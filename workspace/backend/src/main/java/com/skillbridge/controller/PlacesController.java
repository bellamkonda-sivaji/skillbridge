package com.skillbridge.controller;

import com.skillbridge.service.PlacesService;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/** Address lookup for the apps, so no maps key ever ships inside an APK. */
@RestController
@RequestMapping("/api/places")
public class PlacesController {

    private final PlacesService places;

    public PlacesController(PlacesService places) {
        this.places = places;
    }

    @GetMapping("/search")
    public Map<String, Object> search(@RequestParam("q") String q,
                                      @RequestParam(value = "near", required = false) String near) {
        List<Map<String, Object>> results = places.search(q, near);
        return Map.of("provider", places.provider(), "results", results);
    }
}
