import React, { useState } from 'react'
import {
  ActivityIndicator, Image, Pressable, ScrollView, StyleSheet, Text, TextInput,
  View, Platform,
} from 'react-native'
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { colors, radius, shadow, space, type, HIT } from '../theme'

export * from './format'

/* ============================================================ layout ======= */

/** Every screen sits on this: safe area, background, and an optional scroll. */
export function Screen({ children, scroll = true, style, footer, bg = colors.bg, padded = true }) {
  const insets = useSafeAreaInsets()
  const body = (
    <View style={[padded && { paddingHorizontal: space.lg }, style]}>{children}</View>
  )
  return (
    <SafeAreaView style={[s.screen, { backgroundColor: bg }]} edges={['top', 'left', 'right']}>
      {scroll ? (
        <ScrollView
          style={s.flex}
          contentContainerStyle={{ paddingBottom: (footer ? 16 : insets.bottom + 24) }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {body}
        </ScrollView>
      ) : (
        <View style={s.flex}>{body}</View>
      )}
      {footer ? (
        <View style={[s.footer, { paddingBottom: Math.max(insets.bottom, space.md) }]}>{footer}</View>
      ) : null}
    </SafeAreaView>
  )
}

/** The bar at the top of a pushed screen. `onBack` renders the arrow. */
export function AppBar({ title, onBack, right, subtitle }) {
  return (
    <View style={s.appBar}>
      {onBack ? (
        <Pressable onPress={onBack} hitSlop={12} style={s.appBarBack} accessibilityLabel="Go back">
          <Ionicons name="chevron-back" size={26} color={colors.ink} />
        </Pressable>
      ) : null}
      <View style={s.flex}>
        {title ? <Text style={s.appBarTitle} numberOfLines={1}>{title}</Text> : null}
        {subtitle ? <Text style={s.appBarSub} numberOfLines={1}>{subtitle}</Text> : null}
      </View>
      {right || null}
    </View>
  )
}

export const Row = ({ children, style, gap = space.md, align = 'center' }) => (
  <View style={[{ flexDirection: 'row', alignItems: align, gap }, style]}>{children}</View>
)

export const Spacer = ({ h = space.lg }) => <View style={{ height: h }} />

/* ============================================================ text ========= */

export const H1 = ({ children, style }) => <Text style={[type.h1, style]}>{children}</Text>
export const H2 = ({ children, style }) => <Text style={[type.h2, style]}>{children}</Text>
export const H3 = ({ children, style }) => <Text style={[type.h3, style]}>{children}</Text>
export const Body = ({ children, style, numberOfLines }) => (
  <Text style={[type.body, style]} numberOfLines={numberOfLines}>{children}</Text>
)
export const Small = ({ children, style, numberOfLines }) => (
  <Text style={[type.small, style]} numberOfLines={numberOfLines}>{children}</Text>
)
export const Label = ({ children, style }) => <Text style={[type.label, style]}>{children}</Text>

/* ============================================================ surfaces ===== */

export function Card({ children, style, onPress, padded = true }) {
  const inner = <View style={[s.card, padded && { padding: space.lg }, style]}>{children}</View>
  if (!onPress) return inner
  return (
    <Pressable onPress={onPress} style={({ pressed }) => pressed && s.pressed}>
      {inner}
    </Pressable>
  )
}

/* ============================================================ controls ===== */

const BTN_TONE = {
  primary: { bg: colors.blue, fg: colors.white, border: colors.blue },
  success: { bg: colors.green, fg: colors.white, border: colors.green },
  danger: { bg: colors.red, fg: colors.white, border: colors.red },
  outline: { bg: colors.white, fg: colors.blue, border: colors.blue },
  quiet: { bg: colors.white, fg: colors.body, border: colors.line },
  dangerQuiet: { bg: colors.white, fg: colors.redText, border: colors.redLine },
}

/**
 * The one button.
 *
 * Minimum height is 52 - above the 48 that guidance asks for - because a shop
 * owner is usually using this one-handed with the other on a till.
 */
export function Button({
  title, onPress, tone = 'primary', icon, iconRight, loading, disabled, style,
  full = true, size = 'md',
}) {
  const t = BTN_TONE[tone] || BTN_TONE.primary
  const off = disabled || loading
  return (
    <Pressable
      onPress={off ? undefined : onPress}
      disabled={off}
      accessibilityRole="button"
      accessibilityLabel={title}
      style={({ pressed }) => [
        s.btn,
        size === 'sm' && s.btnSm,
        { backgroundColor: t.bg, borderColor: t.border },
        full && { alignSelf: 'stretch' },
        off && s.btnOff,
        pressed && !off && s.pressed,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={t.fg} />
      ) : (
        <>
          {icon ? <Ionicons name={icon} size={size === 'sm' ? 17 : 20} color={t.fg} /> : null}
          <Text style={[s.btnText, size === 'sm' && { fontSize: 14 }, { color: t.fg }]}>{title}</Text>
          {/* A "next" arrow belongs after the word, not in front of it. */}
          {iconRight ? <Ionicons name={iconRight} size={size === 'sm' ? 17 : 20} color={t.fg} /> : null}
        </>
      )}
    </Pressable>
  )
}

export function Field({ label, hint, error, children, style }) {
  return (
    <View style={[{ marginBottom: space.lg }, style]}>
      {label ? <Label style={{ marginBottom: 6 }}>{label}</Label> : null}
      {children}
      {error ? <Text style={s.fieldError}>{error}</Text> : null}
      {!error && hint ? <Small style={{ marginTop: 5 }}>{hint}</Small> : null}
    </View>
  )
}

export function Input({ style, prefix, right, ...props }) {
  const [focused, setFocused] = useState(false)
  return (
    <View style={[s.inputWrap, focused && s.inputWrapFocus, style]}>
      {prefix ? <Text style={s.inputPrefix}>{prefix}</Text> : null}
      <TextInput
        style={s.input}
        placeholderTextColor={colors.muted}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        {...props}
      />
      {right || null}
    </View>
  )
}

export function PasswordInput(props) {
  const [hidden, setHidden] = useState(true)
  return (
    <Input
      {...props}
      secureTextEntry={hidden}
      autoCapitalize="none"
      right={(
        <Pressable onPress={() => setHidden((h) => !h)} hitSlop={12}>
          <Ionicons name={hidden ? 'eye-outline' : 'eye-off-outline'} size={21} color={colors.muted} />
        </Pressable>
      )}
    />
  )
}

/** A tick box big enough to hit, with the label as part of the target. */
export function CheckRow({ checked, onToggle, children, style }) {
  return (
    <Pressable onPress={onToggle} style={[s.checkRow, style]} accessibilityRole="checkbox"
      accessibilityState={{ checked }}>
      <View style={[s.checkBox, checked && s.checkBoxOn]}>
        {checked ? <Ionicons name="checkmark" size={15} color={colors.white} /> : null}
      </View>
      <View style={s.flex}>{children}</View>
    </Pressable>
  )
}

/** A card-sized radio, the way the mockups present big either/or choices. */
export function ChoiceCard({ selected, onPress, icon, iconTone = colors.blue, title, sub, children }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      style={({ pressed }) => [s.choice, selected && s.choiceOn, pressed && s.pressed]}
    >
      {icon ? (
        <View style={[s.choiceIcon, { backgroundColor: selected ? colors.white : colors.soft }]}>
          <Ionicons name={icon} size={22} color={iconTone} />
        </View>
      ) : null}
      <View style={s.flex}>
        <Text style={s.choiceTitle}>{title}</Text>
        {sub ? <Small style={{ marginTop: 3 }}>{sub}</Small> : null}
        {children}
      </View>
      <View style={[s.radio, selected && s.radioOn]}>
        {selected ? <Ionicons name="checkmark" size={14} color={colors.white} /> : null}
      </View>
    </Pressable>
  )
}

