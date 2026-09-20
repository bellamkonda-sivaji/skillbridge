package com.skillbridge.security;

import com.skillbridge.model.AccountType;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

@Component
public class JwtAuthFilter extends OncePerRequestFilter {

    private final JwtUtil jwtUtil;
    private final AccountDetailsService accountDetailsService;

    public JwtAuthFilter(JwtUtil jwtUtil, AccountDetailsService accountDetailsService) {
        this.jwtUtil = jwtUtil;
        this.accountDetailsService = accountDetailsService;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {
        String header = request.getHeader("Authorization");
        if (StringUtils.hasText(header) && header.startsWith("Bearer ")) {
            String token = header.substring(7);
            try {
                String subject = jwtUtil.extractUsername(token);
                AccountType type = jwtUtil.extractAccountType(token);
                Long accountId = jwtUtil.extractAccountId(token);
                if (subject != null && type != null && accountId != null
                        && SecurityContextHolder.getContext().getAuthentication() == null) {
                    UserDetails details = accountDetailsService.loadUserByUsername(subject);
                    boolean typeMatches = details.getAuthorities().stream()
                            .anyMatch(a -> a.getAuthority().equals(type.authority()));
                    if (typeMatches && jwtUtil.isValid(token, details)) {
                        AccountPrincipal principal = new AccountPrincipal(type, accountId, subject);
                        UsernamePasswordAuthenticationToken auth = new UsernamePasswordAuthenticationToken(
                                principal, null, details.getAuthorities());
                        auth.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                        SecurityContextHolder.getContext().setAuthentication(auth);
                    }
                }
            } catch (Exception ignored) {
                // invalid token -> unauthenticated
            }
        }
        filterChain.doFilter(request, response);
    }
}
