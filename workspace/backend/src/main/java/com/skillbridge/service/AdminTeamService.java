package com.skillbridge.service;

import com.skillbridge.dto.AuthResponse;
import com.skillbridge.dto.AccountDto;
import com.skillbridge.dto.admin.AdminDtos.AdminDto;
import com.skillbridge.dto.admin.AdminDtos.AdminRegisterRequest;
import com.skillbridge.exception.ApiException;
import com.skillbridge.model.AdminAccount;
import com.skillbridge.model.AdminPermission;
import com.skillbridge.model.AdminRole;
import com.skillbridge.repository.AdminAccountRepository;
import com.skillbridge.security.AuthenticationUtils;
import com.skillbridge.security.JwtUtil;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;

/**
 * The admin team itself. Every mutation is SUPER_ADMIN-only, except the one bootstrap case:
 * when the admin table is completely empty the first registration is allowed unauthenticated
 * and becomes a SUPER_ADMIN. After that an unauthenticated register is always 403.
 */
@Service
public class AdminTeamService {

    private final AdminAccountRepository repository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;
    private final AdminGuard guard;
    private final AdminAuditService audit;

    public AdminTeamService(AdminAccountRepository repository, PasswordEncoder passwordEncoder,
                            JwtUtil jwtUtil, AdminGuard guard, AdminAuditService audit) {
        this.repository = repository;
        this.passwordEncoder = passwordEncoder;
        this.jwtUtil = jwtUtil;
        this.guard = guard;
        this.audit = audit;
    }

    // ================================================================== mapping

    public AdminDto toDto(AdminAccount a) {
        AdminRole role = a.getAdminRole() == null ? AdminRole.ADMIN : a.getAdminRole();
        String createdByName = a.getCreatedById() == null ? null
                : repository.findById(a.getCreatedById()).map(AdminAccount::getName).orElse(null);
        return new AdminDto(a.getId(), a.getName(), a.getEmail(), a.getPhone(), role,
                new ArrayList<>(role.permissions()), a.isEnabled(), a.getCreatedAt(),
                a.getLastLoginAt(), createdByName);
    }

    public List<AdminDto> list() {
        guard.require(AdminPermission.MANAGE_TEAM);
        return repository.findAllByOrderByCreatedAtAsc().stream().map(this::toDto).toList();
    }

    // ================================================================== register / bootstrap

    /**
     * {@code POST /api/admin/auth/register}. Unauthenticated only while the admin table is empty;
     * that very first account is forced to SUPER_ADMIN so somebody can always get in.
     */
    @Transactional
    public AuthResponse register(AdminRegisterRequest request) {
        boolean bootstrap = repository.count() == 0;
        AdminAccount creator = null;
        AdminRole role;
        if (bootstrap) {
            role = AdminRole.SUPER_ADMIN;
        } else {
            creator = requireSuperAdminCaller();
            role = request.role() == null ? AdminRole.ADMIN : request.role();
        }
        AdminAccount created = createAccount(request, role, creator);
        audit.record(creator == null ? created : creator,
                bootstrap ? "ADMIN_BOOTSTRAP" : "ADMIN_CREATE", "ADMIN", created.getId(),
                "Created " + created.getEmail() + " as " + role);
        return new AuthResponse(jwtUtil.generateToken(created), AccountDto.from(created));
    }

    /** {@code POST /api/admin/team} - always SUPER_ADMIN, never a bootstrap path. */
    @Transactional
    public AdminDto createTeamMember(AdminRegisterRequest request) {
        AdminAccount creator = guard.require(AdminPermission.MANAGE_TEAM);
        AdminRole role = request.role() == null ? AdminRole.ADMIN : request.role();
        AdminAccount created = createAccount(request, role, creator);
        audit.record(creator, "ADMIN_CREATE", "ADMIN", created.getId(),
                "Created " + created.getEmail() + " as " + role);
        return toDto(created);
    }

    private AdminAccount createAccount(AdminRegisterRequest request, AdminRole role,
                                       AdminAccount creator) {
        if (request == null || isBlank(request.name()) || isBlank(request.email())
                || isBlank(request.password())) {
            throw ApiException.badRequest("name, email and password are required");
        }
        String email = request.email().trim().toLowerCase();
        if (repository.existsByEmail(email)) {
            throw ApiException.conflict("An admin with this email already exists");
        }
        String phone = isBlank(request.phone()) ? null : request.phone().trim();
        if (phone != null && repository.existsByPhone(phone)) {
            throw ApiException.conflict("An admin with this mobile number already exists");
        }
        return repository.save(AdminAccount.builder()
                .name(request.name().trim())
                .email(email)
                .phone(phone)
                .password(passwordEncoder.encode(request.password()))
                .adminRole(role)
                .createdById(creator == null ? null : creator.getId())
                .enabled(true)
                .build());
    }

