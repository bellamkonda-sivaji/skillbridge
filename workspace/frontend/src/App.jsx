import React from 'react'
import { Routes, Route, Navigate, Outlet, useSearchParams } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import Navbar from './components/Navbar'
import Chat from './pages/Chat'
import AdminDashboard from './pages/admin/AdminDashboard'
import WorkerProfileTab from './pages/worker/WorkerProfileTab'
import MySkillsTab from './pages/worker/MySkillsTab'

// ---- public marketing site ----
import MarketingLayout from './marketing/MarketingLayout'
import Home from './marketing/pages/Home'
import HowItWorks from './marketing/pages/HowItWorks'
import ForWorkers from './marketing/pages/ForWorkers'
import ForEmployers from './marketing/pages/ForEmployers'
import Categories from './marketing/pages/Categories'
import Stories from './marketing/pages/Stories'
import Pricing from './marketing/pages/Pricing'
import Safety from './marketing/pages/Safety'
import MobileApp from './marketing/pages/MobileApp'
import About from './marketing/pages/About'
import Careers from './marketing/pages/Careers'
import { BlogList, BlogPost } from './marketing/pages/Blog'
import Help from './marketing/pages/Help'
import Contact from './marketing/pages/Contact'
import { LegalIndex, LegalDoc } from './marketing/pages/Legal'
import { FindJobs as PublicJobs, FindWorkers as PublicWorkers } from './marketing/pages/Browse'
import NotFound from './marketing/pages/NotFound'

// ---- auth (separate per account type) ----
import { WorkerLogin, AdminLogin, ChooseLogin } from './auth/Login'

// ---- employer login + onboarding ----
import EmployerLoginScreen from './employer/screens/Login'
import { ForgotPassword, VerifyCode, ResetPassword } from './employer/screens/PasswordRecovery'
import LoginSuccess from './employer/screens/LoginSuccess'
import {
  AccountType as EmpAccountType, BusinessDetails, BusinessLocation,
  Verification as EmpVerification, ChoosePlan,
} from './employer/screens/Onboarding'

// ---- employer application ----
import EmployerShell from './employer/app/EmployerShell'
import EmployerHome from './employer/app/pages/Dashboard'
import PostJob from './employer/app/pages/PostJob'
import MyJobs from './employer/app/pages/MyJobs'
import JobManagement from './employer/app/pages/JobManagement'
import {
  Applications as EmpApplications, FindWorkers as EmpFindWorkers,
  Payments as EmpPayments, Reviews as EmpReviews,
  Attendance as EmpAttendance, Settings as EmpSettings,
} from './employer/app/pages/Secondary'
import BusinessProfileTab from './pages/employer/BusinessProfileTab'
import Applicants from './employer/app/pages/Applicants'
import RecommendedWorkers from './employer/app/pages/RecommendedWorkers'
import EmpWorkerProfile from './employer/app/pages/WorkerProfile'
import Shortlist from './employer/app/pages/Shortlist'
import CompareWorkers from './employer/app/pages/Compare'
import ApplicationDecision from './employer/app/pages/ApplicationDecision'
import ScheduleInterview from './employer/app/pages/ScheduleInterview'
import InterviewCalendar from './employer/app/pages/InterviewCalendar'
import InterviewResults from './employer/app/pages/InterviewResults'
import CreateOffer from './employer/app/pages/CreateOffer'
import OfferTracking from './employer/app/pages/OfferTracking'
import JoiningConfirmation from './employer/app/pages/JoiningConfirmation'

// ---- signup + worker onboarding ----
import { OnboardingProvider } from './onboarding/OnboardingContext'
import ChooseLanguage from './onboarding/screens/ChooseLanguage'
import AccountType from './onboarding/screens/AccountType'
import CreateAccount from './onboarding/screens/CreateAccount'
import VerifyOtp from './onboarding/screens/VerifyOtp'
import BasicInfo from './onboarding/screens/BasicInfo'
import JobPreferences from './onboarding/screens/JobPreferences'
import SkillsSelection from './onboarding/screens/SkillsSelection'
import LocationAvailability from './onboarding/screens/LocationAvailability'

// ---- worker application ----
import WorkerShell from './worker/WorkerShell'
import WorkerDashboard from './worker/pages/Dashboard'
import WorkerFindJobs from './worker/pages/FindJobs'
import SearchFilters from './worker/pages/SearchFilters'
import NearbyMap from './worker/pages/NearbyMap'
import JobDetails from './worker/pages/JobDetails'
import EmployerProfile from './worker/pages/EmployerProfile'
import SavedJobs from './worker/pages/SavedJobs'
import MyApplications from './worker/pages/MyApplications'
import ApplicationDetails from './worker/pages/ApplicationDetails'
import JobOffer from './worker/pages/JobOffer'
import { Earnings, Reviews, Settings } from './worker/pages/Secondary'
import { InterviewInvitations, InterviewDetails } from './worker/pages/Interviews'
import {
  MyWork, JoiningInstructions, TodayShift, AttendanceHistory,
} from './worker/pages/Employment'

