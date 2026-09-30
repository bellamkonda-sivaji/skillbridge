package com.skillbridge.service;

import com.skillbridge.dto.admin.AdminDtos.*;
import com.skillbridge.model.*;
import com.skillbridge.repository.*;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;

/**
 * "Who do I ring next, and why."
 *
 * <p>Everything the back office does is a phone call, so the one screen that matters is a single
 * prioritised worklist rather than eight filtered tables. Each row says who to ring, what number,
 * who the other side is, and - in a sentence a person would actually say - why it is on the list.
 *
 * <p>The queue is derived, never stored. Logging a contact therefore makes a row leave or change
 * type by itself: an UNCONTACTED_APPLICANT with a REACHED outcome simply stops matching, and one
 * with CALLBACK_REQUESTED starts matching CALLBACK_DUE instead. Nothing has to be marked done.
 */
@Service
public class CallQueueService {

    private static final int MAX_RETRIES = 4;

    /** How long a worker may be left without an answer before an operator has to ring. */
    private static final int ATTENDANCE_REQUEST_HOURS = 12;

    private final JobApplicationRepository applicationRepository;
    private final JobOfferRepository offerRepository;
    private final JobPostRepository jobRepository;
    private final EmploymentRepository employmentRepository;
    private final ContactLogRepository contactLogRepository;
    private final EmployerProfileRepository employerProfileRepository;
    private final AttendanceRequestRepository attendanceRequestRepository;
    private final AdminGuard guard;

    public CallQueueService(JobApplicationRepository applicationRepository,
                            JobOfferRepository offerRepository,
                            JobPostRepository jobRepository,
                            EmploymentRepository employmentRepository,
                            ContactLogRepository contactLogRepository,
                            EmployerProfileRepository employerProfileRepository,
                            AttendanceRequestRepository attendanceRequestRepository,
                            AdminGuard guard) {
        this.applicationRepository = applicationRepository;
        this.offerRepository = offerRepository;
        this.jobRepository = jobRepository;
        this.employmentRepository = employmentRepository;
        this.contactLogRepository = contactLogRepository;
        this.employerProfileRepository = employerProfileRepository;
        this.attendanceRequestRepository = attendanceRequestRepository;
        this.guard = guard;
    }

    // ================================================================== public API

    public PageDto<CallQueueRowDto> queue(Long assignedTo, String type, int page, int size) {
        guard.require(AdminPermission.VIEW_APPLICATIONS);
        List<CallQueueRowDto> rows = build();
        if (type != null && !type.isBlank()) {
            String wanted = type.trim().toUpperCase(Locale.ENGLISH);
            rows = rows.stream().filter(r -> r.type().name().equals(wanted)).toList();
        }
        if (assignedTo != null) {
            // "Assigned" here means the admin who last spoke to this person - we do not hand out
            // rows, we keep a conversation with one worker on one caller's desk.
            rows = rows.stream().filter(r -> assignedTo.equals(lastCaller(r))).toList();
        }
        return PageDto.of(rows, page, size);
    }

    public CallQueueSummaryDto summary() {
        guard.require(AdminPermission.VIEW_APPLICATIONS);
        List<CallQueueRowDto> rows = build();
        List<CallQueueTypeCountDto> byType = new ArrayList<>();
        for (CallQueueType t : CallQueueType.values()) {
            long count = rows.stream().filter(r -> r.type() == t).count();
            byType.add(new CallQueueTypeCountDto(t, t.label(), count));
        }
        long high = rows.stream().filter(r -> r.priority() == CallPriority.HIGH).count();
        long medium = rows.stream().filter(r -> r.priority() == CallPriority.MEDIUM).count();
        long low = rows.stream().filter(r -> r.priority() == CallPriority.LOW).count();

        Set<Long> uncontactedWorkers = new LinkedHashSet<>();
        Set<Long> uncontactedEmployers = new LinkedHashSet<>();
        for (CallQueueRowDto row : rows) {
            if (row.contactCount() > 0) {
                continue;
            }
            if (row.nextAction() == NextAction.CALL_EMPLOYER || row.nextAction() == NextAction.CALL_BOTH) {
                if (row.employerId() != null) uncontactedEmployers.add(row.employerId());
            }
            if (row.nextAction() == NextAction.CALL_WORKER || row.nextAction() == NextAction.CALL_BOTH) {
                if (row.workerId() != null) uncontactedWorkers.add(row.workerId());
            }
        }
        return new CallQueueSummaryDto(rows.size(), byType,
                new CallQueuePriorityCountDto(high, medium, low),
                uncontactedWorkers.size(), uncontactedEmployers.size());
    }

    // ================================================================== the rules

