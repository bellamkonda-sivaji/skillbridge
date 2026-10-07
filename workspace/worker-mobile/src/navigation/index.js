import React, { useEffect, useRef, useState } from 'react'
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
import Permissions from '../screens/Permissions'
import Language from '../screens/Language'
import AccountType from '../screens/AccountType'
import CreateAccount from '../screens/CreateAccount'
import Otp from '../screens/Otp'
import Login from '../screens/Login'

import BasicInfo from '../screens/onboarding/BasicInfo'
import JobPreferences from '../screens/onboarding/JobPreferences'
import SkillsStep from '../screens/onboarding/SkillsStep'
import LocationStep from '../screens/onboarding/LocationStep'

import Dashboard from '../screens/Dashboard'
import FindJobs from '../screens/jobs/FindJobs'
import Filters from '../screens/jobs/Filters'
import NearbyJobs from '../screens/jobs/NearbyJobs'
import JobDetails from '../screens/jobs/JobDetails'
import EmployerProfile from '../screens/jobs/EmployerProfile'
import SavedJobs from '../screens/jobs/SavedJobs'

import MyApplications from '../screens/applications/MyApplications'
import ApplicationDetails from '../screens/applications/ApplicationDetails'
import WithdrawApplication from '../screens/applications/WithdrawApplication'

import Offers from '../screens/offers/Offers'
import OfferDetails from '../screens/offers/OfferDetails'
import OfferAccepted from '../screens/offers/OfferAccepted'
import JoiningInstructions from '../screens/offers/JoiningInstructions'

import MyWork from '../screens/work/MyWork'
import TodayShift from '../screens/work/TodayShift'
import EmploymentDetails from '../screens/work/EmploymentDetails'
import Interviews from '../screens/work/Interviews'
import InterviewDetails from '../screens/work/InterviewDetails'
import AttendanceHistory from '../screens/work/AttendanceHistory'

import Profile from '../screens/Profile'
import Earnings from '../screens/Earnings'
import Messages from '../screens/Messages'
import PayoutMethods from '../screens/PayoutMethods'
import Reviews from '../screens/Reviews'
import Settings from '../screens/Settings'
import Help from '../screens/Help'
import { alreadyAsked } from '../permissions/ask'
import { registerChannels } from '../permissions/channels'
import { registerPushToken } from '../permissions/push'
import useNotificationTaps from './useNotificationTaps'

const Stack = createNativeStackNavigator()
const Tab = createBottomTabNavigator()
const hidden = { headerShown: false }

/* Each tab owns a stack so a pushed screen keeps its tab bar context. */
const JobsStack = () => (
  <Stack.Navigator screenOptions={hidden}>
    <Stack.Screen name="FindJobs" component={FindJobs} />
    <Stack.Screen name="Filters" component={Filters} options={{ presentation: 'modal' }} />
    <Stack.Screen name="NearbyJobs" component={NearbyJobs} />
    <Stack.Screen name="JobDetails" component={JobDetails} />
    <Stack.Screen name="EmployerProfile" component={EmployerProfile} />
    <Stack.Screen name="SavedJobs" component={SavedJobs} />
  </Stack.Navigator>
)

const ApplicationsStack = () => (
  <Stack.Navigator screenOptions={hidden}>
    <Stack.Screen name="MyApplications" component={MyApplications} />
    {/* Reachable from a job opened inside this tab. */}
    <Stack.Screen name="EmployerProfile" component={EmployerProfile} />
    <Stack.Screen name="Interviews" component={Interviews} />
    <Stack.Screen name="InterviewDetails" component={InterviewDetails} />
    <Stack.Screen name="ApplicationDetails" component={ApplicationDetails} />
    <Stack.Screen name="WithdrawApplication" component={WithdrawApplication} />
    <Stack.Screen name="Offers" component={Offers} />
    <Stack.Screen name="OfferDetails" component={OfferDetails} />
    <Stack.Screen name="OfferAccepted" component={OfferAccepted} />
    <Stack.Screen name="JoiningInstructions" component={JoiningInstructions} />
    <Stack.Screen name="JobDetails" component={JobDetails} />
  </Stack.Navigator>
)

const MyWorkStack = () => (
  <Stack.Navigator screenOptions={hidden}>
    <Stack.Screen name="MyWork" component={MyWork} />
    <Stack.Screen name="TodayShift" component={TodayShift} />
    <Stack.Screen name="EmploymentDetails" component={EmploymentDetails} />
    <Stack.Screen name="AttendanceHistory" component={AttendanceHistory} />
    <Stack.Screen name="Interviews" component={Interviews} />
    <Stack.Screen name="InterviewDetails" component={InterviewDetails} />
  </Stack.Navigator>
)

