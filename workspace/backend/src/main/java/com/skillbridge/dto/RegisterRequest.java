package com.skillbridge.dto;

import com.skillbridge.model.Role;

public record RegisterRequest(
        String name,
        String email,
        String password,
        String phone,
        Role role,
        String locale
) {}
