package com.skillbridge.service;

import com.skillbridge.model.ApplicationStatus;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

/** Small pure rules: attendance location flags, usable GPS points, worker status notices. */
class AttendanceAndNoticeRulesTest {

    @Test
    void aPunchIsFarBeyondThreeHundredMetres() {
        assertEquals(300, AttendanceService.FAR_METRES);
        assertEquals("OK", AttendanceRules.locationFlag(0));
        assertEquals("OK", AttendanceRules.locationFlag(300));
        assertEquals("FAR", AttendanceRules.locationFlag(301));
        assertEquals("UNKNOWN", AttendanceRules.locationFlag((Integer) null));
        assertEquals("about 1.2 km", AttendanceRules.distanceLabel(1180));
        assertEquals("about 450 m", AttendanceRules.distanceLabel(450));
    }

    @Test
    void zeroZeroAndHalfAPointAreNotLocations() {
        assertTrue(JobCardAssembler.isUsablePoint(13.6288, 79.4192));
        assertFalse(JobCardAssembler.isUsablePoint(0d, 0d));
        assertFalse(JobCardAssembler.isUsablePoint(13.6, null));
        assertFalse(JobCardAssembler.isUsablePoint(null, null));
        assertFalse(JobCardAssembler.isUsablePoint(Double.NaN, 79.4));
        assertFalse(JobCardAssembler.isUsablePoint(95d, 79.4));
    }

    @Test
    void movesWithTheirOwnMessageSendNoGenericOne() {
        assertNull(ApplicationService.workerNoticeFor(ApplicationStatus.OFFERED, "Cashier", "Mart"));
        assertNull(ApplicationService.workerNoticeFor(ApplicationStatus.ACCEPTED, "Cashier", "Mart"));
        assertNull(ApplicationService.workerNoticeFor(ApplicationStatus.INTERVIEW_SCHEDULED, "Cashier", "Mart"));
        assertNull(ApplicationService.workerNoticeFor(ApplicationStatus.WITHDRAWN, "Cashier", "Mart"));
    }

    @Test
    void theRestReadLikeAPersonWroteThem() {
        String[] shortlisted = ApplicationService.workerNoticeFor(ApplicationStatus.SHORTLISTED,
                "Cashier", "LocalWork Demo Mart");
        assertEquals("You've been shortlisted for Cashier at LocalWork Demo Mart.", shortlisted[1]);
        String[] rejected = ApplicationService.workerNoticeFor(ApplicationStatus.REJECTED, "Cashier", "Mart");
        assertFalse(rejected[1].contains("is now"));
    }
}
