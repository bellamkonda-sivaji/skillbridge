import React from 'react'
import { ActivityIndicator, View } from 'react-native'
import { NavigationContainer } from '@react-navigation/native'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { Ionicons } from '@expo/vector-icons'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useTranslation } from 'react-i18next'
import { useSession } from '../session/SessionProvider'
import { colors } from '../theme'

import Splash from '../screens/Splash'
import Language from '../screens/Language'
import CreateAccount from '../screens/CreateAccount'
import Otp from '../screens/Otp'
import Login from '../screens/Login'

import BusinessDetails from '../screens/onboarding/BusinessDetails'
import Verification from '../screens/onboarding/Verification'
import PlanPricing from '../screens/onboarding/PlanPricing'
import CompleteSetup from '../screens/onboarding/CompleteSetup'

import Dashboard from '../screens/Dashboard'
import PostJob from '../screens/post/PostJob'
import JobPublished from '../screens/post/JobPublished'
import MyJobs from '../screens/jobs/MyJobs'
import JobManagement from '../screens/jobs/JobManagement'

import Applications from '../screens/applicants/Applications'
import JobApplicants from '../screens/applicants/JobApplicants'
import ApplicantProfile from '../screens/applicants/ApplicantProfile'
import Recommended from '../screens/applicants/Recommended'
import Compare from '../screens/applicants/Compare'
import Shortlist from '../screens/applicants/Shortlist'
import ApplicationDecision from '../screens/applicants/ApplicationDecision'
import FindWorkers from '../screens/applicants/FindWorkers'

import ScheduleInterview from '../screens/interviews/ScheduleInterview'
import InterviewCalendar from '../screens/interviews/InterviewCalendar'
import InterviewResults from '../screens/interviews/InterviewResults'

import AccountType from '../screens/AccountType'
import CreateOffer from '../screens/offers/CreateOffer'
import OfferPreview from '../screens/offers/OfferPreview'
import OfferSent from '../screens/offers/OfferSent'
import OfferTracking from '../screens/offers/OfferTracking'
import OfferStatusDetail from '../screens/offers/OfferStatusDetail'
import JoiningConfirmation from '../screens/offers/JoiningConfirmation'

import MyTeam from '../screens/team/MyTeam'
import Attendance from '../screens/team/Attendance'
import Payroll from '../screens/team/Payroll'
import FundJob from '../screens/team/FundJob'
import Profile from '../screens/Profile'
import Reviews from '../screens/Reviews'
import Settings from '../screens/Settings'
import Notifications from '../screens/Notifications'

const Stack = createNativeStackNavigator()
const Tab = createBottomTabNavigator()
const hidden = { headerShown: false }

/**
 * The hiring screens are reachable from several tabs, so every stack that can
 * start a hire carries its own copy.
 *
 * This is a function, not a shared element: reusing one element instance in
 * four navigators gives every copy the same identity, which React reports as
 * a missing key and which would make the stacks share state.
 */
const hiringScreens = () => ([
  <Stack.Screen key="ApplicantProfile" name="ApplicantProfile" component={ApplicantProfile} />,
  <Stack.Screen key="Compare" name="Compare" component={Compare} />,
  <Stack.Screen key="Shortlist" name="Shortlist" component={Shortlist} />,
  <Stack.Screen key="ApplicationDecision" name="ApplicationDecision" component={ApplicationDecision} />,
  <Stack.Screen key="ScheduleInterview" name="ScheduleInterview" component={ScheduleInterview} />,
  <Stack.Screen key="InterviewCalendar" name="InterviewCalendar" component={InterviewCalendar} />,
  <Stack.Screen key="InterviewResults" name="InterviewResults" component={InterviewResults} />,
  <Stack.Screen key="CreateOffer" name="CreateOffer" component={CreateOffer} />,
  <Stack.Screen key="OfferPreview" name="OfferPreview" component={OfferPreview} />,
  <Stack.Screen key="OfferSent" name="OfferSent" component={OfferSent} />,
  <Stack.Screen key="OfferTracking" name="OfferTracking" component={OfferTracking} />,
  <Stack.Screen key="OfferStatusDetail" name="OfferStatusDetail" component={OfferStatusDetail} />,
  <Stack.Screen key="JoiningConfirmation" name="JoiningConfirmation" component={JoiningConfirmation} />,
  <Stack.Screen key="FundJob" name="FundJob" component={FundJob} />,
])

const HomeStack = () => (
  <Stack.Navigator screenOptions={hidden}>
    <Stack.Screen name="Dashboard" component={Dashboard} />
    <Stack.Screen name="PostJob" component={PostJob} />
    <Stack.Screen name="JobPublished" component={JobPublished} />
    <Stack.Screen name="JobManagement" component={JobManagement} />
    <Stack.Screen name="JobApplicants" component={JobApplicants} />
    <Stack.Screen name="Recommended" component={Recommended} />
    <Stack.Screen name="FindWorkers" component={FindWorkers} />
    <Stack.Screen name="Notifications" component={Notifications} />
    {hiringScreens()}
  </Stack.Navigator>
)

