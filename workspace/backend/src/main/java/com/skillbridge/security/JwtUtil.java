package com.skillbridge.security;

import com.skillbridge.model.Account;
import com.skillbridge.model.AccountType;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;
import java.util.function.Function;

@Component
public class JwtUtil {

    public static final String CLAIM_ACCOUNT_TYPE = "accountType";
    public static final String CLAIM_ACCOUNT_ID = "accountId";

    private final SecretKey key;
    private final long expirationMs;

    public JwtUtil(@Value("${skillbridge.jwt.secret}") String secret,
                   @Value("${skillbridge.jwt.expiration-ms}") long expirationMs) {
        this.key = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
        this.expirationMs = expirationMs;
    }

    /** The subject is namespaced: {@code "WORKER:9000000007"}. */
    public static String subjectFor(Account account) {
        String identifier = account.getPhone() != null && !account.getPhone().isBlank()
                ? account.getPhone() : account.getEmail();
        return account.accountType().name() + ":" + identifier;
    }

    public String generateToken(Account account) {
        Map<String, Object> claims = new HashMap<>();
        claims.put(CLAIM_ACCOUNT_TYPE, account.accountType().name());
        claims.put(CLAIM_ACCOUNT_ID, account.getId());
        return Jwts.builder()
                .setClaims(claims)
                .setSubject(subjectFor(account))
                .setIssuedAt(new Date())
                .setExpiration(new Date(System.currentTimeMillis() + expirationMs))
                .signWith(key, SignatureAlgorithm.HS256)
                .compact();
    }

    public String extractUsername(String token) {
        return extractClaim(token, Claims::getSubject);
    }

    public AccountType extractAccountType(String token) {
        String raw = extractClaim(token, c -> c.get(CLAIM_ACCOUNT_TYPE, String.class));
        return raw == null ? null : AccountType.valueOf(raw);
    }

    public Long extractAccountId(String token) {
        Number raw = extractClaim(token, c -> c.get(CLAIM_ACCOUNT_ID, Number.class));
        return raw == null ? null : raw.longValue();
    }

    public Date extractExpiration(String token) {
        return extractClaim(token, Claims::getExpiration);
    }

    public <T> T extractClaim(String token, Function<Claims, T> resolver) {
        return resolver.apply(parseClaims(token));
    }

    private Claims parseClaims(String token) {
        return Jwts.parserBuilder().setSigningKey(key).build().parseClaimsJws(token).getBody();
    }

    public boolean isValid(String token, UserDetails userDetails) {
        String username = extractUsername(token);
        return username != null && username.equals(userDetails.getUsername())
                && !extractExpiration(token).before(new Date());
    }
}