    private List<CallQueueRowDto> build() {
        LocalDateTime now = LocalDateTime.now();
        Map<Long, String> businessNames = businessNames();
        Map<Long, List<ContactLog>> byApplication = new HashMap<>();
        for (ContactLog log : contactLogRepository.findAllByOrderByContactedAtDesc()) {
            if (log.getApplicationId() != null) {
                byApplication.computeIfAbsent(log.getApplicationId(), k -> new ArrayList<>()).add(log);
            }
        }
        Map<Long, JobOffer> offersByApplication = new HashMap<>();
        for (JobOffer offer : offerRepository.findAll()) {
            if (offer.getApplication() != null) {
                offersByApplication.put(offer.getApplication().getId(), offer);
            }
        }

        // One row per application at most, and the rules are evaluated in the order of how far
        // the hire has actually got. A worker who starts tomorrow needs a reminder call, not a
        // "nobody has called since they applied" chase - so the employment-stage rules claim
        // their applications first, and the earlier-stage rules below skip whatever they took.
        List<CallQueueRowDto> rows = new ArrayList<>();
        Set<Long> claimed = new HashSet<>();

        // ---- work starting tomorrow: both sides get a reminder call
        LocalDate tomorrow = LocalDate.now().plusDays(1);
        for (Employment e : employmentRepository.findAll()) {
            LocalDate start = e.getJoiningDate() != null ? e.getJoiningDate() : e.getActualJoiningDate();
            if (start == null || !start.equals(tomorrow)) {
                continue;
            }
            if (e.getStatus() != EmploymentStatus.OFFER_ACCEPTED
                    && e.getStatus() != EmploymentStatus.ACTIVE) {
                continue;
            }
            JobApplication a = e.getApplication();
            if (a == null || claimed.contains(a.getId())) {
                continue;
            }
            List<ContactLog> contacts = byApplication.getOrDefault(a.getId(), List.of());
            String business = businessName(businessNames, e.getEmployer());
            rows.add(row(CallQueueType.WORK_TOMORROW, a, offersByApplication.get(a.getId()),
                    contacts, businessNames, now, e.getCreatedAt(),
                    first(a.getWorker().getName()) + " starts at " + business + " tomorrow"
                            + (e.getReportingTime() == null ? "" : " at " + e.getReportingTime())
                            + " - remind both sides",
                    NextAction.CALL_BOTH,
                    "Remind " + first(a.getWorker().getName()) + " and " + business
                            + " about tomorrow"));
            claimed.add(a.getId());
        }

        // ---- work finished but the money has not moved
        for (Employment e : employmentRepository.findAll()) {
            if (e.getStatus() != EmploymentStatus.COMPLETED || e.getSettledAt() != null) {
                continue;
            }
            JobApplication a = e.getApplication();
            if (a == null || claimed.contains(a.getId())) {
                continue;
            }
            List<ContactLog> contacts = byApplication.getOrDefault(a.getId(), List.of());
            LocalDateTime finished = e.getEndedAt() != null ? e.getEndedAt() : e.getCreatedAt();
            String business = businessName(businessNames, e.getEmployer());
            rows.add(row(CallQueueType.UNPAID_COMPLETED_WORK, a, offersByApplication.get(a.getId()),
                    contacts, businessNames, now, finished,
                    first(a.getWorker().getName()) + " finished the work " + ago(finished, now)
                            + " and has not been paid",
                    NextAction.RELEASE_PAYMENT,
                    "Get " + business + " to release " + first(a.getWorker().getName()) + "'s money"));
            claimed.add(a.getId());
        }

        for (JobApplication a : applicationRepository.findAll()) {
            if (claimed.contains(a.getId())) {
                continue;
            }
            List<ContactLog> contacts = byApplication.getOrDefault(a.getId(), List.of());
            ContactLog last = contacts.isEmpty() ? null : contacts.get(0);   // newest first
            JobOffer offer = offersByApplication.get(a.getId());

            CallQueueRowDto row = null;

            // ---- a promised callback that has fallen due outranks everything else
            if (last != null && last.getOutcome() == ContactOutcome.CALLBACK_REQUESTED
                    && (last.getNextCallAt() == null || !last.getNextCallAt().isAfter(now))) {
                row = row(CallQueueType.CALLBACK_DUE, a, offer, contacts, businessNames, now,
                        last.getNextCallAt() == null ? last.getContactedAt() : last.getNextCallAt(),
                        first(a.getWorker().getName()) + " asked us to call back"
                                + (last.getNextCallAt() == null ? "" : " by "
                                    + last.getNextCallAt().toLocalTime().withSecond(0).withNano(0)),
                        NextAction.CALL_WORKER,
                        "Ring " + first(a.getWorker().getName()) + " back as promised");
            }

            // ---- an offer nobody has answered: the employer is waiting on a yes
            if (row == null && offer != null && offer.getStatus() == OfferStatus.PENDING
                    && hoursSince(offer.getSentAt(), now) > 24) {
                row = row(CallQueueType.OFFER_NOT_ANSWERED, a, offer, contacts, businessNames, now,
                        offer.getSentAt(),
                        "Offer sent " + ago(offer.getSentAt(), now) + ", still no yes or no",
                        NextAction.CALL_WORKER,
                        "Call " + first(a.getWorker().getName()) + " and get a yes or a no");
            }

            // ---- nobody has ever rung the applicant
            if (row == null && contacts.isEmpty() && !a.getStatus().isTerminal()
                    && hoursSince(a.getAppliedAt(), now) > 24) {
                row = row(CallQueueType.UNCONTACTED_APPLICANT, a, offer, contacts, businessNames, now,
                        a.getAppliedAt(),
                        "Applied " + ago(a.getAppliedAt(), now) + ", nobody has called",
                        NextAction.CALL_WORKER,
                        "Call " + first(a.getWorker().getName()) + " and check he still wants it");
            }

            // ---- the employer has left the application sitting
            if (row == null && hoursSince(a.getAppliedAt(), now) > 48
                    && (a.getStatus() == ApplicationStatus.APPLIED
                        || a.getStatus() == ApplicationStatus.VIEWED)) {
                String business = businessName(businessNames, a.getJob().getEmployer());
                row = row(CallQueueType.EMPLOYER_NOT_RESPONDING, a, offer, contacts, businessNames, now,
                        a.getAppliedAt(),
                        business + " has not decided " + ago(a.getAppliedAt(), now)
                                + " after " + first(a.getWorker().getName()) + " applied",
                        NextAction.CALL_EMPLOYER,
                        "Call " + business + " and push for a decision");
            }

            // ---- rang, nobody picked up, and it is time to try again
            if (row == null && last != null
                    && (last.getOutcome() == ContactOutcome.NO_ANSWER
                        || last.getOutcome() == ContactOutcome.BUSY)
                    && hoursSince(last.getContactedAt(), now) > 4
                    && contacts.size() < MAX_RETRIES
                    && !a.getStatus().isTerminal()) {
                row = row(CallQueueType.NO_ANSWER_RETRY, a, offer, contacts, businessNames, now,
                        last.getContactedAt(),
                        "Tried " + contacts.size() + (contacts.size() == 1 ? " time" : " times")
                                + ", last one " + ago(last.getContactedAt(), now)
                                + " - " + last.getOutcome().name().toLowerCase().replace('_', ' '),
                        NextAction.CALL_WORKER,
                        "Try " + first(a.getWorker().getName()) + " again");
            }

            if (row != null) {
                rows.add(row);
                claimed.add(a.getId());
            }
        }

        // ---- an attendance question nobody has answered: a day's pay is sitting on it
        for (AttendanceRequest r : attendanceRequestRepository
                .findByStatusOrderByCreatedAtAsc(AttendanceRequestStatus.PENDING)) {
            if (hoursSince(r.getCreatedAt(), now) <= ATTENDANCE_REQUEST_HOURS) {
                continue;
            }
            Employment e = employmentRepository.findById(r.getEmploymentId()).orElse(null);
            if (e == null) {
                continue;
            }
            EmployerAccount employer = e.getEmployer();
            WorkerAccount w = e.getWorker();
            String business = businessName(businessNames, employer);
            rows.add(new CallQueueRowDto(
                    "ATTENDANCE_REQUEST:" + r.getId(), CallQueueType.ATTENDANCE_REQUEST_WAITING,
                    CallPriority.HIGH,
                    first(w.getName()) + " asked about " + r.getWorkDate() + " ("
                            + r.getType().label() + ") " + ago(r.getCreatedAt(), now)
                            + " and " + business + " has not answered",
                    business, employer.getPhone(), "EMPLOYER",
                    w.getId(), employer.getId(), w.getName(), w.getPhone(),
                    r.getJobId(), r.getJobTitle(),
                    e.getApplication() == null ? null : e.getApplication().getId(), null,
                    hoursSince(r.getCreatedAt(), now), null, null, 0,
                    NextAction.CALL_EMPLOYER,
                    "Ring " + business + " and settle " + first(w.getName()) + "'s "
                            + r.getWorkDate() + " attendance",
                    "ATTENDANCE_REQUEST:" + r.getId()));
        }

        // ---- an open job that nobody has applied to: the employer is getting nothing from us
        for (JobPost job : jobRepository.findAll()) {
            if (job.getStatus() != JobStatus.OPEN
                    || hoursSince(job.getPostedAt(), now) <= 48
                    || applicationRepository.countByJobId(job.getId()) > 0) {
                continue;
            }
            EmployerAccount employer = job.getEmployer();
            String business = businessName(businessNames, employer);
            List<ContactLog> contacts = contactLogRepository.findByJobIdOrderByContactedAtDesc(job.getId());
            ContactLog last = contacts.isEmpty() ? null : contacts.get(0);
            rows.add(new CallQueueRowDto(
                    "JOB:" + job.getId(), CallQueueType.JOB_NO_APPLICANTS, CallPriority.MEDIUM,
                    "Open " + ago(job.getPostedAt(), now) + " with nobody applying",
                    business, employer.getPhone(), "EMPLOYER",
                    null, employer.getId(), employer.getName(), employer.getPhone(),
                    job.getId(), job.getTitle(), null, null,
                    hoursSince(job.getPostedAt(), now),
                    last == null ? null : last.getContactedAt(),
                    last == null ? null : last.getOutcome(),
                    contacts.size(),
                    NextAction.CALL_EMPLOYER,
                    "Call " + business + " - either widen the job or go and find workers",
                    "JOB:" + job.getId()));
        }

        // HIGH first, then whoever has been waiting longest. Nothing else: a back office sorts
        // by "how long has this person been ignored", not by id.
        rows.sort(Comparator.comparing((CallQueueRowDto r) -> r.priority().ordinal())
                .thenComparing(Comparator.comparingLong(CallQueueRowDto::waitingHours).reversed()));
        return rows;
    }

