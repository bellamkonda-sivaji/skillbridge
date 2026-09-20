package com.skillbridge.config;

import com.skillbridge.model.*;
import com.skillbridge.repository.*;
import com.skillbridge.service.MatchingService;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;

/**
 * Seeds the Tirupati demo dataset across the three account tables. Every documented demo login
 * keeps working; the wages are in rupees and the applications are spread across the new
 * lifecycle so each worker screen has something real to render.
 */
@Component
public class DataSeeder implements CommandLineRunner {

    private final WorkerAccountRepository workerAccountRepository;
    private final EmployerAccountRepository employerAccountRepository;
    private final AdminAccountRepository adminAccountRepository;
    private final WorkerProfileRepository workerProfileRepository;
    private final EmployerProfileRepository employerProfileRepository;
    private final JobPostRepository jobRepository;
    private final JobApplicationRepository applicationRepository;
    private final JobOfferRepository offerRepository;
    private final InterviewRepository interviewRepository;
    private final EmploymentRepository employmentRepository;
    private final AttendanceRepository attendanceRepository;
    private final ReviewRepository reviewRepository;
    private final WalletRepository walletRepository;
    private final SkillRepository skillRepository;
    private final PasswordEncoder passwordEncoder;
    private final MatchingService matchingService;

    public DataSeeder(WorkerAccountRepository workerAccountRepository,
                      EmployerAccountRepository employerAccountRepository,
                      AdminAccountRepository adminAccountRepository,
                      WorkerProfileRepository workerProfileRepository,
                      EmployerProfileRepository employerProfileRepository,
                      JobPostRepository jobRepository, JobApplicationRepository applicationRepository,
                      JobOfferRepository offerRepository, InterviewRepository interviewRepository,
                      ReviewRepository reviewRepository, WalletRepository walletRepository,
                      SkillRepository skillRepository, PasswordEncoder passwordEncoder,
                      MatchingService matchingService,
                      EmploymentRepository employmentRepository,
                      AttendanceRepository attendanceRepository) {
        this.workerAccountRepository = workerAccountRepository;
        this.employerAccountRepository = employerAccountRepository;
        this.adminAccountRepository = adminAccountRepository;
        this.workerProfileRepository = workerProfileRepository;
        this.employerProfileRepository = employerProfileRepository;
        this.jobRepository = jobRepository;
        this.applicationRepository = applicationRepository;
        this.offerRepository = offerRepository;
        this.interviewRepository = interviewRepository;
        this.reviewRepository = reviewRepository;
        this.walletRepository = walletRepository;
        this.skillRepository = skillRepository;
        this.passwordEncoder = passwordEncoder;
        this.matchingService = matchingService;
        this.employmentRepository = employmentRepository;
        this.attendanceRepository = attendanceRepository;
    }

    @Override
    @Transactional
    public void run(String... args) {
        if (workerAccountRepository.count() > 0 || employerAccountRepository.count() > 0) {
            return;
        }
        seed();
    }

    // Tirupati, Andhra Pradesh. The worker profiles all sit inside a few km of the centre so the
    // NEARBY quick filter and the distance figures on every card are real.
    private static final String CITY = "Tirupati";
    /** Worker profiles carry the region here; employer profiles carry the locality. */
    private static final String REGION = "AP";