/** Guards a route by account type. Worker, employer and admin are separate systems. */
function Protected({ children, type }) {
  const { user, accountType, loading, homePath } = useAuth()
  if (loading) return <div className="spinner" />
  if (!user) return <Navigate to={type ? `/${type.toLowerCase()}/login` : '/login'} replace />
  if (type && accountType !== type) return <Navigate to={homePath()} replace />
  return children
}

/** The signed-in employer/admin app keeps its existing navbar. */
function AppLayout() {
  return (
    <>
      <Navbar />
      <Outlet />
    </>
  )
}

/** The signup wizard shares one draft across its steps. */
function JoinLayout() {
  return (
    <OnboardingProvider>
      <Outlet />
    </OnboardingProvider>
  )
}

function RequireAccount({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <div className="spinner" />
  if (!user) return <Navigate to="/join/create" replace />
  return children
}

/** Old signup links (including ?role=) now open the new flow. */
function RegisterRedirect() {
  const [params] = useSearchParams()
  const role = params.get('role')
  return <Navigate to={`/join${role ? `?role=${role}` : ''}`} replace />
}

/** Legacy /dashboard sends each account type to its own home. */
function DashboardRouter() {
  const { accountType } = useAuth()
  if (accountType === 'ADMIN') return <Navigate to="/admin" replace />
  if (accountType === 'WORKER') return <Navigate to="/worker" replace />
  return <Navigate to="/employer" replace />
}

/** Worker profile screen: identity + skills, reusing the existing editors. */
function WorkerProfilePage() {
  return (
    <>
      <h1 className="wk-h1" style={{ marginBottom: 4 }}>My Profile</h1>
      <p className="wk-sub" style={{ marginBottom: 18 }}>
        Keep this current — it is what employers see and what matching uses.
      </p>
      <div className="wk-card pad-lg"><WorkerProfileTab /></div>
      <div className="wk-card pad-lg" style={{ marginTop: 14 }}><MySkillsTab /></div>
    </>
  )
}

export default function App() {
  return (
    <Routes>
      {/* ---------- public marketing site ---------- */}
      <Route element={<MarketingLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/how-it-works" element={<HowItWorks />} />
        <Route path="/for-workers" element={<ForWorkers />} />
        <Route path="/for-employers" element={<ForEmployers />} />
        <Route path="/categories" element={<Categories />} />
        <Route path="/jobs" element={<PublicJobs />} />
        <Route path="/workers" element={<PublicWorkers />} />
        <Route path="/stories" element={<Stories />} />
        <Route path="/pricing" element={<Pricing />} />
        <Route path="/safety" element={<Safety />} />
        <Route path="/app" element={<MobileApp />} />
        <Route path="/about" element={<About />} />
        <Route path="/careers" element={<Careers />} />
        <Route path="/blog" element={<BlogList />} />
        <Route path="/blog/:id" element={<BlogPost />} />
        <Route path="/help" element={<Help />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/legal" element={<LegalIndex />} />
        <Route path="/legal/:slug" element={<LegalDoc />} />
        <Route path="/register" element={<RegisterRedirect />} />
        <Route path="*" element={<NotFound />} />
      </Route>

      {/* ---------- separate logins ---------- */}
      <Route path="/login" element={<ChooseLogin />} />
      <Route path="/worker/login" element={<WorkerLogin />} />
      <Route path="/employer/login" element={<EmployerLoginScreen />} />
      <Route path="/employer/forgot-password" element={<ForgotPassword />} />
      <Route path="/employer/verify-code" element={<VerifyCode />} />
      <Route path="/employer/reset-password" element={<ResetPassword />} />
      <Route path="/employer/login-success" element={<Protected type="EMPLOYER"><LoginSuccess /></Protected>} />

      {/* employer onboarding wizard */}
      <Route path="/employer/onboarding" element={<Protected type="EMPLOYER"><EmpAccountType /></Protected>} />
      <Route path="/employer/onboarding/business" element={<Protected type="EMPLOYER"><BusinessDetails /></Protected>} />
      <Route path="/employer/onboarding/location" element={<Protected type="EMPLOYER"><BusinessLocation /></Protected>} />
      <Route path="/employer/onboarding/verification" element={<Protected type="EMPLOYER"><EmpVerification /></Protected>} />
      <Route path="/employer/onboarding/plan" element={<Protected type="EMPLOYER"><ChoosePlan /></Protected>} />
      <Route path="/admin/login" element={<AdminLogin />} />

      {/* ---------- signup + worker onboarding ---------- */}
      <Route element={<JoinLayout />}>
        <Route path="/join" element={<ChooseLanguage />} />
        <Route path="/join/account-type" element={<AccountType />} />
        <Route path="/join/create" element={<CreateAccount />} />
        <Route path="/join/verify" element={<VerifyOtp />} />
        <Route path="/join/about-you" element={<RequireAccount><BasicInfo /></RequireAccount>} />
        <Route path="/join/preferences" element={<RequireAccount><JobPreferences /></RequireAccount>} />
        <Route path="/join/skills" element={<RequireAccount><SkillsSelection /></RequireAccount>} />
        <Route path="/join/location" element={<RequireAccount><LocationAvailability /></RequireAccount>} />
      </Route>

      {/* ---------- worker application ---------- */}
      <Route path="/worker" element={<Protected type="WORKER"><WorkerShell /></Protected>}>
        <Route index element={<WorkerDashboard />} />
        <Route path="jobs" element={<WorkerFindJobs />} />
        <Route path="jobs/filters" element={<SearchFilters />} />
        <Route path="jobs/map" element={<NearbyMap />} />
        <Route path="jobs/:id" element={<JobDetails />} />
        <Route path="employers/:id" element={<EmployerProfile />} />
        <Route path="saved" element={<SavedJobs />} />
        <Route path="applications" element={<MyApplications />} />
        <Route path="applications/:id" element={<ApplicationDetails />} />
        <Route path="offers/:id" element={<JobOffer />} />
        <Route path="work" element={<MyWork />} />
        <Route path="interviews" element={<InterviewInvitations />} />
        <Route path="interviews/:id" element={<InterviewDetails />} />
        <Route path="work/:id/joining" element={<JoiningInstructions />} />
        <Route path="work/:id/attendance" element={<AttendanceHistory />} />
        <Route path="shift/today" element={<TodayShift />} />
        <Route path="messages" element={<Chat />} />
        <Route path="earnings" element={<Earnings />} />
        <Route path="reviews" element={<Reviews />} />
        <Route path="profile" element={<WorkerProfilePage />} />
        <Route path="settings" element={<Settings />} />
      </Route>

      {/* ---------- employer application ---------- */}
      <Route path="/employer" element={<Protected type="EMPLOYER"><EmployerShell /></Protected>}>
        <Route index element={<EmployerHome />} />
        <Route path="post-job" element={<PostJob />} />
        <Route path="jobs" element={<MyJobs />} />
        <Route path="jobs/:jobId" element={<JobManagement />} />
        <Route path="jobs/:jobId/applicants" element={<Applicants />} />
        <Route path="jobs/:jobId/recommended" element={<RecommendedWorkers />} />
        <Route path="jobs/:jobId/shortlist" element={<Shortlist />} />
        <Route path="jobs/:jobId/interview-results" element={<InterviewResults />} />
        <Route path="workers/:workerId" element={<EmpWorkerProfile />} />
        <Route path="compare" element={<CompareWorkers />} />
        <Route path="applications/:applicationId/decide" element={<ApplicationDecision />} />
        <Route path="interviews" element={<InterviewCalendar />} />
        <Route path="interviews/schedule" element={<ScheduleInterview />} />
        <Route path="applications/:applicationId/offer" element={<CreateOffer />} />
        <Route path="offers" element={<OfferTracking />} />
        <Route path="offers/:offerId/joining" element={<JoiningConfirmation />} />
        <Route path="applications" element={<EmpApplications />} />
        <Route path="find-workers" element={<EmpFindWorkers />} />
        <Route path="attendance" element={<EmpAttendance />} />
        <Route path="payments" element={<EmpPayments />} />
        <Route path="reviews" element={<EmpReviews />} />
        <Route path="profile" element={<div className="wk-card pad-lg"><BusinessProfileTab /></div>} />
        <Route path="settings" element={<EmpSettings />} />
      </Route>

      {/* ---------- admin application ---------- */}
      <Route element={<AppLayout />}>
        <Route path="/dashboard" element={<Protected><DashboardRouter /></Protected>} />
        <Route path="/chat" element={<Protected><Chat /></Protected>} />
        <Route path="/admin" element={<Protected type="ADMIN"><AdminDashboard /></Protected>} />
      </Route>
    </Routes>
  )
}
