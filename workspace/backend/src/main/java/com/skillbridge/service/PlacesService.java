package com.skillbridge.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Looking up an address, behind our own API.
 *
 * The apps ask us rather than a maps provider directly, for three reasons: the
 * key stays on the server instead of inside an APK anyone can unpack, the
 * provider can be changed without shipping a new app to every phone, and the
 * usage policy of whatever we use is one server's problem rather than every
 * handset's.
 *
 * Google Places when a key is configured - it is the only one with reliable
 * coverage of small Indian shops by name, which is what an employer actually
 * types. OpenStreetMap's Nominatim otherwise, so a server with no key still
 * works: it knows roads and localities well, just not "Fish Market".
 */
@Service
public class PlacesService {

    private static final Logger log = LoggerFactory.getLogger(PlacesService.class);

    private final ObjectMapper mapper = new ObjectMapper();
    private final HttpClient http = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(8)).build();

    private final String googleKey;

    public PlacesService(@Value("${skillbridge.places.google-key:}") String googleKey) {
        this.googleKey = googleKey == null ? "" : googleKey.trim();
    }

    public String provider() {
        return googleKey.isEmpty() ? "osm" : "google";
    }

    /** @param near "lat,lng" to bias results towards, or null. */
    public List<Map<String, Object>> search(String query, String near) {
        String q = query == null ? "" : query.trim();
        if (q.length() < 3) return List.of();
        try {
            return googleKey.isEmpty() ? searchOsm(q) : searchGoogle(q, near);
        } catch (Exception e) {
            log.warn("Place search failed for \"{}\": {}", q, e.toString());
            return List.of();
        }
    }

    /* ----------------------------------------------------------- google -- */

    private List<Map<String, Object>> searchGoogle(String q, String near) throws Exception {
        StringBuilder url = new StringBuilder("https://maps.googleapis.com/maps/api/place/textsearch/json")
                .append("?query=").append(enc(q))
                .append("&region=in")
                .append("&key=").append(enc(googleKey));
        // Biasing to where the person is makes "Fish Market" mean the one down
        // the road rather than one in another state.
        if (near != null && near.matches("-?\\d+(\\.\\d+)?,-?\\d+(\\.\\d+)?")) {
            url.append("&location=").append(near).append("&radius=30000");
        }
        JsonNode root = getJson(url.toString());
        List<Map<String, Object>> out = new ArrayList<>();
        for (JsonNode r : root.path("results")) {
            Map<String, Object> row = new LinkedHashMap<>();
            row.put("id", r.path("place_id").asText());
            row.put("name", r.path("name").asText(""));
            row.put("label", r.path("formatted_address").asText(""));
            row.put("latitude", r.path("geometry").path("location").path("lat").asDouble());
            row.put("longitude", r.path("geometry").path("location").path("lng").asDouble());
            // Text search does not break the address into parts, so the PIN is
            // pulled out of the formatted line - in India it is six digits.
            row.put("pincode", firstPin(r.path("formatted_address").asText("")));
            out.add(row);
            if (out.size() >= 8) break;
        }
        return out;
    }

    /* -------------------------------------------------------------- osm -- */

    private List<Map<String, Object>> searchOsm(String q) throws Exception {
        String url = "https://nominatim.openstreetmap.org/search?format=jsonv2&addressdetails=1"
                + "&limit=8&countrycodes=in&q=" + enc(q);
        JsonNode rows = getJson(url);
        List<Map<String, Object>> out = new ArrayList<>();
        for (JsonNode r : rows) {
            JsonNode a = r.path("address");
            Map<String, Object> row = new LinkedHashMap<>();
            row.put("id", r.path("place_id").asText());
            row.put("name", firstNonBlank(a.path("amenity").asText(null), a.path("shop").asText(null),
                    a.path("road").asText(null), a.path("suburb").asText("")));
            row.put("label", r.path("display_name").asText(""));
            row.put("latitude", r.path("lat").asDouble());
            row.put("longitude", r.path("lon").asDouble());
            row.put("pincode", a.path("postcode").asText(""));
            row.put("street", a.path("road").asText(""));
            row.put("locality", firstNonBlank(a.path("suburb").asText(null),
                    a.path("neighbourhood").asText(null), a.path("village").asText("")));
            row.put("city", firstNonBlank(a.path("city").asText(null), a.path("town").asText(null),
                    a.path("state_district").asText("")));
            row.put("state", a.path("state").asText(""));
            out.add(row);
        }
        return out;
    }

    /* ------------------------------------------------------------ plumbing */

    private JsonNode getJson(String url) throws Exception {
        HttpRequest req = HttpRequest.newBuilder(URI.create(url))
                // Nominatim's policy requires an identifying agent; Google
                // ignores it. One header keeps both happy.
                .header("User-Agent", "JobOn/1.0 (+https://jobon.mindsyncos.com)")
                .header("Accept", "application/json")
                .timeout(Duration.ofSeconds(12))
                .GET().build();
        HttpResponse<String> res = http.send(req, HttpResponse.BodyHandlers.ofString());
        return mapper.readTree(res.body());
    }

    private static String firstPin(String s) {
        var m = java.util.regex.Pattern.compile("\\b(\\d{6})\\b").matcher(s == null ? "" : s);
        return m.find() ? m.group(1) : "";
    }

    private static String firstNonBlank(String... vals) {
        for (String v : vals) if (v != null && !v.isBlank()) return v;
        return "";
    }

    private static String enc(String s) {
        return URLEncoder.encode(s, StandardCharsets.UTF_8);
    }
}
