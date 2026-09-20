package com.skillbridge.security;

import com.skillbridge.model.AccountType;

/**
 * What the JWT filter puts in the security context: which namespace the caller lives in and
 * the primary key inside that namespace. Ids are only unique per table, so the pair travels
 * together everywhere.
 */
public record AccountPrincipal(AccountType type, Long id, String username) {
}
