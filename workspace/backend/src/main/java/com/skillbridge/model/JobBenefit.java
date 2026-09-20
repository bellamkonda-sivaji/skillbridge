package com.skillbridge.model;

import jakarta.persistence.*;
import lombok.*;

/**
 * One structured benefit on a job post. Replaces the old free-text benefit strings; the table
 * is named job_benefit_items because job_benefits was the old element-collection table.
 */
@Entity
@Table(name = "job_benefit_items")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class JobBenefit {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "job_id")
    private JobPost job;

    @Enumerated(EnumType.STRING)
    @Column(name = "benefit_type", nullable = false)
    private BenefitType benefitType;

    /** Optional money figure, e.g. 100 for a travel allowance. */
    @Column(name = "benefit_amount")
    private Double amount;

    /** Free text unit for the amount, e.g. "per day". */
    @Column(name = "benefit_unit")
    private String unit;

    @Column(name = "benefit_note", length = 500)
    private String note;
}