    private void seed() {
        // ---------------------------------------------------------------- admin
        AdminAccount admin = adminAccountRepository.save(AdminAccount.builder()
                .name("Admin")
                .email("admin@skillbridge.com")
                .phone("9000000001")
                .password(passwordEncoder.encode("admin123"))
                .enabled(true)
                .build());

        // ---------------------------------------------------------------- employers (9000000002-06)
        EmployerAccount safiri = employer("James Otieno", "james@safiriconstruction.com", "9000000002");
        EmployerProfile safiriProfile = profile(safiri, "Safiri Constructions", "Construction",
                "Civil construction and interior finishing across the Tirupati temple belt.",
                "Korlagunta", 13.6360, 79.4170, "www.safiriconstruction.com",
                2012, "50 - 200 employees", true,
                "51 - 200 employees", "12-4-118, Korlagunta Main Road, Tirupati", "517501",
                EmployerPlan.BUSINESS);

        EmployerAccount bloom = employer("Amina Yusuf", "amina@bloomrestaurants.com", "9000000003");
        EmployerProfile bloomProfile = profile(bloom, "Bloom Restaurants", "Hospitality",
                "Vegetarian restaurant chain serving pilgrims near Leela Mahal circle.",
                "Leela Mahal", 13.6420, 79.4180, "www.bloomrestaurants.com",
                2016, "10 - 50 employees", true,
                "10 - 50 employees", "3-2-40, Leela Mahal Circle, Tirupati", "517501",
                EmployerPlan.GROWTH);

        EmployerAccount freshMart = employer("Venkatesh Reddy", "contact@freshmart.in", "9000000004");
        EmployerProfile freshMartProfile = profile(freshMart, "Fresh Mart Supermarket", "Retail / Supermarket",
                "Neighbourhood supermarket on Gandhi Road stocking groceries and fresh produce.",
                "Gandhi Road", 13.6288, 79.4192, "www.freshmart.in",
                2018, "10 - 50 employees", true,
                "10 - 50 employees", "8-1-22, Gandhi Road, Tirupati", "517501",
                EmployerPlan.GROWTH);

        EmployerAccount logistics = employer("Lakshmi Devi", "hr@srinivasalogistics.in", "9000000005");
        EmployerProfile logisticsProfile = profile(logistics, "Srinivasa Logistics", "Logistics & Warehousing",
                "Warehousing and last-mile delivery out of the Renigunta hub.",
                "Renigunta", 13.6400, 79.5120, "www.srinivasalogistics.in",
                2009, "200 - 500 employees", true,
                "200+ employees", "Plot 14, Renigunta Industrial Hub, Tirupati", "517520",
                EmployerPlan.BUSINESS);

        EmployerAccount homeServices = employer("Ramesh Naidu", "care@tirumalahomeservices.in", "9000000006");
        EmployerProfile homeServicesProfile = profile(homeServices, "Tirumala Home Services", "Home Services",
                "On-call electricians, plumbers and housekeeping staff for homes and apartments.",
                "Air Bypass Road", 13.6330, 79.4050, "www.tirumalahomeservices.in",
                2020, "10 - 50 employees", false,
                "1 - 9 employees", "5-6-18, Air Bypass Road, Tirupati", "517502",
                EmployerPlan.STARTER);

        // ---------------------------------------------------------------- workers (9000000007-16)
        WorkerAccount john = worker("John Kamau", "john.kamau@mail.com", "9000000007",
                List.of("Carpentry", "Cabinet Making", "Tiling"), 6, "Carpenter",
                "Finishing carpenter for doors, cabinets and temple guest-house interiors.",
                13.6360, 79.4170, Availability.FULL_TIME, 800, SalaryUnit.PER_DAY,
                VerificationStatus.VERIFIED, List.of(EmploymentType.FULL_TIME, EmploymentType.DAILY));

        WorkerAccount mary = worker("Mary Wanjiru", "mary.wanjiru@mail.com", "9000000008",
                List.of("Cleaning", "Housekeeping", "Laundry"), 3, "Housekeeping Staff",
                "Reliable housekeeping for homes, lodges and offices around Tirupati.",
                13.6420, 79.4280, Availability.IMMEDIATE, 550, SalaryUnit.PER_DAY,
                VerificationStatus.VERIFIED, List.of(EmploymentType.PART_TIME, EmploymentType.DAILY));

        WorkerAccount lakshmiS = worker("Lakshmi Sridevi", "lakshmi.sridevi@mail.com", "9000000009",
                List.of("Retail", "Sales", "Cashier", "Packing"), 2, "Store Helper",
                "Retail floor and billing counter experience at a grocery chain.",
                13.6288, 79.4192, Availability.FULL_TIME, 700, SalaryUnit.PER_DAY,
                VerificationStatus.PENDING, List.of(EmploymentType.FULL_TIME));

        WorkerAccount suresh = worker("Suresh Babu", "suresh.babu@mail.com", "9000000010",
                List.of("Welding", "Metal Fabrication", "Grinding"), 8, "Welder / Fabricator",
                "Certified welder for gates, railings and structural steel work.",
                13.6100, 79.4450, Availability.FULL_TIME, 950, SalaryUnit.PER_DAY,
                VerificationStatus.VERIFIED, List.of(EmploymentType.FULL_TIME, EmploymentType.MONTHLY));

        WorkerAccount anitha = worker("Anitha Rani", "anitha.rani@mail.com", "9000000011",
                List.of("Cooking", "Kitchen", "Waiter"), 4, "Cook / Kitchen Helper",
                "South Indian tiffin and meals cook, used to high-volume pilgrim kitchens.",
                13.6420, 79.4180, Availability.PART_TIME, 650, SalaryUnit.PER_DAY,
                VerificationStatus.UNVERIFIED, List.of(EmploymentType.PART_TIME, EmploymentType.DAILY));

        WorkerAccount ravi = worker("Ravi Kumar", "ravi.kumar@mail.com", "9000000012",
                List.of("Driving", "Delivery", "Taxi"), 5, "Driver / Delivery Rider",
                "LMV licence holder, knows every route between Tirupati and Renigunta.",
                13.6400, 79.5120, Availability.IMMEDIATE, 22000, SalaryUnit.PER_MONTH,
                VerificationStatus.VERIFIED, List.of(EmploymentType.FULL_TIME, EmploymentType.PERMANENT));

        WorkerAccount david = worker("David Kiprop", "david.kiprop@mail.com", "9000000013",
                List.of("Electrical Wiring", "Electrical Work", "Solar Installation"), 5, "Electrician",
                "Licensed electrician for apartment wiring, repairs and solar installs.",
                13.6330, 79.4050, Availability.FULL_TIME, 900, SalaryUnit.PER_DAY,
                VerificationStatus.VERIFIED, List.of(EmploymentType.FULL_TIME, EmploymentType.DAILY));

        WorkerAccount padma = worker("Padma Latha", "padma.latha@mail.com", "9000000014",
                List.of("Tailoring", "Sewing", "Stitching"), 2, "Tailor",
                "Blouse stitching, alterations and uniform orders.",
                13.6230, 79.4340, Availability.WEEKENDS_ONLY, 450, SalaryUnit.PER_DAY,
                VerificationStatus.PENDING, List.of(EmploymentType.PART_TIME));

        WorkerAccount murali = worker("Murali Krishna", "murali.krishna@mail.com", "9000000015",
                List.of("Plumbing", "Pipe Fitting", "Bathroom Fitting"), 7, "Plumber",
                "Plumbing repairs, fittings and renovation work. Fast and tidy.",
                13.6230, 79.4340, Availability.FULL_TIME, 850, SalaryUnit.PER_DAY,
                VerificationStatus.VERIFIED, List.of(EmploymentType.FULL_TIME, EmploymentType.MONTHLY));

        WorkerAccount divya = worker("Divya Sree", "divya.sree@mail.com", "9000000016",
                List.of("Data Entry", "Typing", "Office Assistant"), 2, "Data Entry Operator",
                "Fast typist, comfortable with spreadsheets and billing software.",
                13.6288, 79.4192, Availability.IMMEDIATE, 16000, SalaryUnit.PER_MONTH,
                VerificationStatus.PENDING, List.of(EmploymentType.FULL_TIME));

        // ---------------------------------------------------------------- worker demographics
        // Age, gender, languages and history: everything the employer-facing worker card,
        // profile and compare screens render.
        demographics(john, Gender.MALE, 34, List.of("Telugu", "Hindi"),
                exp("Finishing Carpenter", "Sri Balaji Interiors", 4),
                exp("Carpenter", "Independent contractor", 2));
        demographics(mary, Gender.FEMALE, 29, List.of("Telugu", "English"),
                exp("Housekeeping Staff", "Hotel Bhimas Deluxe", 2),
                exp("House Cleaner", "Private households", 1));
        demographics(lakshmiS, Gender.FEMALE, 26, List.of("Telugu", "English"),
                exp("Store Helper", "More Supermarket", 2));
        demographics(suresh, Gender.MALE, 41, List.of("Telugu", "Hindi"),
                exp("Welder / Fabricator", "Tirumala Steel Works", 5),
                exp("Helper", "Local fabrication shop", 3));
        demographics(anitha, Gender.FEMALE, 33, List.of("Telugu", "Tamil"),
                exp("Cook", "Sri Krishna Tiffins", 3),
                exp("Kitchen Helper", "Annapurna Mess", 1));
        demographics(ravi, Gender.MALE, 31, List.of("Telugu", "Hindi", "English"),
                exp("Delivery Driver", "Srinivasa Logistics", 3),
                exp("Taxi Driver", "Tirupati Cabs", 2));
        demographics(david, Gender.MALE, 36, List.of("Telugu", "English"),
                exp("Electrician", "Tirumala Home Services", 3),
                exp("Wiring Assistant", "SR Electricals", 2));
        demographics(padma, Gender.FEMALE, 28, List.of("Telugu"),
                exp("Tailor", "Padmavathi Tailors", 2));
        demographics(murali, Gender.MALE, 39, List.of("Telugu", "Hindi"),
                exp("Plumber", "Independent contractor", 5),
                exp("Pipe Fitter", "Sai Plumbing Works", 2));
        demographics(divya, Gender.FEMALE, 24, List.of("Telugu", "English"),
                exp("Data Entry Operator", "Fresh Mart Supermarket", 2));

        // ---------------------------------------------------------------- jobs
        JobPost carpenterJob = job(safiri, "Skilled Carpenter for guest house interiors",
                "Doors, wardrobes and shelving for a 40-room pilgrim guest house. Around five weeks of work.",
                List.of("Carpentry", "Cabinet Making"), WorkType.WEEKLY, EmploymentType.FULL_TIME,
                800, SalaryUnit.PER_DAY, "Korlagunta", 13.6360, 79.4170, 3, true, 2, "te");

        JobPost kitchenJob = job(bloom, "Kitchen Helper / Cook",
                "Tiffin and meals counter. Uniform and two meals provided. Daily shifts from 6am.",
                List.of("Cooking", "Kitchen"), WorkType.DAILY, EmploymentType.DAILY,
                650, SalaryUnit.PER_DAY, "Leela Mahal", 13.6420, 79.4180, 4, true, 0, "te");

        JobPost storeHelperJob = job(freshMart, "Store Helper",
                "Stocking shelves, handling deliveries and helping customers on the floor.",
                List.of("Retail", "Packing", "Sales"), WorkType.DAILY, EmploymentType.FULL_TIME,
                700, SalaryUnit.PER_DAY, "Gandhi Road", 13.6288, 79.4192, 3, true, 0, "te");

        JobPost cashierJob = job(freshMart, "Cashier (evening shift)",
                "Billing counter from 4pm to 10pm. Training on the billing software provided.",
                List.of("Cashier", "Billing", "Retail"), WorkType.DAILY, EmploymentType.PART_TIME,
                450, SalaryUnit.PER_DAY, "Gandhi Road", 13.6288, 79.4192, 2, false, 1, "en");

        JobPost loadingJob = job(logistics, "Loading and packing staff",
                "Warehouse loading, packing and inventory support at the Renigunta hub.",
                List.of("Packing", "Loading", "Warehouse"), WorkType.MONTHLY, EmploymentType.FULL_TIME,
                18000, SalaryUnit.PER_MONTH, "Renigunta", 13.6400, 79.5120, 5, false, 0, "te");

        JobPost driverJob = job(logistics, "Delivery driver (permanent)",
                "Last-mile delivery across Tirupati and Chittoor. Salary plus fuel allowance.",
                List.of("Driving", "Delivery"), WorkType.PERMANENT, EmploymentType.PERMANENT,
                22000, SalaryUnit.PER_MONTH, "Renigunta", 13.6400, 79.5120, 4, true, 2, "te");

        JobPost electricianJob = job(homeServices, "Electrician for apartment wiring",
                "Wiring, fixture fitting and testing for a new 24-flat apartment block.",
                List.of("Electrical Wiring", "Electrical Work"), WorkType.DAILY, EmploymentType.DAILY,
                900, SalaryUnit.PER_DAY, "Air Bypass Road", 13.6330, 79.4050, 2, false, 3, "te");

        JobPost plumberJob = job(homeServices, "Plumber for bathroom fittings",
                "Two bathrooms: pipe fitting, fixture installation and leak repairs.",
                List.of("Plumbing", "Pipe Fitting"), WorkType.MONTHLY, EmploymentType.FULL_TIME,
                850, SalaryUnit.PER_DAY, "Padmavathi Nagar", 13.6230, 79.4340, 1, false, 2, "te");

        JobPost welderJob = job(safiri, "Welder for gates and railings",
                "Fabricate and install steel gates and balcony railings at an ongoing site.",
                List.of("Welding", "Metal Fabrication"), WorkType.MONTHLY, EmploymentType.FULL_TIME,
                950, SalaryUnit.PER_DAY, "Tiruchanoor", 13.6100, 79.4450, 2, false, 3, "te");

        JobPost waiterJob = job(bloom, "Weekend server / waiter",
                "Saturday and Sunday shifts at the Leela Mahal branch. Training provided.",
                List.of("Waiter", "Restaurant Service"), WorkType.WEEKLY, EmploymentType.PART_TIME,
                500, SalaryUnit.PER_DAY, "Leela Mahal", 13.6420, 79.4180, 3, false, 0, "te");

        JobPost cleaningJob = job(homeServices, "House cleaning staff",
                "Daily cleaning rounds for apartments in MR Palli. Morning slots only.",
                List.of("Cleaning", "Housekeeping"), WorkType.DAILY, EmploymentType.PART_TIME,
                550, SalaryUnit.PER_DAY, "MR Palli", 13.6420, 79.4280, 3, false, 0, "te");

        JobPost dataEntryJob = job(freshMart, "Data entry operator",
                "Stock and billing data entry. Comfortable with spreadsheets required.",
                List.of("Data Entry", "Typing"), WorkType.MONTHLY, EmploymentType.FULL_TIME,
                16000, SalaryUnit.PER_MONTH, "Gandhi Road", 13.6288, 79.4192, 1, false, 1, "en");

        // Safiri Constructions (the employer demo login, 9000000002) carries the full spread of
        // statuses so every tab of the employer job list has something in it.
        JobPost siteHelperJob = job(safiri, "Site helper / loading staff",
                "General site support: moving material, mixing, clearing and helping the fitters.",
                List.of("Loading", "Packing", "Cleaning"), WorkType.DAILY, EmploymentType.DAILY,
                600, SalaryUnit.PER_DAY, "Korlagunta", 13.6360, 79.4170, 4, true, 0, "te");

        JobPost securityJob = job(safiri, "Night security guard for site",
                "Overnight watch at the Korlagunta site. Cabin, fan and tea provided.",
                List.of("Security"), WorkType.MONTHLY, EmploymentType.FULL_TIME,
                17000, SalaryUnit.PER_MONTH, "Korlagunta", 13.6360, 79.4170, 2, false, 1, "te");

        JobPost sweepingJob = job(safiri, "Site cleaning crew",
                "Daily clearing and washing down of finished floors before handover.",
                List.of("Cleaning", "Housekeeping"), WorkType.DAILY, EmploymentType.PART_TIME,
                500, SalaryUnit.PER_DAY, "Korlagunta", 13.6360, 79.4170, 2, false, 0, "te");

        JobPost materialDriverJob = job(safiri, "Material delivery driver (draft)",
                "Moving cement, steel and tools between the yard and the three live sites.",
                List.of("Driving", "Delivery"), WorkType.MONTHLY, EmploymentType.FULL_TIME,
                19000, SalaryUnit.PER_MONTH, "Korlagunta", 13.6360, 79.4170, 1, false, 2, "te");

        // A short DAILY engagement whose fixed range holds exactly ten working days: the
        // payroll demo hangs off it (ten scheduled, nine attended, paid for nine).
        LocalDate payrollEnd = LocalDate.now().with(DayOfWeek.FRIDAY).minusWeeks(1);
        LocalDate payrollStart = payrollEnd.minusDays(11);
        JobPost inventoryJob = job(freshMart, "Inventory count support (two weeks)",
                "A two-week stock count across both branches. Fixed weekday schedule.",
                List.of("Retail", "Data Entry", "Packing"), WorkType.DAILY, EmploymentType.DAILY,
                700, SalaryUnit.PER_DAY, "Gandhi Road", 13.6288, 79.4192, 2, false, 0, "te");

        // ---------------------------------------------------------------- employment rules engine
        // Every engagement model appears at least once, each with a schedule and a pay basis
        // its model actually allows.
        model(plumberJob, EngagementModel.ONE_TIME, SalaryUnit.PER_SHIFT, 1200,
                LocalDate.now().plusDays(4), null, null);
        model(kitchenJob, EngagementModel.DAILY, SalaryUnit.PER_DAY, 650, null,
                LocalDate.now().minusDays(2), LocalDate.now().plusDays(12));
        model(electricianJob, EngagementModel.DAILY, SalaryUnit.PER_DAY, 900, null,
                LocalDate.now().plusDays(3), LocalDate.now().plusDays(24));
        model(siteHelperJob, EngagementModel.DAILY, SalaryUnit.PER_DAY, 600, null,
                LocalDate.now().minusDays(1), LocalDate.now().plusDays(20));
        model(inventoryJob, EngagementModel.DAILY, SalaryUnit.PER_DAY, 700, null,
                payrollStart, payrollEnd);
        model(carpenterJob, EngagementModel.TEMPORARY, SalaryUnit.PER_DAY, 800, null,
                LocalDate.now().plusDays(2), LocalDate.now().plusDays(37));
        model(welderJob, EngagementModel.TEMPORARY, SalaryUnit.PER_DAY, 950, null,
                LocalDate.now().minusDays(20), LocalDate.now().plusDays(40));
        model(cashierJob, EngagementModel.PART_TIME, SalaryUnit.PER_HOUR, 90, null, null, null);
        model(waiterJob, EngagementModel.PART_TIME, SalaryUnit.PER_DAY, 500, null, null, null);
        model(cleaningJob, EngagementModel.PART_TIME, SalaryUnit.PER_HOUR, 110, null, null, null);
        model(sweepingJob, EngagementModel.PART_TIME, SalaryUnit.PER_DAY, 500, null, null, null);
        model(storeHelperJob, EngagementModel.FULL_TIME, SalaryUnit.PER_DAY, 700, null, null, null);
        model(loadingJob, EngagementModel.FULL_TIME, SalaryUnit.PER_MONTH, 18000, null, null, null);
        model(securityJob, EngagementModel.FULL_TIME, SalaryUnit.PER_MONTH, 17000, null, null, null);
        model(dataEntryJob, EngagementModel.FULL_TIME, SalaryUnit.PER_MONTH, 16000, null, null, null);
        model(materialDriverJob, EngagementModel.FULL_TIME, SalaryUnit.PER_MONTH, 19000, null, null, null);
        model(driverJob, EngagementModel.PERMANENT, SalaryUnit.PER_MONTH, 22000, null, null, null);

        // ---------------------------------------------------------------- posting-wizard detail
        enrich(carpenterJob, WorkerCategory.OTHER, JobStatus.OPEN, 142,
                List.of("Fit doors and wardrobes", "Build shelving units", "Finish and sand surfaces",
                        "Keep the work area tidy"),
                SIX_DAYS, List.of("MEALS", "TRAVEL"), List.of("Telugu", "Hindi"),
                InterviewType.IN_PERSON, 12, "Day shift|08:00|17:00");
        enrich(welderJob, WorkerCategory.OTHER, JobStatus.OPEN, 96,
                List.of("Fabricate gates and railings", "Install on site", "Maintain the welding kit"),
                SIX_DAYS, List.of("MEALS", "BONUS"), List.of("Telugu"),
                InterviewType.SKILL_TEST, 18, "Day shift|09:00|18:00|13:00|13:30");
        enrich(siteHelperJob, WorkerCategory.STORE_HELPER, JobStatus.OPEN, 211,
                List.of("Move material around the site", "Mix and carry mortar",
                        "Clear debris at the end of the day", "Assist the fitters"),
                SIX_DAYS, List.of("MEALS", "TRAVEL", "BONUS"), List.of("Telugu", "Hindi"),
                InterviewType.PHONE, 9, "Morning|07:00|12:00", "Afternoon|13:00|18:00");
        enrich(securityJob, WorkerCategory.SECURITY, JobStatus.PAUSED, 64,
                List.of("Monitor entry and exit", "Maintain the visitor register",
                        "Patrol the premises hourly", "Report incidents to the site engineer"),
                ALL_DAYS, List.of("MEALS"), List.of("Telugu"),
                InterviewType.IN_PERSON, 20, "Night shift|20:00|06:00");
        enrich(sweepingJob, WorkerCategory.CLEANING_STAFF, JobStatus.FILLED, 178,
                List.of("Clean finished floors", "Wash down and dust", "Dispose of waste safely"),
                WEEKDAYS, List.of("MEALS"), List.of("Telugu"),
                InterviewType.NONE, 2, "Morning|06:00|10:00");
        enrich(materialDriverJob, WorkerCategory.DRIVER, JobStatus.DRAFT, 0,
                List.of("Drive safely and on time", "Keep trip records", "Assist with loading"),
                SIX_DAYS, List.of("TRAVEL", "BONUS"), List.of("Telugu", "Hindi"),
                InterviewType.IN_PERSON, 30, "Day shift|08:00|18:00");

        // The other businesses get the same treatment so their screens are not bare either.
        enrich(kitchenJob, WorkerCategory.KITCHEN_STAFF, JobStatus.OPEN, 88,
                List.of("Prepare tiffin items", "Maintain kitchen hygiene", "Support the head cook"),
                ALL_DAYS, List.of("MEALS"), List.of("Telugu"), InterviewType.IN_PERSON, 10,
                "Morning|06:00|11:00", "Evening|17:00|21:00");
        enrich(storeHelperJob, WorkerCategory.STORE_HELPER, JobStatus.OPEN, 134,
                List.of("Arrange items on shelves", "Assist customers", "Support the billing area"),
                SIX_DAYS, List.of("MEALS", "BONUS"), List.of("Telugu", "English"),
                InterviewType.PHONE, 14, "Day shift|09:00|18:00");
        enrich(cashierJob, WorkerCategory.CASHIER, JobStatus.OPEN, 71,
                List.of("Handle billing and cash", "Operate the POS machine", "Reconcile daily sales"),
                SIX_DAYS, List.of("MEALS"), List.of("Telugu", "English"),
                InterviewType.SKILL_TEST, 16, "Evening|16:00|22:00");
        enrich(loadingJob, WorkerCategory.OTHER, JobStatus.OPEN, 57,
                List.of("Load and unload vehicles", "Pack and label consignments", "Support stock counts"),
                SIX_DAYS, List.of("MEALS", "TRAVEL"), List.of("Telugu"),
                InterviewType.NONE, 21, "Day shift|09:00|18:00");
        enrich(driverJob, WorkerCategory.DELIVERY_PARTNER, JobStatus.OPEN, 163,
                List.of("Deliver consignments on time", "Maintain the vehicle", "Update delivery status"),
                SIX_DAYS, List.of("TRAVEL", "BONUS"), List.of("Telugu", "Hindi"),
                InterviewType.IN_PERSON, 11, "Day shift|08:00|17:00");
        enrich(electricianJob, WorkerCategory.OTHER, JobStatus.OPEN, 49,
                List.of("Run wiring for the block", "Fit and test fixtures", "Certify each flat"),
                WEEKDAYS, List.of("TRAVEL"), List.of("Telugu"), InterviewType.SKILL_TEST, 13,
                "Day shift|09:00|18:00");
        enrich(plumberJob, WorkerCategory.OTHER, JobStatus.OPEN, 38,
                List.of("Fit pipes and fixtures", "Repair leaks", "Test the finished bathrooms"),
                WEEKDAYS, List.of("MEALS"), List.of("Telugu"), InterviewType.PHONE, 15,
                "Day shift|09:00|17:00");
        enrich(waiterJob, WorkerCategory.SERVICE_STAFF, JobStatus.OPEN, 44,
                List.of("Take customer orders", "Serve food and beverages", "Keep tables clean"),
                List.of("SAT", "SUN"), List.of("MEALS"), List.of("Telugu", "English"),
                InterviewType.IN_PERSON, 17, "Weekend shift|11:00|22:00");
        enrich(cleaningJob, WorkerCategory.CLEANING_STAFF, JobStatus.OPEN, 66,
                List.of("Clean assigned flats", "Manage cleaning supplies", "Dispose of waste safely"),
                SIX_DAYS, List.of("TRAVEL"), List.of("Telugu"), InterviewType.NONE, 19,
                "Morning|06:00|11:00");
        enrich(inventoryJob, WorkerCategory.STORE_HELPER, JobStatus.OPEN, 33,
                List.of("Count and record stock", "Reconcile against the system", "Flag damaged goods"),
                WEEKDAYS, List.of("MEALS", "TRAVEL"), List.of("Telugu", "English"),
                InterviewType.NONE, 5, "Day shift|09:00|18:00|13:00|13:30");
        enrich(dataEntryJob, WorkerCategory.OTHER, JobStatus.OPEN, 29,
                List.of("Enter stock and billing data", "Reconcile daily sheets", "File the paperwork"),
                WEEKDAYS, List.of("MEALS"), List.of("English", "Telugu"),
                InterviewType.SKILL_TEST, 25, "Day shift|10:00|18:00");

        // ---------------------------------------------------------------- applications
        // John's applications deliberately cover every state the new timeline can render.
        JobApplication johnCarpenter = application(john, carpenterJob, ApplicationStatus.INTERVIEW_SCHEDULED, 5,
                "6 years of finishing carpentry, available immediately.");
        JobApplication johnStoreHelper = application(john, storeHelperJob, ApplicationStatus.OFFERED, 6,
                "Happy to take on store floor work between carpentry contracts.");
        application(john, loadingJob, ApplicationStatus.APPLIED, 1,
                "Available for warehouse work on weekends.");
        JobApplication johnWelder = application(john, welderJob, ApplicationStatus.ACCEPTED, 30,
                "I have done gate fitting alongside carpentry work.");
        application(john, siteHelperJob, ApplicationStatus.SHORTLISTED, 4,
                "Happy to take site support shifts between contracts.");
        application(john, dataEntryJob, ApplicationStatus.REJECTED, 8,
                "Basic computer knowledge, willing to learn.");

        application(ravi, driverJob, ApplicationStatus.APPLIED, 2, "LMV licence, 5 years on this route.");
        application(anitha, kitchenJob, ApplicationStatus.SHORTLISTED, 3, "Tiffin and meals experience.");
        application(david, electricianJob, ApplicationStatus.VIEWED, 3, "Licensed electrician, 5 years.");
        application(mary, cleaningJob, ApplicationStatus.APPLIED, 1, "Available for morning slots.");
        application(lakshmiS, storeHelperJob, ApplicationStatus.VIEWED, 2, "Two years on a grocery floor.");

        // Safiri Constructions carries the employer demo load: fourteen applications spread over
        // every status the applicants screen filters on, including two completed hires.
        application(murali, carpenterJob, ApplicationStatus.APPLIED, 1,
                "Plumbing is my trade but I have done site carpentry too.");
        JobApplication sureshWelder = application(suresh, welderJob, ApplicationStatus.INTERVIEW_SCHEDULED, 4,
                "Certified welder, 8 years on gates and structural steel.");
        application(david, carpenterJob, ApplicationStatus.REJECTED, 7,
                "Available between wiring contracts.");
        application(mary, siteHelperJob, ApplicationStatus.APPLIED, 1, "Available from tomorrow.");
        JobApplication padmaSiteHelper = application(padma, siteHelperJob, ApplicationStatus.SHORTLISTED, 3,
                "Happy to do site support work on weekdays.");
        application(lakshmiS, siteHelperJob, ApplicationStatus.APPLIED, 2, "Used to stock and loading work.");
        application(divya, siteHelperJob, ApplicationStatus.REJECTED, 6, "Looking for any daily work.");
        application(ravi, securityJob, ApplicationStatus.APPLIED, 2, "Can take the night shift.");
        JobApplication anithaSecurity = application(anitha, securityJob, ApplicationStatus.SHORTLISTED, 5,
                "Looking for a steady monthly position.");
        application(mary, sweepingJob, ApplicationStatus.ACCEPTED, 20, "Morning cleaning suits me.");
        application(padma, sweepingJob, ApplicationStatus.ACCEPTED, 19, "I can start immediately.");
        application(divya, sweepingJob, ApplicationStatus.REJECTED, 18, "Available for morning shifts.");

        // One PENDING offer so the offers screen has something to accept.
        offerRepository.save(JobOffer.builder()
                .application(johnStoreHelper)
                .salary(storeHelperJob.getSalary())
                .salaryUnit(storeHelperJob.getSalaryUnit())
                .employmentType(storeHelperJob.getEmploymentType())
                .joiningDate(LocalDate.now().plusDays(5))
                .workLocation("Gandhi Road, Tirupati")
                .status(OfferStatus.PENDING)
                .sentAt(LocalDateTime.now().minusDays(1))
                .build());

        // John's accepted hire: the ACTIVE employment every joining / shift / attendance screen reads.
        JobOffer johnWelderOffer = offerRepository.save(JobOffer.builder()
                .application(johnWelder)
                .salary(welderJob.getSalary())
                .salaryUnit(welderJob.getSalaryUnit())
                .employmentType(welderJob.getEmploymentType())
                .joiningDate(LocalDate.now().minusDays(20))
                .workLocation("Safiri Constructions yard, Korlagunta Main Road, Tirupati")
                .status(OfferStatus.ACCEPTED)
                .sentAt(LocalDateTime.now().minusDays(26))
                .respondedAt(LocalDateTime.now().minusDays(25))
                .build());
        Employment johnEmployment = employmentRepository.save(Employment.builder()
                .worker(john).employer(safiri).job(welderJob)
                .application(johnWelder).offer(johnWelderOffer)
                .joiningDate(LocalDate.now().minusDays(20))
                .reportingTime(LocalTime.of(9, 0))
                .status(EmploymentStatus.ACTIVE)
                .salary(welderJob.getSalary())
                .salaryUnit(welderJob.getSalaryUnit())
                .employmentType(welderJob.getEmploymentType())
                .workLocation("Safiri Constructions yard, 12-4-118 Korlagunta Main Road, Tirupati 517501")
                .contactPersonName("James Otieno")
                .contactPersonPhone("9000000002")
                .dressCode("Full-sleeve shirt, safety shoes and helmet. Gloves provided on site.")
                .documentsToCarry(new ArrayList<>(List.of("Aadhaar card", "Bank passbook",
                        "Two passport-size photos", "Welding certificate")))
                .startedAt(LocalDateTime.now().minusDays(20).withHour(9).withMinute(2))
                .createdAt(LocalDateTime.now().minusDays(25))
                .build());
        seedAttendance(johnEmployment);

        // The payroll demo: ten scheduled days on the inventory job, nine of them attended.
        Employment payrollEmployment = employmentRepository.save(Employment.builder()
                .worker(mary).employer(freshMart).job(inventoryJob)
                .joiningDate(payrollStart)
                .reportingTime(LocalTime.of(9, 0))
                .status(EmploymentStatus.ACTIVE)
                .salary(700)
                .salaryUnit(SalaryUnit.PER_DAY)
                .employmentType(EmploymentType.DAILY)
                .workLocation("FreshMart, Gandhi Road, Tirupati")
                .contactPersonName("Priya Sharma")
                .contactPersonPhone("9000000004")
                .documentsToCarry(new ArrayList<>(List.of("Aadhaar card", "Bank passbook")))
                .startedAt(payrollStart.atTime(9, 0))
                .createdAt(payrollStart.minusDays(3).atStartOfDay())
                .build());
        seedTenOfWhichNineAttended(payrollEmployment, payrollStart, payrollEnd);

        // A finished engagement, so the PAST tab of the employments screen is never empty.
        employmentRepository.save(Employment.builder()
                .worker(john).employer(logistics).job(loadingJob)
                .joiningDate(LocalDate.now().minusMonths(8))
                .reportingTime(LocalTime.of(8, 0))
                .status(EmploymentStatus.COMPLETED)
                .salary(loadingJob.getSalary())
                .salaryUnit(loadingJob.getSalaryUnit())
                .employmentType(loadingJob.getEmploymentType())
                .workLocation("Tirupati Logistics warehouse, Renigunta Road, Tirupati")
                .contactPersonName("Lakshmi Devi")
                .contactPersonPhone("9000000005")
                .dressCode("Closed shoes and a company vest.")
                .documentsToCarry(new ArrayList<>(List.of("Aadhaar card", "Bank passbook")))
                .joiningAcknowledgedAt(LocalDateTime.now().minusMonths(8).minusDays(1))
                .startedAt(LocalDateTime.now().minusMonths(8))
                .endedAt(LocalDateTime.now().minusMonths(5))
                .createdAt(LocalDateTime.now().minusMonths(8).minusDays(2))
                .build());

        // ---------------------------------------------------------------- interviews
        // All four Safiri interviews sit inside the CURRENT week so the employer calendar and the
        // "interviews this week" counter always have something real to show.
        interviewRepository.save(Interview.builder()
                .employer(safiri).worker(john).job(carpenterJob)
                .scheduledAt(soon(2, 10, 30))
                .durationMinutes(45)
                .mode(InterviewMode.IN_PERSON)
                .location("Safiri Constructions site office, Korlagunta")
                .interviewerName("James Otieno")
                .interviewerRole("Site Manager")
                .interviewerPhone("9000000002")
                .addressLine("12-4-118, Korlagunta Main Road, Tirupati 517501")
                .latitude(13.6360).longitude(79.4170)
                .notes("Bring a photo of previous cabinet work.")
                .status(InterviewStatus.CONFIRMED)
                .build());
        // The past one, so the worker interviews screen has both halves of the split.
        interviewRepository.save(Interview.builder()
                .employer(safiri).worker(john).job(welderJob)
                .scheduledAt(LocalDateTime.now().minusDays(24).withHour(11).withMinute(0)
                        .withSecond(0).withNano(0))
                .durationMinutes(30)
                .mode(InterviewMode.IN_PERSON)
                .location("Safiri Constructions yard, Korlagunta")
                .interviewerName("James Otieno")
                .interviewerRole("Site Manager")
                .interviewerPhone("9000000002")
                .addressLine("12-4-118, Korlagunta Main Road, Tirupati 517501")
                .latitude(13.6360).longitude(79.4170)
                .notes("Welding trial on the railing drawings.")
                .status(InterviewStatus.COMPLETED)
                .build());
        interviewRepository.save(Interview.builder()
                .employer(safiri).worker(suresh).job(welderJob)
                .scheduledAt(thisWeek(DayOfWeek.WEDNESDAY, 14, 0))
                .durationMinutes(30)
                .mode(InterviewMode.PHONE)
                .notes("Short call about the railing drawings.")
                .status(InterviewStatus.CONFIRMED)
                .build());
        interviewRepository.save(Interview.builder()
                .employer(safiri).worker(padma).job(siteHelperJob)
                .scheduledAt(thisWeek(DayOfWeek.THURSDAY, 11, 0))
                .durationMinutes(30)
                .mode(InterviewMode.IN_PERSON)
                .location("Safiri Constructions site office, Korlagunta")
                .notes("Trial shift straight after the chat.")
                .status(InterviewStatus.PENDING)
                .build());
        interviewRepository.save(Interview.builder()
                .employer(safiri).worker(anitha).job(securityJob)
                .scheduledAt(thisWeek(DayOfWeek.FRIDAY, 16, 0))
                .durationMinutes(30)
                .mode(InterviewMode.VIDEO)
                .notes("Video call about the night shift.")
                .status(InterviewStatus.CONFIRMED)
                .build());
        interviewRepository.save(Interview.builder()
                .employer(bloom).worker(anitha).job(kitchenJob)
                .scheduledAt(thisWeek(DayOfWeek.THURSDAY, 16, 0))
                .durationMinutes(30)
                .mode(InterviewMode.PHONE)
                .notes("Short call about shift timings.")
                .status(InterviewStatus.CONFIRMED)
                .build());

        // ---------------------------------------------------------------- reviews
        review(safiri, john, carpenterJob, 5, "Excellent carpenter - finished the guest house job on time.");
        review(bloom, anitha, kitchenJob, 4, "Great cook, always on time for the morning shift.");
        review(logistics, ravi, driverJob, 5, "Careful driver who knows the routes inside out.");
        review(homeServices, david, electricianJob, 5, "Neat wiring work and clear explanations.");
        review(john, safiri, carpenterJob, 5, "Fair site management and payments always on time.");
        review(anitha, bloom, kitchenJob, 4, "Supportive kitchen team and clean workspace.");
        review(ravi, logistics, driverJob, 5, "Reliable schedule and fuel allowance paid promptly.");
        review(david, homeServices, electricianJob, 4, "Steady flow of work and prompt settlements.");

        // ---------------------------------------------------------------- wallets
        wallet(AccountType.ADMIN, admin.getId(), 200000);
        for (EmployerAccount e : List.of(safiri, bloom, freshMart, logistics, homeServices)) {
            wallet(AccountType.EMPLOYER, e.getId(), 200000);
        }
        for (WorkerAccount w : workerAccountRepository.findAll()) {
            wallet(AccountType.WORKER, w.getId(), 0);
        }

        // Touch the profiles so the unused-variable warnings stay honest and the rows are flushed.
        employerProfileRepository.saveAll(List.of(safiriProfile, bloomProfile, freshMartProfile,
                logisticsProfile, homeServicesProfile));

        seedSkills();

        jobRepository.findByStatusOrderByPostedAtDesc(JobStatus.OPEN)
                .forEach(matchingService::generateMatchesForJob);
    }

