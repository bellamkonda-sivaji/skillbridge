package com.skillbridge.controller;

import com.skillbridge.dto.admin.AdminDtos.*;
import com.skillbridge.service.AdminAuditService;
import com.skillbridge.service.AdminGuard;
import com.skillbridge.service.ApplicationHistoryService;
import com.skillbridge.service.BackOfficeReportService;
import com.skillbridge.service.BackOfficeService;
import com.skillbridge.model.AdminPermission;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

/**
 * The back-office read and tracking API. It sits alongside the original thin AdminController,
 * which keeps its own routes untouched for the older admin UI.
 */
@RestController
@RequestMapping("/api/admin")
public class BackOfficeController {

    private final BackOfficeService backOffice;
    private final ApplicationHistoryService historyService;
    private final BackOfficeReportService reportService;
    private final AdminAuditService auditService;
    private final AdminGuard guard;

    public BackOfficeController(BackOfficeService backOffice,
                                ApplicationHistoryService historyService,
                                BackOfficeReportService reportService,
                                AdminAuditService auditService, AdminGuard guard) {
        this.backOffice = backOffice;
        this.historyService = historyService;
        this.reportService = reportService;
        this.auditService = auditService;
        this.guard = guard;
    }

    // ---------------------------------------------------------------- overview

    @GetMapping("/overview")
    public OverviewDto overview(@RequestParam(defaultValue = "30") int days) {
        return backOffice.overview(days);
    }

    // ---------------------------------------------------------------- jobs

    @GetMapping("/jobs/list")
    public PageDto<JobRowDto> jobs(@RequestParam(required = false) String status,
                                   @RequestParam(required = false) Long employerId,
                                   @RequestParam(required = false) String engagementModel,
                                   @RequestParam(required = false) String q,
                                   @RequestParam(defaultValue = "0") int page,
                                   @RequestParam(defaultValue = "25") int size) {
        return backOffice.jobs(status, employerId, engagementModel, q, page, size);
    }

    @GetMapping("/jobs/{id}/detail")
    public JobDetailDto jobDetail(@PathVariable Long id) {
        return backOffice.jobDetail(id);
    }

    // ---------------------------------------------------------------- applications

    @GetMapping("/applications")
    public PageDto<ApplicationRowDto> applications(@RequestParam(required = false) String status,
                                                   @RequestParam(required = false) Long jobId,
                                                   @RequestParam(required = false) Long employerId,
                                                   @RequestParam(required = false) Boolean contacted,
                                                   @RequestParam(required = false) String q,
                                                   @RequestParam(defaultValue = "0") int page,
                                                   @RequestParam(defaultValue = "25") int size) {
        return backOffice.applications(status, jobId, employerId, contacted, q, page, size);
    }

    @GetMapping("/applications/{id}/history")
    public ApplicationHistoryDto history(@PathVariable Long id) {
        return historyService.history(id);
    }

    @PostMapping("/applications/{id}/contact")
    public ContactLogDto logContact(@PathVariable Long id, @RequestBody ContactRequest request) {
        return historyService.logContact(id, request);
    }

    @GetMapping("/applications/{id}/contacts")
    public List<ContactLogDto> contacts(@PathVariable Long id) {
        return historyService.contacts(id);
    }

    // ---------------------------------------------------------------- skills registry

    @GetMapping("/skills/registry")
    public PageDto<SkillRegistryRowDto> skillRegistry(@RequestParam(required = false) String q,
                                                      @RequestParam(required = false) String sort,
                                                      @RequestParam(defaultValue = "0") int page,
                                                      @RequestParam(defaultValue = "25") int size) {
        return backOffice.skillRegistry(q, sort, page, size);
    }

    @GetMapping("/skills/registry/{skill}/workers")
    public PageDto<SkillWorkerRowDto> skillWorkers(@PathVariable String skill,
                                                   @RequestParam(defaultValue = "0") int page,
                                                   @RequestParam(defaultValue = "25") int size) {
        return backOffice.skillWorkers(skill, page, size);
    }

    // ---------------------------------------------------------------- companies

    @GetMapping("/companies")
    public PageDto<CompanyRowDto> companies(@RequestParam(required = false) Boolean verified,
                                            @RequestParam(required = false) String q,
                                            @RequestParam(defaultValue = "0") int page,
                                            @RequestParam(defaultValue = "25") int size) {
        return backOffice.companies(verified, q, page, size);
    }

    @GetMapping("/companies/{id}")
    public CompanyDetailDto company(@PathVariable Long id) {
        return backOffice.company(id);
    }

    // ---------------------------------------------------------------- interviews

    @GetMapping("/interviews/list")
    public PageDto<InterviewRowDto> interviews(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) Long employerId,
            @RequestParam(required = false) String q,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "25") int size) {
        return backOffice.interviews(from, to, status, employerId, q, page, size);
    }

    @GetMapping("/interviews/calendar")
    public List<CalendarDayDto> calendar(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
        return backOffice.interviewCalendar(from, to);
    }

    // ---------------------------------------------------------------- payments

    @GetMapping("/payments/list")
    public PaymentListDto payments(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
            @RequestParam(required = false) String type,
            @RequestParam(required = false) Long employerId,
            @RequestParam(required = false) Long workerId,
            @RequestParam(required = false) String q,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "25") int size) {
        return backOffice.payments(from, to, type, employerId, workerId, q, page, size);
    }

    // ---------------------------------------------------------------- reports / audit

    @GetMapping("/reports/daily")
    public DailyReportDto daily(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        return reportService.daily(date);
    }

    @GetMapping("/audit")
    public PageDto<AuditRowDto> audit(
            @RequestParam(required = false) Long adminId,
            @RequestParam(required = false) String action,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "25") int size) {
        guard.require(AdminPermission.VIEW_AUDIT);
        return PageDto.of(auditService.search(adminId, action,
                        from == null ? null : from.atStartOfDay(),
                        to == null ? null : to.plusDays(1).atStartOfDay().minusNanos(1)),
                page, size);
    }
}
