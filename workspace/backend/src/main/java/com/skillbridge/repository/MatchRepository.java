package com.skillbridge.repository;

import com.skillbridge.model.JobPost;
import com.skillbridge.model.Match;
import com.skillbridge.model.WorkerAccount;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface MatchRepository extends JpaRepository<Match, Long> {
    List<Match> findByWorkerOrderByScoreDesc(WorkerAccount worker);
    List<Match> findByJobOrderByScoreDesc(JobPost job);
    List<Match> findByWorkerOrderByCreatedAtDesc(WorkerAccount worker);
    Optional<Match> findByWorkerAndJob(WorkerAccount worker, JobPost job);
    long countByJobId(Long jobId);
    List<Match> findAllByOrderByScoreDesc();
}
