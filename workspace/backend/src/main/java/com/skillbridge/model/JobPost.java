package com.skillbridge.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "job_posts")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class JobPost {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "employer_account_id")
    private EmployerAccount employer;

    @Column(nullable = false)
    private String title;

    @Column(length = 4000)
    private String description;

    @Builder.Default
    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "job_required_skills", joinColumns = @JoinColumn(name = "job_id"))
    @Column(name = "skill")
    private List<String> requiredSkills = new ArrayList<>();

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private WorkType workType;

    /** What the worker-facing filters key on (FULL_TIME / PART_TIME / DAILY / ...). */
    @Builder.Default
    @Enumerated(EnumType.STRING)
    private EmploymentType employmentType = EmploymentType.FULL_TIME;

    private double salary;

    @Builder.Default
    @Enumerated(EnumType.STRING)
    private SalaryUnit salaryUnit = SalaryUnit.MONTHLY;

    @Column(nullable = false)
    private String city;

    private String area;

    private double latitude;

    private double longitude;

    /** Years of experience the employer expects. 0 means "freshers welcome". */
    private int minExperienceYears;

    /** Locale code the work is carried out in (en / te / hi). null means "any". */
    private String language;

    @Builder.Default
    @Column(name = "workers_needed")
    private int workersNeeded = 1;

    private boolean urgent;

    @Builder.Default
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private JobStatus status = JobStatus.OPEN;

    @Builder.Default
    @Column(nullable = false)
    private LocalDateTime postedAt = LocalDateTime.now();

    private LocalDateTime expiresAt;

    private int applicantsCount;

    // ------------------------------------------------------------------ posting wizard fields

    /** The worker type picked on step 1 of the wizard. */
    @Enumerated(EnumType.STRING)
    private WorkerCategory workerCategory;

    @Builder.Default
    @ElementCollection
    @CollectionTable(name = "job_responsibilities", joinColumns = @JoinColumn(name = "job_id"))
    @Column(name = "responsibility", length = 500)
    @OrderColumn(name = "position")
    private List<String> responsibilities = new ArrayList<>();

    /** MON / TUE / ... - the days the job actually runs. */
    @Builder.Default
    @ElementCollection
    @CollectionTable(name = "job_working_days", joinColumns = @JoinColumn(name = "job_id"))
    @Column(name = "work_day")
    @OrderColumn(name = "position")
    private List<String> workingDays = new ArrayList<>();

    @Builder.Default
    @OneToMany(mappedBy = "job", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("id asc")
    private List<JobShift> shifts = new ArrayList<>();

    // ------------------------------------------------------------------ employment rules engine

    /** The model that drives the schedule, duration, pay basis and payroll rules. */
    @Builder.Default
    @Enumerated(EnumType.STRING)
    @Column(name = "engagement_model")
    private EngagementModel engagementModel = EngagementModel.MONTHS;

    /** How the working hours are spread across a day, independent of the duration. */
    @Builder.Default
    @Enumerated(EnumType.STRING)
    @Column(name = "work_pattern")
    private WorkPattern workPattern = WorkPattern.FULL_DAY;

    /** How the employer meets the worker before hiring. */
    @Builder.Default
    @Enumerated(EnumType.STRING)
    @Column(name = "hiring_method")
    private HiringMethod hiringMethod = HiringMethod.DIRECT;

    /** ONE_DAY jobs run on exactly this date. */
    @Column(name = "work_date")
    private LocalDate workDate;

    /** For MONTHS: the fixed number of months the engagement is hired for (1-12). */
    @Column(name = "duration_months")
    private Integer durationMonths;

    /** Day-specific timings; a scheduled date falls back to {@link #shifts} without an entry. */
    @Builder.Default
    @ElementCollection
    @CollectionTable(name = "job_day_times", joinColumns = @JoinColumn(name = "job_id"))
    @OrderColumn(name = "position")
    private List<DayTime> dayTimes = new ArrayList<>();

    @Builder.Default
    @Enumerated(EnumType.STRING)
    @Column(name = "shift_arrangement")
    private ShiftArrangement shiftArrangement = ShiftArrangement.ALL_SHIFTS;

    /** The break inside each shift is unpaid unless this is set. */
    @Builder.Default
    @Column(name = "break_paid", nullable = false)
    private boolean breakPaid = false;

    @Builder.Default
    @Column(name = "overtime_expected", nullable = false)
    private boolean overtimeExpected = false;

    @Enumerated(EnumType.STRING)
    @Column(name = "overtime_pay_basis")
    private OvertimePayBasis overtimePayBasis;

    @Column(name = "overtime_rate")
    private Double overtimeRate;

    @Builder.Default
    @Enumerated(EnumType.STRING)
    @Column(name = "payroll_cycle")
    private PayrollCycle payrollCycle = PayrollCycle.MONTHLY;

    /** For MONTHLY payroll cycles: the day of the month salary falls due. */
    @Column(name = "salary_due_day_of_month")
    private Integer salaryDueDayOfMonth;

    @Builder.Default
    @Enumerated(EnumType.STRING)
    private JobDuration durationType = JobDuration.ONGOING;

    private LocalDate startDate;

    private LocalDate endDate;

    /** Structured benefits. The old free-text list is now derived from these. */
    @Builder.Default
    @OneToMany(mappedBy = "job", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("id asc")
    private List<JobBenefit> jobBenefits = new ArrayList<>();

    @Builder.Default
    @Enumerated(EnumType.STRING)
    private PaymentMode paymentMode = PaymentMode.SKILLBRIDGE;

    /** Spoken languages the work needs, e.g. ["Telugu","Hindi"]. */
    @Builder.Default
    @ElementCollection
    @CollectionTable(name = "job_languages", joinColumns = @JoinColumn(name = "job_id"))
    @Column(name = "language_name")
    @OrderColumn(name = "position")
    private List<String> languages = new ArrayList<>();

    @Builder.Default
    @Enumerated(EnumType.STRING)
    private GenderPreference genderPreference = GenderPreference.ANY;

    private Integer ageMin;

    private Integer ageMax;

    @Builder.Default
    @Enumerated(EnumType.STRING)
    private InterviewType interviewType = InterviewType.NONE;

    private LocalDate applicationDeadline;

    @Builder.Default
    @Column(nullable = false)
    private boolean autoCloseWhenFilled = true;

    /** How many times the posting has been opened by someone other than its owner. */
    @Builder.Default
    @Column(nullable = false)
    private int jobViews = 0;

    /** Read-only benefit labels, so screens built against the old List<String> keep working. */
    public List<String> getBenefits() {
        List<String> labels = new ArrayList<>();
        if (jobBenefits != null) {
            for (JobBenefit b : jobBenefits) {
                if (b.getBenefitType() != null) labels.add(b.getBenefitType().name());
            }
        }
        return labels;
    }

    /** Replaces the benefit rows in place so the orphan-removal cascade can do its job. */
    public void replaceBenefits(List<JobBenefit> replacements) {
        this.jobBenefits.clear();
        if (replacements != null) {
            for (JobBenefit b : replacements) {
                b.setJob(this);
                this.jobBenefits.add(b);
            }
        }
    }

    /** Replaces the shift list in place so the orphan-removal cascade can do its job. */
    public void replaceShifts(List<JobShift> replacements) {
        this.shifts.clear();
        if (replacements != null) {
            for (JobShift shift : replacements) {
                shift.setJob(this);
                this.shifts.add(shift);
            }
        }
    }

    // ------------------------------------------------------------------ pricing

    /**
     * The commission percentage frozen at the moment the price was set. Frozen, not looked up
     * live, so a later change to the slab table cannot silently rewrite what a worker was
     * already shown and promised.
     */
    @Column(name = "fee_percent")
    private double feePercent;

    /** The commission in rupees on {@link #salary}. */
    @Column(name = "platform_fee")
    private double platformFee;

    /** What the worker actually takes home - salary minus the commission. */
    @Column(name = "worker_salary")
    private double workerSalary;

    /** The price the job first went live at, kept so we can show "raised from ...". */
    @Column(name = "original_salary")
    private double originalSalary;

    @Column(name = "price_changed_at")
    private LocalDateTime priceChangedAt;

    @Builder.Default
    @Column(name = "price_change_count")
    private int priceChangeCount = 0;

    // ------------------------------------------------------------------ demand intelligence

    /** The most recent read on whether this job is attracting workers. */
    @Enumerated(EnumType.STRING)
    @Column(name = "demand_verdict")
    private DemandVerdict demandVerdict;

    /** The price we last advised, so we never nag twice with the same number. */
    @Column(name = "suggested_salary")
    private Double suggestedSalary;

    @Column(name = "demand_checked_at")
    private LocalDateTime demandCheckedAt;

    @Column(name = "demand_alerted_at")
    private LocalDateTime demandAlertedAt;

    /** Set once the job first receives an application, so the clock stops. */
    @Column(name = "first_applicant_at")
    private LocalDateTime firstApplicantAt;

    /** Recomputes the fee split from the current salary. The one way pricing is set. */
    public void applyPricing(double percent, double fee, double takeHome) {
        this.feePercent = percent;
        this.platformFee = fee;
        this.workerSalary = takeHome;
    }
}
