package com.skillbridge.service;

import com.skillbridge.dto.admin.AdminDtos.*;
import com.skillbridge.exception.ApiException;
import com.skillbridge.model.*;
import com.skillbridge.repository.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;

/**
 * The whole story of one application, merged from every table that ever touched it, in order.
 * This is what the back office reads instead of clicking through six screens.
 */
@Service
public class ApplicationHistoryService {

    private static final DateTimeFormatter HHMM = DateTimeFormatter.ofPattern("HH:mm");

    private final JobApplicationRepository applicationRepository;
    private final ContactLogRepository contactLogRepository;
    private final BackOfficeAssembler assembler;
    private final AdminGuard guard;
    private final AdminAuditService audit;
    private final OfferService offerService;

    public ApplicationHistoryService(JobApplicationRepository applicationRepository,
                                     ContactLogRepository contactLogRepository,
                                     BackOfficeAssembler assembler, AdminGuard guard,
                                     AdminAuditService audit, OfferService offerService) {
        this.applicationRepository = applicationRepository;
        this.contactLogRepository = contactLogRepository;
        this.assembler = assembler;
        this.guard = guard;
        this.audit = audit;
        this.offerService = offerService;
    }

    // ================================================================== contact logging

    @Transactional
    public ContactLogDto logContact(Long applicationId, ContactRequest request) {
        AdminAccount admin = guard.require(AdminPermission.LOG_CONTACT);
        if (request == null || request.channel() == null || request.outcome() == null) {
            throw ApiException.badRequest("channel and outcome are required");
        }
        JobApplication application = require(applicationId);
        ContactLog log = contactLogRepository.save(ContactLog.builder()
                .applicationId(application.getId())
                .jobId(application.getJob().getId())
                .workerId(application.getWorker().getId())
                .employerId(application.getJob().getEmployer().getId())
                .channel(request.channel())
                .outcome(request.outcome())
                .note(request.note())
                .contactedByAdminId(admin.getId())
                .contactedByName(admin.getName())
                .contactedAt(LocalDateTime.now())
                // Only a promised callback carries a time; anything else would put the row back
                // in the queue as CALLBACK_DUE for no reason.
                .nextCallAt(request.outcome() == ContactOutcome.CALLBACK_REQUESTED
                        ? (request.nextCallAt() != null
                            ? request.nextCallAt() : LocalDateTime.now().plusHours(4))
                        : request.nextCallAt())
                .build());
        audit.record(admin, "CONTACT_LOGGED", "APPLICATION", application.getId(),
                request.channel() + " / " + request.outcome()
                        + " with " + application.getWorker().getName());
        return assembler.contactDto(log);
    }

    public List<ContactLogDto> contacts(Long applicationId) {
        guard.require(AdminPermission.VIEW_APPLICATIONS);
        require(applicationId);
        return contactLogRepository.findByApplicationIdOrderByContactedAtAsc(applicationId).stream()
                .map(assembler::contactDto).toList();
    }

    // ================================================================== history

    public ApplicationHistoryDto history(Long applicationId) {
        guard.require(AdminPermission.VIEW_APPLICATIONS);
        JobApplication a = require(applicationId);
        BackOfficeAssembler.Snapshot s = assembler.snapshot();

        WorkerAccount worker = a.getWorker();
        JobPost job = a.getJob();
        EmployerAccount employer = job.getEmployer();
        WorkerProfile workerProfile = s.workerProfiles.get(worker.getId());
        JobOffer offer = s.offer(a);
        Employment employment = s.employment(a);
        List<ContactLog> contacts = s.contacts(a);
        List<Attendance> attendance = assembler.attendanceOf(employment);
        WalletTransaction payment = assembler.paymentTransaction(a);

        // ---- money on the offer comes from the schedule engine, never from arithmetic here
        HistoryOfferDto offerDto = null;
        if (offer != null) {
            com.skillbridge.dto.OfferDto priced = offerService.toDto(offer);
            offerDto = new HistoryOfferDto(offer.getId(), offer.getStatus(), offer.getSentAt(),
                    offer.getRespondedAt(), offer.getSalary(), offer.getSalaryUnit(),
                    priced.estimatedWorkerPay(), priced.platformFee(), priced.estimatedEmployerTotal());
        }

        HistoryPaymentDto paymentDto = payment == null
                ? new HistoryPaymentDto(false, null, null, null, null)
                : new HistoryPaymentDto(true, payment.getAmount(), payment.getCreatedAt(),
                        "WT-" + payment.getId(), assembler.platformFeeOn(payment.getAmount()));

        List<HistoryAttendanceDto> attendanceDtos = attendance.stream()
                .map(r -> new HistoryAttendanceDto(r.getWorkDate(), r.getStatus(),
                        r.getCheckInAt() == null ? null : r.getCheckInAt().format(HHMM),
                        r.getCheckOutAt() == null ? null : r.getCheckOutAt().format(HHMM),
                        r.getMinutesWorked() == null ? null
                                : Math.round(r.getMinutesWorked() / 60.0 * 10.0) / 10.0,
                        assembler.attendanceApproved(r)))
                .toList();

        return new ApplicationHistoryDto(
                a.getId(),
                new HistoryWorkerDto(worker.getId(), worker.getName(), worker.getPhone(),
                        worker.getPhotoUrl(), worker.getAvgRating(),
                        workerProfile == null ? List.of() : List.copyOf(workerProfile.getSkills())),
                new HistoryJobDto(job.getId(), job.getTitle(), job.getEngagementModel(),
                        job.getSalary(), job.getSalaryUnit()),
                new HistoryEmployerDto(employer.getId(),
                        assembler.displayBusinessName(s, employer), employer.getName(),
                        employer.getPhone()),
                a.getStatus(), assembler.stageOf(s, a),
                !contacts.isEmpty(), contacts.size(),
                assembler.employerResponded(a), assembler.employerRespondedAt(a),
                offerDto, paymentDto, attendanceDtos,
                contacts.stream().map(assembler::contactDto).toList(),
                timeline(s, a, offer, employment, contacts, attendance, payment));
    }

