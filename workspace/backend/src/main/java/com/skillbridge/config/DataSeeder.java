package com.skillbridge.config;

import com.skillbridge.model.*;
import com.skillbridge.repository.*;
import com.skillbridge.service.MatchingService;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Component
public class DataSeeder implements CommandLineRunner {

    private final UserRepository userRepository;
    private final WorkerProfileRepository workerRepository;
    private final EmployerProfileRepository employerRepository;
    private final JobPostRepository jobRepository;
    private final ReviewRepository reviewRepository;
    private final WalletRepository walletRepository;
    private final SkillRepository skillRepository;
    private final PasswordEncoder passwordEncoder;
    private final MatchingService matchingService;

    public DataSeeder(UserRepository userRepository, WorkerProfileRepository workerRepository,
                      EmployerProfileRepository employerRepository, JobPostRepository jobRepository,
                      ReviewRepository reviewRepository, WalletRepository walletRepository,
                      SkillRepository skillRepository, PasswordEncoder passwordEncoder,
                      MatchingService matchingService) {
        this.userRepository = userRepository;
        this.workerRepository = workerRepository;
        this.employerRepository = employerRepository;
        this.jobRepository = jobRepository;
        this.reviewRepository = reviewRepository;
        this.walletRepository = walletRepository;
        this.skillRepository = skillRepository;
        this.passwordEncoder = passwordEncoder;
        this.matchingService = matchingService;
    }

    @Override
    @Transactional
    public void run(String... args) {
        if (userRepository.count() > 0) {
            return;
        }
        seed();
    }

