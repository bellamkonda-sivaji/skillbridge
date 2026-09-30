package com.skillbridge.service;

import com.skillbridge.exception.ApiException;
import com.skillbridge.model.AdminAccount;
import com.skillbridge.model.AdminPermission;
import com.skillbridge.model.AdminRole;
import com.skillbridge.security.AuthenticationUtils;
import org.springframework.stereotype.Component;

/**
 * The one place a back-office permission is checked. Every guarded call runs through
 * {@link #require(AdminPermission)}, which answers 403 naming the permission that was missing -
 * so no controller ever branches on a role name.
 */
@Component("adminGuard")
public class AdminGuard {

    /** The signed-in admin, or 403 if the caller is not one. */
    public AdminAccount currentAdmin() {
        return AuthenticationUtils.currentAdmin();
    }

    public AdminRole currentRole() {
        AdminRole role = currentAdmin().getAdminRole();
        return role == null ? AdminRole.ADMIN : role;
    }

    /** Throws 403 unless the signed-in admin's role carries {@code permission}. */
    public AdminAccount require(AdminPermission permission) {
        AdminAccount admin = currentAdmin();
        AdminRole role = admin.getAdminRole() == null ? AdminRole.ADMIN : admin.getAdminRole();
        if (!role.can(permission)) {
            throw ApiException.forbidden(
                    "Your role (" + role + ") is missing the " + permission + " permission");
        }
        return admin;
    }

    /** For {@code @PreAuthorize("@adminGuard.has('MANAGE_TEAM')")} style checks. */
    public boolean has(String permission) {
        try {
            return currentRole().can(AdminPermission.valueOf(permission));
        } catch (RuntimeException ex) {
            return false;
        }
    }
}
