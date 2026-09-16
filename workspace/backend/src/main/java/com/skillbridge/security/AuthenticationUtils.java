package com.skillbridge.security;

import com.skillbridge.exception.ApiException;
import com.skillbridge.model.User;
import com.skillbridge.repository.UserRepository;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Component;

@Component
public class AuthenticationUtils {

    private static UserRepository userRepository;

    public AuthenticationUtils(UserRepository repo) {
        userRepository = repo;
    }

    public static User currentUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !(auth.getPrincipal() instanceof UserDetails details)) {
            throw ApiException.unauthorized("Authentication required");
        }
        return userRepository.findByEmail(details.getUsername())
                .orElseThrow(() -> ApiException.unauthorized("User no longer exists"));
    }
}
