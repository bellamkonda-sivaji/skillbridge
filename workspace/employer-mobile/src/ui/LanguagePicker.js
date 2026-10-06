import React, { useState } from 'react'
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native'
import { useTranslation } from 'react-i18next'
import { Ionicons } from '@expo/vector-icons'
import { LANGUAGES, setLanguage } from '../i18n'
import { colors, radius, shadow, space, HIT } from '../theme'

/**
 * Switching language from the top of the home screen.
 *
 * It lives here, next to the person's own name, because choosing a language is
 * the very first thing that makes the rest of the app readable - and burying it
 * three taps deep in Settings assumes someone can read enough English to find
 * Settings in the first place.
 *
 * The button shows the language's own name in its own script. Someone who reads
 * only Telugu can find "తెలుగు" without reading a word of anything else.
 */
export default function LanguagePicker({ style }) {
  const { i18n } = useTranslation()
  const [open, setOpen] = useState(false)

  const current = LANGUAGES.find((l) => l.code === i18n.language) || LANGUAGES[0]

  const choose = async (code) => {
    setOpen(false)
    if (code !== i18n.language) await setLanguage(code)
  }

  return (
    <>
      <Pressable
        onPress={() => setOpen(true)}
        hitSlop={8}
        accessibilityRole="button"
        accessibilityLabel={current.english}
        style={({ pressed }) => [s.btn, pressed && { opacity: 0.7 }, style]}
      >
        <Ionicons name="language-outline" size={17} color={colors.blue} />
        <Text style={s.label} numberOfLines={1}>{current.native}</Text>
        <Ionicons name="chevron-down" size={14} color={colors.blue} />
      </Pressable>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable style={s.scrim} onPress={() => setOpen(false)}>
          {/* Stops a tap inside the sheet from closing it. */}
          <Pressable style={s.sheet} onPress={() => {}}>
            {LANGUAGES.map((l) => {
              const on = l.code === i18n.language
              return (
                <Pressable
                  key={l.code}
                  onPress={() => choose(l.code)}
                  style={({ pressed }) => [s.row, on && s.rowOn, pressed && { opacity: 0.8 }]}
                >
                  <View style={s.flex}>
                    <Text style={[s.native, on && { color: colors.blue }]}>{l.native}</Text>
                    {/* The English name too, for anyone handed the phone to help. */}
                    <Text style={s.english}>{l.english}</Text>
                  </View>
                  {on ? <Ionicons name="checkmark-circle" size={24} color={colors.blue} /> : null}
                </Pressable>
              )
            })}
          </Pressable>
        </Pressable>
      </Modal>
    </>
  )
}

const s = StyleSheet.create({
  btn: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 10, minHeight: 38, borderRadius: radius.lg,
    backgroundColor: colors.blueSoft, borderWidth: 1, borderColor: colors.blueLine,
    maxWidth: 132,
  },
  label: { fontSize: 15, fontWeight: '700', color: colors.blue, flexShrink: 1 },
  scrim: { flex: 1, backgroundColor: 'rgba(15,23,42,0.45)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: colors.white, borderTopLeftRadius: 22, borderTopRightRadius: 22,
    paddingHorizontal: space.lg, paddingTop: space.lg, paddingBottom: space.xxl,
    ...shadow.raised,
  },
  flex: { flex: 1 },
  row: {
    flexDirection: 'row', alignItems: 'center', minHeight: HIT + 12,
    paddingHorizontal: space.md, borderRadius: radius.lg, marginBottom: space.sm,
    borderWidth: 1.5, borderColor: colors.line,
  },
  rowOn: { borderColor: colors.blue, backgroundColor: colors.blueSoft },
  native: { fontSize: 19, fontWeight: '800', color: colors.ink },
  english: { fontSize: 14, color: colors.muted, marginTop: 1 },
})