    // ---------------------------------------------------------------- builders

    private EmployerAccount employer(String name, String email, String phone) {
        return employerAccountRepository.save(EmployerAccount.builder()
                .name(name)
                .email(email)
                .phone(phone)
                .password(passwordEncoder.encode("pass1234"))
                .phoneVerified(true)
                .locale("en")
                .enabled(true)
                .build());
    }

    private EmployerProfile profile(EmployerAccount account, String businessName, String businessType,
                                    String description, String area, double lat, double lng,
                                    String website, Integer founded, String teamSize, boolean verified,
                                    String businessSize, String address, String pincode, EmployerPlan plan) {
        return employerProfileRepository.save(EmployerProfile.builder()
                .account(account).businessName(businessName).businessType(businessType)
                .description(description).city(CITY).area(area).latitude(lat).longitude(lng)
                .locationEnabled(true).website(website).founded(founded).teamSize(teamSize)
                .verified(verified)
                .employerKind(EmployerKind.BUSINESS)
                .businessSize(businessSize)
                .address(address)
                .pincode(pincode)
                .authorizedConfirmed(true)
                .plan(plan)
                .paymentMethod("UPI")
                .onboardingCompleted(true)
                .build());
    }

    /** Fills in the demographics and history the employer-facing worker screens render. */
    private void demographics(WorkerAccount account, Gender gender, int age,
                              List<String> languages, WorkExperience... history) {
        WorkerProfile profile = workerProfileRepository.findByAccountId(account.getId()).orElseThrow();
        profile.setGender(gender);
        profile.setDateOfBirth(LocalDate.now().minusYears(age).minusDays(37));
        profile.setLanguages(new ArrayList<>(languages));
        profile.setWorkExperience(new ArrayList<>(List.of(history)));
        workerProfileRepository.save(profile);
    }

