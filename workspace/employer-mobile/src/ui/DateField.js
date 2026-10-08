import React, { useState } from 'react'
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native'
import DateTimePicker from '@react-native-community/datetimepicker'
import { Ionicons } from '@expo/vector-icons'
import { colors, radius, space } from '../theme'

/**
 * Choosing a date by tapping a calendar, not by typing one.
 *
 * Typing "DD / MM / YYYY" asks someone to know today's date, do the
 * arithmetic for "next Monday", and get the separators right - on a number
 * pad, in a second language. Every one of those is a place to give up, and a
 * mistyped date is a job that starts on the wrong day.
 *
 * The value stays in the DD/MM/YYYY string the rest of the form already uses,
 * so nothing downstream has to change: the picker is the input method, not a
 * new data type.
 */

const pad = (n) => String(n).padStart(2, '0')
const toText = (d) => `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`

/** Parses the form's own format back into a Date, for reopening the picker. */
function fromText(text) {
  const parts = String(text || '').split(/[^0-9]+/).filter(Boolean)
  if (parts.length !== 3) return null
  const [d, m, y] = parts.map(Number)
  if (!y || String(parts[2]).length !== 4) return null
  const date = new Date(y, m - 1, d)
  return Number.isNaN(date.getTime()) ? null : date
}

export default function DateField({
  value, onChange, placeholder = 'Choose a date', minimumDate, maximumDate, disabled,
}) {
  const [open, setOpen] = useState(false)
  const current = fromText(value) || new Date()

  const handle = (event, picked) => {
    // Android fires once and closes itself; iOS keeps the spinner mounted.
    if (Platform.OS === 'android') setOpen(false)
    if (event?.type === 'dismissed' || !picked) return
    onChange(toText(picked))
  }

  return (
    <>
      <Pressable
        onPress={() => !disabled && setOpen(true)}
        style={({ pressed }) => [s.box, pressed && !disabled && s.pressed, disabled && s.off]}
        accessibilityRole="button"
        accessibilityLabel={value || placeholder}
      >
        <Ionicons name="calendar-outline" size={19} color={colors.blue} />
        <Text style={[s.text, !value && s.placeholder]} numberOfLines={1}>
          {value || placeholder}
        </Text>
        <Ionicons name="chevron-down" size={16} color={colors.muted} />
      </Pressable>

      {open ? (
        <DateTimePicker
          value={current}
          mode="date"
          display={Platform.OS === 'ios' ? 'inline' : 'calendar'}
          // Work cannot start in the past, and a date years out is a typo.
          minimumDate={minimumDate ?? new Date()}
          maximumDate={maximumDate}
          onChange={handle}
        />
      ) : null}

      {Platform.OS === 'ios' && open ? (
        <View style={s.doneRow}>
          <Text style={s.done} onPress={() => setOpen(false)}>Done</Text>
        </View>
      ) : null}
    </>
  )
}

const s = StyleSheet.create({
  box: {
    flexDirection: 'row', alignItems: 'center', gap: space.sm,
    minHeight: 52, paddingHorizontal: space.md,
    borderWidth: 1.5, borderColor: colors.line, borderRadius: radius.md,
    backgroundColor: colors.white,
  },
  pressed: { borderColor: colors.blue, backgroundColor: colors.blueSoft },
  off: { opacity: 0.5 },
  text: { flex: 1, fontSize: 16.5, color: colors.ink, fontWeight: '600' },
  placeholder: { color: colors.muted, fontWeight: '400' },
  doneRow: { alignItems: 'flex-end', paddingTop: space.sm },
  done: { fontSize: 16, fontWeight: '700', color: colors.blue, padding: space.sm },
})
