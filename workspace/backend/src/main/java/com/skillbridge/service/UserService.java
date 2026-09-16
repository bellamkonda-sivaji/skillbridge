package com.skillbridge.service;

import com.skillbridge.dto.*;
import com.skillbridge.exception.ApiException;
import com.skillbridge.model.*;
import com.skillbridge.repository.EmployerProfileRepository;
import com.skillbridge.repository.ReviewRepository;
import com.skillbridge.repository.UserRepository;
import com.skillbridge.repository.WorkerProfileRepository;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class UserService {

    private final UserRepository userRepository;
    private final WorkerProfileRepository workerProfileRepository;
    private final EmployerProfileRepository employerProfileRepository;
    private final ReviewRepository reviewRepository;
    private final GeoService geoService;
    private final SkillLexicon lexicon;
    private final MatchingService matchingService;

    public UserService(UserRepository userRepository, WorkerProfileRepository workerProfileRepository,
                       EmployerProfileRepository employerProfileRepository, ReviewRepository reviewRepository,
                       GeoService geoService, SkillLexicon lexicon, MatchingService matchingService) {
        this.userRepository = userRepository;
        this.workerProfileRepository = workerProfileRepository;
        this.employerProfileRepository = employerProfileRepository;
        this.reviewRepository = reviewRepository;
        this.geoService = geoService;
        this.lexicon = lexicon;
        this.matchingService = matchingService;
    }

    public User getUserOrThrow(Long id) {
        return userRepository.findById(id).orElseThrow(() -> ApiException.notFound("User not found"));
    }

    public UserDto me(User user) {
        return UserDto.from(user);
    }

    public WorkerProfileDto getWorkerProfile(Long userId) {
        WorkerProfile profile = workerProfileRepository.findByUserId(userId)
                .orElseThrow(() -> ApiException.notFound("Worker profile not found"));
        return WorkerProfileDto.from(profile);
    }

    public EmployerProfileDto getEmployerProfile(Long userId) {
        EmployerProfile profile = employerProfileRepository.findByUserId(userId)
                .orElseThrow(() -> ApiException.notFound("Employer profile not found"));
        return EmployerProfileDto.from(profile);
    }

    @Transactional
    public WorkerProfileDto updateWorkerProfile(User user, WorkerProfileRequest request) {
        WorkerProfile profile = workerProfileRepository.findByUserId(user.getId())
                .orElseGet(() -> workerProfileRepository.save(WorkerProfile.builder().user(user).build()));

        profile.setSkills(request.skills() != null ? request.skills() : new ArrayList<>());
        profile.setExperienceYears(request.experienceYears());
        profile.setJobTitle(request.jobTitle());
        profile.setBio(request.bio());
        profile.setCity(request.city());
        profile.setArea(request.area());
        profile.setLatitude(request.latitude());
        profile.setLongitude(request.longitude());
        profile.setLocationEnabled(request.locationEnabled());
        if (request.availability() != null) profile.setAvailability(request.availability());
        profile.setExpectedSalary(request.expectedSalary());
        if (request.salaryUnit() != null) profile.setSalaryUnit(request.salaryUnit());
        if (request.verificationDoc() != null && !request.verificationDoc().isBlank()
                && profile.getVerificationStatus() == VerificationStatus.UNVERIFIED) {
            profile.setVerificationDoc(request.verificationDoc());
            profile.setVerificationStatus(VerificationStatus.PENDING);
        }
        profile.setProfileCompleted(!profile.getSkills().isEmpty() && profile.getJobTitle() != null
                && !profile.getJobTitle().isBlank() && profile.getCity() != null && !profile.getCity().isBlank());
        workerProfileRepository.save(profile);

        matchingService.generateMatchesForWorker(profile);
        return WorkerProfileDto.from(profile);
    }

    @Transactional
    public EmployerProfileDto updateEmployerProfile(User user, EmployerProfileRequest request) {
        EmployerProfile profile = employerProfileRepository.findByUserId(user.getId())
                .orElseGet(() -> employerProfileRepository.save(EmployerProfile.builder().user(user).build()));
        if (request.businessName() != null && !request.businessName().isBlank()) {
            profile.setBusinessName(request.businessName());
        }
        profile.setBusinessType(request.businessType());
        profile.setDescription(request.description());
        profile.setCity(request.city());
        profile.setArea(request.area());
        profile.setLatitude(request.latitude());
        profile.setLongitude(request.longitude());
        profile.setLocationEnabled(request.locationEnabled());
        profile.setWebsite(request.website());
        employerProfileRepository.save(profile);
        return EmployerProfileDto.from(profile);
    }

    public List<WorkerProfileDto> searchWorkers(String q, List<String> skills, String city,
                                                Double maxDistanceKm, Double lat, Double lng,
                                                Integer minRating, Availability availability,
                                                boolean verifiedOnly, Integer minExperience) {
        List<WorkerProfile> candidates;
        if (q != null && !q.isBlank()) {
            candidates = new ArrayList<>(workerProfileRepository.search(q));
            for (String skill : q.split("[,\\s]+")) {
                if (skill.length() > 1) {
                    for (WorkerProfile w : workerProfileRepository.findBySkillContaining(skill)) {
                        if (!candidates.contains(w)) candidates.add(w);
                    }
                }
            }
        } else {
            candidates = workerProfileRepository.findAll(Sort.by(Sort.Direction.DESC, "id"));
        }

        List<WorkerProfile> result = new ArrayList<>();
        for (WorkerProfile w : candidates) {
            boolean ok = true;
            if (skills != null && !skills.isEmpty()) {
                List<String> workerExpanded = new ArrayList<>();
                for (String s : w.getSkills()) {
                    for (String v : lexicon.expand(s)) workerExpanded.add(lexicon.normalize(v));
                }
                boolean hasAll = skills.stream().allMatch(s -> {
                    for (String v : lexicon.expand(s)) {
                        if (workerExpanded.contains(lexicon.normalize(v))) return true;
                    }
                    return false;
                });
                if (!hasAll) ok = false;
            }
            if (ok && city != null && !city.isBlank() && !w.getCity().equalsIgnoreCase(city)) ok = false;
            if (ok && minRating != null && w.getUser().getAvgRating() < minRating) ok = false;
            if (ok && availability != null && w.getAvailability() != availability) ok = false;
            if (ok && verifiedOnly && w.getVerificationStatus() != VerificationStatus.VERIFIED) ok = false;
            if (ok && minExperience != null && w.getExperienceYears() < minExperience) ok = false;
            if (ok && maxDistanceKm != null && lat != null && lng != null) {
                double dist = geoService.distanceKm(lat, lng, w.getLatitude(), w.getLongitude());
                if (dist > maxDistanceKm) ok = false;
            }
            if (ok) result.add(w);
        }
        return result.stream().map(WorkerProfileDto::from).collect(Collectors.toList());
    }

    public List<ReviewDto> reviewsFor(Long userId) {
        User target = getUserOrThrow(userId);
        return reviewRepository.findByTargetOrderByCreatedAtDesc(target).stream().map(ReviewDto::from).toList();
    }
}
