package com.skillbridge.service;

import com.skillbridge.dto.JobDemandDto;
import com.skillbridge.model.*;
import com.skillbridge.repository.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

/**
 * The advice engine decides whether to spend an employer's money, so the tests here are about
 * restraint as much as correctness: the cases that must NOT produce a suggestion matter more
 * than the ones that do.
 */
class JobDemandServiceTest {

    private JobPostRepository jobs;
    private JobApplicationRepository applications;
    private WorkerProfileRepository workers;
    private JobDemandService service;

    @BeforeEach
    void setUp() {
        jobs = mock(JobPostRepository.class);
        applications = mock(JobApplicationRepository.class);
        workers = mock(WorkerProfileRepository.class);
        service = new JobDemandService(jobs, applications, workers,
                mock(JobPriceChangeRepository.class), new PricingService(),
                mock(NotificationService.class));
        when(workers.findByCityIgnoreCase(anyString())).thenReturn(List.of());
        when(jobs.findComparables(any(), anyString(), any(), any(), any())).thenReturn(List.of());
    }

    private JobPost job(EngagementModel model, LocalDate workDate, double salary, int needed, long hoursAgo) {
        JobPost job = JobPost.builder()
                .title("Loading help")
                .city("Tirupati")
                .workerCategory(WorkerCategory.STORE_HELPER)
                .salary(salary)
                .salaryUnit(SalaryUnit.DAILY)
                .engagementModel(model)
                .workDate(workDate)
                .workersNeeded(needed)
                .status(JobStatus.OPEN)
                .build();
        job.setId(1L);
        job.setPostedAt(LocalDateTime.now().minusHours(hoursAgo));
        job.setShifts(new ArrayList<>());
        job.applyPricing(10, salary * 0.10, salary * 0.90);
        return job;
    }

    // ---------------------------------------------------------------- the urgency window

    @Test
    void aOneDayJobStartingTomorrowGetsAnHour() {
        // The case the feature exists for: the employer needs somebody today.
        assertEquals(1, service.windowHours(job(EngagementModel.ONE_DAY, LocalDate.now().plusDays(1), 400, 1, 0)));
    }

    @Test
    void aOneDayJobStillWeeksAwayGetsLonger() {
        assertEquals(6, service.windowHours(job(EngagementModel.ONE_DAY, LocalDate.now().plusDays(20), 400, 1, 0)));
    }

    @Test
    void longerEngagementsGetProportionallyLongerWindows() {
        assertEquals(24, service.windowHours(job(EngagementModel.FEW_WEEKS, null, 8000, 1, 0)));
        assertEquals(48, service.windowHours(job(EngagementModel.MONTHS, null, 18000, 1, 0)));
        assertEquals(72, service.windowHours(job(EngagementModel.PERMANENT, null, 18000, 1, 0)));
    }

    @Test
    void aJobWithNoDatesStillGetsAWindow() {
        // No work date must never mean "no window" - that would silence the advice entirely.
        assertTrue(service.windowHours(job(EngagementModel.ONE_DAY, null, 400, 1, 0)) > 0);
    }

    // ---------------------------------------------------------------- restraint

    @Test
    void insideTheWindowWeSayNothingAboutThePrice() {
        JobPost j = job(EngagementModel.ONE_DAY, LocalDate.now().plusDays(1), 400, 2, 0);
        when(applications.countByJobId(1L)).thenReturn(0L);

        JobDemandDto read = service.assess(j);
        assertEquals(DemandVerdict.TOO_EARLY, read.verdict());
        assertNull(read.suggestedSalary(), "we must not advise a raise before the employer's own window is up");
    }

    @Test
    void withNoComparableLocalJobsWeAdmitWeDoNotKnowTheRate() {
        // Overdue, nobody applied, and nothing nearby to compare against. We may still advise
        // a measured step, but we must never claim a market rate we do not have.
        JobPost j = job(EngagementModel.ONE_DAY, LocalDate.now().plusDays(1), 400, 2, 5);
        when(applications.countByJobId(1L)).thenReturn(0L);

        JobDemandDto read = service.assess(j);
        assertEquals(DemandVerdict.STALLED, read.verdict());
        assertNull(read.marketMedianSalary(), "no comparables means no median, not a guessed one");
        assertEquals(0, read.comparableJobs());
        assertFalse(read.detail().contains("Shops near you"),
                "with nothing to compare against we must not claim to know what nearby shops pay");
    }

    @Test
    void enoughApplicantsIsReportedAsHealthyAndNeverAsksForMoreMoney() {
        JobPost j = job(EngagementModel.ONE_DAY, LocalDate.now().plusDays(1), 400, 2, 5);
        when(applications.countByJobId(1L)).thenReturn(6L);

        JobDemandDto read = service.assess(j);
        assertEquals(DemandVerdict.HEALTHY, read.verdict());
        assertNull(read.suggestedSalary());
    }

