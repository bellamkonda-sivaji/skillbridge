package com.skillbridge.controller;

import com.skillbridge.dto.ShopDto;
import com.skillbridge.dto.ShopRequest;
import com.skillbridge.security.AuthenticationUtils;
import com.skillbridge.service.ShopService;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/** The places an employer hires for: one account, many shops. */
@RestController
@RequestMapping("/api/employer/shops")
public class ShopController {

    private final ShopService shops;

    public ShopController(ShopService shops) {
        this.shops = shops;
    }

    @GetMapping
    public List<ShopDto> list() {
        return shops.listOrSeed(AuthenticationUtils.currentEmployer());
    }

    @PostMapping
    public ShopDto add(@RequestBody ShopRequest request) {
        return shops.add(AuthenticationUtils.currentEmployer(), request);
    }

    @PutMapping("/{id}")
    public ShopDto update(@PathVariable Long id, @RequestBody ShopRequest request) {
        return shops.update(AuthenticationUtils.currentEmployer(), id, request);
    }

    @DeleteMapping("/{id}")
    public Map<String, Object> close(@PathVariable Long id) {
        shops.close(AuthenticationUtils.currentEmployer(), id);
        return Map.of("closed", true);
    }
}
