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
        // Places API (New). The legacy textsearch endpoint still exists but
        // Google refuses it on projects that never used it: "You're calling a
        // legacy API, which is not enabled for your project."
        var body = mapper.createObjectNode();
        body.put("textQuery", q);
        body.put("regionCode", "IN");
        body.put("maxResultCount", 8);
        // Biasing to where the person is makes "Fish Market" mean the one down
        // the road rather than one in another state.
        if (near != null && near.matches("-?\\d+(\\.\\d+)?,-?\\d+(\\.\\d+)?")) {
            String[] parts = near.split(",");
            var circle = body.putObject("locationBias").putObject("circle");
            var centre = circle.putObject("center");
            centre.put("latitude", Double.parseDouble(parts[0]));
            centre.put("longitude", Double.parseDouble(parts[1]));
            circle.put("radius", 30000.0);
        }

        HttpRequest req = HttpRequest.newBuilder(URI.create("https://places.googleapis.com/v1/places:searchText"))
                .header("Content-Type", "application/json")
                .header("X-Goog-Api-Key", googleKey)
                // Billing is per field group, so ask for exactly what is shown.
                .header("X-Goog-FieldMask",
                        "places.id,places.displayName,places.formattedAddress,"
                                + "places.location,places.addressComponents")
                .timeout(Duration.ofSeconds(12))
                .POST(HttpRequest.BodyPublishers.ofString(
                        mapper.writeValueAsString(body), StandardCharsets.UTF_8))
                .build();
        HttpResponse<String> res = http.send(req, HttpResponse.BodyHandlers.ofString());
        JsonNode root = mapper.readTree(res.body());
        if (root.has("error")) {
            log.warn("Google Places refused the search: {}",
                    root.path("error").path("message").asText());
            // Falling back keeps address entry working on a misconfigured key
            // instead of leaving the employer with an empty list and no reason.
            return searchOsm(q);
        }

        List<Map<String, Object>> out = new ArrayList<>();
        for (JsonNode p : root.path("places")) {
            Map<String, Object> row = new LinkedHashMap<>();
            row.put("id", p.path("id").asText());
            row.put("name", p.path("displayName").path("text").asText(""));
            row.put("label", p.path("formattedAddress").asText(""));
            row.put("latitude", p.path("location").path("latitude").asDouble());
            row.put("longitude", p.path("location").path("longitude").asDouble());
            row.put("pincode", component(p, "postal_code"));
            row.put("street", component(p, "route"));
            row.put("doorNo", component(p, "street_number"));
            row.put("locality", firstNonBlank(component(p, "sublocality_level_1"),
                    component(p, "sublocality"), component(p, "neighborhood")));
            row.put("city", firstNonBlank(component(p, "locality"),
                    component(p, "administrative_area_level_2")));
            row.put("state", component(p, "administrative_area_level_1"));
            out.add(row);
        }
        return out;
    }

    /** One address component by type, which is where the PIN and street live. */
    private static String component(JsonNode place, String type) {
        for (JsonNode c : place.path("addressComponents")) {
            for (JsonNode t : c.path("types")) {
                if (type.equals(t.asText())) return c.path("longText").asText("");
            }
        }
        return "";
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
