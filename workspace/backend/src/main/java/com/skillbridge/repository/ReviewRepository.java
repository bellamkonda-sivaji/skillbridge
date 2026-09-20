package com.skillbridge.repository;

import com.skillbridge.model.AccountType;
import com.skillbridge.model.Review;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface ReviewRepository extends JpaRepository<Review, Long> {
    List<Review> findByTargetTypeAndTargetIdOrderByCreatedAtDesc(AccountType targetType, Long targetId);
    List<Review> findByAuthorTypeAndAuthorIdOrderByCreatedAtDesc(AccountType authorType, Long authorId);
    List<Review> findByTargetTypeOrderByCreatedAtDesc(AccountType targetType);

    @Query("select coalesce(avg(r.rating), 0.0) from Review r "
            + "where r.targetType = :type and r.targetId = :id")
    double averageRatingFor(@Param("type") AccountType type, @Param("id") Long id);

    long countByTargetTypeAndTargetId(AccountType targetType, Long targetId);
}
