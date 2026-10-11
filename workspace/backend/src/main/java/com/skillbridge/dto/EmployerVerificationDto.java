package com.skillbridge.dto;

import com.skillbridge.model.EmployerProfile;

/**
 * A business waiting to be checked, with the proof it sent.
 *
 * The documents are the point. An employer uploads a registration
 * certificate, a photo of the shop and the owner's ID, and until now
 * nothing showed them to anyone - the upload side of verification existed
 * and the reviewing side did not, so every business sat unverified however
 * much proof it had provided.
 *
 * Contact details are included deliberately: staff ring the business to
 * check, which is the step the documents only support.
 */
public record EmployerVerificationDto(
        Long employerAccountId,
        String businessName,
        String ownerName,
        String phone,
        String email,
        String businessType,
        String address,
        String city,
        String pincode,
        /** Base64 data URLs, shown as pictures in the back office. */
        String registrationDocUrl,
        String ownerIdDocUrl,
        String logoUrl,
        boolean verified,
        int shopCount
) {
    public static EmployerVerificationDto from(EmployerProfile p, int shopCount) {
        return new EmployerVerificationDto(
                p.getAccount().getId(),
                p.getBusinessName(),
                p.getAccount().getName(),
                p.getAccount().getPhone(),
                p.getAccount().getEmail(),
                p.getBusinessType(),
                p.getAddress(),
                p.getCity(),
                p.getPincode(),
                p.getRegistrationDocUrl(),
                p.getOwnerIdDocUrl(),
                p.getLogoUrl(),
                p.isVerified(),
                shopCount);
    }
}
