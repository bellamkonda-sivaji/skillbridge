package com.skillbridge.model;

/** The document set the employer-facing worker profile renders, in display order. */
public enum DocumentType {
    AADHAAR, BANK, PAN, ADDRESS, PASSPORT;

    /** The label the profile screen prints next to the status chip. */
    public String label() {
        return switch (this) {
            case AADHAAR -> "Aadhaar Card";
            case BANK -> "Bank Account Details";
            case PAN -> "PAN Card";
            case ADDRESS -> "Address Proof";
            case PASSPORT -> "Passport (Optional)";
        };
    }
}