    private WorkExperience exp(String role, String employer, double years) {
        return WorkExperience.builder().role(role).employer(employer).years(years).build();
    }

    /**
     * Adds everything the posting wizard collects to a job the short {@link #job} helper built,
     * so the employer screens have real categories, shifts, benefits and view counts to render.
     */
    private JobPost enrich(JobPost job, WorkerCategory category, JobStatus status, int views,
                           List<String> responsibilities, List<String> workingDays,
                           List<String> benefits, List<String> languages,
                           InterviewType interviewType, int deadlineInDays, String... shifts) {
        job.setWorkerCategory(category);
        job.setStatus(status);
        job.setJobViews(views);
        job.getResponsibilities().clear();
        job.getResponsibilities().addAll(responsibilities);
        job.getWorkingDays().clear();
        job.getWorkingDays().addAll(workingDays);
        List<JobBenefit> benefitRows = new ArrayList<>();
        for (String raw : benefits) {
            benefitRows.add(JobBenefit.builder().benefitType(BenefitType.parse(raw)).build());
        }
        job.replaceBenefits(benefitRows);
        job.getLanguages().clear();
        job.getLanguages().addAll(languages);
        job.setInterviewType(interviewType);
        job.setApplicationDeadline(LocalDate.now().plusDays(deadlineInDays));
        job.setPaymentMode(PaymentMode.SKILLBRIDGE);
        job.setGenderPreference(GenderPreference.ANY);
        job.setAgeMin(18);
        job.setAgeMax(50);
        job.setAutoCloseWhenFilled(true);
        List<JobShift> built = new ArrayList<>();
        for (String spec : shifts) {
            String[] parts = spec.split("\\|");
            JobShift built1 = JobShift.builder().label(parts[0])
                    .startTime(LocalTime.parse(parts[1])).endTime(LocalTime.parse(parts[2])).build();
            if (parts.length >= 5) {
                built1.setBreakStart(LocalTime.parse(parts[3]));
                built1.setBreakEnd(LocalTime.parse(parts[4]));
            }
            built.add(built1);
        }
        job.replaceShifts(built);
        if (job.getEngagementModel() == null) {
            job.setEngagementModel(EngagementModel.FULL_TIME);
        }
        job.setEmploymentType(job.getEngagementModel().legacyEmploymentType());
        if (job.getPayrollCycle() == null) {
            job.setPayrollCycle(job.getEngagementModel().defaultPayrollCycle());
        }
        return jobRepository.save(job);
    }

