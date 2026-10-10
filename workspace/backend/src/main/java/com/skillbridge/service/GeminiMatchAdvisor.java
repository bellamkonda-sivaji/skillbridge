package com.skillbridge.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.skillbridge.model.JobPost;
import com.skillbridge.model.WorkerProfile;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Judgement on the cases arithmetic gets wrong.
 *
 * The scorer handles what is measurable: how far, how much, how long they
 * have done it. What it cannot do is read a job and a person and say whether
 * one suits the other. "Cashier" and "Store Helper" share no skill keyword
 * and are the same shop floor; "Driver" and "Delivery Partner" overlap on
 * paper and do not always in practice.
 *
 * So this is asked only about the uncertain middle - the band where the score
 * is neither clearly yes nor clearly no. Clear matches are notified without
 * asking, and anything outside the worker's travel radius is already gone
 * before we get here, because no amount of judgement makes a job reachable.
 *
 * One call for the whole band, not one per worker: a posting that notifies
 * forty people should cost one request, not forty.
 *
 * Without a key, or on any failure, the band is admitted on score alone -
 * the behaviour before this existed. Matching must never depend on a third
 * party being up.
 */
@Service
public class GeminiMatchAdvisor {

    private static final Logger log = LoggerFactory.getLogger(GeminiMatchAdvisor.class);

    private final ObjectMapper mapper = new ObjectMapper();
    private final HttpClient http = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(8)).build();

    private final String apiKey;
    private final String model;

    public GeminiMatchAdvisor(@Value("${skillbridge.gemini.api-key:}") String apiKey,
                              @Value("${skillbridge.gemini.model:gemini-flash-lite-latest}") String model) {
        this.apiKey = apiKey == null ? "" : apiKey.trim();
        this.model = model;
    }

    public boolean enabled() {
        return !apiKey.isEmpty();
    }

    /** One worker's case, as the model is asked to judge it. */
    public record Candidate(Long workerId, String name, String jobTitle, List<String> skills,
                            int experienceYears, double distanceKm, double score) {}

    /** What came back: whether to tell them, and why in one line. */
    public record Verdict(boolean shouldNotify, String reason) {}

    /**
     * @return a verdict per worker id. Missing ids mean "no opinion" and the
     *         caller falls back to the score.
     */
    public Map<Long, Verdict> judge(JobPost job, List<Candidate> candidates) {
        if (!enabled() || candidates.isEmpty()) return Map.of();
        try {
            ObjectNode root = mapper.createObjectNode();
            ArrayNode contents = root.putArray("contents");
            ObjectNode turn = contents.addObject();
            turn.putArray("parts").addObject().put("text", prompt(job, candidates));

            ObjectNode cfg = root.putObject("generationConfig");
            // Deterministic: the same posting judged twice should notify the
            // same people, or nobody can reason about why they were told.
            cfg.put("temperature", 0);
            cfg.put("responseMimeType", "application/json");

            HttpRequest req = HttpRequest.newBuilder(URI.create(
                            "https://generativelanguage.googleapis.com/v1beta/models/"
                                    + model + ":generateContent"))
                    .header("Content-Type", "application/json")
                    .header("x-goog-api-key", apiKey)
                    .timeout(Duration.ofSeconds(20))
                    .POST(HttpRequest.BodyPublishers.ofString(
                            mapper.writeValueAsString(root), StandardCharsets.UTF_8))
                    .build();

            HttpResponse<String> res = http.send(req, HttpResponse.BodyHandlers.ofString());
            JsonNode body = mapper.readTree(res.body());
            if (body.has("error")) {
                log.warn("Gemini refused the match request: {}",
                        body.path("error").path("message").asText());
                return Map.of();
            }
            String text = body.path("candidates").path(0).path("content")
                    .path("parts").path(0).path("text").asText("");
            return parse(text);
        } catch (Exception e) {
            log.warn("Could not reach Gemini for match advice: {}", e.toString());
            return Map.of();
        }
    }

    private String prompt(JobPost job, List<Candidate> candidates) {
        StringBuilder sb = new StringBuilder();
        sb.append("You are matching daily-wage and shift workers in India to a job.\n")
          .append("Decide, for each worker, whether telling them about this job is a fair use ")
          .append("of their attention. A notification that wastes their time costs them trust; ")
          .append("a job they could have done and never heard about costs them a day's pay. ")
          .append("Favour telling them when the work is plainly within reach.\n\n")
          .append("Judge the kind of work, not the exact words. A cashier can usually do store ")
          .append("helper work; a tailor cannot usually drive. Experience below what is asked ")
          .append("is rarely fatal for simple work. Distance is already within the worker's own ")
          .append("stated limit, so do not reject on it.\n\n")
          .append("JOB\n")
          .append("title: ").append(job.getTitle()).append('\n')
          .append("skills wanted: ").append(String.join(", ", job.getRequiredSkills())).append('\n')
          .append("experience wanted: ").append(job.getMinExperienceYears()).append(" years\n");
        if (job.getDescription() != null && !job.getDescription().isBlank()) {
            sb.append("description: ")
              .append(job.getDescription().length() > 400
                      ? job.getDescription().substring(0, 400) : job.getDescription())
              .append('\n');
        }
        sb.append("\nWORKERS\n");
        for (Candidate c : candidates) {
            sb.append("- id=").append(c.workerId())
              .append(" | does: ").append(c.jobTitle() == null ? "unstated" : c.jobTitle())
              .append(" | skills: ").append(c.skills() == null || c.skills().isEmpty()
                      ? "none listed" : String.join(", ", c.skills()))
              .append(" | experience: ").append(c.experienceYears()).append(" years")
              .append(" | ").append(String.format("%.1f", c.distanceKm())).append(" km away\n");
        }
        sb.append("\nReturn JSON only: ")
          .append("{\"results\":[{\"id\":<worker id>,\"notify\":true|false,")
          .append("\"reason\":\"<at most 12 plain words a worker would understand>\"}]}");
        return sb.toString();
    }

    private Map<Long, Verdict> parse(String text) {
        Map<Long, Verdict> out = new HashMap<>();
        try {
            JsonNode root = mapper.readTree(text);
            for (JsonNode r : root.path("results")) {
                long id = r.path("id").asLong(-1);
                if (id < 0) continue;
                out.put(id, new Verdict(r.path("notify").asBoolean(false),
                        r.path("reason").asText("")));
            }
        } catch (Exception e) {
            log.warn("Gemini returned something that was not the JSON asked for: {}", e.toString());
        }
        return out;
    }

    /** Candidates in the uncertain band, which is all this is asked about. */
    public static List<Candidate> uncertain(List<Candidate> all, double low, double high) {
        List<Candidate> band = new ArrayList<>();
        for (Candidate c : all) {
            if (c.score() >= low && c.score() < high) band.add(c);
        }
        return band;
    }
}
