package com.skillbridge.config;

import com.skillbridge.model.JobPost;
import com.skillbridge.repository.JobPostRepository;
import com.skillbridge.service.PricingService;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * Fills in the commission split on jobs that were posted before the slab table existed.
 *
 * Without this, an older job carries a zero take-home and the worker app - which correctly
 * prefers the take-home - would fall back to showing the employer's gross. That is exactly
 * the mismatch the feature exists to prevent, so it is worth a pass at boot.
 *
 * It only touches jobs whose split has never been computed, so it is safe to run every start
 * and it never overwrites a price an employer has since changed.
 */
@Component
@Order(5)
public class PricingBackfill implements CommandLineRunner {

    private final JobPostRepository jobs;
    private final PricingService pricing;

    public PricingBackfill(JobPostRepository jobs, PricingService pricing) {
        this.jobs = jobs;
        this.pricing = pricing;
    }

    @Override
    @Transactional
    public void run(String... args) {
        List<JobPost> all = jobs.findAll();
        int fixed = 0;
        for (JobPost job : all) {
            if (job.getSalary() <= 0 || job.getWorkerSalary() > 0) {
                continue;
            }
            job.applyPricing(
                    pricing.feePercent(job.getSalary()),
                    pricing.fee(job.getSalary()),
                    pricing.takeHome(job.getSalary()));
            if (job.getOriginalSalary() <= 0) {
                job.setOriginalSalary(job.getSalary());
            }
            fixed++;
        }
        if (fixed > 0) {
            jobs.saveAll(all);
            System.out.println("PricingBackfill: applied the commission split to " + fixed + " job(s)");
        }
    }
}