const ProfileStack = () => (
  <Stack.Navigator screenOptions={hidden}>
    <Stack.Screen name="Profile" component={Profile} />
    <Stack.Screen name="Earnings" component={Earnings} />
    <Stack.Screen name="SavedJobs" component={SavedJobs} />
    <Stack.Screen name="Messages" component={Messages} />
    {/* Saved work lives in this tab, so opening a job from it must work here. */}
    <Stack.Screen name="JobDetails" component={JobDetails} />
    <Stack.Screen name="EmployerProfile" component={EmployerProfile} />
    <Stack.Screen name="PayoutMethods" component={PayoutMethods} />
    <Stack.Screen name="Reviews" component={Reviews} />
    <Stack.Screen name="Settings" component={Settings} />
    <Stack.Screen name="Help" component={Help} />
    <Stack.Screen name="AttendanceHistory" component={AttendanceHistory} />
    <Stack.Screen name="Interviews" component={Interviews} />
    <Stack.Screen name="InterviewDetails" component={InterviewDetails} />
    {/* The profile menu links to the onboarding steps for editing. */}
    <Stack.Screen name="BasicInfo" component={BasicInfo} />
    <Stack.Screen name="JobPreferences" component={JobPreferences} />
    <Stack.Screen name="SkillsStep" component={SkillsStep} />
    <Stack.Screen name="LocationStep" component={LocationStep} />
  </Stack.Navigator>
)

const ICONS = {
  HomeTab: ['home', 'home-outline'],
  JobsTab: ['briefcase', 'briefcase-outline'],
  ApplicationsTab: ['document-text', 'document-text-outline'],
  MyWorkTab: ['calendar', 'calendar-outline'],
  ProfileTab: ['person', 'person-outline'],
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
        // Sized to fit the icon and its label with room to spare. The default
        // is built for a device with a home indicator; without one the label
        // gets clipped, and a tab you cannot read is a tab nobody uses.
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
      <Tab.Screen name="HomeTab" component={Dashboard} options={{ title: t('tabs.home') }} />
      <Tab.Screen name="JobsTab" component={JobsStack} options={{ title: t('tabs.jobs') }} />
      <Tab.Screen name="ApplicationsTab" component={ApplicationsStack} options={{ title: t('tabs.applications') }} />
      <Tab.Screen name="MyWorkTab" component={MyWorkStack} options={{ title: t('tabs.myWork') }} />
      <Tab.Screen name="ProfileTab" component={ProfileStack} options={{ title: t('tabs.profile') }} />
    </Tab.Navigator>
  )
}

export default function RootNavigator() {
  const { booting, signedIn } = useSession()
  const { t, i18n } = useTranslation()

  // A tapped notification has to reach the navigator, and the navigator does
  // not exist as a hook target - hence a ref handed to the container.
  const navigationRef = useRef(null)
  useNotificationTaps(navigationRef)
  // Null while we are still reading the flag, so the first frame is never the
  // wrong screen - showing Splash and then yanking it away looks like a bug.
  const [askedPermissions, setAskedPermissions] = useState(null)

  useEffect(() => {
    alreadyAsked().then(setAskedPermissions)
  }, [])

  // The channels have to exist before the first notification arrives, or
  // Android files it under its own default and the person's choice of what to
  // silence is ignored. Names are translated, so re-run when the language changes.
  useEffect(() => { registerChannels(t) }, [t, i18n.language])

  // Only once signed in: a token is worthless until we know whose phone it is.
  useEffect(() => {
    if (signedIn) registerPushToken()
  }, [signedIn])

  if (booting || askedPermissions === null) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.white }}>
        <ActivityIndicator size="large" color={colors.blue} />
      </View>
    )
  }

  return (
    <NavigationContainer ref={navigationRef}>
      <Stack.Navigator screenOptions={hidden}>
        {signedIn ? (
          <>
            {/* Onboarding lives inside the signed-in stack: the profile steps
                need a token, and a half-finished profile must still be able to
                reach the app rather than being trapped in the wizard. */}
            <Stack.Screen name="Main" component={MainTabs} />
            <Stack.Screen name="BasicInfo" component={BasicInfo} />
            <Stack.Screen name="JobPreferences" component={JobPreferences} />
            <Stack.Screen name="SkillsStep" component={SkillsStep} />
            <Stack.Screen name="LocationStep" component={LocationStep} />
          </>
        ) : (
          <>
            {/* Straight after install, explain what we are about to ask for
                before Android's own dialogs appear cold. */}
            {askedPermissions ? null : (
              <Stack.Screen name="Permissions" component={Permissions} />
            )}
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
