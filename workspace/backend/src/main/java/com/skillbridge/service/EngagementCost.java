package com.skillbridge.service;

import com.skillbridge.dto.ScheduleEstimateDto;
import com.skillbridge.model.JobOffer;
import com.skillbridge.model.JobPost;
import com.skillbridge.service.payment.Money;
import org.springframework.stereotype.Service;

/**
 * What a hire costs the employer, start to finish.
 *
 * An offer carries a rate - Rs 700 a day - but the money that has to be behind the hire is
 * the rate times the work: eighteen days of a three-week job. Reserving the rate alone meant a
 * worker who did three weeks was paid for one day. Ongoing work is reserved one pay period at
 * a time, which is what the estimate reports for it.
 */
@Service
public class EngagementCost {

    private final ScheduleCalculator scheduleCalculator;
    private final JobService jobService;

    public EngagementCost(ScheduleCalculator scheduleCalculator, JobService jobService) {
        this.scheduleCalculator = scheduleCalculator;
        this.jobService = jobService;
    }

    /** The whole engagement at the offered rate, in paise. Never less than one unit. */
    public long totalMinor(JobOffer offer) {
        return totalMinor(offer.getApplication().getJob(), offer.getSalary(),
                offer.getSalaryUnit(), offer.getWorkDate());
    }

    public long totalMinor(JobPost job, double rate, com.skillbridge.model.SalaryUnit unit,
                           java.time.LocalDate workDate) {
        double perUnit = rate > 0 ? rate : job.getSalary();
        ScheduleCalculator.ScheduleInput base = jobService.scheduleInput(job);
        ScheduleCalculator.ScheduleInput priced = new ScheduleCalculator.ScheduleInput(
                base.engagementModel(), workDate != null ? workDate : base.workDate(),
                base.startDate(), base.endDate(), base.durationType(), base.workingDays(),
                base.shifts(), base.shiftArrangement(), base.breakPaid(), perUnit,
                unit != null ? unit : base.salaryUnit(), base.payrollCycle(), base.workPattern(),
                base.durationMonths(), base.dayTimes());
        Double total = null;
        try {
            ScheduleEstimateDto estimate = scheduleCalculator.estimate(priced);
            total = estimate.estimatedEmployerTotal();
        } catch (RuntimeException ignored) {
            // A schedule the calculator cannot read still has its rate to fall back on.
        }
        double rupees = total != null && total > perUnit ? total : perUnit;
        return Money.fromRupees(rupees);
    }
}
