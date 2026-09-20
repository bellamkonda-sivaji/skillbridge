package com.skillbridge.model;

/** The three independent account namespaces. Also the Spring authority suffix (ROLE_WORKER, ...). */
public enum AccountType {
    WORKER, EMPLOYER, ADMIN;

    public String authority() {
        return "ROLE_" + name();
    }
}