    /**
     * Applies the employment rules engine to a seeded job: the model, its schedule and the
     * payroll cycle that follows from it. Called before {@link #enrich}, which then keeps the
     * legacy employmentType column in step.
     */
    private JobPost model(JobPost job, EngagementModel engagementModel, SalaryUnit unit,
                          double salary, LocalDate workDate, LocalDate startDate, LocalDate endDate) {
        job.setEngagementModel(engagementModel);
        job.setEmploymentType(engagementModel.legacyEmploymentType());
        job.setSalaryUnit(unit);
        job.setSalary(salary);
        job.setWorkDate(workDate);
        job.setShiftArrangement(ShiftArrangement.ALL_SHIFTS);
        job.setPayrollCycle(engagementModel.defaultPayrollCycle());
        if (engagementModel == EngagementModel.ONE_TIME && workDate != null) {
            job.setDurationType(JobDuration.SPECIFIC);
            job.setStartDate(workDate);
            job.setEndDate(workDate);
        } else if (startDate != null && endDate != null) {
            job.setDurationType(JobDuration.SPECIFIC);
            job.setStartDate(startDate);
            job.setEndDate(endDate);
        } else {
            job.setDurationType(JobDuration.ONGOING);
            job.setStartDate(startDate);
            job.setEndDate(null);
        }
        if (engagementModel == EngagementModel.PART_TIME || engagementModel == EngagementModel.FULL_TIME
                || engagementModel == EngagementModel.PERMANENT) {
            job.setSalaryDueDayOfMonth(5);
        }
        return jobRepository.save(job);
    }

