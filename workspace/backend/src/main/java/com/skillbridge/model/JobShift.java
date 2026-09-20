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

    /** Optional unpaid break inside the window, e.g. 13:00 - 13:30. */
    private LocalTime breakStart;

    private LocalTime breakEnd;
}
