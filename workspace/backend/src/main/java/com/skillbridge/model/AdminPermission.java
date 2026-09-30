package com.skillbridge.model;

/**
 * Every distinct thing a back-office user can do. Roles are described purely as a set of these,
 * so permission logic lives in exactly one place instead of being scattered across controllers.
 */
public enum AdminPermission {

    // ---- read ----
    VIEW_DASHBOARD,
    VIEW_JOBS,
    VIEW_EMPLOYERS,
    VIEW_WORKERS,
    VIEW_APPLICATIONS,
    VIEW_INTERVIEWS,
    VIEW_REPORTS,
    VIEW_AUDIT,
    VIEW_PAYMENTS,

    // ---- operational writes ----
    MANAGE_JOBS,
    LOG_CONTACT,
    MANAGE_INTERVIEWS,
    MANAGE_APPLICATIONS,
    MANAGE_SKILLS,
    VERIFY_ACCOUNTS,
    TOGGLE_ACCOUNT_STATUS,
    MANAGE_PAYMENTS,

    // ---- the team itself ----
    MANAGE_TEAM
}
