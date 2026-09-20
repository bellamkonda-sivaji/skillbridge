package com.skillbridge.controller;

import com.skillbridge.dto.ReviewDto;
import com.skillbridge.dto.ReviewRequest;
import com.skillbridge.model.AccountType;
import com.skillbridge.security.AuthenticationUtils;
import com.skillbridge.service.ReviewService;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/reviews")
public class ReviewController {

    private final ReviewService reviewService;

    public ReviewController(ReviewService reviewService) {
        this.reviewService = reviewService;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ReviewDto create(@RequestBody ReviewRequest request) {
        return reviewService.createReview(AuthenticationUtils.currentAccount(), request);
    }

    @GetMapping("/mine")
    public List<ReviewDto> mine() {
        return reviewService.reviewsBy(AuthenticationUtils.currentAccount());
    }

    /** The type is part of the path because ids repeat across the three account tables. */
    @GetMapping("/target/{accountType}/{accountId}")
    public List<ReviewDto> forAccount(@PathVariable String accountType, @PathVariable Long accountId) {
        return reviewService.reviewsFor(AccountType.valueOf(accountType.toUpperCase()), accountId);
    }
}