    private void seed() {
        // ---- Admin ----
        User admin = user("Admin", "admin@skillbridge.com", "admin123", Role.ADMIN, "en");
        employer(admin, "SkillBridge Platform", "Platform", "Official platform jobs",
                "Nairobi", "CBD", -1.2833, 36.8219, "www.skillbridge.com");

        // ---- Employers ----
        User safiri = user("James Otieno", "james@safiriconstruction.com", "pass1234", Role.EMPLOYER, "en");
        employer(safiri, "Safiri Construction Ltd", "Construction", "General construction and renovation services",
                "Nairobi", "Kilimani", -1.2921, 36.8219, "www.safiriconstruction.co.ke");

        User bloom = user("Amina Yusuf", "amina@bloomrestaurants.com", "pass1234", Role.EMPLOYER, "en");
        employer(bloom, "Bloom Restaurants", "Hospitality", "Chain of restaurants across Nairobi",
                "Nairobi", "Westlands", -1.2671, 36.8094, "www.bloomrestaurants.com");

        User techFix = user("Daniel Mwangi", "daniel@techfix.co.ke", "pass1234", Role.EMPLOYER, "en");
        employer(techFix, "TechFix Services", "Electronics & Appliances", "Home appliance repair and maintenance",
                "Nairobi", "South B", -1.3174, 36.8175, "www.techfix.co.ke");

        User greenFarm = user("Grace Kimani", "grace@greenfarms.co.ke", "pass1234", Role.EMPLOYER, "en");
        employer(greenFarm, "Green Valley Farms", "Agriculture", "Fresh produce farm supplying city markets",
                "Nairobi", "Karen", -1.3197, 36.7109, "www.greenvalleyfarms.co.ke");

        User cityCabs = user("Peter Njoroge", "peter@citycabs.co.ke", "pass1234", Role.EMPLOYER, "en");
        employer(cityCabs, "City Cabs", "Transport", "Taxi and delivery fleet",
                "Nairobi", "CBD", -1.2833, 36.8219, "www.citycabs.co.ke");

        // ---- Workers ----
        User john = worker("John Kamau", "john.kamau@mail.com", "pass1234", "en",
                List.of("Carpentry", "Cabinet Making", "Tiling"), 6, "Carpenter",
                "Experienced carpenter specializing in custom furniture and finishing work.",
                "Nairobi", "Kasarani", -1.2262, 36.9047, true,
                Availability.FULL_TIME, 450, SalaryUnit.PER_DAY, VerificationStatus.VERIFIED);

        worker("Mary Wanjiru", "mary.wanjiru@mail.com", "pass1234", "en",
                List.of("Cleaning", "Housekeeping", "Laundry"), 3, "Professional Cleaner",
                "Reliable cleaner for homes and offices with 3 years of experience.",
                "Nairobi", "Langata", -1.3644, 36.7358, true,
                Availability.IMMEDIATE, 250, SalaryUnit.PER_DAY, VerificationStatus.VERIFIED);

        worker("Samuel Ochieng", "samuel.ochieng@mail.com", "pass1234", "en",
                List.of("Welding", "Metal Fabrication", "Grinding"), 8, "Welder / Fabricator",
                "Certified welder with experience in gates, railings and structural work.",
                "Nairobi", "Industrial Area", -1.3016, 36.8418, true,
                Availability.FULL_TIME, 600, SalaryUnit.PER_DAY, VerificationStatus.PENDING);

        User esther = worker("Esther Achieng", "esther.achieng@mail.com", "pass1234", "en",
                List.of("Cooking", "Kitchen", "Waiter"), 4, "Cook / Kitchen Helper",
                "Kitchen assistant and cook with catering experience for events and restaurants.",
                "Nairobi", "Eastleigh", -1.2660, 36.8550, true,
                Availability.PART_TIME, 300, SalaryUnit.PER_DAY, VerificationStatus.UNVERIFIED);

        User brian = worker("Brian Otieno", "brian.otieno@mail.com", "pass1234", "en",
                List.of("Driving", "Delivery", "Taxi"), 5, "Driver / Delivery Rider",
                "Licensed driver (class B) with clean record. Comfortable with GPS and city routes.",
                "Nairobi", "Embakasi", -1.3186, 36.9172, true,
                Availability.IMMEDIATE, 350, SalaryUnit.PER_DAY, VerificationStatus.VERIFIED);

        worker("Faith Njeri", "faith.njeri@mail.com", "pass1234", "en",
                List.of("Tailoring", "Sewing", "Stitching"), 2, "Tailor",
                "Tailor with skill in alterations, custom dresses and upholstery repair.",
                "Nairobi", "Kangemi", -1.2541, 36.7400, true,
                Availability.WEEKENDS_ONLY, 200, SalaryUnit.PER_DAY, VerificationStatus.PENDING);

        worker("David Kiprop", "david.kiprop@mail.com", "pass1234", "en",
                List.of("Electrical Wiring", "Electrical Work", "Solar Installation"), 5, "Electrician",
                "Licensed electrician handling domestic wiring, repairs and solar installations.",
                "Nairobi", "Roysambu", -1.2121, 36.8438, true,
                Availability.FULL_TIME, 550, SalaryUnit.PER_DAY, VerificationStatus.VERIFIED);

        User ruth = worker("Ruth Adhiambo", "ruth.adhiambo@mail.com", "pass1234", "en",
                List.of("Gardening", "Landscaping", "Lawn Care"), 3, "Gardener / Landscaper",
                "Green-thumb gardener experienced in lawn care, hedges and flower beds.",
                "Nairobi", "Karen", -1.3197, 36.7109, true,
                Availability.PART_TIME, 400, SalaryUnit.PER_DAY, VerificationStatus.VERIFIED);

        worker("Kevin Muthama", "kevin.muthama@mail.com", "pass1234", "en",
                List.of("Plumbing", "Pipe Fitting", "Bathroom Fitting"), 7, "Plumber",
                "Plumber for repairs, installations and renovations. Fast and tidy.",
                "Nairobi", "Donholm", -1.2860, 36.8980, true,
                Availability.FULL_TIME, 500, SalaryUnit.PER_DAY, VerificationStatus.VERIFIED);

        worker("Lucy Waithera", "lucy.waithera@mail.com", "pass1234", "en",
                List.of("Data Entry", "Typing", "Office Assistant"), 2, "Data Entry Clerk",
                "Fast typist with attention to detail, proficient with spreadsheets.",
                "Nairobi", "Ngara", -1.2741, 36.8293, true,
                Availability.IMMEDIATE, 18000, SalaryUnit.PER_MONTH, VerificationStatus.PENDING);

        // ---- Jobs ----
        JobPost job1 = job(safiri, "Skilled Carpenter needed for renovation",
                "We are renovating a residential building and need carpenters for doors, cabinets and shelving. 5 weeks of work.",
                List.of("Carpentry", "Cabinet Making"), WorkType.WEEKLY, 500, SalaryUnit.PER_DAY,
                "Nairobi", "Kilimani", -1.2921, 36.8219, 3, true);

        JobPost job2 = job(bloom, "Kitchen helper / Cook",
                "Busy restaurant hiring cooks and kitchen helpers. Uniform and meals provided. Shifts daily.",
                List.of("Cooking", "Kitchen"), WorkType.DAILY, 320, SalaryUnit.PER_DAY,
                "Nairobi", "Westlands", -1.2671, 36.8094, 4, true);

        JobPost job3 = job(techFix, "Electrician for appliance wiring",
                "Need an electrician for wiring and testing of household appliances. Weekday work.",
                List.of("Electrical Wiring", "Electrical Work"), WorkType.DAILY, 550, SalaryUnit.PER_DAY,
                "Nairobi", "South B", -1.3174, 36.8175, 2, false);

        JobPost job4 = job(greenFarm, "Gardeners for farm maintenance",
                "Maintain flower beds, hedges and greenhouses at our farm in Karen. Weekly schedule.",
                List.of("Gardening", "Landscaping"), WorkType.WEEKLY, 400, SalaryUnit.PER_DAY,
                "Nairobi", "Karen", -1.3197, 36.7109, 2, false);

        JobPost job5 = job(cityCabs, "Delivery drivers (permanent)",
                "Full-time delivery drivers for our fleet. Clean driving record required, salary + fuel allowance.",
                List.of("Driving", "Delivery"), WorkType.PERMANENT, 28000, SalaryUnit.PER_MONTH,
                "Nairobi", "CBD", -1.2833, 36.8219, 5, true);

        JobPost job6 = job(safiri, "Welder for gate and railing fabrication",
                "Fabricate and install steel gates and railings at an ongoing site. Two months project.",
                List.of("Welding", "Metal Fabrication"), WorkType.MONTHLY, 600, SalaryUnit.PER_DAY,
                "Nairobi", "Industrial Area", -1.3016, 36.8418, 2, false);

        JobPost job7 = job(bloom, "Weekend waiters / servers",
                "Weekend shifts for waiters at our Westlands branch. Training provided.",
                List.of("Waiter", "Cooking"), WorkType.WEEKLY, 280, SalaryUnit.PER_DAY,
                "Nairobi", "Westlands", -1.2671, 36.8094, 3, false);

        JobPost job8 = job(techFix, "Plumber for bathroom renovation",
                "Renovate two bathrooms: pipe fitting, fixture installation and tiling support.",
                List.of("Plumbing", "Pipe Fitting"), WorkType.MONTHLY, 520, SalaryUnit.PER_DAY,
                "Nairobi", "South B", -1.3174, 36.8175, 1, false);

        // ---- Reviews ----
        // Employers review workers they hired
        review(safiri, john, job1, 5, "Excellent carpenter, reliable and finished the renovation on time.");
        review(bloom, esther, job2, 4, "Great cook, showed up on time every day. Good work ethic.");
        review(cityCabs, brian, job5, 5, "Professional driver, very punctual and careful.");
        review(greenFarm, ruth, job4, 4, "Great landscaping skills and attention to detail.");
        // Workers review employers they worked for
        review(john, safiri, job1, 5, "Fair employer, paid on time and provided all materials.");
        review(esther, bloom, job2, 4, "Good working conditions and supportive kitchen team.");
        review(brian, cityCabs, job5, 5, "Paid well, reliable schedule and respectful management.");
        review(ruth, greenFarm, job4, 4, "Nice farm to work at, organized supervisor.");

        // ---- Wallets (employers + platform start funded) ----
        List.of(admin, safiri, bloom, techFix, greenFarm, cityCabs)
                .forEach(u -> wallet(u, 100000));
        userRepository.findByRole(Role.WORKER).forEach(u -> wallet(u, 0));

        // ---- Skill catalog ----
        seedSkills();

        // ---- Generate AI matches for all open jobs ----
        jobRepository.findByStatusOrderByPostedAtDesc(JobStatus.OPEN)
                .forEach(matchingService::generateMatchesForJob);
    }

