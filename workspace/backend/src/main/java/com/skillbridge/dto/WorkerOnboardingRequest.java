package com.skillbridge.dto;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.skillbridge.model.Availability;
import com.skillbridge.model.EmploymentType;
import com.skillbridge.model.Gender;
import com.skillbridge.model.SalaryUnit;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;
import java.util.List;

/**
 * Body of PATCH /api/worker/onboarding. Every field is boxed so that an absent field
 * arrives as null and is left untouched by the merge.
 */
@Getter
@Setter
@NoArgsConstructor
public class WorkerOnboardingRequest {

    private LocalDate dateOfBirth;
    private Gender gender;
    private String alternatePhone;
    private String photoUrl;
    private List<String> jobCategories;
    private List<EmploymentType> employmentTypes;
    private List<String> skills;
    private Integer experienceYears;
    private Boolean fresher;
    private String city;
    private String area;
    private Double latitude;
    private Double longitude;
    private Integer preferredRadiusKm;
    private Availability availability;
    private String jobTitle;
    private String bio;
    private Double expectedSalary;
    private SalaryUnit salaryUnit;

    /**
     * preferredRadiusKm is the one field where null carries meaning ("anywhere"), so we
     * track whether the caller actually sent the key rather than relying on null alone.
     */
    @JsonIgnore
    private boolean preferredRadiusKmPresent;

    public void setPreferredRadiusKm(Integer preferredRadiusKm) {
        this.preferredRadiusKm = preferredRadiusKm;
        this.preferredRadiusKmPresent = true;
    }
}
