package com.skillbridge.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "reviews", uniqueConstraints = @UniqueConstraint(
        columnNames = {"author_type", "author_id", "target_type", "target_id", "job_id"}))
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Review {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** Both ends are polymorphic: workers review employers and employers review workers. */
    @Enumerated(EnumType.STRING)
    @Column(name = "author_type", nullable = false)
    private AccountType authorType;

    @Column(name = "author_id", nullable = false)
    private Long authorId;

    @Enumerated(EnumType.STRING)
    @Column(name = "target_type", nullable = false)
    private AccountType targetType;

    @Column(name = "target_id", nullable = false)
    private Long targetId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "job_id")
    private JobPost job;

    @Column(nullable = false)
    private int rating;

    @Column(length = 2000)
    private String comment;

    @Builder.Default
    @Column(nullable = false)
    private LocalDateTime createdAt = LocalDateTime.now();
}
