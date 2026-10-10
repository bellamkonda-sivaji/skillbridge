package com.skillbridge.dto;

/** Adding or renaming a place of work. */
public record ShopRequest(
        String name,
        String address,
        String city,
        String area,
        String pincode,
        Double latitude,
        Double longitude,
        Boolean primaryShop
) {}
