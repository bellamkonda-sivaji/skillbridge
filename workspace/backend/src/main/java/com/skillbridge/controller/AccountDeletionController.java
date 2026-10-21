package com.skillbridge.controller;

import com.skillbridge.security.AuthenticationUtils;
import com.skillbridge.service.AccountDeletionService;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/** Delete my account - in the apps (signed in), and by request from the public web page. */
@RestController
public class AccountDeletionController {

    public record DeletionRequest(String phone, String name, String accountType, String reason) {}

    private final AccountDeletionService deletion;

    public AccountDeletionController(AccountDeletionService deletion) {
        this.deletion = deletion;
    }

    @DeleteMapping("/api/worker/account")
    public Map<String, Object> deleteWorker() {
        deletion.deleteWorker(AuthenticationUtils.currentWorker());
        return Map.of("deleted", true);
    }

    @DeleteMapping("/api/employer/account")
    public Map<String, Object> deleteEmployer() {
        deletion.deleteEmployer(AuthenticationUtils.currentEmployer());
        return Map.of("deleted", true);
    }

    /** No sign-in: for someone who no longer has the app. The back office verifies and deletes. */
    @PostMapping("/api/public/account-deletion")
    public Map<String, Object> request(@RequestBody DeletionRequest body) {
        Long id = deletion.request(body.phone(), body.name(), body.accountType(), body.reason());
        return Map.of("received", true, "reference", "DEL-" + id);
    }
}