const JobsStack = () => (
  <Stack.Navigator screenOptions={hidden}>
    <Stack.Screen name="MyJobs" component={MyJobs} />
    <Stack.Screen name="PostJob" component={PostJob} />
    <Stack.Screen name="JobPublished" component={JobPublished} />
    <Stack.Screen name="JobManagement" component={JobManagement} />
    <Stack.Screen name="JobApplicants" component={JobApplicants} />
    <Stack.Screen name="Recommended" component={Recommended} />
    {hiringScreens()}
  </Stack.Navigator>
)

const ApplicantsStack = () => (
  <Stack.Navigator screenOptions={hidden}>
    <Stack.Screen name="Applications" component={Applications} />
    <Stack.Screen name="JobApplicants" component={JobApplicants} />
    <Stack.Screen name="Recommended" component={Recommended} />
    <Stack.Screen name="FindWorkers" component={FindWorkers} />
    {hiringScreens()}
  </Stack.Navigator>
)

const TeamStack = () => (
  <Stack.Navigator screenOptions={hidden}>
    <Stack.Screen name="MyTeam" component={MyTeam} />
    <Stack.Screen name="Attendance" component={Attendance} />
    <Stack.Screen name="Payroll" component={Payroll} />
    <Stack.Screen name="FundJob" component={FundJob} />
    <Stack.Screen name="JoiningConfirmation" component={JoiningConfirmation} />
    <Stack.Screen name="OfferTracking" component={OfferTracking} />
  </Stack.Navigator>
)

const ProfileStack = () => (
  <Stack.Navigator screenOptions={hidden}>
    <Stack.Screen name="Profile" component={Profile} />
    <Stack.Screen name="BusinessDetails" component={BusinessDetails} />
    <Stack.Screen name="Verification" component={Verification} />
    <Stack.Screen name="PlanPricing" component={PlanPricing} />
    <Stack.Screen name="InterviewCalendar" component={InterviewCalendar} />
    <Stack.Screen name="OfferTracking" component={OfferTracking} />
    <Stack.Screen name="JoiningConfirmation" component={JoiningConfirmation} />
    <Stack.Screen name="OfferStatusDetail" component={OfferStatusDetail} />
    <Stack.Screen name="Payroll" component={Payroll} />
    <Stack.Screen name="Reviews" component={Reviews} />
    <Stack.Screen name="Settings" component={Settings} />
    <Stack.Screen name="Notifications" component={Notifications} />
    <Stack.Screen name="InterviewResults" component={InterviewResults} />
  </Stack.Navigator>
)

const ICONS = {
  HomeTab: ['home', 'home-outline'],
  JobsTab: ['briefcase', 'briefcase-outline'],
  ApplicantsTab: ['people', 'people-outline'],
  TeamTab: ['calendar', 'calendar-outline'],
  ProfileTab: ['storefront', 'storefront-outline'],
}

function MainTabs() {
  const { t } = useTranslation()
  const insets = useSafeAreaInsets()
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.blue,
        tabBarInactiveTintColor: colors.muted,
        // Sized to fit the icon and its label. The default is built for a
        // device with a home indicator; without one the label gets clipped.
        tabBarStyle: {
          height: 84 + insets.bottom,
          paddingTop: 10,
          paddingBottom: 14 + insets.bottom,
          borderTopColor: colors.line,
        },
        tabBarItemStyle: { height: 58 },
        tabBarIconStyle: { marginBottom: 2 },
        tabBarLabelStyle: { fontSize: 11.5, fontWeight: '600' },
        tabBarIcon: ({ focused, color, size }) => {
          const [on, off] = ICONS[route.name] || ICONS.HomeTab
          return <Ionicons name={focused ? on : off} size={size ?? 23} color={color} />
        },
      })}
    >
      <Tab.Screen name="HomeTab" component={HomeStack} options={{ title: t('tabs.home') }} />
      <Tab.Screen name="JobsTab" component={JobsStack} options={{ title: t('tabs.jobs') }} />
      <Tab.Screen name="ApplicantsTab" component={ApplicantsStack} options={{ title: t('tabs.applicants') }} />
      <Tab.Screen name="TeamTab" component={TeamStack} options={{ title: t('tabs.team') }} />
      <Tab.Screen name="ProfileTab" component={ProfileStack} options={{ title: t('tabs.profile') }} />
    </Tab.Navigator>
  )
}

export default function RootNavigator() {
  const { booting, signedIn } = useSession()

  if (booting) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.white }}>
        <ActivityIndicator size="large" color={colors.blue} />
      </View>
    )
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={hidden}>
        {signedIn ? (
          <>
            {/* Setup lives inside the signed-in stack: it needs a token, and a
                half-finished business must still be able to reach the app. */}
            <Stack.Screen name="Main" component={MainTabs} />
            <Stack.Screen name="BusinessDetails" component={BusinessDetails} />
            <Stack.Screen name="Verification" component={Verification} />
            <Stack.Screen name="PlanPricing" component={PlanPricing} />
            <Stack.Screen name="CompleteSetup" component={CompleteSetup} />
          </>
        ) : (
          <>
            <Stack.Screen name="Splash" component={Splash} />
            <Stack.Screen name="Language" component={Language} />
            <Stack.Screen name="AccountType" component={AccountType} />
            <Stack.Screen name="CreateAccount" component={CreateAccount} />
            <Stack.Screen name="Otp" component={Otp} />
            <Stack.Screen name="Login" component={Login} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  )
}
