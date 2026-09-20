package com.skillbridge.security;

import com.skillbridge.model.Account;
import com.skillbridge.model.AccountType;
import com.skillbridge.repository.AdminAccountRepository;
import com.skillbridge.repository.EmployerAccountRepository;
import com.skillbridge.repository.WorkerAccountRepository;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import java.util.Optional;

/**
 * Resolves the namespaced JWT subject - {@code "WORKER:9000000007"} - back to an account.
 * The prefix is what keeps a worker id 4 from ever resolving to employer id 4.
 */
@Service
public class AccountDetailsService implements UserDetailsService {

    private final WorkerAccountRepository workerRepository;
    private final EmployerAccountRepository employerRepository;
    private final AdminAccountRepository adminRepository;

    public AccountDetailsService(WorkerAccountRepository workerRepository,
                                 EmployerAccountRepository employerRepository,
                                 AdminAccountRepository adminRepository) {
        this.workerRepository = workerRepository;
        this.employerRepository = employerRepository;
        this.adminRepository = adminRepository;
    }

    @Override
    public UserDetails loadUserByUsername(String subject) throws UsernameNotFoundException {
        Account account = findBySubject(subject)
                .orElseThrow(() -> new UsernameNotFoundException("Account not found: " + subject));
        return org.springframework.security.core.userdetails.User
                .withUsername(subject)
                .password(account.getPassword())
                .authorities(account.accountType().authority())
                .disabled(!account.isEnabled())
                .build();
    }

    /** {@code "<TYPE>:<phone-or-email>"}. Anything else is not a subject we issued. */
    public Optional<Account> findBySubject(String subject) {
        if (subject == null || !subject.contains(":")) {
            return Optional.empty();
        }
        int split = subject.indexOf(':');
        AccountType type;
        try {
            type = AccountType.valueOf(subject.substring(0, split));
        } catch (IllegalArgumentException ex) {
            return Optional.empty();
        }
        return findByIdentifier(type, subject.substring(split + 1));
    }

    /** Looks an account up inside one namespace by mobile number first, then email. */
    public Optional<Account> findByIdentifier(AccountType type, String identifier) {
        if (identifier == null || identifier.isBlank()) {
            return Optional.empty();
        }
        String id = identifier.trim();
        String lower = id.toLowerCase();
        return switch (type) {
            case WORKER -> workerRepository.findByPhone(id)
                    .map(a -> (Account) a)
                    .or(() -> workerRepository.findByEmail(id).map(a -> (Account) a))
                    .or(() -> workerRepository.findByEmail(lower).map(a -> (Account) a));
            case EMPLOYER -> employerRepository.findByPhone(id)
                    .map(a -> (Account) a)
                    .or(() -> employerRepository.findByEmail(id).map(a -> (Account) a))
                    .or(() -> employerRepository.findByEmail(lower).map(a -> (Account) a));
            case ADMIN -> adminRepository.findByPhone(id)
                    .map(a -> (Account) a)
                    .or(() -> adminRepository.findByEmail(id).map(a -> (Account) a))
                    .or(() -> adminRepository.findByEmail(lower).map(a -> (Account) a));
        };
    }
}
