package com.skillbridge.service;

import org.springframework.stereotype.Service;

@Service
public class GeoService {

    private static final double EARTH_RADIUS_KM = 6371.0;

    /** Scoring flavour: an unknown location reads as "infinitely far" so it scores neutral. */
    public double distanceKm(double lat1, double lng1, double lat2, double lng2) {
        Double exact = exactDistanceKm(lat1, lng1, lat2, lng2);
        return exact == null ? Double.MAX_VALUE : exact;
    }

    /** API flavour: null when either side has no pin, so the JSON never carries a sentinel. */
    public Double distanceKmOrNull(double lat1, double lng1, double lat2, double lng2) {
        Double exact = exactDistanceKm(lat1, lng1, lat2, lng2);
        return exact == null ? null : Math.round(exact * 10.0) / 10.0;
    }

    private Double exactDistanceKm(double lat1, double lng1, double lat2, double lng2) {
        if ((lat1 == 0 && lng1 == 0) || (lat2 == 0 && lng2 == 0)) {
            return null;
        }
        double dLat = Math.toRadians(lat2 - lat1);
        double dLng = Math.toRadians(lng2 - lng1);
        double a = Math.sin(dLat / 2) * Math.sin(dLat / 2)
                + Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2))
                * Math.sin(dLng / 2) * Math.sin(dLng / 2);
        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return EARTH_RADIUS_KM * c;
    }
}
