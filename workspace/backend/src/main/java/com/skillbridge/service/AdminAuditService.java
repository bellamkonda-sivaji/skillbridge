package com.skillbridge.service;

import com.skillbridge.dto.admin.AdminDtos.AuditRowDto;
import com.skillbridge.model.AdminAccount;
import com.skillbridge.model.AdminAuditLog;
import com.skillbridge.model.AdminRole;
import com.skillbridge.repository.AdminAuditLogRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/** Writes one row per state-changing admin action. Reads are deliberately never recorded. */
@Service
public class AdminAuditService {

    private final AdminAuditLogRepository repository;

    public AdminAuditService(AdminAuditLogRepository repository) {
        this.repository = repository;
    }

    public AdminAuditLog record(AdminAccount admin, String action, String entityType, Long entityId,
                                String detail) {
        return repository.save(AdminAuditLog.builder()
                .adminId(admin == null ? null : admin.getId())
                .adminName(admin == null ? "system" : admin.getName())
                .adminRole(admin == null ? null
                        : (admin.getAdminRole() == null ? AdminRole.ADMIN : admin.getAdminRole()))
                .action(action)
                .entityType(entityType)
                .entityId(entityId)
                .detail(detail)
                .createdAt(LocalDateTime.now())
                .build());
    }

    public List<AuditRowDto> search(Long adminId, String action, LocalDateTime from, LocalDateTime to) {
        List<AuditRowDto> rows = new ArrayList<>();
        for (AdminAuditLog log : repository.findAllByOrderByCreatedAtDesc()) {
            if (adminId != null && !adminId.equals(log.getAdminId())) {
                continue;
            }
            if (action != null && !action.isBlank()
                    && (log.getAction() == null
                        || !log.getAction().toLowerCase().contains(action.toLowerCase().trim()))) {
                continue;
            }
            if (from != null && log.getCreatedAt().isBefore(from)) {
                continue;
            }
            if (to != null && log.getCreatedAt().isAfter(to)) {
                continue;
            }
            rows.add(new AuditRowDto(log.getId(), log.getAdminId(), log.getAdminName(),
                    log.getAdminRole(), log.getAction(), log.getEntityType(), log.getEntityId(),
                    log.getDetail(), log.getCreatedAt()));
        }
        return rows;
    }

    public List<AdminAuditLog> onDate(java.time.LocalDate date) {
        return repository.findByCreatedAtBetweenOrderByCreatedAtDesc(
                date.atStartOfDay(), date.plusDays(1).atStartOfDay().minusNanos(1));
    }
}
