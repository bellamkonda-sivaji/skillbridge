package com.skillbridge.service;

import com.skillbridge.dto.ShopDto;
import com.skillbridge.dto.ShopRequest;
import com.skillbridge.exception.ApiException;
import com.skillbridge.model.EmployerAccount;
import com.skillbridge.model.EmployerProfile;
import com.skillbridge.model.Shop;
import com.skillbridge.repository.EmployerProfileRepository;
import com.skillbridge.repository.ShopRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/** The places an employer hires for. */
@Service
public class ShopService {

    private final ShopRepository shops;
    private final EmployerProfileRepository profiles;

    public ShopService(ShopRepository shops, EmployerProfileRepository profiles) {
        this.shops = shops;
        this.profiles = profiles;
    }

    /**
     * Every shop, creating the first one from the profile if there is none.
     *
     * Existing employers already gave us a business name and an address during
     * onboarding. Asking them to enter it again as a "shop" would be asking
     * twice for the same thing, so the first shop is simply what they already
     * told us, promoted.
     */
    @Transactional
    public List<ShopDto> listOrSeed(EmployerAccount employer) {
        List<Shop> rows = shops.findByEmployerAndActiveTrueOrderByPrimaryShopDescIdAsc(employer);
        if (!rows.isEmpty()) {
            return rows.stream().map(ShopDto::from).toList();
        }
        EmployerProfile p = profiles.findByAccountId(employer.getId()).orElse(null);
        if (p == null || p.getBusinessName() == null || p.getBusinessName().isBlank()) {
            // Nothing to promote: the app asks them to add one before posting.
            return List.of();
        }
        Shop first = shops.save(Shop.builder()
                .employer(employer)
                .name(p.getBusinessName())
                .address(p.getAddress())
                .city(p.getCity())
                .area(p.getArea())
                .pincode(p.getPincode())
                .latitude(p.getLatitude())
                .longitude(p.getLongitude())
                .primaryShop(true)
                .active(true)
                .build());
        return List.of(ShopDto.from(first));
    }

    @Transactional
    public ShopDto add(EmployerAccount employer, ShopRequest req) {
        String name = req.name() == null ? "" : req.name().trim();
        if (name.isEmpty()) throw ApiException.badRequest("Give this place a name.");
        // Without somewhere to put it on a map, no worker can be told how far
        // away it is - which is the one thing they decide on.
        boolean located = (req.pincode() != null && !req.pincode().isBlank())
                || (req.latitude() != null && req.latitude() != 0);
        if (!located) throw ApiException.badRequest("Add the address or PIN code for this place.");

        boolean first = shops.countByEmployer(employer) == 0;
        Shop shop = shops.save(Shop.builder()
                .employer(employer)
                .name(name)
                .address(req.address())
                .city(req.city())
                .area(req.area())
                .pincode(req.pincode())
                .latitude(req.latitude() == null ? 0 : req.latitude())
                .longitude(req.longitude() == null ? 0 : req.longitude())
                .primaryShop(first || Boolean.TRUE.equals(req.primaryShop()))
                .active(true)
                .build());

        if (shop.isPrimaryShop()) demoteOthers(employer, shop.getId());
        return ShopDto.from(shop);
    }

    @Transactional
    public ShopDto update(EmployerAccount employer, Long id, ShopRequest req) {
        Shop shop = shops.findByIdAndEmployer(id, employer)
                .orElseThrow(() -> ApiException.notFound("No such place of work."));
        if (req.name() != null && !req.name().isBlank()) shop.setName(req.name().trim());
        if (req.address() != null) shop.setAddress(req.address());
        if (req.city() != null) shop.setCity(req.city());
        if (req.area() != null) shop.setArea(req.area());
        if (req.pincode() != null) shop.setPincode(req.pincode());
        if (req.latitude() != null) shop.setLatitude(req.latitude());
        if (req.longitude() != null) shop.setLongitude(req.longitude());
        if (Boolean.TRUE.equals(req.primaryShop())) {
            shop.setPrimaryShop(true);
            demoteOthers(employer, shop.getId());
        }
        return ShopDto.from(shops.save(shop));
    }

    /**
     * Closed rather than deleted: old jobs and employments still point at it,
     * and a worker looking at last month's work should still see where it was.
     */
    @Transactional
    public void close(EmployerAccount employer, Long id) {
        Shop shop = shops.findByIdAndEmployer(id, employer)
                .orElseThrow(() -> ApiException.notFound("No such place of work."));
        shop.setActive(false);
        shop.setPrimaryShop(false);
        shops.save(shop);
    }

    public Shop require(EmployerAccount employer, Long id) {
        return shops.findByIdAndEmployer(id, employer)
                .orElseThrow(() -> ApiException.badRequest("Choose which place this work is at."));
    }

    private void demoteOthers(EmployerAccount employer, Long keepId) {
        shops.findByEmployerOrderByPrimaryShopDescIdAsc(employer).stream()
                .filter(s -> !s.getId().equals(keepId) && s.isPrimaryShop())
                .forEach(s -> { s.setPrimaryShop(false); shops.save(s); });
    }
}
