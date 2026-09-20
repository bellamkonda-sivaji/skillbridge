package com.skillbridge.security;

import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.web.access.AccessDeniedHandler;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.util.Map;

/**
 * A valid token used on another account type's routes is FORBIDDEN, not
 * UNAUTHORIZED. The distinction matters to the client: a 401 makes it drop the
 * session and bounce to the login screen, whereas this should simply be denied.
 */
@Component
public class RestAccessDeniedHandler implements AccessDeniedHandler {

    private final ObjectMapper mapper = new ObjectMapper();

    @Override
    public void handle(HttpServletRequest request, HttpServletResponse response,
                       AccessDeniedException ex) throws IOException {
        response.setStatus(HttpServletResponse.SC_FORBIDDEN);
        response.setContentType("application/json");
        mapper.writeValue(response.getOutputStream(), Map.of(
                "error", "Forbidden",
                "message", "This account type does not have access to that area"));
    }
}
