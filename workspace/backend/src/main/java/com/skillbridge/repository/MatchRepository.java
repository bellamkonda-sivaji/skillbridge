package com.skillbridge.repository;

import com.skillbridge.model.JobPost;
import com.skillbridge.model.Match;
import com.skillbridge.model.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface MatchRepository extends JpaRepository<Match, Long> {
    List<Match> findByWorkerOrderByScoreDesc(User worker);
    List<Match> findByJobOrderByScoreDesc(JobPost job);
    List<Match> findByWorkerOrderByCreatedAtDesc(User worker);
    Optional<Match> findByWorkerAndJob(User worker, JobPost job);
    long countByJobId(Long jobId);
    List<Match> findAllByOrderByScoreDesc();
}
