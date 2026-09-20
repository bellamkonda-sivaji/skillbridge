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
    private SalaryUnit salaryUnit = SalaryUnit.PER_DAY;

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
}