    private static final List<String> WEEKDAYS = List.of("MON", "TUE", "WED", "THU", "FRI");
    private static final List<String> SIX_DAYS = List.of("MON", "TUE", "WED", "THU", "FRI", "SAT");
    private static final List<String> ALL_DAYS = List.of("MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN");

    /** A fixed time a few days out, so the "upcoming" interview is always genuinely upcoming. */
    private LocalDateTime soon(int days, int hour, int minute) {
        return LocalDate.now().plusDays(days).atTime(hour, minute);
    }

    /**
     * The last week of attendance for a live employment. Every working day before today is a
     * completed 8-hour shift; today is deliberately left NOT_CHECKED_IN so the Today's Shift
     * screen opens with a working Check In button.
     */
    private void seedAttendance(Employment employment) {
        List<String> working = employment.getJob().getWorkingDays();
        LocalDate today = LocalDate.now();
        for (int back = 7; back >= 1; back--) {
            LocalDate date = today.minusDays(back);
            String key = DAY_KEYS.get(date.getDayOfWeek().getValue() - 1);
            if (!working.isEmpty() && !working.contains(key)) {
                continue;
            }
            LocalDateTime in = date.atTime(9, 3);
            LocalDateTime out = date.atTime(18, 1);
            attendanceRepository.save(Attendance.builder()
                    .employment(employment)
                    .workDate(date)
                    .checkInAt(in)
                    .checkOutAt(out)
                    .status(AttendanceStatus.CHECKED_OUT)
                    .minutesWorked((int) java.time.Duration.between(in, out).toMinutes())
                    .build());
        }
        attendanceRepository.save(Attendance.builder()
                .employment(employment)
                .workDate(today)
                .status(AttendanceStatus.NOT_CHECKED_IN)
                .build());
    }

