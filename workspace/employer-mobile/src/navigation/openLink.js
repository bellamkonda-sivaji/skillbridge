/**
 * Where a notification should land.
 *
 * The server sends a path with every notification - "/employer/applications",
 * "/employer/jobs/42" - and this turns it into a screen. Without it a tap just
 * reopens whatever was last on screen, which for someone told "a worker
 * applied" is indistinguishable from nothing having happened.
 *
 * Unknown paths fall through to the dashboard rather than throwing: a server
 * that learns a new link before the app does should still open something.
 */

/**
 * Which tab owns each screen.
 *
 * Every one of these is nested inside a tab's own stack, so navigating to the
 * bare name does nothing at all - the route is not on the root navigator.
 * Screens shared into every stack (ApplicantProfile, InterviewCalendar and
 * the rest) are reachable from whichever tab is showing, so they are listed
 * against the tab they belong with rather than left out.
 */
const TABS = {
  Applications: 'ApplicantsTab',
  JobApplicants: 'ApplicantsTab',
  ApplicantProfile: 'ApplicantsTab',
  InterviewCalendar: 'ApplicantsTab',
  MyJobs: 'JobsTab',
  JobManagement: 'JobsTab',
  MyTeam: 'TeamTab',
  Attendance: 'TeamTab',
  Payroll: 'TeamTab',
  OfferTracking: 'TeamTab',
}

export function resolveLink(link) {
  const path = String(link || '').split('?')[0].replace(/\/+$/, '')
  if (!path) return null

  const job = path.match(/^\/employer\/jobs\/(\d+)$/)
  if (job) return { screen: 'JobManagement', params: { jobId: Number(job[1]) } }

  const applicant = path.match(/^\/employer\/applications\/(\d+)$/)
  if (applicant) {
    return { screen: 'ApplicantProfile', params: { applicationId: Number(applicant[1]) } }
  }

  switch (path) {
    case '/employer/applications': return { screen: 'Applications' }
    case '/employer/employments': return { screen: 'MyTeam' }
    case '/employer/interviews': return { screen: 'InterviewCalendar' }
    case '/employer/attendance':
    case '/employer/attendance/requests': return { screen: 'Attendance' }
    case '/employer/wallet': return { screen: 'Payroll' }
    case '/employer/jobs': return { screen: 'MyJobs' }
    case '/messages': return { screen: 'Applications' }
    default: return null
  }
}

export function openLink(navigation, link) {
  const target = resolveLink(link)
  if (!navigation) return false
  if (!target) {
    navigation.navigate('Main', { screen: 'HomeTab' })
    return false
  }
  const tab = TABS[target.screen]
  if (tab) {
    navigation.navigate('Main', {
      screen: tab,
      params: { screen: target.screen, params: target.params },
    })
  } else {
    navigation.navigate(target.screen, target.params)
  }
  return true
}