    /**
     * The register route sits behind {@code permitAll}, so the SUPER_ADMIN check is made by hand
     * here rather than by the filter chain.
     */
    private AdminAccount requireSuperAdminCaller() {
        AdminAccount caller;
        try {
            caller = AuthenticationUtils.currentAdmin();
        } catch (RuntimeException ex) {
            throw ApiException.forbidden(
                    "Admin accounts already exist - a SUPER_ADMIN token is required to create another. "
                            + "Missing the MANAGE_TEAM permission.");
        }
        AdminRole role = caller.getAdminRole() == null ? AdminRole.ADMIN : caller.getAdminRole();
        if (!role.can(AdminPermission.MANAGE_TEAM)) {
            throw ApiException.forbidden(
                    "Your role (" + role + ") is missing the MANAGE_TEAM permission");
        }
        return caller;
    }

    // ================================================================== mutations

    @Transactional
    public AdminDto changeRole(Long id, AdminRole role) {
        AdminAccount caller = guard.require(AdminPermission.MANAGE_TEAM);
        if (role == null) {
            throw ApiException.badRequest("role is required");
        }
        AdminAccount target = require(id);
        // The platform-level guard runs first: it is the one that would otherwise be unreachable,
        // because the last SUPER_ADMIN is by definition the only one who could demote themselves.
        if (role != AdminRole.SUPER_ADMIN) {
            guardLastSuperAdmin(target, "demoted");
        }
        if (target.getId().equals(caller.getId()) && role != currentRoleOf(target)) {
            throw ApiException.badRequest("You cannot change your own role");
        }
        AdminRole before = currentRoleOf(target);
        target.setAdminRole(role);
        repository.save(target);
        audit.record(caller, "ADMIN_ROLE_CHANGE", "ADMIN", target.getId(),
                target.getEmail() + ": " + before + " -> " + role);
        return toDto(target);
    }

    @Transactional
    public AdminDto changeStatus(Long id, Boolean enabled) {
        AdminAccount caller = guard.require(AdminPermission.MANAGE_TEAM);
        if (enabled == null) {
            throw ApiException.badRequest("enabled is required");
        }
        AdminAccount target = require(id);
        if (!enabled) {
            guardLastSuperAdmin(target, "disabled");
        }
        if (target.getId().equals(caller.getId()) && !enabled) {
            throw ApiException.badRequest("You cannot disable your own account");
        }
        target.setEnabled(enabled);
        repository.save(target);
        audit.record(caller, "ADMIN_STATUS_CHANGE", "ADMIN", target.getId(),
                target.getEmail() + " " + (enabled ? "enabled" : "disabled"));
        return toDto(target);
    }

    @Transactional
    public void delete(Long id) {
        AdminAccount caller = guard.require(AdminPermission.MANAGE_TEAM);
        AdminAccount target = require(id);
        guardLastSuperAdmin(target, "removed");
        if (target.getId().equals(caller.getId())) {
            throw ApiException.badRequest("You cannot delete your own account");
        }
        audit.record(caller, "ADMIN_DELETE", "ADMIN", target.getId(), "Removed " + target.getEmail());
        repository.delete(target);
    }

    /** The platform must never be left without a way in. */
    private void guardLastSuperAdmin(AdminAccount target, String verb) {
        if (currentRoleOf(target) != AdminRole.SUPER_ADMIN || !target.isEnabled()) {
            return;
        }
        long othersEnabled = repository.findByAdminRole(AdminRole.SUPER_ADMIN).stream()
                .filter(a -> a.isEnabled() && !a.getId().equals(target.getId()))
                .count();
        if (othersEnabled == 0) {
            throw ApiException.badRequest(
                    "The last enabled SUPER_ADMIN cannot be " + verb
                            + " - promote another admin to SUPER_ADMIN first");
        }
    }

    private AdminRole currentRoleOf(AdminAccount a) {
        return a.getAdminRole() == null ? AdminRole.ADMIN : a.getAdminRole();
    }

    private AdminAccount require(Long id) {
        return repository.findById(id).orElseThrow(() -> ApiException.notFound("Admin not found"));
    }

    private static boolean isBlank(String s) {
        return s == null || s.isBlank();
    }
}
