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
 * It only touches jobs whose split is missing or was computed at the wrong slab (before slabs
 * were chosen on the daily-equivalent rate), so it is safe to run every start, and it never
 * changes the price an employer posted - only the commission split derived from it.
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
            if (job.getSalary() <= 0) {
                continue;
            }
            double percent = pricing.feePercent(job.getSalary(), job.getSalaryUnit());
            // A split already computed at the right slab is left alone. One computed before the
            // slab was chosen on the daily equivalent (a monthly job slabbed at 20% on its raw
            // figure) is re-derived: the split is arithmetic on the price, never the price.
            if (job.getWorkerSalary() > 0 && job.getFeePercent() == percent) {
                continue;
            }
            job.applyPricing(
                    percent,
                    pricing.fee(job.getSalary(), job.getSalaryUnit()),
                    pricing.takeHome(job.getSalary(), job.getSalaryUnit()));
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