/** A tappable pill. Used for skills, filters and work types. */
export function Chip({ label, selected, onPress, icon, style }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      style={({ pressed }) => [s.chip, selected && s.chipOn, pressed && s.pressed, style]}
    >
      {icon ? (
        <Ionicons name={icon} size={15} color={selected ? colors.blueDark : colors.body} />
      ) : null}
      <Text style={[s.chipText, selected && s.chipTextOn]}>{label}</Text>
    </Pressable>
  )
}

/** A horizontal strip of chips that scrolls - never wraps into a wall. */
export function ChipRow({ options, value, onChange, style }) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={[{ gap: space.sm, paddingVertical: 2 }, style]}
    >
      {options.map((o) => (
        <Chip key={o.value} label={o.label} selected={value === o.value} onPress={() => onChange(o.value)} />
      ))}
    </ScrollView>
  )
}

/** Small coloured status word. `tone` matches the palette, not a hex code. */
export function Badge({ label, tone = 'blue', style }) {
  const map = {
    blue: [colors.blueSoft, colors.blueDark],
    green: [colors.greenSoft, colors.greenText],
    orange: [colors.orangeSoft, colors.orangeText],
    red: [colors.redSoft, colors.redText],
    grey: [colors.soft, colors.body],
    violet: [colors.violetSoft, colors.violet],
  }
  const [bg, fg] = map[tone] || map.blue
  return (
    <View style={[s.badge, { backgroundColor: bg }, style]}>
      <Text style={[s.badgeText, { color: fg }]}>{label}</Text>
    </View>
  )
}

