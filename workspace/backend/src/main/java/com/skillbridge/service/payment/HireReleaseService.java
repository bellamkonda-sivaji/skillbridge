package com.skillbridge.service.payment;

import com.skillbridge.exception.ApiException;
import com.skillbridge.model.*;
import com.skillbridge.model.money.Earning;
import com.skillbridge.model.money.EarningStatus;
import com.skillbridge.repository.AdminAccountRepository;
import com.skillbridge.repository.AttendanceRepository;
import com.skillbridge.repository.EmployerProfileRepository;
import com.skillbridge.repository.EmploymentRepository;
import com.skillbridge.repository.EarningRepository;
import com.skillbridge.service.NotificationService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.List;

/**
 * The last mile of a hire: the shop owner says the work is done, JobOn checks it, and only
 * then does the worker's money become theirs.
 *
 * Completion used to release the money on the owner's word alone. Now it is held, the admins
 * are told, and an admin releases it - which is when the worker hears it is done and paid.
 */
@Service
public class HireReleaseService {

    /** One hire, start to finish, as the back office reads it. */
    public record HireDto(
            Long employmentId, Long workerId, String workerName, String workerPhone,
            Long employerId, String businessName, Long jobId, String jobTitle,
            EmploymentStatus status, String stage,
            LocalDateTime offeredAt, LocalDateTime acceptedAt, LocalDate joiningDate,
            LocalDateTime startedAt, LocalDateTime completedAt,
            int daysWorked, long grossMinor, long feeMinor, long netMinor,
            String paymentStatus, LocalDateTime releasedAt
    ) {}

    private final EmploymentRepository employments;
    private final EarningRepository earnings;
    private final AttendanceRepository attendances;
    private final EmployerProfileRepository employerProfiles;
    private final AdminAccountRepository admins;
    private final EscrowService escrow;
    private final NotificationService notifications;

    public HireReleaseService(EmploymentRepository employments, EarningRepository earnings,
                              AttendanceRepository attendances, EmployerProfileRepository employerProfiles,
                              AdminAccountRepository admins, EscrowService escrow,
                              NotificationService notifications) {
        this.employments = employments;
        this.earnings = earnings;
        this.attendances = attendances;
        this.employerProfiles = employerProfiles;
        this.admins = admins;
        this.escrow = escrow;
        this.notifications = notifications;
    }

    // ---------------------------------------------------------------- employer marks it done

    /** Called when an engagement reaches COMPLETED. Holds the money for an admin and tells everyone. */
    @Transactional
    public void holdForApproval(Employment e) {
        Earning earning = earnings.lockByEmploymentId(e.getId()).orElse(null);
        if (earning == null || earning.getStatus() != EarningStatus.ACCRUED) {
            return; // nothing reserved, or already held / released
        }
        earning.setStatus(EarningStatus.HELD);
        earnings.save(earning);
        String business = businessName(e);
        long net = earning.getGrossMinor() - earning.getFeeMinor();
        notifications.notify(e.getWorker(), "Work marked complete",
                business + " has marked \"" + e.getJob().getTitle() + "\" as done. JobOn is checking it and will"
                        + " release your " + Money.inr(net) + " soon.",
                NotificationType.APPLICATION, "/worker/work");
        for (AdminAccount admin : admins.findAllByOrderByCreatedAtAsc()) {
            notifications.notify(AccountType.ADMIN, admin.getId(), "Release payment to " + e.getWorker().getName(),
                    business + " marked \"" + e.getJob().getTitle() + "\" complete. " + Money.inr(net)
                            + " is waiting for your approval.",
                    NotificationType.SYSTEM, "/admin/hires");
        }
    }

    // ---------------------------------------------------------------- admin

    public List<HireDto> list() {
        return employments.findAll().stream()
                .map(this::toDto)
                // What needs a person first: money waiting, then work in progress, then the rest.
                .sorted(Comparator.comparingInt((HireDto h) -> rank(h.paymentStatus()))
                        .thenComparing(HireDto::employmentId, Comparator.reverseOrder()))
                .toList();
    }

