package com.skillbridge.security;

import com.skillbridge.exception.ApiException;
import com.skillbridge.model.Account;
import com.skillbridge.model.AccountType;
import com.skillbridge.model.AdminAccount;
import com.skillbridge.model.EmployerAccount;
import com.skillbridge.model.WorkerAccount;
import com.skillbridge.repository.AdminAccountRepository;
import com.skillbridge.repository.EmployerAccountRepository;
import com.skillbridge.repository.WorkerAccountRepository;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

@Component
public class AuthenticationUtils {

    private static WorkerAccountRepository workerRepository;
    private static EmployerAccountRepository employerRepository;
    private static AdminAccountRepository adminRepository;

    public AuthenticationUtils(WorkerAccountRepository workerRepository,
                               EmployerAccountRepository employerRepository,
                               AdminAccountRepository adminRepository) {
        AuthenticationUtils.workerRepository = workerRepository;
        AuthenticationUtils.employerRepository = employerRepository;
        AuthenticationUtils.adminRepository = adminRepository;
    }

    public static AccountPrincipal principal() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !(auth.getPrincipal() instanceof AccountPrincipal principal)) {
            throw ApiException.unauthorized("Authentication required");
        }
        return principal;
    }

    public static AccountType currentType() {
        return principal().type();
    }

    public static Long currentId() {
        return principal().id();
    }

    public static Account currentAccount() {
        AccountPrincipal p = principal();
        return switch (p.type()) {
            case WORKER -> workerRepository.findById(p.id())
                    .map(a -> (Account) a).orElseThrow(AuthenticationUtils::gone);
            case EMPLOYER -> employerRepository.findById(p.id())
                    .map(a -> (Account) a).orElseThrow(AuthenticationUtils::gone);
            case ADMIN -> adminRepository.findById(p.id())
                    .map(a -> (Account) a).orElseThrow(AuthenticationUtils::gone);
        };
    }

    /** Null instead of throwing, for endpoints that serve both anonymous and signed-in callers. */
    public static Account currentAccountOrNull() {
        try {
            return currentAccount();
        } catch (RuntimeException ex) {
            return null;
        }
    }

    public static WorkerAccount currentWorker() {
        AccountPrincipal p = principal();
        if (p.type() != AccountType.WORKER) {
            throw ApiException.forbidden("This endpoint is for worker accounts");
        }
        return workerRepository.findById(p.id()).orElseThrow(AuthenticationUtils::gone);
    }

    public static EmployerAccount currentEmployer() {
        AccountPrincipal p = principal();
        if (p.type() != AccountType.EMPLOYER) {
            throw ApiException.forbidden("This endpoint is for employer accounts");
        }
        return employerRepository.findById(p.id()).orElseThrow(AuthenticationUtils::gone);
    }

    public static AdminAccount currentAdmin() {
        AccountPrincipal p = principal();
        if (p.type() != AccountType.ADMIN) {
            throw ApiException.forbidden("This endpoint is for admin accounts");
        }
        return adminRepository.findById(p.id()).orElseThrow(AuthenticationUtils::gone);
    }

    private static ApiException gone() {
        return ApiException.unauthorized("Account no longer exists");
    }
}
