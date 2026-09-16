package com.skillbridge.controller;

import com.skillbridge.dto.ReviewDto;
import com.skillbridge.dto.ReviewRequest;
import com.skillbridge.security.AuthenticationUtils;
import com.skillbridge.service.ReviewService;
import com.skillbridge.service.UserService;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/reviews")
public class ReviewController {

    private final ReviewService reviewService;
    private final UserService userService;

    public ReviewController(ReviewService reviewService, UserService userService) {
        this.reviewService = reviewService;
        this.userService = userService;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ReviewDto create(@RequestBody ReviewRequest request) {
        return reviewService.createReview(AuthenticationUtils.currentUser(), request);
    }

    @GetMapping("/mine")
    public List<ReviewDto> mine() {
        return reviewService.reviewsBy(AuthenticationUtils.currentUser());
    }

    @GetMapping("/target/{userId}")
    public List<ReviewDto> forUser(@PathVariable Long userId) {
        return userService.reviewsFor(userId);
    }
}
