package com.skillbridge.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * A formal offer an employer sends against an application. Accepting it is what moves the
 * application to ACCEPTED and releases the wallet payment - exactly once.
 */
@Entity
@Table(name = "job_offers")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class JobOffer {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "application_id", nullable = false, unique = true)
    private JobApplication application;

    private double salary;

    @Builder.Default
    @Enumerated(EnumType.STRING)
    private SalaryUnit salaryUnit = SalaryUnit.DAILY;

    @Builder.Default
    @Enumerated(EnumType.STRING)
    private EmploymentType employmentType = EmploymentType.FULL_TIME;

    private LocalDate joiningDate;

    private String workLocation;

    @Builder.Default
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private OfferStatus status = OfferStatus.PENDING;

    @Builder.Default
    @Column(nullable = false)
    private LocalDateTime sentAt = LocalDateTime.now();

    private LocalDateTime respondedAt;

    // ------------------------------------------------------------------ offer lifecycle

    /** The paperwork this offer carries, derived from the job's duration when it is created. */
    @Enumerated(EnumType.STRING)
    @Column(name = "offer_type")
    private OfferType offerType;

    /** ONE_DAY offers are for exactly this date instead of a joining date. */
    @Column(name = "work_date")
    private LocalDate workDate;

    /** Only meaningful on MONTHS / PERMANENT offers; null on short engagements. */
    @Column(name = "probation_months")
    private Integer probationMonths;

    @Builder.Default
    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "job_offer_benefits", joinColumns = @JoinColumn(name = "offer_id"))
    @Enumerated(EnumType.STRING)
    @Column(name = "benefit_type")
    private java.util.List<BenefitType> benefits = new java.util.ArrayList<>();

    /** The covering note the employer attaches to the offer. */
    @Column(name = "offer_message", length = 2000)
    private String message;

    /** After this the offer lapses; a PENDING offer past it reads as EXPIRED. */
    @Column(name = "expires_at")
    private LocalDateTime expiresAt;

}
