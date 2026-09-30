package com.skillbridge.model;

import java.util.Collections;
import java.util.EnumSet;
import java.util.Set;

import static com.skillbridge.model.AdminPermission.*;

/**
 * The three back-office roles. {@link #permissions()} is the single source of truth - nothing
 * anywhere else is allowed to branch on the role name.
 */
public enum AdminRole {

    /** Everything, including the admin team and role changes. */
    SUPER_ADMIN(EnumSet.allOf(AdminPermission.class)),

    /** Everything operational, but never the admin team. */
    ADMIN(EnumSet.complementOf(EnumSet.of(MANAGE_TEAM))),

    /**
     * Reads everything operational and drives the human side of the funnel - contact logging,
     * interview scheduling, application tracking - but cannot verify accounts, toggle account
     * status, touch payments or manage the team.
     */
    HR(EnumSet.of(
            VIEW_DASHBOARD, VIEW_JOBS, VIEW_EMPLOYERS, VIEW_WORKERS, VIEW_APPLICATIONS,
            VIEW_INTERVIEWS, VIEW_REPORTS, VIEW_AUDIT,
            LOG_CONTACT, MANAGE_INTERVIEWS, MANAGE_APPLICATIONS));

    private final Set<AdminPermission> permissions;

    AdminRole(Set<AdminPermission> permissions) {
        this.permissions = Collections.unmodifiableSet(permissions);
    }

    public Set<AdminPermission> permissions() {
        return permissions;
    }

    public boolean can(AdminPermission permission) {
        return permission != null && permissions.contains(permission);
    }
}
