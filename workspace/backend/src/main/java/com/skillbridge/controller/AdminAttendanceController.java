package com.skillbridge.controller;

import com.skillbridge.dto.AttendanceDto;
import com.skillbridge.dto.AttendanceDtos;
import com.skillbridge.dto.admin.AdminDtos.PageDto;
import com.skillbridge.service.AttendanceService;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

/**
 * The back office's view of attendance: everything, and able to settle it.
 *
 * <p>Reads need VIEW_REPORTS, decisions need MANAGE_APPLICATIONS (which HR carries). Every
 * decision taken here stamps ADMIN on the row, flags it {@code editedByAdmin}, writes an audit
 * log and notifies both the worker and the employer - so what the operator settles on the phone
 * is what all three sides see a second later.
 */
@RestController
@RequestMapping("/api/admin/attendance")
public class AdminAttendanceController {

    private final AttendanceService attendanceService;

    public AdminAttendanceController(AttendanceService attendanceService) {
        this.attendanceService = attendanceService;
    }

    @GetMapping
    public PageDto<AttendanceDto> search(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
            @RequestParam(required = false) Long employerId,
            @RequestParam(required = false) Long workerId,
            @RequestParam(required = false) Long jobId,
            @RequestParam(required = false) String approvalStatus,
            @RequestParam(required = false) String q,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "25") int size) {
        List<AttendanceDto> rows = attendanceService.adminSearch(
                date, from, to, employerId, workerId, jobId, approvalStatus, q);
        return PageDto.of(rows, page, size);
    }

    @GetMapping("/summary")
    public AttendanceDtos.AdminAttendanceSummaryDto summary(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
        return attendanceService.adminSummary(from, to);
    }

    @GetMapping("/requests")
    public PageDto<AttendanceDtos.AttendanceRequestDto> requests(
            @RequestParam(required = false) String status,
            @RequestParam(required = false) Long employerId,
            @RequestParam(required = false) String q,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "25") int size) {
        return PageDto.of(attendanceService.adminRequests(status, employerId, q), page, size);
    }

    @PostMapping("/requests/{id}/approve")
    public AttendanceDtos.AttendanceRequestDto approveRequest(
            @PathVariable Long id, @RequestBody(required = false) AttendanceDtos.DecisionBody body) {
        return attendanceService.adminDecideRequest(id, true, body);
    }

    @PostMapping("/requests/{id}/reject")
    public AttendanceDtos.AttendanceRequestDto rejectRequest(
            @PathVariable Long id, @RequestBody(required = false) AttendanceDtos.DecisionBody body) {
        return attendanceService.adminDecideRequest(id, false, body);
    }

    @PostMapping("/{id}/override")
    public AttendanceDto override(@PathVariable Long id,
                                  @RequestBody(required = false) AttendanceDtos.OverrideBody body) {
        return attendanceService.adminOverride(id, body);
    }
}
