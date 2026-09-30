package com.skillbridge.service;

import com.skillbridge.dto.admin.AdminDtos.*;
import com.skillbridge.model.*;
import com.skillbridge.repository.*;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;

/** The one screen the back office opens every morning: what happened, and what needs chasing. */
@Service
public class BackOfficeReportService {

    private static final DateTimeFormatter HHMM = DateTimeFormatter.ofPattern("HH:mm");

    private final WorkerAccountRepository workerAccountRepository;
    private final EmployerAccountRepository employerAccountRepository;
    private final WorkerProfileRepository workerProfileRepository;
    private final EmployerProfileRepository employerProfileRepository;
    private final JobPostRepository jobRepository;
    private final JobOfferRepository offerRepository;
    private final EmploymentRepository employmentRepository;
    private final AttendanceRepository attendanceRepository;
    private final AttendanceRequestRepository attendanceRequestRepository;
    private final ContactLogRepository contactLogRepository;
    private final BackOfficeService backOffice;
    private final BackOfficeAssembler assembler;
    private final AdminAuditService audit;
    private final AdminGuard guard;

    public BackOfficeReportService(WorkerAccountRepository workerAccountRepository,
                                   EmployerAccountRepository employerAccountRepository,
                                   WorkerProfileRepository workerProfileRepository,
                                   EmployerProfileRepository employerProfileRepository,
                                   JobPostRepository jobRepository, JobOfferRepository offerRepository,
                                   EmploymentRepository employmentRepository,
                                   AttendanceRepository attendanceRepository,
                                   AttendanceRequestRepository attendanceRequestRepository,
                                   ContactLogRepository contactLogRepository,
                                   BackOfficeService backOffice, BackOfficeAssembler assembler,
                                   AdminAuditService audit, AdminGuard guard) {
        this.workerAccountRepository = workerAccountRepository;
        this.employerAccountRepository = employerAccountRepository;
        this.workerProfileRepository = workerProfileRepository;
        this.employerProfileRepository = employerProfileRepository;
        this.jobRepository = jobRepository;
        this.offerRepository = offerRepository;
        this.employmentRepository = employmentRepository;
        this.attendanceRepository = attendanceRepository;
        this.attendanceRequestRepository = attendanceRequestRepository;
        this.contactLogRepository = contactLogRepository;
        this.backOffice = backOffice;
        this.assembler = assembler;
        this.audit = audit;
        this.guard = guard;
    }

