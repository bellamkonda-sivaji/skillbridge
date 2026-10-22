package com.skillbridge.service;

import com.skillbridge.model.Attendance;
import com.skillbridge.model.AttendanceApproval;
import com.skillbridge.model.AttendanceStatus;
import com.skillbridge.model.EngagementModel;

/**
 * The whole attendance policy, such as it is. Four static methods and no configuration: there are
 * no shift rosters, no geofences and no approval chains to express, because a shop owner in
 * Tirupati does not have any of those things.
 */
public final class AttendanceRules {

    private AttendanceRules() {
    }

    /** Further than this from the workplace and a punch is flagged FAR to the shop owner. */
    public static final int FAR_METRES = 300;

    /**
     * "OK" within {@link #FAR_METRES} of the workplace, "FAR" beyond it, "UNKNOWN" when the
     * phone sent no point or the job has no pin (the distance is then null).
     */
    public static String locationFlag(Integer distanceM) {
        if (distanceM == null) {
            return "UNKNOWN";
        }
        return distanceM <= FAR_METRES ? "OK" : "FAR";
    }

    /** The row's flag: check-in decides; a day checked in with no point falls back to check-out. */
    public static String locationFlag(Attendance a) {
        Integer d = a.getCheckInDistanceM() != null ? a.getCheckInDistanceM() : a.getCheckOutDistanceM();
        return locationFlag(d);
    }

    /** "about 1.2 km" / "about 450 m", the way a person would say how far it was. */
    public static String distanceLabel(int metres) {
        if (metres >= 1000) {
            return "about " + (Math.round(metres / 100.0) / 10.0) + " km";
        }
        return "about " + metres + " m";
    }

    /**
     * Does the shop owner have to confirm each day of this job?
     *
     * <p>Yes for ONE_DAY and FEW_DAYS. On a one-off job that single day IS the engagement and the
     * whole of the pay, so the owner confirming the person actually turned up is the only control
     * either side has.
     *
     * <p>No for FEW_WEEKS, MONTHS and PERMANENT: somebody working a month does not need a
     * signature every evening, and asking for one would simply mean nobody ever signs.
     */
    public static boolean needsEmployerApproval(EngagementModel model) {
        if (model == null) {
            return false;
        }
        return switch (model) {
            case ONE_DAY, FEW_DAYS -> true;
            case FEW_WEEKS, MONTHS, PERMANENT -> false;
        };
    }

    /** What punching out should land on for this job. */
    public static AttendanceApproval onPunchOut(EngagementModel model) {
        return needsEmployerApproval(model)
                ? AttendanceApproval.PENDING
                : AttendanceApproval.AUTO_APPROVED;
    }

    /** Null-safe read: rows written before the column existed read as PENDING. */
    public static AttendanceApproval approvalOf(Attendance a) {
        if (a == null || a.getApprovalStatus() == null) {
            return AttendanceApproval.PENDING;
        }
        return a.getApprovalStatus();
    }

    /** A finished, approved day. This and only this is payable. */
    public static boolean counts(Attendance a) {
        return a != null
                && a.getStatus() == AttendanceStatus.CHECKED_OUT
                && approvalOf(a).counts();
    }

    /** Whether this row is still waiting on the shop owner. */
    public static boolean needsApproval(Attendance a) {
        return approvalOf(a) == AttendanceApproval.PENDING
                && a != null && a.getStatus() == AttendanceStatus.CHECKED_OUT;
    }

    public static String statusLabel(AttendanceStatus status) {
        if (status == null) {
            return "Not marked";
        }
        return switch (status) {
            case NOT_CHECKED_IN -> "Not started";
            case CHECKED_IN -> "At work";
            case CHECKED_OUT -> "Work finished";
            case ABSENT -> "Did not come";
        };
    }

    /**
     * "7 hours 15 minutes". Spelled out rather than "7h 15m" - a shorthand is one more thing to
     * decode for somebody who reads slowly.
     */
    public static String workedLabel(Integer minutes) {
        return workedLabel(minutes, null);
    }

    public static String workedLabel(Integer minutes, String suffix) {
        if (minutes == null || minutes <= 0) {
            return null;
        }
        int h = minutes / 60;
        int m = minutes % 60;
        StringBuilder sb = new StringBuilder();
        if (h > 0) {
            sb.append(h).append(h == 1 ? " hour" : " hours");
        }
        if (m > 0) {
            if (sb.length() > 0) {
                sb.append(' ');
            }
            sb.append(m).append(m == 1 ? " minute" : " minutes");
        }
        if (suffix != null && !suffix.isBlank()) {
            sb.append(' ').append(suffix.trim());
        }
        return sb.toString();
    }
}
