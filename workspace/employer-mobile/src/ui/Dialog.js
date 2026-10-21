import React, { useEffect, useRef, useState } from 'react'
import { Animated, Modal, Pressable, StyleSheet, Text, View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { colors, radius, space } from '../theme'

/**
 * The app's own pop-up, in place of Android's grey system box.
 *
 * Called exactly like Alert.alert - `Dialog.alert(title, message, buttons)` -
 * so every existing call moves over unchanged. The colour says what kind of
 * news it is before anyone reads a word: red for a problem, green for done,
 * orange for "are you sure", blue for information.
 */

const TONES = {
  error: { icon: 'alert-circle', fg: colors.red, soft: colors.redSoft },
  success: { icon: 'checkmark-circle', fg: colors.green, soft: colors.greenSoft },
  warning: { icon: 'help-circle', fg: colors.orange, soft: colors.orangeSoft },
  info: { icon: 'information-circle', fg: colors.blue, soft: colors.blueSoft },
}

const BAD = /could not|couldn't|failed|error|not enough|wrong|no internet|unknown|required|not allowed|cannot|can't|too long|has not|first\b/i
const GOOD = /saved|done|sent|shortlisted|accepted|success|thank|added|updated|booked/i

function guessTone(title, message, buttons) {
  if (buttons?.some((b) => b.style === 'destructive')) return 'warning'
  const text = `${title || ''} ${message || ''}`
  if (BAD.test(text)) return 'error'
  if (GOOD.test(text)) return 'success'
  return 'info'
}

let show = null
const waiting = []

export const Dialog = {
  /** Same arguments as Alert.alert; a fourth `{ tone }` picks the colour. */
  alert(title, message, buttons, options = {}) {
    const item = {
      title: title || '',
      message: message || '',
      buttons: buttons?.length ? buttons : [{ text: 'OK' }],
      tone: options.tone || guessTone(title, message, buttons),
    }
    if (show) show(item)
    else waiting.push(item)
  },
}

/** Mounted once at the root of the app; every Dialog.alert shows here. */
export function DialogHost() {
  const [queue, setQueue] = useState([])
  const scale = useRef(new Animated.Value(0.92)).current
  const current = queue[0]

  useEffect(() => {
    show = (item) => setQueue((q) => [...q, item])
    if (waiting.length) setQueue((q) => [...q, ...waiting.splice(0)])
    return () => { show = null }
  }, [])

  useEffect(() => {
    if (!current) return
    scale.setValue(0.92)
    Animated.spring(scale, { toValue: 1, friction: 7, tension: 90, useNativeDriver: true }).start()
  }, [current, scale])

  if (!current) return null
  const tone = TONES[current.tone] || TONES.info

  const press = (button) => {
    setQueue((q) => q.slice(1))
    if (button?.onPress) setTimeout(button.onPress, 0)
  }
  const cancel = current.buttons.find((b) => b.style === 'cancel')
  // Cancel first, the real choice last and coloured - the thumb lands on it.
  const ordered = [...current.buttons.filter((b) => b.style === 'cancel'),
    ...current.buttons.filter((b) => b.style !== 'cancel')]
  const stacked = ordered.length > 2 || ordered.some((b) => String(b.text).length > 14)

  return (
    <Modal visible transparent animationType="fade" statusBarTranslucent
      onRequestClose={() => press(cancel || (current.buttons.length === 1 ? current.buttons[0] : null))}>
      <View style={s.scrim}>
        <Animated.View style={[s.card, { transform: [{ scale }] }]}>
          <View style={[s.iconWrap, { backgroundColor: tone.soft }]}>
            <Ionicons name={tone.icon} size={38} color={tone.fg} />
          </View>
          {current.title ? <Text style={s.title}>{current.title}</Text> : null}
          {current.message ? <Text style={[s.message, !current.title && s.messageOnly]}>{current.message}</Text> : null}
          <View style={[s.buttons, stacked && s.buttonsStacked]}>
            {ordered.map((b, i) => {
              const quiet = b.style === 'cancel' || (ordered.length > 1 && i < ordered.length - 1 && b.style !== 'destructive')
              const fill = b.style === 'destructive' ? colors.red : tone.fg
              return (
                <Pressable
                  key={`${b.text}-${i}`}
                  onPress={() => press(b)}
                  style={({ pressed }) => [
                    s.btn, !stacked && { flex: 1 },
                    quiet ? s.btnQuiet : { backgroundColor: fill, borderColor: fill },
                    pressed && { opacity: 0.85 },
                  ]}
                >
                  <Text style={[s.btnText, quiet ? { color: colors.body } : { color: colors.white }]}>
                    {b.text}
                  </Text>
                </Pressable>
              )
            })}
          </View>
        </Animated.View>
      </View>
    </Modal>
  )
}

const s = StyleSheet.create({
  scrim: {
    flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.55)',
    alignItems: 'center', justifyContent: 'center', padding: space.xl,
  },
  card: {
    width: '100%', maxWidth: 400, backgroundColor: colors.white, borderRadius: radius.xl,
    paddingTop: space.xxl, paddingHorizontal: space.xl, paddingBottom: space.xl, alignItems: 'center',
    shadowColor: '#000', shadowOpacity: 0.18, shadowRadius: 24, shadowOffset: { width: 0, height: 10 },
    elevation: 12,
  },
  iconWrap: { width: 72, height: 72, borderRadius: 36, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 19, fontWeight: '800', color: colors.ink, textAlign: 'center', marginTop: space.lg },
  message: { fontSize: 15, lineHeight: 22, color: colors.body, textAlign: 'center', marginTop: space.sm },
  messageOnly: { marginTop: space.lg, color: colors.ink, fontSize: 16 },
  buttons: { flexDirection: 'row', gap: space.sm, alignSelf: 'stretch', marginTop: space.xl },
  buttonsStacked: { flexDirection: 'column-reverse' },
  btn: {
    minHeight: 50, borderRadius: radius.md, borderWidth: 1.5,
    alignItems: 'center', justifyContent: 'center', paddingHorizontal: space.lg,
  },
  btnQuiet: { backgroundColor: colors.white, borderColor: colors.line },
  btnText: { fontSize: 16, fontWeight: '700' },
})
