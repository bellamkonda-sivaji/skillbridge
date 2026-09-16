package com.skillbridge.controller;

import com.skillbridge.dto.*;
import com.skillbridge.model.Availability;
import com.skillbridge.security.AuthenticationUtils;
import com.skillbridge.service.UserService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api")
public class UserController {

    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }

    @GetMapping("/me")
    public UserDto me() {
        return userService.me(AuthenticationUtils.currentUser());
    }

    @GetMapping("/workers/{userId}")
    public WorkerProfileDto workerProfile(@PathVariable Long userId) {
        return userService.getWorkerProfile(userId);
    }

    @PutMapping("/worker/profile")
    public WorkerProfileDto updateWorkerProfile(@RequestBody WorkerProfileRequest request) {
        return userService.updateWorkerProfile(AuthenticationUtils.currentUser(), request);
    }

    @GetMapping("/worker/profile")
    public WorkerProfileDto myWorkerProfile() {
        return userService.getWorkerProfile(AuthenticationUtils.currentUser().getId());
    }

    @GetMapping("/employers/{userId}")
    public EmployerProfileDto employerProfile(@PathVariable Long userId) {
        return userService.getEmployerProfile(userId);
    }

    @PutMapping("/employer/profile")
    public EmployerProfileDto updateEmployerProfile(@RequestBody EmployerProfileRequest request) {
        return userService.updateEmployerProfile(AuthenticationUtils.currentUser(), request);
    }

    @GetMapping("/employer/profile")
    public EmployerProfileDto myEmployerProfile() {
        return userService.getEmployerProfile(AuthenticationUtils.currentUser().getId());
    }

    @GetMapping("/workers")
    public List<WorkerProfileDto> searchWorkers(@RequestParam(required = false) String q,
                                                 @RequestParam(required = false) List<String> skills,
                                                 @RequestParam(required = false) String city,
                                                 @RequestParam(required = false) Double maxDistanceKm,
                                                 @RequestParam(required = false) Double lat,
                                                 @RequestParam(required = false) Double lng,
                                                 @RequestParam(required = false) Integer minRating,
                                                 @RequestParam(required = false) Availability availability,
                                                 @RequestParam(required = false) boolean verifiedOnly,
                                                 @RequestParam(required = false) Integer minExperience) {
        return userService.searchWorkers(q, skills, city, maxDistanceKm, lat, lng, minRating,
                availability, verifiedOnly, minExperience);
    }

    @GetMapping("/users/{userId}/reviews")
    public List<ReviewDto> reviewsFor(@PathVariable Long userId) {
        return userService.reviewsFor(userId);
    }
}
