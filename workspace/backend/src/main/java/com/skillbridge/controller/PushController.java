package com.skillbridge.controller;

import com.skillbridge.security.AuthenticationUtils;
import com.skillbridge.service.PushService;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/** Where a phone tells us how to reach it. Any signed-in account may call this. */
@RestController
@RequestMapping("/api/push")
public class PushController {

    private final PushService push;

    public PushController(PushService push) {
        this.push = push;
    }

    @PostMapping("/tokens")
    public Map<String, Object> register(@RequestBody Map<String, String> body) {
        push.register(
                AuthenticationUtils.currentType(),
                AuthenticationUtils.currentId(),
                body.get("token"),
                body.get("platform"));
        return Map.of("ok", true);
    }

    /** Called on sign-out, so a shared phone stops ringing for the last person. */
    @DeleteMapping("/tokens")
    public Map<String, Object> forget(@RequestBody Map<String, String> body) {
        push.forget(body.get("token"));
        return Map.of("ok", true);
    }
}