    // ================================================================== helpers

    private CallQueueRowDto row(CallQueueType type, JobApplication a, JobOffer offer,
                                List<ContactLog> contacts, Map<Long, String> businessNames,
                                LocalDateTime now, LocalDateTime waitingSince,
                                String reasonLabel, NextAction nextAction, String nextActionLabel) {
        WorkerAccount worker = a.getWorker();
        EmployerAccount employer = a.getJob().getEmployer();
        ContactLog last = contacts.isEmpty() ? null : contacts.get(0);
        boolean employerSide = nextAction == NextAction.CALL_EMPLOYER;
        String business = businessName(businessNames, employer);
        return new CallQueueRowDto(
                "APPLICATION:" + a.getId(), type, type.priority(), reasonLabel,
                employerSide ? employer.getName() : worker.getName(),
                employerSide ? employer.getPhone() : worker.getPhone(),
                employerSide ? "EMPLOYER" : "WORKER",
                worker.getId(), employer.getId(),
                employerSide ? worker.getName() : business,
                employerSide ? worker.getPhone() : employer.getPhone(),
                a.getJob().getId(), a.getJob().getTitle(), a.getId(), null,
                hoursSince(waitingSince, now),
                last == null ? null : last.getContactedAt(),
                last == null ? null : last.getOutcome(),
                contacts.size(),
                nextAction, nextActionLabel,
                "APPLICATION:" + a.getId());
    }

