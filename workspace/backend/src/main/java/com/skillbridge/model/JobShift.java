package com.skillbridge.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalTime;

/** One working window on a job post. A job carries 0..n of these, cascaded and orphan-removed. */
@Entity
@Table(name = "job_shifts")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class JobShift {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "job_id")
    private JobPost job;

    private String label;

    private LocalTime startTime;

    private LocalTime endTime;

    /** Unpaid break in minutes, e.g. 60 for a one-hour lunch. Preferred over the legacy pair. */
    private Integer breakMinutes;

    /** Legacy break window, kept so rows written before breakMinutes still compute. */
    private LocalTime breakStart;

    private LocalTime breakEnd;
}