    public DailyReportDto daily(LocalDate date) {
        guard.require(AdminPermission.VIEW_REPORTS);
        LocalDate day = date != null ? date : LocalDate.now();
        LocalDateTime start = day.atStartOfDay();
        LocalDateTime end = day.plusDays(1).atStartOfDay();
        LocalDateTime now = LocalDateTime.now();
        BackOfficeAssembler.Snapshot s = assembler.snapshot();

        // ---------------------------------------------------------------- counts for the day
        long newJobs = jobRepository.findAll().stream().filter(j -> within(j.getPostedAt(), start, end)).count();
        long newApplications = s.applications.stream().filter(a -> within(a.getAppliedAt(), start, end)).count();
        long newWorkers = workerAccountRepository.findAll().stream()
                .filter(w -> within(w.getCreatedAt(), start, end)).count();
        long newEmployers = employerAccountRepository.findAll().stream()
                .filter(e -> within(e.getCreatedAt(), start, end)).count();
        long interviewsScheduled = s.interviews.stream()
                .filter(i -> within(i.getCreatedAt(), start, end)).count();
        long interviewsHeld = s.interviews.stream()
                .filter(i -> i.getStatus() == InterviewStatus.COMPLETED
                        && within(i.getScheduledAt(), start, end)).count();
        List<JobOffer> offers = offerRepository.findAll();
        long offersSent = offers.stream().filter(o -> within(o.getSentAt(), start, end)).count();
        long offersAccepted = offers.stream().filter(o -> o.getStatus() == OfferStatus.ACCEPTED
                && within(o.getRespondedAt(), start, end)).count();
        long hires = employmentRepository.findAll().stream()
                .filter(e -> within(e.getCreatedAt(), start, end)).count();
        long contactsLogged = contactLogRepository.findAll().stream()
                .filter(c -> within(c.getContactedAt(), start, end)).count();
        List<WalletTransaction> payouts = backOffice.jobPayoutsToWorkers().stream()
                .filter(t -> within(t.getCreatedAt(), start, end)).toList();

        // ---------------------------------------------------------------- the chase list
        List<TaskGroupDto> tasks = new ArrayList<>();

        List<TaskItemDto> uncontacted = new ArrayList<>();
        List<TaskItemDto> awaiting = new ArrayList<>();
        List<TaskItemDto> unpaid = new ArrayList<>();
        for (JobApplication a : s.applications) {
            String who = a.getWorker().getName();
            String what = a.getJob().getTitle() + " · "
                    + assembler.displayBusinessName(s, a.getJob().getEmployer());
            if (!assembler.isContacted(s, a) && a.getAppliedAt().isBefore(now.minusHours(24))
                    && !a.getStatus().isTerminal()) {
                uncontacted.add(new TaskItemDto(a.getId(), who, what, a.getAppliedAt(),
                        "APPLICATION:" + a.getId()));
            }
            if (a.getAppliedAt().isBefore(now.minusHours(48))
                    && (a.getStatus() == ApplicationStatus.APPLIED
                        || a.getStatus() == ApplicationStatus.VIEWED)) {
                awaiting.add(new TaskItemDto(a.getId(), who, what, a.getAppliedAt(),
                        "APPLICATION:" + a.getId()));
            }
            Employment employment = s.employment(a);
            boolean workDone = employment != null
                    && (employment.getStatus() == EmploymentStatus.COMPLETED
                        || employment.getStatus() == EmploymentStatus.ENDED
                        || employment.getSettledAt() != null);
            if (workDone && !assembler.isPaid(a)) {
                unpaid.add(new TaskItemDto(a.getId(), who, what,
                        employment.getEndedAt() != null ? employment.getEndedAt()
                                : employment.getCreatedAt(),
                        "APPLICATION:" + a.getId()));
            }
        }
        add(tasks, "UNCONTACTED_APPLICANTS", "Applicants not contacted yet", "HIGH", uncontacted);
        add(tasks, "AWAITING_EMPLOYER_RESPONSE", "Applications the employer has not answered",
                "MEDIUM", awaiting);

        List<TaskItemDto> interviewsTodayTasks = new ArrayList<>();
        List<InterviewRowDto> interviewsToday = new ArrayList<>();
        for (Interview i : s.interviews) {
            if (!within(i.getScheduledAt(), start, end)) {
                continue;
            }
            InterviewRowDto row = assembler.interviewRow(s, i);
            interviewsToday.add(row);
            interviewsTodayTasks.add(new TaskItemDto(i.getId(), row.workerName(),
                    row.jobTitle() + " · " + row.businessName(), i.getScheduledAt(),
                    "INTERVIEW:" + i.getId()));
        }
        interviewsToday.sort(Comparator.comparing(InterviewRowDto::scheduledAt));
        add(tasks, "INTERVIEWS_TODAY", "Interviews happening today", "MEDIUM", interviewsTodayTasks);

        List<TaskItemDto> pendingOffers = new ArrayList<>();
        for (JobOffer o : offers) {
            if (o.getStatus().isOpen() && o.getSentAt().isBefore(now.minusHours(48))) {
                pendingOffers.add(new TaskItemDto(o.getId(),
                        o.getApplication().getWorker().getName(),
                        o.getApplication().getJob().getTitle() + " · "
                                + assembler.displayBusinessName(s,
                                        o.getApplication().getJob().getEmployer()),
                        o.getSentAt(), "OFFER:" + o.getId()));
            }
        }
        add(tasks, "PENDING_OFFERS", "Offers sent but not answered", "HIGH", pendingOffers);

        List<TaskItemDto> verifications = new ArrayList<>();
        for (WorkerProfile p : workerProfileRepository.findAll()) {
            if (p.getVerificationStatus() == VerificationStatus.PENDING) {
                verifications.add(new TaskItemDto(p.getAccount().getId(), p.getAccount().getName(),
                        "Worker verification · " + nz(p.getCity()), p.getAccount().getCreatedAt(),
                        "WORKER:" + p.getAccount().getId()));
            }
        }
        for (EmployerProfile p : employerProfileRepository.findAll()) {
            if (!p.isVerified()) {
                verifications.add(new TaskItemDto(p.getAccount().getId(), p.getBusinessName(),
                        "Business verification · " + nz(p.getCity()), p.getCreatedAt(),
                        "EMPLOYER:" + p.getAccount().getId()));
            }
        }
        add(tasks, "PENDING_VERIFICATIONS", "Accounts waiting on verification", "MEDIUM", verifications);

        List<TaskItemDto> unapproved = new ArrayList<>();
        List<AttendanceTodayDto> attendanceToday = new ArrayList<>();
        for (Attendance r : attendanceRepository.findAll()) {
            Employment e = r.getEmployment();
            String workerName = e.getWorker().getName();
            String business = assembler.displayBusinessName(s, e.getEmployer());
            if (r.getWorkDate().equals(day)) {
                attendanceToday.add(new AttendanceTodayDto(e.getId(), workerName, business,
                        r.getStatus(),
                        r.getCheckInAt() == null ? null : r.getCheckInAt().format(HHMM),
                        r.getCheckOutAt() == null ? null : r.getCheckOutAt().format(HHMM),
                        assembler.attendanceApproved(r)));
            }
            if (!assembler.attendanceApproved(r) && r.getStatus() != AttendanceStatus.NOT_CHECKED_IN
                    && !r.getWorkDate().isAfter(day)) {
                unapproved.add(new TaskItemDto(r.getId(), workerName,
                        business + " · " + r.getWorkDate(), r.getWorkDate().atStartOfDay(),
                        "EMPLOYMENT:" + e.getId()));
            }
        }
        add(tasks, "UNAPPROVED_ATTENDANCE", "Attendance days not approved", "MEDIUM", unapproved);

        // "I was there but it is not showing" - nobody has answered these, and each one is a
        // day's pay waiting on a tap.
        List<TaskItemDto> attendanceRequests = new ArrayList<>();
        for (AttendanceRequest r : attendanceRequestRepository
                .findByStatusOrderByCreatedAtAsc(AttendanceRequestStatus.PENDING)) {
            attendanceRequests.add(new TaskItemDto(r.getId(), r.getWorkerName(),
                    r.getBusinessName() + " \u00b7 " + r.getWorkDate() + " \u00b7 "
                            + r.getType().label(),
                    r.getCreatedAt(), "ATTENDANCE_REQUEST:" + r.getId()));
        }
        long openRequests = attendanceRequests.size();
        add(tasks, "OPEN_ATTENDANCE_REQUESTS", "Attendance questions nobody has answered", "HIGH",
                attendanceRequests);
        add(tasks, "UNPAID_COMPLETED_WORK", "Completed work still unpaid", "HIGH", unpaid);

        List<AdminActivityDto> adminActivity = audit.onDate(day).stream()
                .map(l -> new AdminActivityDto(l.getAdminName(), l.getAction(), l.getEntityType(),
                        l.getEntityId(), l.getCreatedAt()))
                .toList();

        return new DailyReportDto(day,
                new DailyCountsDto(newJobs, newApplications, newWorkers, newEmployers,
                        interviewsScheduled, interviewsHeld, offersSent, offersAccepted, hires,
                        contactsLogged, payouts.size(),
                        BackOfficeAssembler.round2(
                                payouts.stream().mapToDouble(WalletTransaction::getAmount).sum()),
                        openRequests),
                tasks, interviewsToday, attendanceToday, adminActivity);
    }

    private static void add(List<TaskGroupDto> tasks, String type, String label, String severity,
                            List<TaskItemDto> items) {
        items.sort(Comparator.comparing(TaskItemDto::at,
                Comparator.nullsLast(Comparator.naturalOrder())));
        tasks.add(new TaskGroupDto(type, label, items.size(), severity,
                items.size() > 20 ? items.subList(0, 20) : items));
    }

    private static boolean within(LocalDateTime at, LocalDateTime start, LocalDateTime end) {
        return at != null && !at.isBefore(start) && at.isBefore(end);
    }

    private static String nz(String s) {
        return s == null ? "" : s;
    }
}
