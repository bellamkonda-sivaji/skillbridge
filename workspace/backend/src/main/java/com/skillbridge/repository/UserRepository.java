package com.skillbridge.repository;

import com.skillbridge.model.Role;
import com.skillbridge.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmail(String email);
    boolean existsByEmail(String email);
    List<User> findByRole(Role role);
    long countByRole(Role role);
    long countByCreatedAtAfter(LocalDateTime time);

    @Query("select u from User u where u.role = :role and lower(u.name) like lower(concat('%', :q, '%'))")
    List<User> searchByRoleAndName(@Param("role") Role role, @Param("q") String q);
}
