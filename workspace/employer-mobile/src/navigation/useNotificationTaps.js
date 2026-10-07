import { useEffect, useRef } from 'react'
import * as Notifications from 'expo-notifications'
import { openLink } from './openLink'

/**
 * Taking a tapped notification to the screen it is about.
 *
 * Two cases, and the second is the one that is usually missed. If the app is
 * already running, a listener fires. If the app was closed, the tap launches
 * it and there is no event at all - the response is waiting in
 * getLastNotificationResponseAsync, and must be read once on startup.
 *
 * Both are guarded against navigating before the container is ready, and
 * against handling the same cold-start response twice, which would bounce
 * someone off the screen they had already navigated away from.
 */
export default function useNotificationTaps(navigationRef) {
  const handled = useRef(new Set())

  useEffect(() => {
    let alive = true

    const handle = (response) => {
      const id = response?.notification?.request?.identifier
      if (id) {
        if (handled.current.has(id)) return
        handled.current.add(id)
      }
      const link = response?.notification?.request?.content?.data?.link
      if (!link) return
      // The container is mounted by the time a tap can happen, but a cold
      // start races it, so wait for readiness rather than assuming it.
      const go = () => {
        if (!alive) return
        if (navigationRef.current?.isReady()) openLink(navigationRef.current, link)
        else setTimeout(go, 120)
      }
      go()
    }

    // Launched by tapping a notification while the app was not running.
    Notifications.getLastNotificationResponseAsync()
      .then((response) => { if (alive && response) handle(response) })
      .catch(() => {})

    const sub = Notifications.addNotificationResponseReceivedListener(handle)
    return () => { alive = false; sub.remove() }
  }, [navigationRef])
}