    // ================================================================== the merged timeline

    private List<TimelineEntry> timeline(BackOfficeAssembler.Snapshot s, JobApplication a,
                                         JobOffer offer, Employment employment,
                                         List<ContactLog> contacts, List<Attendance> attendance,
                                         WalletTransaction payment) {
        List<TimelineEntry> entries = new ArrayList<>();
        String workerName = a.getWorker().getName();
        String employerName = assembler.displayBusinessName(s, a.getJob().getEmployer());

        // ---- the application itself
        entries.add(new TimelineEntry(a.getAppliedAt(), "APPLIED", "Applied for the job",
                a.getCoverMessage(), "WORKER", workerName));
        if (a.getViewedAt() != null) {
            entries.add(new TimelineEntry(a.getViewedAt(), "VIEWED", "Employer viewed the application",
                    employerName + " opened the profile", "EMPLOYER", employerName));
        }
        if (a.getShortlistedAt() != null) {
            entries.add(new TimelineEntry(a.getShortlistedAt(), "SHORTLISTED", "Shortlisted",
                    employerName + " shortlisted " + workerName, "EMPLOYER", employerName));
        }

        // ---- every contact the back office made
        for (ContactLog log : contacts) {
            entries.add(new TimelineEntry(log.getContactedAt(), "CONTACTED",
                    "Contacted by " + log.getChannel() + " - " + log.getOutcome(),
                    log.getNote(), "ADMIN", log.getContactedByName()));
        }

        // ---- interviews: scheduled, then whatever happened to them
        for (Interview i : s.interviews(a)) {
            String where = i.getLocation() != null ? i.getLocation() : i.getAddressLine();
            String who = i.getInterviewerName() != null ? i.getInterviewerName() : employerName;
            entries.add(new TimelineEntry(i.getCreatedAt(), "INTERVIEW_SCHEDULED",
                    "Interview scheduled (" + i.getMode() + ")",
                    "With " + who + " on " + i.getScheduledAt()
                            + (where == null ? "" : " at " + where),
                    "EMPLOYER", employerName));
            if (i.getStatus() == InterviewStatus.COMPLETED) {
                entries.add(new TimelineEntry(i.getScheduledAt(), "INTERVIEWED",
                        "Interview completed (" + i.getMode() + ")",
                        a.getInterviewResult() == null ? i.getNotes()
                                : a.getInterviewResult() + " - " + nullSafe(a.getInterviewFeedback()),
                        "EMPLOYER", who));
            } else if (i.getStatus() == InterviewStatus.CANCELLED) {
                entries.add(new TimelineEntry(i.getScheduledAt(), "INTERVIEW_SCHEDULED",
                        "Interview cancelled (" + i.getMode() + ")", i.getNotes(),
                        "EMPLOYER", who));
            }
        }
        // The employer may record a result without an interview row ever existing.
        if (a.getInterviewResultAt() != null
                && s.interviews(a).stream().noneMatch(i -> i.getStatus() == InterviewStatus.COMPLETED)) {
            entries.add(new TimelineEntry(a.getInterviewResultAt(), "INTERVIEWED",
                    "Interview result recorded: " + a.getInterviewResult(),
                    a.getInterviewFeedback(), "EMPLOYER", employerName));
        }

        // ---- the offer
        if (offer != null) {
            entries.add(new TimelineEntry(offer.getSentAt(), "OFFERED", "Offer sent",
                    "Offered " + (long) offer.getSalary() + " " + offer.getSalaryUnit()
                            + (offer.getMessage() == null ? "" : " - " + offer.getMessage()),
                    "EMPLOYER", employerName));
            if (offer.getRespondedAt() != null) {
                boolean accepted = offer.getStatus() == OfferStatus.ACCEPTED;
                entries.add(new TimelineEntry(offer.getRespondedAt(),
                        accepted ? "OFFER_ACCEPTED" : "OFFER_DECLINED",
                        accepted ? "Offer accepted" : "Offer " + offer.getStatus().name().toLowerCase(),
                        workerName + " responded " + offer.getStatus(), "WORKER", workerName));
            }
        }

        // ---- joining and the engagement
        if (employment != null) {
            entries.add(new TimelineEntry(employment.getCreatedAt(), "JOINED", "Hire created",
                    "Joining date " + employment.getJoiningDate()
                            + " at " + nullSafe(employment.getWorkLocation()),
                    "SYSTEM", "JobOn"));
            if (employment.getJoiningAcknowledgedAt() != null) {
                entries.add(new TimelineEntry(employment.getJoiningAcknowledgedAt(), "JOINED",
                        "Worker confirmed joining", null, "WORKER", workerName));
            }
            if (employment.getStartedAt() != null) {
                entries.add(new TimelineEntry(employment.getStartedAt(), "JOINED", "Joined",
                        employment.getJoiningNotes(), "EMPLOYER", employerName));
            }
            if (employment.getEndedAt() != null) {
                entries.add(new TimelineEntry(employment.getEndedAt(), "COMPLETED",
                        "Engagement completed", "Status " + employment.getStatus(),
                        "SYSTEM", "JobOn"));
            }
        }

        // ---- each attendance day
        for (Attendance r : attendance) {
            LocalDateTime at = r.getCheckInAt() != null ? r.getCheckInAt()
                    : r.getWorkDate().atTime(9, 0);
            String detail = r.getCheckInAt() == null ? "No check-in recorded"
                    : "In " + r.getCheckInAt().format(HHMM)
                        + (r.getCheckOutAt() == null ? ", still on shift"
                            : ", out " + r.getCheckOutAt().format(HHMM)
                              + " (" + hours(r) + "h)");
            entries.add(new TimelineEntry(at, "ATTENDANCE",
                    "Attendance " + r.getWorkDate() + " - " + r.getStatus(), detail,
                    "WORKER", workerName));
        }

        // ---- the money
        if (payment != null) {
            Double fee = assembler.platformFeeOn(payment.getAmount());
            entries.add(new TimelineEntry(payment.getCreatedAt(), "PAID", "Payment released",
                    (long) payment.getAmount() + " credited to " + workerName
                            + (fee == null ? "" : " (platform fee " + fee + ")"),
                    "SYSTEM", "JobOn"));
        }

        // ---- terminal application states that nothing above covers
        if (a.getDecisionAt() != null && a.getStatus() == ApplicationStatus.REJECTED) {
            entries.add(new TimelineEntry(a.getDecisionAt(), "REJECTED", "Application rejected",
                    nullSafe(a.getInterviewFeedback()), "EMPLOYER", employerName));
        }
        if (a.getDecisionAt() != null && a.getStatus() == ApplicationStatus.WITHDRAWN) {
            entries.add(new TimelineEntry(a.getDecisionAt(), "WITHDRAWN", "Application withdrawn",
                    null, "WORKER", workerName));
        }

        entries.sort(Comparator.comparing(TimelineEntry::at,
                Comparator.nullsLast(Comparator.naturalOrder())));
        return entries;
    }

    private static String hours(Attendance r) {
        if (r.getMinutesWorked() != null) {
            return String.valueOf(Math.round(r.getMinutesWorked() / 60.0 * 10.0) / 10.0);
        }
        if (r.getCheckInAt() != null && r.getCheckOutAt() != null) {
            return String.valueOf(
                    Math.round(Duration.between(r.getCheckInAt(), r.getCheckOutAt()).toMinutes()
                            / 60.0 * 10.0) / 10.0);
        }
        return "0";
    }

    private static String nullSafe(String s) {
        return s == null ? "" : s;
    }

    private JobApplication require(Long id) {
        return applicationRepository.findById(id)
                .orElseThrow(() -> ApiException.notFound("Application not found"));
    }
}