    @Test
    void aJobAlreadyPayingAboveTheLocalRateIsNotToldToPayMore() {
        // Rs 900 against a local median of Rs 700. The problem is not the price, so we do not
        // pretend it is - this is the check that stops the engine burning employers' money.
        JobPost j = job(EngagementModel.ONE_DAY, LocalDate.now().plusDays(1), 900, 2, 5);
        when(applications.countByJobId(1L)).thenReturn(0L);
        when(jobs.findComparables(any(), anyString(), any(), any(), any()))
                .thenReturn(List.of(peer(700), peer(700), peer(650), peer(720)));

        JobDemandDto read = service.assess(j);
        assertEquals(DemandVerdict.STALLED, read.verdict());
        assertEquals(700.0, read.marketMedianSalary());
        assertNull(read.suggestedSalary(), "already above the local rate - raising it is not the fix");
    }

    // ---------------------------------------------------------------- the suggestion

    @Test
    void anUnderpricedStalledJobIsAdvisedTheLocalRate() {
        JobPost j = job(EngagementModel.ONE_DAY, LocalDate.now().plusDays(1), 400, 2, 5);
        when(applications.countByJobId(1L)).thenReturn(0L);
        when(jobs.findComparables(any(), anyString(), any(), any(), any()))
                .thenReturn(List.of(peer(700), peer(700), peer(650), peer(720)));

        JobDemandDto read = service.assess(j);
        assertEquals(DemandVerdict.STALLED, read.verdict());
        assertNotNull(read.suggestedSalary());
        assertTrue(read.suggestedSalary() > 400, "the advice must actually be a raise");
        // Capped at 40% so the advice stays something a small business can act on.
        assertTrue(read.suggestedSalary() <= 560, "advised " + read.suggestedSalary() + " exceeds the cap");
        assertTrue(read.detail().contains("700"), "the employer must be told what nearby jobs pay");
    }

    @Test
    void advisedAmountsAreWrittenTheWayRupeesAreWrittenInIndia() {
        // These sentences go straight into a push notification, so "18,000" not "18000.0".
        JobPost j = job(EngagementModel.MONTHS, null, 12000, 2, 100);
        when(applications.countByJobId(1L)).thenReturn(0L);
        when(jobs.findComparables(any(), anyString(), any(), any(), any()))
                .thenReturn(List.of(monthly(18000), monthly(18000), monthly(17500), monthly(19000)));

        JobDemandDto read = service.assess(j);
        assertNotNull(read.suggestedSalary());
        assertTrue(read.detail().contains("16,800") || read.detail().contains("18,000"),
                "expected grouped rupees in: " + read.detail());
        assertFalse(read.detail().matches(".*\\d+\\.0.*"), "no raw doubles in: " + read.detail());
    }

    @Test
    void theAdvisedPriceIsAFigurePeopleActuallySayOutLoud() {
        JobPost j = job(EngagementModel.ONE_DAY, LocalDate.now().plusDays(1), 437, 2, 5);
        when(applications.countByJobId(1L)).thenReturn(0L);
        when(jobs.findComparables(any(), anyString(), any(), any(), any()))
                .thenReturn(List.of(peer(700), peer(700), peer(650), peer(720)));

        Double advised = service.assess(j).suggestedSalary();
        assertNotNull(advised);
        assertEquals(0, advised % 10, "a sub-Rs 1,000 figure must land on a round ten, got " + advised);
    }

    @Test
    void theReachFigureIsOnlyGivenWhenThereAreProfilesToCountFrom() {
        JobPost j = job(EngagementModel.ONE_DAY, LocalDate.now().plusDays(1), 400, 2, 5);
        when(applications.countByJobId(1L)).thenReturn(0L);
        when(workers.findByCityIgnoreCase("Tirupati")).thenReturn(List.of(profile(300)));

        // One profile is not a pool - reporting "1 worker" from it would be misleading.
        assertNull(service.assess(j).reachNow());
    }

    @Test
    void reachCountsTheWorkersThePayWouldActuallySuit() {
        JobPost j = job(EngagementModel.ONE_DAY, LocalDate.now().plusDays(1), 400, 2, 5);
        when(applications.countByJobId(1L)).thenReturn(0L);
        when(workers.findByCityIgnoreCase("Tirupati"))
                .thenReturn(List.of(profile(300), profile(350), profile(500), profile(900)));

        // Take-home on Rs 400 is Rs 360, so the Rs 300 and Rs 350 workers qualify.
        assertEquals(2, service.assess(j).reachNow());
    }

    private JobPost peer(double salary) {
        JobPost p = JobPost.builder().salary(salary).salaryUnit(SalaryUnit.DAILY).build();
        return p;
    }

    private JobPost monthly(double salary) {
        return JobPost.builder().salary(salary).salaryUnit(SalaryUnit.DAILY).build();
    }

    private WorkerProfile profile(double expected) {
        WorkerProfile w = new WorkerProfile();
        w.setCity("Tirupati");
        w.setExpectedSalary(expected);
        w.setSalaryUnit(SalaryUnit.DAILY);
        return w;
    }
}