/* ============================================================ states ======= */

export const Loader = ({ label }) => (
  <View style={s.centre}>
    <ActivityIndicator size="large" color={colors.blue} />
    {label ? <Small style={{ marginTop: space.md }}>{label}</Small> : null}
  </View>
)

export function EmptyState({ icon = 'search-outline', title, sub, action }) {
  return (
    <View style={s.centre}>
      <View style={s.emptyIcon}><Ionicons name={icon} size={30} color={colors.muted} /></View>
      <H3 style={{ textAlign: 'center', marginTop: space.md }}>{title}</H3>
      {sub ? <Body style={{ textAlign: 'center', marginTop: 6 }}>{sub}</Body> : null}
      {action ? <View style={{ marginTop: space.lg, alignSelf: 'stretch' }}>{action}</View> : null}
    </View>
  )
}

export function ErrorNote({ children, onRetry }) {
  if (!children) return null
  return (
    <View style={s.errorNote}>
      <Ionicons name="alert-circle-outline" size={20} color={colors.redText} />
      <View style={s.flex}>
        <Text style={s.errorText}>{children}</Text>
      </View>
      {onRetry ? (
        <Pressable onPress={onRetry} hitSlop={10}>
          <Text style={s.errorRetry}>Retry</Text>
        </Pressable>
      ) : null}
    </View>
  )
}

/** The reassurance line under sign-up forms. */
export const SafeNote = ({ children }) => (
  <View style={s.safeNote}>
    <Ionicons name="shield-checkmark-outline" size={17} color={colors.greenText} />
    <Text style={s.safeNoteText}>{children}</Text>
  </View>
)

/* ============================================================ progress ===== */