    /**
     * Ten scheduled weekdays, nine of them worked: the fifth day has no attendance row at all,
     * which is exactly what an absence looks like to the payroll engine.
     */
    private void seedTenOfWhichNineAttended(Employment employment, LocalDate from, LocalDate to) {
        List<String> working = employment.getJob().getWorkingDays();
        int index = 0;
        for (LocalDate date = from; !date.isAfter(to); date = date.plusDays(1)) {
            String key = DAY_KEYS.get(date.getDayOfWeek().getValue() - 1);
            if (!working.isEmpty() && !working.contains(key)) {
                continue;
            }
            index++;
            if (index == 5) {
                continue;   // the absent day
            }
            LocalDateTime in = date.atTime(9, 0);
            LocalDateTime out = date.atTime(18, 0);
            attendanceRepository.save(Attendance.builder()
                    .employment(employment)
                    .workDate(date)
                    .checkInAt(in)
                    .checkOutAt(out)
                    .status(AttendanceStatus.CHECKED_OUT)
                    .minutesWorked((int) java.time.Duration.between(in, out).toMinutes())
                    .build());
        }
    }

    private static final List<String> DAY_KEYS =
            List.of("MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN");

    /** A day of the CURRENT week at a fixed time, so the calendar always has something to draw. */
    private LocalDateTime thisWeek(DayOfWeek day, int hour, int minute) {
        return LocalDate.now().with(day).atTime(hour, minute);
    }

