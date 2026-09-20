package com.skillbridge.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;

/**
 * The hire itself: created the moment a worker accepts an offer, and the row the joining,
 * shift and attendance screens all hang off.
 */
@Entity
@Table(name = "employments")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Employment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "worker_account_id", nullable = false)
    private WorkerAccount worker;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "employer_account_id", nullable = false)
    private EmployerAccount employer;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "job_id", nullable = false)
    private JobPost job;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "application_id", unique = true)
    private JobApplication application;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "offer_id", unique = true)
    private JobOffer offer;

    private LocalDate joiningDate;

    private LocalTime reportingTime;

    @Builder.Default
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private EmploymentStatus status = EmploymentStatus.OFFER_ACCEPTED;

    private double salary;

    @Builder.Default
    @Enumerated(EnumType.STRING)
    private SalaryUnit salaryUnit = SalaryUnit.PER_DAY;

    @Builder.Default
    @Enumerated(EnumType.STRING)
    private EmploymentType employmentType = EmploymentType.FULL_TIME;

    @Column(length = 500)
    private String workLocation;

    private String contactPersonName;

    private String contactPersonPhone;

    private String dressCode;

    @Builder.Default
    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "employment_documents", joinColumns = @JoinColumn(name = "employment_id"))
    @Column(name = "document_name")
    @OrderColumn(name = "position")
    private List<String> documentsToCarry = new ArrayList<>();

    /** Stamped when the worker taps "I will be there" on the joining screen. */
    private LocalDateTime joiningAcknowledgedAt;

    private LocalDateTime startedAt;

    private LocalDateTime endedAt;

    @Builder.Default
    @Column(nullable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    /** OFFER_ACCEPTED / JOINING_CONFIRMED / ACTIVE are the "current" side of the scope filter. */
    public boolean isCurrent() {
        return status == EmploymentStatus.OFFER_ACCEPTED
                || status == EmploymentStatus.JOINING_CONFIRMED
                || status == EmploymentStatus.ACTIVE;
    }
}