/** The dots across the top of a wizard, as in the onboarding mockups. */
export function Steps({ total, current, labels }) {
  return (
    <View style={s.steps}>
      {Array.from({ length: total }, (_, i) => {
        const n = i + 1
        const done = n < current
        const active = n === current
        return (
          <React.Fragment key={n}>
            <View style={s.stepItem}>
              <View style={[s.stepDot, (done || active) && s.stepDotOn, done && s.stepDotDone]}>
                {done
                  ? <Ionicons name="checkmark" size={13} color={colors.white} />
                  : <Text style={[s.stepNum, active && { color: colors.white }]}>{n}</Text>}
              </View>
              {labels?.[i] ? (
                <Text style={[s.stepLabel, active && s.stepLabelOn]} numberOfLines={1}>{labels[i]}</Text>
              ) : null}
            </View>
            {n < total ? <View style={[s.stepBar, done && s.stepBarOn]} /> : null}
          </React.Fragment>
        )
      })}
    </View>
  )
}

/** A filled bar, for profile completion. */
export function ProgressBar({ value, tone = colors.blue }) {
  const pct = Math.max(0, Math.min(100, Number(value) || 0))
  return (
    <View style={s.progressTrack}>
      <View style={[s.progressFill, { width: `${pct}%`, backgroundColor: tone }]} />
    </View>
  )
}

/* ============================================================ bits ========= */

/**
 * A photo when there is one, initials when there is not - and initials again
 * if the photo fails to load, which base64 data URLs from an old record do.
 */
export function Avatar({ uri, name, size = 48, style }) {
  const [failed, setFailed] = useState(false)
  const initials = String(name || '?')
    .split(' ').filter(Boolean).slice(0, 2).map((w) => w[0]).join('').toUpperCase()
  if (uri && !failed) {
    return (
      <Image
        source={{ uri }}
        onError={() => setFailed(true)}
        style={[{ width: size, height: size, borderRadius: size / 2 }, style]}
      />
    )
  }
  return (
    <View style={[s.avatar, { width: size, height: size, borderRadius: size / 2 }, style]}>
      <Text style={[s.avatarText, { fontSize: size * 0.36 }]}>{initials}</Text>
    </View>
  )
}

/** A labelled fact, the pattern used all over the detail screens. */
export function Fact({ icon, label, value, tone = colors.muted }) {
  return (
    <View style={s.fact}>
      <Ionicons name={icon} size={18} color={tone} style={{ marginTop: 1 }} />
      <View style={s.flex}>
        <Small>{label}</Small>
        <Text style={s.factValue}>{value ?? '—'}</Text>
      </View>
    </View>
  )
}

/** Key on the left, value on the right - the review and summary screens. */
export function KV({ k, v, strong }) {
  return (
    <View style={s.kv}>
      <Text style={s.kvKey}>{k}</Text>
      <Text style={[s.kvValue, strong && { fontWeight: '800', color: colors.ink }]}>{v ?? '—'}</Text>
    </View>
  )
}

export function ListRow({ icon, title, sub, onPress, right, tone = colors.blue }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [s.listRow, pressed && s.pressed]}>
      {icon ? (
        <View style={s.listIcon}><Ionicons name={icon} size={19} color={tone} /></View>
      ) : null}
      <View style={s.flex}>
        <Text style={s.listTitle}>{title}</Text>
        {sub ? <Small style={{ marginTop: 2 }}>{sub}</Small> : null}
      </View>
      {right !== undefined ? right : <Ionicons name="chevron-forward" size={19} color={colors.muted} />}
    </Pressable>
  )
}

/** Tabs inside a screen (All / Pending / Shortlisted). */
export function SegTabs({ tabs, value, onChange }) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ gap: space.sm, paddingVertical: 2 }}>
      {tabs.map((t) => (
        <Pressable
          key={t.value}
          onPress={() => onChange(t.value)}
          style={({ pressed }) => [s.seg, value === t.value && s.segOn, pressed && s.pressed]}
        >
          <Text style={[s.segText, value === t.value && s.segTextOn]}>{t.label}</Text>
        </Pressable>
      ))}
    </ScrollView>
  )
}

