/**
 * Where a notification should land.
 *
 * The server sends a path with every notification - "/worker/offers",
 * "/jobs/42" - and this turns it into a screen. Without it a tap just opens
 * the app on whatever was last on screen, which for someone who was told
 * "you have an offer" is indistinguishable from the offer not existing.
 *
 * Unknown paths fall through to the home tab rather than throwing. A server
 * that learns a new link before the app does should still open something
 * sensible, not crash on a notification.
 */

/**
 * Which tab owns each screen.
 *
 * Every one of these is nested inside a tab's own stack, so navigating to the
 * bare name silently does nothing - the route does not exist on the root
 * navigator. Several screens appear in more than one stack; they are listed
 * against the tab a person would expect to back out into.
 */
const TABS = {
  MyApplications: 'ApplicationsTab',
  ApplicationDetails: 'ApplicationsTab',
  Offers: 'ApplicationsTab',
  OfferDetails: 'ApplicationsTab',
  Interviews: 'MyWorkTab',
  InterviewDetails: 'MyWorkTab',
  MyWork: 'MyWorkTab',
  TodayShift: 'MyWorkTab',
  AttendanceHistory: 'MyWorkTab',
  Earnings: 'ProfileTab',
  Messages: 'ProfileTab',
  NearbyJobs: 'JobsTab',
  JobDetails: 'JobsTab',
}

export function resolveLink(link) {
  const path = String(link || '').split('?')[0].replace(/\/+$/, '')
  if (!path) return null

  // "/jobs/42" - the id is the point of the notification.
  const job = path.match(/^\/jobs\/(\d+)$/)
  if (job) return { screen: 'JobDetails', params: { jobId: Number(job[1]) } }

  const application = path.match(/^\/worker\/applications\/(\d+)$/)
  if (application) {
    return { screen: 'ApplicationDetails', params: { applicationId: Number(application[1]) } }
  }

  const offer = path.match(/^\/worker\/offers\/(\d+)$/)
  if (offer) return { screen: 'OfferDetails', params: { offerId: Number(offer[1]) } }

  switch (path) {
    case '/worker/applications': return { screen: 'MyApplications' }
    case '/worker/offers': return { screen: 'Offers' }
    case '/worker/interviews': return { screen: 'Interviews' }
    case '/worker/attendance': return { screen: 'MyWork' }
    case '/worker/wallet': return { screen: 'Earnings' }
    case '/messages': return { screen: 'Messages' }
    case '/jobs': return { screen: 'NearbyJobs' }
    default: return null
  }
}

/**
 * @param navigation  A navigation object from the root container.
 */
export function openLink(navigation, link) {
  const target = resolveLink(link)
  if (!navigation) return false
  if (!target) {
    navigation.navigate('Main', { screen: 'HomeTab' })
    return false
  }
  const tab = TABS[target.screen]
  if (tab) {
    // Focus the tab first, then push the screen inside it, or the back button
    // takes them out of the app instead of to the list they came from.
    navigation.navigate('Main', {
      screen: tab,
      params: { screen: target.screen, params: target.params },
    })
  } else {
    navigation.navigate(target.screen, target.params)
  }
  return true
}
