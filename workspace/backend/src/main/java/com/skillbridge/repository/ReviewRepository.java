package com.skillbridge.repository;

import com.skillbridge.model.Review;
import com.skillbridge.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface ReviewRepository extends JpaRepository<Review, Long> {
    List<Review> findByTargetOrderByCreatedAtDesc(User target);
    List<Review> findByAuthorOrderByCreatedAtDesc(User author);

    @Query("select coalesce(avg(r.rating), 0.0) from Review r where r.target = :user")
    double averageRatingFor(@Param("user") User user);

    @Query("select r from Review r where r.target.role = :role order by r.createdAt desc")
    List<Review> findByTargetRole(@Param("role") com.skillbridge.model.Role role);

    long countByTarget(User target);
}
