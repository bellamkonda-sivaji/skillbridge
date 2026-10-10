package com.skillbridge.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

/**
 * One place of work belonging to an employer.
 *
 * A business is not one address. A shop owner opens a second branch, a
 * contractor runs three sites, and the job posted today is at one of them -
 * which is the single most important thing a worker needs to know, because it
 * decides whether they can get there.
 *
 * The profile used to hold one address, so every job inherited it whether or
 * not the work was there. An employer with two shops had to either edit their
 * profile before each posting or let the job claim the wrong address.
 *
 * One account, many shops. The first one is created from whatever the profile
 * already held, so nobody has to re-enter what they have already given us.
 */
@Entity
@Table(name = "shops")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Shop {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "employer_account_id", nullable = false)
    private EmployerAccount employer;

    /** What the owner calls it: "Fresh Mart, Gandhi Road" or just "Main shop". */
    @Column(nullable = false)
    private String name;

    @Column(columnDefinition = "TEXT")
    private String address;

    private String city;
    private String area;
    private String pincode;

    private double latitude;
    private double longitude;

    /**
     * The one offered first when posting.
     *
     * Most employers have a single shop and should never think about this;
     * the default is simply the one they already had.
     */
    @Builder.Default
    @Column(name = "is_primary")
    private boolean primaryShop = false;

    /** Closed branches stop being offered, but their old jobs still resolve. */
    @Builder.Default
    private boolean active = true;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @PrePersist
    void onCreate() {
        if (createdAt == null) createdAt = LocalDateTime.now();
    }
}
