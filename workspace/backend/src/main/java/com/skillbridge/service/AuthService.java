package com.skillbridge.service;

import com.skillbridge.dto.AuthRequest;
import com.skillbridge.dto.AuthResponse;
import com.skillbridge.dto.RegisterRequest;
import com.skillbridge.dto.UserDto;
import com.skillbridge.exception.ApiException;
import com.skillbridge.model.EmployerProfile;
import com.skillbridge.model.Role;
import com.skillbridge.model.User;
import com.skillbridge.model.WorkerProfile;
import com.skillbridge.repository.EmployerProfileRepository;
import com.skillbridge.repository.UserRepository;
import com.skillbridge.repository.WorkerProfileRepository;
import com.skillbridge.security.JwtUtil;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final WorkerProfileRepository workerProfileRepository;
    private final EmployerProfileRepository employerProfileRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final UserDetailsService userDetailsService;
    private final JwtUtil jwtUtil;

    public AuthService(UserRepository userRepository, WorkerProfileRepository workerProfileRepository,
                       EmployerProfileRepository employerProfileRepository, PasswordEncoder passwordEncoder,
                       AuthenticationManager authenticationManager, UserDetailsService userDetailsService,
                       JwtUtil jwtUtil) {
        this.userRepository = userRepository;
        this.workerProfileRepository = workerProfileRepository;
        this.employerProfileRepository = employerProfileRepository;
        this.passwordEncoder = passwordEncoder;
        this.authenticationManager = authenticationManager;
        this.userDetailsService = userDetailsService;
        this.jwtUtil = jwtUtil;
    }

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        if (request.name() == null || request.name().isBlank()
                || request.email() == null || request.email().isBlank()
                || request.password() == null || request.password().length() < 6) {
            throw ApiException.badRequest("Name, email and password (min 6 chars) are required");
        }
        if (userRepository.existsByEmail(request.email().toLowerCase().trim())) {
            throw ApiException.conflict("An account with this email already exists");
        }
        Role role = request.role() != null ? request.role() : Role.WORKER;
        if (role == Role.ADMIN) {
            role = Role.WORKER; // admins can only be created via seed
        }

        User user = User.builder()
                .name(request.name().trim())
                .email(request.email().toLowerCase().trim())
                .password(passwordEncoder.encode(request.password()))
                .phone(request.phone())
                .role(role)
                .locale(request.locale() != null ? request.locale() : "en")
                .enabled(true)
                .build();
        user = userRepository.save(user);

        if (role == Role.WORKER) {
            WorkerProfile profile = WorkerProfile.builder().user(user).build();
            workerProfileRepository.save(profile);
        } else {
            EmployerProfile profile = EmployerProfile.builder().user(user)
                    .businessName(request.name().trim())
                    .build();
            employerProfileRepository.save(profile);
        }

        return buildAuthResponse(user);
    }

    public AuthResponse login(AuthRequest request) {
        try {
            authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(request.email(), request.password()));
        } catch (Exception ex) {
            throw ApiException.unauthorized("Invalid email or password");
        }
        User user = userRepository.findByEmail(request.email().toLowerCase().trim())
                .orElseThrow(() -> ApiException.unauthorized("Invalid email or password"));
        if (!user.isEnabled()) {
            throw ApiException.forbidden("Your account has been disabled. Contact support.");
        }
        return buildAuthResponse(user);
    }

    private AuthResponse buildAuthResponse(User user) {
        UserDetails details = userDetailsService.loadUserByUsername(user.getEmail());
        String token = jwtUtil.generateToken(details, user.getId(), user.getRole().name());
        return new AuthResponse(token, UserDto.from(user));
    }
}
