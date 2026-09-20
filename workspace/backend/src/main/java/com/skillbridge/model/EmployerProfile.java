package com.skillbridge.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "employer_profiles")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EmployerProfile {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "employer_account_id", nullable = false, unique = true)
    private EmployerAccount account;

    @Column(nullable = false)
    private String businessName;

    private String businessType;

    @Column(length = 4000)
    private String description;

    private String city;

    private String area;

    private double latitude;

    private double longitude;

    private boolean locationEnabled;

    private String website;

    /** Year the business was founded. Nullable - most profiles never fill it in. */
    private Integer founded;

    /** Free text bucket, e.g. "10 - 50 employees". */
    private String teamSize;

    /** Set by an admin once the business paperwork checks out. */
    @Builder.Default
    @Column(nullable = false)
    private boolean verified = false;

    /** Data URLs of the shopfront / site photos shown on the public profile. */
    @Builder.Default
    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "employer_photos", joinColumns = @JoinColumn(name = "employer_profile_id"))
    @Column(name = "photo", length = 1000000)
    private List<String> photos = new ArrayList<>();

    // ------------------------------------------------------------------ onboarding wizard fields
    // Every one of these is nullable: the wizard saves a step at a time and may be resumed.

    /** BUSINESS or INDIVIDUAL - step 1 of the employer onboarding wizard. */
    @Enumerated(EnumType.STRING)
    private EmployerKind employerKind;

    /** Free text bucket the wizard offers, e.g. "10 - 50 employees". */
    private String businessSize;

    @Column(length = 500)
    private String address;

    private String pincode;

    /** Base64 data URL of the business registration document. CLOB: a base64
     *  payload is ~33% larger than the file, so a fixed VARCHAR cap overflows. */
    @Lob
    @Column(columnDefinition = "CLOB")
    private String registrationDocUrl;

    /** Base64 data URL of the business logo. */
    @Lob
    @Column(columnDefinition = "CLOB")
    private String logoUrl;

    /** The "I am authorised to hire for this business" tick on the verification step. */
    @Builder.Default
    @Column(nullable = false)
    private boolean authorizedConfirmed = false;

    @Enumerated(EnumType.STRING)
    private EmployerPlan plan;

    /** "UPI" | "CARD" | "NETBANKING". */
    private String paymentMethod;

    @Builder.Default
    @Column(nullable = false)
    private boolean onboardingCompleted = false;

    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();
}
