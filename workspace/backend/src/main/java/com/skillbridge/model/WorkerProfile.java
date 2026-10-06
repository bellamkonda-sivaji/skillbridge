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
    private SalaryUnit salaryUnit = SalaryUnit.MONTHLY;

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

    // ------------------------------------------------------------------ employer-facing profile

    /** How far the worker will travel for work, in km. null means "not stated". */
    @Column(name = "can_travel_km")
    private Integer canTravelKm;

    /** The date the worker can start. null means "not stated". */
    @Column(name = "available_from")
    private LocalDate availableFrom;

    /** Roles the worker wants, e.g. ["Store Helper","Cashier"]. */
    @Builder.Default
    @ElementCollection
    @CollectionTable(name = "worker_preferred_roles", joinColumns = @JoinColumn(name = "profile_id"))
    @Column(name = "preferred_role")
    @OrderColumn(name = "position")
    private java.util.List<String> preferredRoles = new java.util.ArrayList<>();

    /** Time-of-day preferences, e.g. ["Morning","Evening"]. */
    @Builder.Default
    @ElementCollection
    @CollectionTable(name = "worker_preferred_hours", joinColumns = @JoinColumn(name = "profile_id"))
    @Column(name = "preferred_hour")
    @OrderColumn(name = "position")
    private java.util.List<String> preferredHours = new java.util.ArrayList<>();

    /** Base64 data URLs of work photos, so each one needs a CLOB rather than a capped varchar. */
    @Builder.Default
    @ElementCollection
    @CollectionTable(name = "worker_photos", joinColumns = @JoinColumn(name = "profile_id"))
    @Lob
    @Column(name = "photo_url", columnDefinition = "TEXT")
    @OrderColumn(name = "position")
    private java.util.List<String> photos = new java.util.ArrayList<>();

    // Document states. null means the profile has nothing recorded, which reads as NOT_UPLOADED.
    @Enumerated(EnumType.STRING)
    @Column(name = "aadhaar_doc_status")
    private DocumentStatus aadhaarStatus;

    @Enumerated(EnumType.STRING)
    @Column(name = "bank_doc_status")
    private DocumentStatus bankStatus;

    @Enumerated(EnumType.STRING)
    @Column(name = "pan_doc_status")
    private DocumentStatus panStatus;

    @Enumerated(EnumType.STRING)
    @Column(name = "address_doc_status")
    private DocumentStatus addressStatus;

    @Enumerated(EnumType.STRING)
    @Column(name = "passport_doc_status")
    private DocumentStatus passportStatus;

    /** The recorded state of one document, defaulting to NOT_UPLOADED when nothing is held. */
    public DocumentStatus documentStatus(DocumentType type) {
        DocumentStatus stored = switch (type) {
            case AADHAAR -> aadhaarStatus;
            case BANK -> bankStatus;
            case PAN -> panStatus;
            case ADDRESS -> addressStatus;
            case PASSPORT -> passportStatus;
        };
        if (stored != null) {
            return stored;
        }
        // Aadhaar falls back to the identity verification the profile already carries.
        if (type == DocumentType.AADHAAR) {
            if (verificationStatus == VerificationStatus.VERIFIED) {
                return DocumentStatus.VERIFIED;
            }
            if (verificationStatus == VerificationStatus.PENDING
                    || (verificationDoc != null && !verificationDoc.isBlank())) {
                return DocumentStatus.PENDING;
            }
        }
        return DocumentStatus.NOT_UPLOADED;
    }
}
