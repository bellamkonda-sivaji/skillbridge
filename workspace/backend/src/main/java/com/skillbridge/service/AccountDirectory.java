package com.skillbridge.service;

import com.skillbridge.exception.ApiException;
import com.skillbridge.model.Account;
import com.skillbridge.model.AccountType;
import com.skillbridge.repository.AdminAccountRepository;
import com.skillbridge.repository.EmployerAccountRepository;
import com.skillbridge.repository.EmployerProfileRepository;
import com.skillbridge.repository.WorkerAccountRepository;
import org.springframework.stereotype.Service;

import java.util.Optional;

/**
 * Resolves a polymorphic {@code (type, id)} pair back to an account. Everything that stores a
 * party as a pair - messages, notifications, wallets, reviews - reads names and photos through here.
 */
@Service
public class AccountDirectory {

    private final WorkerAccountRepository workerRepository;
    private final EmployerAccountRepository employerRepository;
    private final AdminAccountRepository adminRepository;
    private final EmployerProfileRepository employerProfileRepository;

    public AccountDirectory(WorkerAccountRepository workerRepository,
                            EmployerAccountRepository employerRepository,
                            AdminAccountRepository adminRepository,
                            EmployerProfileRepository employerProfileRepository) {
        this.workerRepository = workerRepository;
        this.employerRepository = employerRepository;
        this.adminRepository = adminRepository;
        this.employerProfileRepository = employerProfileRepository;
    }

    public Optional<Account> find(AccountType type, Long id) {
        if (type == null || id == null) {
            return Optional.empty();
        }
        return switch (type) {
            case WORKER -> workerRepository.findById(id).map(a -> (Account) a);
            case EMPLOYER -> employerRepository.findById(id).map(a -> (Account) a);
            case ADMIN -> adminRepository.findById(id).map(a -> (Account) a);
        };
    }

    public Account require(AccountType type, Long id) {
        return find(type, id).orElseThrow(() -> ApiException.notFound("Account not found"));
    }

    public String nameOf(AccountType type, Long id) {
        return find(type, id).map(Account::getName).orElse("Unknown");
    }

    /** Employers are shown by business name wherever there is one. */
    public String displayNameOf(AccountType type, Long id) {
        if (type == AccountType.EMPLOYER && id != null) {
            Optional<String> business = employerProfileRepository.findByAccountId(id)
                    .map(p -> p.getBusinessName());
            if (business.isPresent() && business.get() != null && !business.get().isBlank()) {
                return business.get();
            }
        }
        return nameOf(type, id);
    }
}
