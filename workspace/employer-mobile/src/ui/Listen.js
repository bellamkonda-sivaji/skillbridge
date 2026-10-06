import React, { useEffect, useState } from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import * as Speech from 'expo-speech'
import { useTranslation } from 'react-i18next'
import { Ionicons } from '@expo/vector-icons'
import { colors, radius, space, HIT } from '../theme'

/**
 * A button that reads something aloud.
 *
 * Plenty of the people using this app can follow spoken Telugu or Hindi fluently
 * but cannot read it quickly. Wherever misreading costs real money - the pay on
 * a job, the terms of an offer, what a document is for - they should be able to
 * hear it instead of guessing.
 *
 * It speaks in whatever language the app is already in, because that is the
 * language they chose to read in.
 */

const VOICE = { en: 'en-IN', te: 'te-IN', hi: 'hi-IN' }

/** A slower-than-default rate: this is being listened to, not skimmed. */
const RATE = 0.92

export function speakLanguage(lng) {
  return VOICE[(lng || 'en').split('-')[0]] || VOICE.en
}

/**
 * @param {string} text  What to read. Build it in the caller so the spoken
 *                       version can differ from the printed one - "seven
 *                       hundred rupees a day" reads better than "₹700/day".
 */
export default function Listen({ text, label, style, tone = 'soft' }) {
  const { t, i18n } = useTranslation()
  const [speaking, setSpeaking] = useState(false)

  // Leaving a screen mid-sentence should stop the voice, not follow the user.
  useEffect(() => () => { Speech.stop() }, [])

  const toggle = () => {
    if (speaking) {
      Speech.stop()
      setSpeaking(false)
      return
    }
    if (!text || !text.trim()) return
    setSpeaking(true)
    Speech.speak(text, {
      language: speakLanguage(i18n.language),
      rate: RATE,
      onDone: () => setSpeaking(false),
      onStopped: () => setSpeaking(false),
      // A missing voice must not look like a broken button.
      onError: () => setSpeaking(false),
    })
  }

  const solid = tone === 'solid'

  return (
    <Pressable
      onPress={toggle}
      hitSlop={10}
      accessibilityRole="button"
      accessibilityLabel={label || t('listen.read')}
      style={({ pressed }) => [
        s.btn,
        solid ? s.solid : s.soft,
        pressed && { opacity: 0.75 },
        style,
      ]}
    >
      <Ionicons
        name={speaking ? 'stop' : 'volume-high'}
        size={20}
        color={solid ? colors.white : colors.blue}
      />
      <Text style={[s.label, solid && { color: colors.white }]}>
        {speaking ? t('listen.stop') : (label || t('listen.listen'))}
      </Text>
    </Pressable>
  )
}

/** Speaks without a button - for a screen that should announce itself. */
export function speak(text, lng) {
  if (!text) return
  Speech.stop()
  Speech.speak(text, { language: speakLanguage(lng), rate: RATE })
}

const s = StyleSheet.create({
  btn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    minHeight: HIT, paddingHorizontal: space.md,
    borderRadius: radius.lg, alignSelf: 'flex-start',
  },
  soft: { backgroundColor: colors.blueSoft, borderWidth: 1, borderColor: colors.blueLine },
  solid: { backgroundColor: colors.blue },
  label: { fontSize: 16, fontWeight: '700', color: colors.blue },
})