    @Transactional
    public HireDto release(Long employmentId, AdminAccount admin) {
        Employment e = employments.findById(employmentId)
                .orElseThrow(() -> ApiException.notFound("Hire not found"));
        if (e.getStatus() != EmploymentStatus.COMPLETED) {
            throw ApiException.badRequest("The shop owner has not marked this work complete yet.");
        }
        Earning earning = earnings.findByEmploymentId(employmentId)
                .orElseThrow(() -> ApiException.badRequest("No money was reserved for this hire."));
        if (earning.getStatus() != EarningStatus.HELD && earning.getStatus() != EarningStatus.ACCRUED) {
            throw ApiException.badRequest("This payment has already been released.");
        }
        escrow.release(e, "ADMIN", admin.getId());
        long net = earning.getGrossMinor() - earning.getFeeMinor();
        String business = businessName(e);
        notifications.notify(e.getWorker(), "Work completed - money released 🎉",
                "You have successfully completed \"" + e.getJob().getTitle() + "\" at " + business + ". "
                        + Money.inr(net) + " has been released to your account. You can withdraw it now.",
                NotificationType.SYSTEM, "/worker/earnings");
        notifications.notify(e.getEmployer(), "Payment released to " + e.getWorker().getName(),
                "JobOn released " + Money.inr(net) + " to " + e.getWorker().getName() + " for \""
                        + e.getJob().getTitle() + "\". Thank you for hiring on JobOn.",
                NotificationType.SYSTEM, "/employer/billing");
        return toDto(e);
    }

    // ---------------------------------------------------------------- helpers

    private HireDto toDto(Employment e) {
        Earning earning = earnings.findByEmploymentId(e.getId()).orElse(null);
        int days = (int) attendances.findByEmploymentOrderByWorkDateDesc(e).stream()
                .filter(a -> a.getCheckOutAt() != null).count();
        JobOffer offer = e.getOffer();
        long gross = earning == null ? 0 : earning.getGrossMinor();
        long fee = earning == null ? 0 : earning.getFeeMinor();
        return new HireDto(
                e.getId(), e.getWorker().getId(), e.getWorker().getName(), e.getWorker().getPhone(),
                e.getEmployer().getId(), businessName(e), e.getJob().getId(), e.getJob().getTitle(),
                e.getStatus(), stage(e, earning),
                offer == null ? null : offer.getSentAt(), offer == null ? null : offer.getRespondedAt(),
                e.getJoiningDate(), e.getStartedAt(), e.getEndedAt(),
                days, gross, fee, gross - fee,
                earning == null ? "NONE" : paymentStatus(earning.getStatus()),
                earning == null ? null : earning.getPayableAt());
    }

    /** Where the hire is, in the words the back office uses. */
    private String stage(Employment e, Earning earning) {
        if (earning != null && (earning.getStatus() == EarningStatus.PAYABLE
                || earning.getStatus() == EarningStatus.IN_BATCH || earning.getStatus() == EarningStatus.PAID)) {
            return "Paid";
        }
        return switch (e.getStatus()) {
            case OFFER_ACCEPTED -> "Hired - not started";
            case JOINING_CONFIRMED -> "Joining confirmed";
            case ACTIVE -> "Working";
            case COMPLETED -> "Completed - release payment";
            case ENDED -> "Ended";
        };
    }

    private String paymentStatus(EarningStatus s) {
        return switch (s) {
            case ACCRUED -> "HELD_IN_ESCROW";
            case HELD -> "WAITING_FOR_RELEASE";
            case PAYABLE, IN_BATCH -> "RELEASED";
            case PAID -> "WITHDRAWN";
            case FAILED -> "FAILED";
            case REVERSED -> "REVERSED";
        };
    }

    private int rank(String paymentStatus) {
        return switch (paymentStatus) {
            case "WAITING_FOR_RELEASE" -> 0;
            case "HELD_IN_ESCROW" -> 1;
            default -> 2;
        };
    }

    private String businessName(Employment e) {
        return employerProfiles.findByAccountId(e.getEmployer().getId())
                .map(EmployerProfile::getBusinessName)
                .filter(n -> n != null && !n.isBlank())
                .orElse(e.getEmployer().getName());
    }
}
