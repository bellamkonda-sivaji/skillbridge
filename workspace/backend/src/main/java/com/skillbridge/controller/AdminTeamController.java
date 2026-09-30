package com.skillbridge.controller;

import com.skillbridge.dto.admin.AdminDtos.AdminDto;
import com.skillbridge.dto.admin.AdminDtos.AdminRegisterRequest;
import com.skillbridge.dto.admin.AdminDtos.RoleRequest;
import com.skillbridge.dto.admin.AdminDtos.StatusRequest;
import com.skillbridge.service.AdminTeamService;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/** Managing the back-office team itself. Every route needs the MANAGE_TEAM permission. */
@RestController
@RequestMapping("/api/admin/team")
public class AdminTeamController {

    private final AdminTeamService teamService;

    public AdminTeamController(AdminTeamService teamService) {
        this.teamService = teamService;
    }

    @GetMapping
    public List<AdminDto> list() {
        return teamService.list();
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public AdminDto create(@RequestBody AdminRegisterRequest request) {
        return teamService.createTeamMember(request);
    }

    @PatchMapping("/{id}/role")
    public AdminDto changeRole(@PathVariable Long id, @RequestBody RoleRequest request) {
        return teamService.changeRole(id, request.role());
    }

    @PatchMapping("/{id}/status")
    public AdminDto changeStatus(@PathVariable Long id, @RequestBody StatusRequest request) {
        return teamService.changeStatus(id, request.enabled());
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id) {
        teamService.delete(id);
    }
}
