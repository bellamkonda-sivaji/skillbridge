package com.skillbridge.dto;

import com.skillbridge.model.Shop;

/** A place of work, as the apps and the back office see it. */
public record ShopDto(
        Long id,
        String name,
        String address,
        String city,
        String area,
        String pincode,
        double latitude,
        double longitude,
        boolean primaryShop,
        boolean active
) {
    public static ShopDto from(Shop s) {
        return new ShopDto(s.getId(), s.getName(), s.getAddress(), s.getCity(), s.getArea(),
                s.getPincode(), s.getLatitude(), s.getLongitude(), s.isPrimaryShop(), s.isActive());
    }
}
