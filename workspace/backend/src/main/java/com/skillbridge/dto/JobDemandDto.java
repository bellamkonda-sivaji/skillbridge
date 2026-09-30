package com.skillbridge.dto;

import com.skillbridge.model.DemandVerdict;

import java.time.LocalDateTime;

/**
 * The advice on one live job: how it is doing, and - only when we can actually back it with
 * comparable local pay - what price would fix it.
 *
 * Every field that could be invented is nullable instead. If we do not know what shops nearby
 * pay for this work, {@code suggestedSalary} is null and the employer is told we do not know,
 * rather than being shown a confident number with nothing behind it.
 */
public record JobDemandDto(
        Long jobId,
        String jobTitle,
        DemandVerdict verdict,
        /** One plain sentence, already translated-ready on the client via the key below. */
        String headline,
        String detail,
        /** i18n key so the worker/employer apps can render this in Telugu or Hindi. */
        String messageKey,
        int applicants,
        int workersNeeded,
        /** Hours the employer said they had, from the job's own dates - not a guess. */
        Integer windowHours,
        /** Hours since the job went live. */
        long hoursLive,
        boolean windowPassed,
        double currentSalary,
        Double suggestedSalary,
        Double suggestedIncreasePercent,
        /** What comparable local jobs pay, null when too few to be honest about. */
        Double marketMedianSalary,
        Integer comparableJobs,
        /** How many workers the higher price is expected to reach - null unless measurable. */
        Integer reachAtSuggested,
        Integer reachNow,
        LocalDateTime checkedAt
) {}