    private WorkerAccount worker(String name, String email, String phone, List<String> skills,
                                 int experience, String jobTitle, String bio, double lat, double lng,
                                 Availability availability, double salary, SalaryUnit unit,
                                 VerificationStatus verification, List<EmploymentType> employmentTypes) {
        WorkerAccount account = workerAccountRepository.save(WorkerAccount.builder()
                .name(name)
                .email(email)
                .phone(phone)
                .password(passwordEncoder.encode("pass1234"))
                .phoneVerified(true)
                .locale("en")
                .enabled(true)
                .build());
        workerProfileRepository.save(WorkerProfile.builder()
                .account(account)
                .skills(new java.util.ArrayList<>(skills))
                .employmentTypes(new java.util.ArrayList<>(employmentTypes))
                .experienceYears(experience)
                .jobTitle(jobTitle)
                .bio(bio)
                .city(CITY)
                .area(REGION)
                .latitude(lat)
                .longitude(lng)
                .locationEnabled(true)
                .preferredRadiusKm(15)
                .availability(availability)
                .expectedSalary(salary)
                .salaryUnit(unit)
                .verificationStatus(verification)
                .profileCompleted(true)
                .build());
        return account;
    }

    private JobPost job(EmployerAccount employer, String title, String description, List<String> skills,
                        WorkType workType, EmploymentType employmentType, double salary, SalaryUnit unit,
                        String area, double lat, double lng, int workers, boolean urgent,
                        int minExperienceYears, String language) {
        return jobRepository.save(JobPost.builder()
                .employer(employer).title(title).description(description)
                .requiredSkills(new java.util.ArrayList<>(skills))
                .workType(workType).employmentType(employmentType).salary(salary).salaryUnit(unit)
                .city(CITY).area(area).latitude(lat).longitude(lng)
                .minExperienceYears(minExperienceYears).language(language)
                .workersNeeded(workers).urgent(urgent).status(JobStatus.OPEN)
                .postedAt(LocalDateTime.now().minusDays(2))
                .expiresAt(LocalDateTime.now().plusDays(30))
                .build());
    }

    /** Backfills the stage timestamps so the five-step timeline renders correctly straight away. */
    private JobApplication application(WorkerAccount worker, JobPost job, ApplicationStatus status,
                                       int daysAgo, String coverMessage) {
        LocalDateTime applied = LocalDateTime.now().minusDays(daysAgo);
        JobApplication.JobApplicationBuilder builder = JobApplication.builder()
                .worker(worker).job(job).coverMessage(coverMessage)
                .status(status).appliedAt(applied);

        switch (status) {
            case VIEWED -> builder.viewedAt(applied.plusHours(6));
            case SHORTLISTED -> builder.viewedAt(applied.plusHours(6)).shortlistedAt(applied.plusDays(1));
            case INTERVIEW_SCHEDULED -> builder.viewedAt(applied.plusHours(6))
                    .shortlistedAt(applied.plusDays(1)).interviewAt(applied.plusDays(2));
            case OFFERED -> builder.viewedAt(applied.plusHours(6)).shortlistedAt(applied.plusDays(1));
            case ACCEPTED -> builder.viewedAt(applied.plusHours(6))
                    .shortlistedAt(applied.plusDays(1)).interviewAt(applied.plusDays(2))
                    .decisionAt(applied.plusDays(3)).paymentSettled(true);
            case REJECTED, WITHDRAWN -> builder.viewedAt(applied.plusHours(6))
                    .decisionAt(applied.plusDays(2));
            case APPLIED -> { /* nothing else has happened yet */ }
        }

        JobApplication application = applicationRepository.save(builder.build());
        job.setApplicantsCount(job.getApplicantsCount() + 1);
        jobRepository.save(job);
        return application;
    }

    private void review(Account author, Account target, JobPost job, int rating, String comment) {
        reviewRepository.save(Review.builder()
                .authorType(author.accountType()).authorId(author.getId())
                .targetType(target.accountType()).targetId(target.getId())
                .job(job).rating(rating).comment(comment)
                .build());
        double avg = reviewRepository.averageRatingFor(target.accountType(), target.getId());
        long count = reviewRepository.countByTargetTypeAndTargetId(target.accountType(), target.getId());
        double rounded = Math.round(avg * 100.0) / 100.0;
        if (target instanceof WorkerAccount w) {
            w.setAvgRating(rounded);
            w.setRatingCount((int) count);
            workerAccountRepository.save(w);
        } else if (target instanceof EmployerAccount e) {
            e.setAvgRating(rounded);
            e.setRatingCount((int) count);
            employerAccountRepository.save(e);
        }
    }

    private void wallet(AccountType ownerType, Long ownerId, double balance) {
        walletRepository.save(Wallet.builder()
                .ownerType(ownerType).ownerId(ownerId).balance(balance).build());
    }

    private void seedSkills() {
        List<String[]> skills = List.of(
                new String[]{"Carpentry", "Construction"},
                new String[]{"Carpenter", "Construction"},
                new String[]{"Cabinet Making", "Construction"},
                new String[]{"Tiling", "Construction"},
                new String[]{"Masonry", "Construction"},
                new String[]{"Bricklaying", "Construction"},
                new String[]{"Painting", "Construction"},
                new String[]{"Electrical Wiring", "Electrical"},
                new String[]{"Electrician", "Electrical"},
                new String[]{"Solar Installation", "Electrical"},
                new String[]{"Plumbing", "Plumbing"},
                new String[]{"Pipe Fitting", "Plumbing"},
                new String[]{"Bathroom Fitting", "Plumbing"},
                new String[]{"HVAC", "Plumbing"},
                new String[]{"Welding", "Metalwork"},
                new String[]{"Metal Fabrication", "Metalwork"},
                new String[]{"Grinding", "Metalwork"},
                new String[]{"Driving", "Transport"},
                new String[]{"Delivery", "Transport"},
                new String[]{"Taxi", "Transport"},
                new String[]{"Cooking", "Hospitality"},
                new String[]{"Kitchen", "Hospitality"},
                new String[]{"Waiter", "Hospitality"},
                new String[]{"Restaurant Service", "Hospitality"},
                new String[]{"Cleaning", "Domestic"},
                new String[]{"Housekeeping", "Domestic"},
                new String[]{"Laundry", "Domestic"},
                new String[]{"Gardening", "Agriculture"},
                new String[]{"Landscaping", "Agriculture"},
                new String[]{"Tailoring", "Fashion"},
                new String[]{"Sewing", "Fashion"},
                new String[]{"Stitching", "Fashion"},
                new String[]{"Security", "Security"},
                new String[]{"Data Entry", "Office"},
                new String[]{"Typing", "Office"},
                new String[]{"Office Assistant", "Office"},
                new String[]{"Accountant", "Office"},
                new String[]{"Receptionist", "Office"},
                new String[]{"Packing", "Warehouse"},
                new String[]{"Loading", "Warehouse"},
                new String[]{"Warehouse", "Warehouse"},
                new String[]{"Cashier", "Retail"},
                new String[]{"Billing", "Retail"},
                new String[]{"Sales", "Retail"},
                new String[]{"Retail", "Retail"},
                new String[]{"Mechanic", "Automotive"},
                new String[]{"Auto Repair", "Automotive"},
                new String[]{"Barber", "Beauty"},
                new String[]{"Childcare", "Domestic"}
        );
        for (String[] s : skills) {
            skillRepository.save(Skill.builder().name(s[0]).category(s[1]).build());
        }
    }
}
