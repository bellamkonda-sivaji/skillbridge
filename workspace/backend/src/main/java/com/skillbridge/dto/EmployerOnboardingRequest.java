package com.skillbridge.dto;

import com.skillbridge.model.EmployerKind;
import com.skillbridge.model.EmployerPlan;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.List;

/**
 * Body of PATCH /api/employer/onboarding. Every field is boxed so that an absent field arrives
 * as null and is left untouched by the merge - the wizard saves one step at a time and may be
 * resumed from GET /api/employer/onboarding.
 */
@Getter
@Setter
@NoArgsConstructor
public class EmployerOnboardingRequest {

    // ---- account columns (unique, so a clash is a 409) ----
    private String phone;
    private String email;

    // ---- business identity ----
    private EmployerKind employerKind;
    private String businessName;
    private String businessType;
    private String businessSize;
    private String description;
    private String website;

    // ---- location ----
    private String address;
    private String pincode;
    private String city;
    private String area;
    private Double latitude;
    private Double longitude;

    // ---- verification ----
    private String registrationDocUrl;
    private String ownerIdDocUrl;
    private String logoUrl;
    private Boolean authorizedConfirmed;

    // ---- plan & payment ----
    private EmployerPlan plan;
    private String paymentMethod;
    private Boolean onboardingCompleted;

    // ---- optional extras the profile screen also edits ----
    private Integer founded;
    private String teamSize;
    private List<String> photos;
}
