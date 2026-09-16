package com.skillbridge.dto;

import com.skillbridge.model.Role;
import com.skillbridge.model.User;

public record UserDto(
        Long id,
        String name,
        String email,
        String phone,
        String photoUrl,
        Role role,
        String locale,
        boolean enabled,
        double avgRating,
        int ratingCount
) {
    public static UserDto from(User u) {
        return new UserDto(u.getId(), u.getName(), u.getEmail(), u.getPhone(), u.getPhotoUrl(),
                u.getRole(), u.getLocale(), u.isEnabled(), u.getAvgRating(), u.getRatingCount());
    }
}
