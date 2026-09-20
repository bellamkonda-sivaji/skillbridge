package com.skillbridge.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "worker_profiles")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class WorkerProfile {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "worker_account_id", nullable = false, unique = true)
    private WorkerAccount account;

    private LocalDate dateOfBirth;

    @Enumerated(EnumType.STRING)
    private Gender gender;

    private String alternatePhone;

    @Builder.Default
    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "worker_job_categories", joinColumns = @JoinColumn(name = "profile_id"))
    @Column(name = "job_category")
    private java.util.List<String> jobCategories = new java.util.ArrayList<>();

    @Builder.Default
    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "worker_employment_types", joinColumns = @JoinColumn(name = "profile_id"))
    @Enumerated(EnumType.STRING)
    @Column(name = "employment_type")
    private java.util.List<EmploymentType> employmentTypes = new java.util.ArrayList<>();

    @Builder.Default
    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "worker_skills", joinColumns = @JoinColumn(name = "profile_id"))
    @Column(name = "skill")
    private java.util.List<String> skills = new java.util.ArrayList<>();

    private int experienceYears;

    private boolean fresher;

    private String jobTitle;

    private String bio;

    private String city;

    private String area;

    private double latitude;

    private double longitude;

    private boolean locationEnabled;

    /** How far the worker is willing to travel. null means "anywhere". */
    private Integer preferredRadiusKm;

    @Builder.Default
    @Enumerated(EnumType.STRING)
    private Availability availability = Availability.IMMEDIATE;

    private double expectedSalary;

    @Builder.Default
    @Enumerated(EnumType.STRING)
    private SalaryUnit salaryUnit = SalaryUnit.PER_MONTH;

    @Builder.Default
    @Enumerated(EnumType.STRING)
    private VerificationStatus verificationStatus = VerificationStatus.UNVERIFIED;

    private String verificationDoc;

    private String verifiedBy;

    private LocalDateTime verifiedAt;

    private boolean profileCompleted;

    /** Spoken languages, e.g. ["Telugu","English"]. Shown on the employer-facing profile. */
    @Builder.Default
    @ElementCollection
    @CollectionTable(name = "worker_languages", joinColumns = @JoinColumn(name = "profile_id"))
    @Column(name = "language_name")
    @OrderColumn(name = "position")
    private java.util.List<String> languages = new java.util.ArrayList<>();

    /** Work history rows rendered on the employer-facing worker profile and the compare screen. */
    @Builder.Default
    @ElementCollection
    @CollectionTable(name = "worker_work_experience", joinColumns = @JoinColumn(name = "profile_id"))
    @OrderColumn(name = "position")
    private java.util.List<WorkExperience> workExperience = new java.util.ArrayList<>();
}
