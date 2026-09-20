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
    private SalaryUnit salaryUnit = SalaryUnit.PER_MONTH;

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
    private EngagementModel engagementModel = EngagementModel.FULL_TIME;

    /** ONE_TIME jobs run on exactly this date. */
    @Column(name = "work_date")
    private LocalDate workDate;

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
}
