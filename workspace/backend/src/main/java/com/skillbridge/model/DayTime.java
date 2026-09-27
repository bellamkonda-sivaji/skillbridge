package com.skillbridge.model;

import jakarta.persistence.Embeddable;
import lombok.*;

import java.time.LocalTime;

/** Day-specific timings on a job post: the window the work runs on one weekday. */
@Embeddable
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DayTime {

    /** MON / TUE / ... - the weekday this window applies to. */
    private String dayCode;

    private LocalTime startTime;

    private LocalTime endTime;
}