    private Long lastCaller(CallQueueRowDto row) {
        if (row.applicationId() == null) {
            return null;
        }
        List<ContactLog> logs =
                contactLogRepository.findByApplicationIdOrderByContactedAtAsc(row.applicationId());
        return logs.isEmpty() ? null : logs.get(logs.size() - 1).getContactedByAdminId();
    }

    private Map<Long, String> businessNames() {
        Map<Long, String> names = new HashMap<>();
        for (EmployerProfile p : employerProfileRepository.findAll()) {
            if (p.getAccount() != null && p.getBusinessName() != null && !p.getBusinessName().isBlank()) {
                names.put(p.getAccount().getId(), p.getBusinessName());
            }
        }
        return names;
    }

    private static String businessName(Map<Long, String> names, EmployerAccount employer) {
        return names.getOrDefault(employer.getId(), employer.getName());
    }

    private static String first(String name) {
        if (name == null || name.isBlank()) {
            return "them";
        }
        return name.trim().split("\\s+")[0];
    }

    private static long hoursSince(LocalDateTime from, LocalDateTime now) {
        return from == null ? 0 : Math.max(0, Duration.between(from, now).toHours());
    }

    /** "2 days ago", "51 hours ago" - the way a person reads a delay off a screen. */
    private static String ago(LocalDateTime from, LocalDateTime now) {
        long hours = hoursSince(from, now);
        if (hours < 1) {
            return "just now";
        }
        if (hours < 48) {
            return hours + (hours == 1 ? " hour ago" : " hours ago");
        }
        long days = hours / 24;
        return days + " days ago";
    }
}