/** The celebratory full-screen confirmation the mockups use after big actions. */
export function SuccessPanel({ icon = 'checkmark', title, sub, tone = colors.green, children }) {
  return (
    <View style={s.success}>
      <View style={[s.successIcon, { backgroundColor: tone }]}>
        <Ionicons name={icon} size={46} color={colors.white} />
      </View>
      <H1 style={{ textAlign: 'center', marginTop: space.xl }}>{title}</H1>
      {sub ? <Body style={{ textAlign: 'center', marginTop: space.sm }}>{sub}</Body> : null}
      {children}
    </View>
  )
}

const s = StyleSheet.create({
  flex: { flex: 1 },
  screen: { flex: 1 },
  pressed: { opacity: 0.75 },
  centre: { alignItems: 'center', justifyContent: 'center', paddingVertical: space.xxxl },

  footer: {
    paddingHorizontal: space.lg, paddingTop: space.md,
    borderTopWidth: 1, borderTopColor: colors.line, backgroundColor: colors.white,
  },

  appBar: {
    flexDirection: 'row', alignItems: 'center', gap: space.sm,
    paddingHorizontal: space.lg, paddingVertical: space.md, backgroundColor: colors.white,
    borderBottomWidth: 1, borderBottomColor: colors.line,
  },
  appBarBack: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center', marginLeft: -6 },
  appBarTitle: { fontSize: 18, fontWeight: '800', color: colors.ink },
  appBarSub: { fontSize: 12.5, color: colors.muted, marginTop: 1 },

  card: {
    backgroundColor: colors.white, borderRadius: radius.lg,
    borderWidth: 1, borderColor: colors.line, ...shadow.card,
  },

  btn: {
    minHeight: 52, borderRadius: radius.md, borderWidth: 1,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: space.sm, paddingHorizontal: space.xl,
  },
  btnSm: { minHeight: 42, paddingHorizontal: space.lg, borderRadius: radius.sm },
  btnOff: { opacity: 0.5 },
  btnText: { fontSize: 16, fontWeight: '700' },

  inputWrap: {
    flexDirection: 'row', alignItems: 'center', gap: space.sm,
    minHeight: HIT, borderWidth: 1.5, borderColor: colors.line, borderRadius: radius.md,
    paddingHorizontal: space.md, backgroundColor: colors.white,
  },
  inputWrapFocus: { borderColor: colors.blue },
  input: { flex: 1, fontSize: 16, color: colors.ink, paddingVertical: Platform.OS === 'ios' ? 13 : 9 },
  inputPrefix: { fontSize: 16, color: colors.body, fontWeight: '600' },
  fieldError: { fontSize: 13, color: colors.redText, marginTop: 5 },

  checkRow: { flexDirection: 'row', alignItems: 'flex-start', gap: space.md, paddingVertical: space.sm },
  checkBox: {
    width: 24, height: 24, borderRadius: 6, borderWidth: 2, borderColor: colors.muted,
    alignItems: 'center', justifyContent: 'center', marginTop: 1,
  },
  checkBoxOn: { backgroundColor: colors.blue, borderColor: colors.blue },

  choice: {
    flexDirection: 'row', alignItems: 'center', gap: space.md,
    borderWidth: 2, borderColor: colors.line, borderRadius: radius.lg,
    padding: space.lg, backgroundColor: colors.white, marginBottom: space.md,
  },
  choiceOn: { borderColor: colors.blue, backgroundColor: colors.blueSoft },
  choiceIcon: { width: 46, height: 46, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  choiceTitle: { fontSize: 16, fontWeight: '700', color: colors.ink },
  radio: {
    width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: colors.muted,
    alignItems: 'center', justifyContent: 'center',
  },
  radioOn: { backgroundColor: colors.blue, borderColor: colors.blue },

  chip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    borderWidth: 1.5, borderColor: colors.line, borderRadius: radius.pill,
    paddingHorizontal: space.lg, minHeight: 40, backgroundColor: colors.white,
    justifyContent: 'center',
  },
  chipOn: { borderColor: colors.blue, backgroundColor: colors.blueSoft },
  chipText: { fontSize: 14, fontWeight: '600', color: colors.body },
  chipTextOn: { color: colors.blueDark },

  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: radius.pill, alignSelf: 'flex-start' },
  badgeText: { fontSize: 12, fontWeight: '700' },

  emptyIcon: {
    width: 64, height: 64, borderRadius: 32, backgroundColor: colors.soft,
    alignItems: 'center', justifyContent: 'center',
  },

  errorNote: {
    flexDirection: 'row', alignItems: 'center', gap: space.sm,
    backgroundColor: colors.redSoft, borderWidth: 1, borderColor: colors.redLine,
    borderRadius: radius.md, padding: space.md, marginBottom: space.md,
  },
  errorText: { fontSize: 14, color: colors.redText },
  errorRetry: { fontSize: 14, fontWeight: '700', color: colors.redText },

  safeNote: {
    flexDirection: 'row', alignItems: 'center', gap: space.sm,
    backgroundColor: colors.greenSoft, borderRadius: radius.md, padding: space.md,
  },
  safeNoteText: { fontSize: 13.5, color: colors.greenText, flex: 1 },

  steps: { flexDirection: 'row', alignItems: 'flex-start', paddingVertical: space.md },
  stepItem: { alignItems: 'center', width: 58 },
  stepDot: {
    width: 28, height: 28, borderRadius: 14, backgroundColor: colors.line,
    alignItems: 'center', justifyContent: 'center',
  },
  stepDotOn: { backgroundColor: colors.blue },
  stepDotDone: { backgroundColor: colors.green },
  stepNum: { fontSize: 13, fontWeight: '800', color: colors.muted },
  stepLabel: { fontSize: 10.5, color: colors.muted, marginTop: 5 },
  stepLabelOn: { color: colors.blueDark, fontWeight: '700' },
  stepBar: { flex: 1, height: 2, backgroundColor: colors.line, marginTop: 13 },
  stepBarOn: { backgroundColor: colors.green },

  progressTrack: { height: 8, borderRadius: 4, backgroundColor: colors.line, overflow: 'hidden' },
  progressFill: { height: 8, borderRadius: 4 },

  avatar: { backgroundColor: colors.blueSoft, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: colors.blueDark, fontWeight: '800' },

  fact: { flexDirection: 'row', gap: space.sm, alignItems: 'flex-start', flex: 1, minWidth: 130 },
  factValue: { fontSize: 15, fontWeight: '700', color: colors.ink, marginTop: 1 },

  kv: {
    flexDirection: 'row', justifyContent: 'space-between', gap: space.md,
    paddingVertical: 9, alignItems: 'flex-start',
  },
  kvKey: { fontSize: 14, color: colors.body, flexShrink: 0 },
  kvValue: { fontSize: 14, fontWeight: '600', color: colors.ink, flex: 1, textAlign: 'right' },

  listRow: {
    flexDirection: 'row', alignItems: 'center', gap: space.md,
    paddingVertical: space.md, minHeight: 56,
  },
  listIcon: {
    width: 38, height: 38, borderRadius: 11, backgroundColor: colors.soft,
    alignItems: 'center', justifyContent: 'center',
  },
  listTitle: { fontSize: 15, fontWeight: '600', color: colors.ink },

  seg: {
    paddingHorizontal: space.lg, minHeight: 38, justifyContent: 'center',
    borderRadius: radius.pill, backgroundColor: colors.white,
    borderWidth: 1, borderColor: colors.line,
  },
  segOn: { backgroundColor: colors.blue, borderColor: colors.blue },
  segText: { fontSize: 14, fontWeight: '600', color: colors.body },
  segTextOn: { color: colors.white },

  success: { alignItems: 'center', paddingVertical: space.xxxl, paddingHorizontal: space.lg },
  successIcon: { width: 86, height: 86, borderRadius: 43, alignItems: 'center', justifyContent: 'center' },
})

export { s as uiStyles }
