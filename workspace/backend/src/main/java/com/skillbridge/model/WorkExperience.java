package com.skillbridge.model;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;
import lombok.*;

/** One line of a worker's history, rendered on the employer-facing worker profile. */
@Embeddable
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class WorkExperience {

    @Column(name = "role")
    private String role;

    @Column(name = "employer_name")
    private String employer;

    @Column(name = "years")
    private double years;
}