    private User user(String name, String email, String password, Role role, String locale) {
        User u = User.builder()
                .name(name)
                .email(email)
                .password(passwordEncoder.encode(password))
                .role(role)
                .locale(locale)
                .enabled(true)
                .build();
        return userRepository.save(u);
    }

    private void employer(User user, String businessName, String businessType, String description,
                          String city, String area, double lat, double lng, String website) {
        employerRepository.save(EmployerProfile.builder()
                .user(user).businessName(businessName).businessType(businessType).description(description)
                .city(city).area(area).latitude(lat).longitude(lng).locationEnabled(true).website(website)
                .build());
    }

    private User worker(String name, String email, String password, String locale, List<String> skills,
                        int experience, String jobTitle, String bio, String city, String area,
                        double lat, double lng, boolean locationEnabled, Availability availability,
                        double salary, SalaryUnit unit, VerificationStatus verification) {
        User u = user(name, email, password, Role.WORKER, locale);
        workerRepository.save(WorkerProfile.builder()
                .user(u).skills(skills).experienceYears(experience).jobTitle(jobTitle).bio(bio)
                .city(city).area(area).latitude(lat).longitude(lng).locationEnabled(locationEnabled)
                .availability(availability).expectedSalary(salary).salaryUnit(unit)
                .verificationStatus(verification)
                .profileCompleted(true)
                .build());
        return u;
    }

