package com.skillbridge.service;

import com.skillbridge.model.Employment;
import com.skillbridge.model.EmploymentStatus;
import org.junit.jupiter.api.Test;

import java.time.LocalDate;
import java.time.LocalDateTime;

import static org.junit.jupiter.api.Assertions.*;

/** The employment list scopes, which the worker and employer lists share. */
class EmploymentScopeTest {

    private static final LocalDate TODAY = LocalDate.of(2026, 10, 22);

    private static Employment of(EmploymentStatus status, LocalDate joining) {
        Employment e = new Employment();
        e.setStatus(status);
        e.setJoiningDate(joining);
        return e;
    }

    @Test
    void aCompletedJobIsPastAndNeverUpcoming() {
        Employment done = of(EmploymentStatus.COMPLETED, TODAY.plusDays(3));
        assertFalse(EmploymentService.matchesScope(done, "UPCOMING", TODAY));
        assertFalse(EmploymentService.matchesScope(done, "CURRENT", TODAY));
        assertTrue(EmploymentService.matchesScope(done, "PAST", TODAY));
        assertTrue(EmploymentService.matchesScope(of(EmploymentStatus.ENDED, null), "PAST", TODAY));
    }

    @Test
    void anAcceptedJobStartingLaterIsUpcoming() {
        Employment later = of(EmploymentStatus.OFFER_ACCEPTED, TODAY.plusDays(2));
        assertTrue(EmploymentService.matchesScope(later, "UPCOMING", TODAY));
        assertFalse(EmploymentService.matchesScope(later, "CURRENT", TODAY));
        assertTrue(EmploymentService.matchesScope(later, "LIVE", TODAY));
        assertTrue(EmploymentService.matchesScope(of(EmploymentStatus.JOINING_CONFIRMED, null), "UPCOMING", TODAY));
    }

    @Test
    void anAcceptedJobDueTodayOrAlreadyStartedIsCurrent() {
        assertTrue(EmploymentService.matchesScope(of(EmploymentStatus.OFFER_ACCEPTED, TODAY), "CURRENT", TODAY));
        assertFalse(EmploymentService.matchesScope(of(EmploymentStatus.OFFER_ACCEPTED, TODAY), "UPCOMING", TODAY));

        Employment active = of(EmploymentStatus.ACTIVE, TODAY.plusDays(5));
        assertTrue(EmploymentService.matchesScope(active, "CURRENT", TODAY));
        assertFalse(EmploymentService.matchesScope(active, "UPCOMING", TODAY));

        Employment startedEarly = of(EmploymentStatus.JOINING_CONFIRMED, TODAY.plusDays(5));
        startedEarly.setStartedAt(LocalDateTime.of(2026, 10, 22, 9, 0));
        assertTrue(EmploymentService.matchesScope(startedEarly, "CURRENT", TODAY));
    }

    @Test
    void noScopeOrAllIsNoFilter() {
        Employment done = of(EmploymentStatus.COMPLETED, null);
        assertTrue(EmploymentService.matchesScope(done, null, TODAY));
        assertTrue(EmploymentService.matchesScope(done, "ALL", TODAY));
        assertFalse(EmploymentService.matchesScope(done, "LIVE", TODAY));
    }
}
