import { Platform } from 'react-native'
import * as Notifications from 'expo-notifications'
import { colors } from '../theme'

/**
 * The notification channels, named in plain words.
 *
 * On Android these names are not decoration: they are the switches a person
 * sees in Settings, and whatever we pass is what they read. Without channels
 * Android files everything under one labelled "Miscellaneous", which is a bad
 * word to meet in any language.
 *
 * Separate channels mean someone fed up with shift reminders can silence those
 * alone and still hear about work. The names are translated, because the phone
 * shows them exactly as given - Android will not translate them for us.
 *
 * Channel names are fixed once created, so changing a name later needs a new
 * id. That is why the ids carry a version.
 */

export const CHANNELS = [
  { id: 'work.v1', key: 'work', importance: 'high' },
  { id: 'shifts.v1', key: 'shifts', importance: 'default' },
  { id: 'office.v1', key: 'office', importance: 'high' },
]

const IMPORTANCE = {
  high: Notifications.AndroidImportance.HIGH,
  default: Notifications.AndroidImportance.DEFAULT,
}

/**
 * @param t  The i18n translator, so the switches read in the person's language.
 */
export async function registerChannels(t) {
  if (Platform.OS !== 'android') return
  try {
    await Promise.all(CHANNELS.map((c) => Notifications.setNotificationChannelAsync(c.id, {
      name: t(`notif.${c.key}Name`),
      description: t(`notif.${c.key}Body`),
      importance: IMPORTANCE[c.importance],
      lightColor: colors.blue,
      vibrationPattern: [0, 250, 250, 250],
    })))
  } catch { /* an older phone without channels still gets notifications */ }
}