    private JobPost job(User employer, String title, String description, List<String> skills, WorkType workType,
                        double salary, SalaryUnit unit, String city, String area, double lat, double lng,
                        int workers, boolean urgent) {
        return jobRepository.save(JobPost.builder()
                .employer(employer).title(title).description(description).requiredSkills(skills)
                .workType(workType).salary(salary).salaryUnit(unit)
                .city(city).area(area).latitude(lat).longitude(lng)
                .workersNeeded(workers).urgent(urgent).status(JobStatus.OPEN)
                .postedAt(LocalDateTime.now().minusDays(2))
                .expiresAt(LocalDateTime.now().plusDays(30))
                .build());
    }

    private void review(User author, User target, JobPost job, int rating, String comment) {
        reviewRepository.save(Review.builder()
                .author(author).target(target).job(job).rating(rating).comment(comment)
                .build());
        double avg = reviewRepository.averageRatingFor(target);
        long count = reviewRepository.countByTarget(target);
        target.setAvgRating(Math.round(avg * 100.0) / 100.0);
        target.setRatingCount((int) count);
        userRepository.save(target);
    }

    private void wallet(User user, double balance) {
        walletRepository.save(com.skillbridge.model.Wallet.builder()
                .user(user).balance(balance).build());
    }

    private void seedSkills() {
        List<String[]> skills = List.of(
                new String[]{"Carpentry", "Construction"},
                new String[]{"Carpenter", "Construction"},
                new String[]{"Cabinet Making", "Construction"},
                new String[]{"Tiling", "Construction"},
                new String[]{"Tile Setting", "Construction"},
                new String[]{"Masonry", "Construction"},
                new String[]{"Bricklaying", "Construction"},
                new String[]{"Painting", "Construction"},
                new String[]{"Electrical Wiring", "Electrical"},
                new String[]{"Electrician", "Electrical"},
                new String[]{"Solar Installation", "Electrical"},
                new String[]{"Plumbing", "Plumbing"},
                new String[]{"Pipe Fitting", "Plumbing"},
                new String[]{"HVAC", "Plumbing"},
                new String[]{"Air Conditioning", "Plumbing"},
                new String[]{"Welding", "Metalwork"},
                new String[]{"Metal Fabrication", "Metalwork"},
                new String[]{"Driving", "Transport"},
                new String[]{"Delivery", "Transport"},
                new String[]{"Taxi", "Transport"},
                new String[]{"Cooking", "Hospitality"},
                new String[]{"Kitchen", "Hospitality"},
                new String[]{"Waiter", "Hospitality"},
                new String[]{"Baker", "Hospitality"},
                new String[]{"Cleaning", "Domestic"},
                new String[]{"Housekeeping", "Domestic"},
                new String[]{"Laundry", "Domestic"},
                new String[]{"Gardening", "Agriculture"},
                new String[]{"Landscaping", "Agriculture"},
                new String[]{"Lawn Care", "Agriculture"},
                new String[]{"Tailoring", "Fashion"},
                new String[]{"Sewing", "Fashion"},
                new String[]{"Seamstress", "Fashion"},
                new String[]{"Security", "Security"},
                new String[]{"Data Entry", "Office"},
                new String[]{"Typing", "Office"},
                new String[]{"Office Assistant", "Office"},
                new String[]{"Accountant", "Office"},
                new String[]{"Receptionist", "Office"},
                new String[]{"Nanny", "Domestic"},
                new String[]{"Childcare", "Domestic"},
                new String[]{"Barber", "Beauty"},
                new String[]{"Hairstyling", "Beauty"},
                new String[]{"Packing", "Warehouse"},
                new String[]{"Loading", "Warehouse"},
                new String[]{"Cashier", "Retail"},
                new String[]{"Sales", "Retail"},
                new String[]{"Mechanic", "Automotive"},
                new String[]{"Auto Repair", "Automotive"}
        );
        for (String[] s : skills) {
            skillRepository.save(com.skillbridge.model.Skill.builder().name(s[0]).category(s[1]).build());
        }
    }
}
