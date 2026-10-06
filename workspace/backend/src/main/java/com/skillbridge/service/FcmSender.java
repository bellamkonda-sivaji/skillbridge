package com.skillbridge.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.security.KeyFactory;
import java.security.PrivateKey;
import java.security.Signature;
import java.security.spec.PKCS8EncodedKeySpec;
import java.time.Duration;
import java.time.Instant;
import java.util.Base64;
import java.util.Map;

/**
 * Sends a push through Firebase Cloud Messaging.
 *
 * FCM's v1 API wants an OAuth2 access token, which means signing a JWT with the
 * service account's private key and swapping it at Google's token endpoint.
 * That is all this does - it is a hundred lines rather than a dependency on the
 * Firebase Admin SDK, which would drag in a large transitive tree for one call.
 *
 * Credentials come from a file path in configuration, never from the repository:
 * the service account key can send notifications to every user of the product,
 * so it is a real secret. Without it the sender quietly does nothing, which is
 * what we want in development and in tests.
 */
@Service
public class FcmSender {

    private static final Logger log = LoggerFactory.getLogger(FcmSender.class);
    private static final String SCOPE = "https://www.googleapis.com/auth/firebase.messaging";
    private static final String TOKEN_URI = "https://oauth2.googleapis.com/token";

    private final ObjectMapper mapper = new ObjectMapper();
    private final HttpClient http = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(10)).build();

    private final String credentialsPath;

    /** Cached so we are not signing a JWT for every single notification. */
    private String accessToken;
    private Instant accessTokenExpiry = Instant.EPOCH;

    private JsonNode credentials;

    public FcmSender(@Value("${skillbridge.fcm.credentials:}") String credentialsPath) {
        this.credentialsPath = credentialsPath == null ? "" : credentialsPath.trim();
    }

    /** True when the server is actually able to send. */
    public boolean enabled() {
        return !credentialsPath.isEmpty();
    }

    /**
     * Fire and forget. A push that fails must never break the thing that caused
     * it - a job offer is still an offer whether or not the phone rings.
     *
     * @return true if FCM accepted it
     */
    public boolean send(String deviceToken, String title, String body,
                        String channelId, Map<String, String> data) {
        if (!enabled() || deviceToken == null || deviceToken.isBlank()) return false;
        try {
            String token = accessToken();
            if (token == null) return false;

            ObjectNode root = mapper.createObjectNode();
            ObjectNode message = root.putObject("message");
            message.put("token", deviceToken);

            ObjectNode notification = message.putObject("notification");
            notification.put("title", title);
            notification.put("body", body);

            // Android needs the channel named here or it lands in the default
            // one, which is the "Miscellaneous" bucket we took trouble to avoid.
            ObjectNode android = message.putObject("android");
            android.put("priority", "high");
            ObjectNode androidNotification = android.putObject("notification");
            if (channelId != null && !channelId.isBlank()) {
                androidNotification.put("channel_id", channelId);
            }

            if (data != null && !data.isEmpty()) {
                ObjectNode payload = message.putObject("data");
                data.forEach((k, v) -> payload.put(k, v == null ? "" : v));
            }

            String projectId = credentials().path("project_id").asText();
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create("https://fcm.googleapis.com/v1/projects/"
                            + projectId + "/messages:send"))
                    .header("Authorization", "Bearer " + token)
                    .header("Content-Type", "application/json; UTF-8")
                    .timeout(Duration.ofSeconds(15))
                    .POST(HttpRequest.BodyPublishers.ofString(
                            mapper.writeValueAsString(root), StandardCharsets.UTF_8))
                    .build();

            HttpResponse<String> response = http.send(request, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() / 100 == 2) return true;

            // 404 and 403 here usually mean the token is dead - the app was
            // uninstalled. The caller decides whether to delete it.
            log.warn("FCM rejected a message: {} {}", response.statusCode(), response.body());
            return false;
        } catch (Exception e) {
            log.warn("Could not send a push notification: {}", e.toString());
            return false;
        }
    }

    /* --------------------------------------------------------------- auth -- */

    private synchronized JsonNode credentials() throws Exception {
        if (credentials == null) {
            credentials = mapper.readTree(Files.readAllBytes(Path.of(credentialsPath)));
        }
        return credentials;
    }

    private synchronized String accessToken() {
        // A minute of slack, so a token cannot expire mid-flight.
        if (accessToken != null && Instant.now().isBefore(accessTokenExpiry.minusSeconds(60))) {
            return accessToken;
        }
        try {
            JsonNode creds = credentials();
            String assertion = signedJwt(
                    creds.path("client_email").asText(),
                    creds.path("private_key").asText());

            String form = "grant_type=" + enc("urn:ietf:params:oauth:grant-type:jwt-bearer")
                    + "&assertion=" + enc(assertion);

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(TOKEN_URI))
                    .header("Content-Type", "application/x-www-form-urlencoded")
                    .timeout(Duration.ofSeconds(15))
                    .POST(HttpRequest.BodyPublishers.ofString(form))
                    .build();

            HttpResponse<String> response = http.send(request, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() / 100 != 2) {
                log.warn("Could not get an FCM access token: {} {}",
                        response.statusCode(), response.body());
                return null;
            }
            JsonNode body = mapper.readTree(response.body());
            accessToken = body.path("access_token").asText();
            accessTokenExpiry = Instant.now().plusSeconds(body.path("expires_in").asLong(3600));
            return accessToken;
        } catch (Exception e) {
            log.warn("Could not authenticate with FCM: {}", e.toString());
            return null;
        }
    }

    private String signedJwt(String clientEmail, String privateKeyPem) throws Exception {
        long now = Instant.now().getEpochSecond();
        String header = b64("{\"alg\":\"RS256\",\"typ\":\"JWT\"}".getBytes(StandardCharsets.UTF_8));
        String claims = b64((""
                + "{\"iss\":\"" + clientEmail + "\","
                + "\"scope\":\"" + SCOPE + "\","
                + "\"aud\":\"" + TOKEN_URI + "\","
                + "\"iat\":" + now + ","
                + "\"exp\":" + (now + 3600) + "}").getBytes(StandardCharsets.UTF_8));

        String signingInput = header + "." + claims;
        Signature rsa = Signature.getInstance("SHA256withRSA");
        rsa.initSign(parsePrivateKey(privateKeyPem));
        rsa.update(signingInput.getBytes(StandardCharsets.UTF_8));
        return signingInput + "." + b64(rsa.sign());
    }

    private PrivateKey parsePrivateKey(String pem) throws Exception {
        String body = pem
                .replace("-----BEGIN PRIVATE KEY-----", "")
                .replace("-----END PRIVATE KEY-----", "")
                .replaceAll("\\s", "");
        byte[] der = Base64.getDecoder().decode(body);
        return KeyFactory.getInstance("RSA").generatePrivate(new PKCS8EncodedKeySpec(der));
    }

    private static String b64(byte[] bytes) {
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }

    private static String enc(String s) {
        return java.net.URLEncoder.encode(s, StandardCharsets.UTF_8);
    }
}
