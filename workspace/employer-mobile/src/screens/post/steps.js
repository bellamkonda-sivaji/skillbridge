import React from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { useTranslation } from 'react-i18next'
import { Ionicons } from '@expo/vector-icons'
import {
  Body, Card, CheckRow, Chip, ChoiceCard, Field, H2, Input, KV, Row, Small, money,
} from '../../ui'
import {
  BENEFITS, DAYS, ENGAGEMENT_MODELS, HIRING_METHODS, LANGUAGE_OPTIONS,
  SALARY_UNITS, SKILLS, WORKER_TYPES, splitPrice,
} from '../../ui/catalog'
import { colors, radius, space } from '../../theme'
import DateField from '../../ui/DateField'

/** The form keeps dates as DD/MM/YYYY text; the picker needs a real Date. */
function dateOf(text) {
  const parts = String(text || '').split(/[^0-9]+/).filter(Boolean)
  if (parts.length !== 3) return undefined
  const [d, m, y] = parts.map(Number)
  const out = new Date(y, m - 1, d)
  return Number.isNaN(out.getTime()) ? undefined : out
}

const Head = ({ title, sub }) => (
  <View style={{ marginBottom: space.lg }}>
    <H2>{title}</H2>
    {sub ? <Body style={{ marginTop: 5 }}>{sub}</Body> : null}
  </View>
)

/* ---------------------------------------------------- 1. worker type ------ */

export function StepWorkerType({ draft, set, lang, t }) {
  return (
    <View>
      <Head title={t('post.workerType')} sub={t('post.workerTypeSub')} />
      <View style={s.grid}>
        {WORKER_TYPES.map((w) => {
          const on = draft.workerCategory === w.value
          return (
            <Pressable
              key={w.value}
              onPress={() => set({
                workerCategory: w.value,
                // Suggest a title so nobody has to invent one, but leave it editable.
                title: draft.title || w.suggests,
              })}
              style={({ pressed }) => [s.tile, on && s.tileOn, pressed && { opacity: 0.85 }]}
            >
              {on ? <View style={s.tick}><Ionicons name="checkmark" size={12} color={colors.white} /></View> : null}
              <Ionicons name={w.icon} size={26} color={on ? colors.blueDark : colors.blue} />
              <Text style={[s.tileText, on && { color: colors.blueDark }]} numberOfLines={2}>
                {w[lang] || w.en}
              </Text>
            </Pressable>
          )
        })}
      </View>
    </View>
  )
}

/* ---------------------------------------------------- 2. how long --------- */

export function StepEmployment({ draft, set, lang, t }) {
  return (
    <View>
      <Head title={t('post.employmentType')} />
      {ENGAGEMENT_MODELS.map((m) => (
        <ChoiceCard
          key={m.value}
          selected={draft.engagementModel === m.value}
          onPress={() => set({
            engagementModel: m.value,
            // A few days or weeks always runs between two dates; only monthly
            // work can be open-ended. Carrying "ongoing" across from the
            // default left short work with no dates at all.
            durationType: (m.value === 'FEW_DAYS' || m.value === 'FEW_WEEKS')
              ? 'SPECIFIC' : draft.durationType,
            // Keep the pay basis valid for the length chosen - a monthly salary
            // on a one-day job is not a thing.
            salaryUnit: m.defaultUnit,
          })}
          icon={m.icon}
          title={m[lang] || m.en}
          sub={m.subEn}
        />
      ))}
    </View>
  )
}

/* ---------------------------------------------------- 3. details ---------- */

export function StepDetails({ draft, set, t }) {
  const responsibilities = draft.responsibilities || []
  const addResponsibility = () => set({ responsibilities: [...responsibilities, ''] })
  const setResponsibility = (i, v) =>
    set({ responsibilities: responsibilities.map((r, idx) => (idx === i ? v : r)) })
  const removeResponsibility = (i) =>
    set({ responsibilities: responsibilities.filter((_, idx) => idx !== i) })

  return (
    <View>
      <Head title={t('post.detailsTitle')} />

      <Field label={t('post.jobTitle')}>
        <Input value={draft.title} onChangeText={(v) => set({ title: v })}
          placeholder="Store Helper" autoCapitalize="words" />
      </Field>

      <Field label={t('post.openings')}>
        <Row>
          <Pressable style={s.stepBtn}
            onPress={() => set({ workersNeeded: Math.max(1, (draft.workersNeeded || 1) - 1) })}>
            <Text style={s.stepBtnText}>−</Text>
          </Pressable>
          <View style={s.counter}><Text style={s.counterText}>{draft.workersNeeded || 1}</Text></View>
          <Pressable style={s.stepBtn}
            onPress={() => set({ workersNeeded: (draft.workersNeeded || 1) + 1 })}>
            <Text style={s.stepBtnText}>+</Text>
          </Pressable>
        </Row>
      </Field>

      <Field label={t('post.description')}>
        <Input
          value={draft.description}
          onChangeText={(v) => set({ description: v })}
          placeholder="We need a helper for shelf arrangement, billing support and cleaning."
          multiline
          maxLength={500}
          style={{ minHeight: 110, alignItems: 'flex-start' }}
        />
        <Small style={{ alignSelf: 'flex-end', marginTop: 4 }}>
          {(draft.description || '').length}/500
        </Small>
      </Field>

      <Field label={t('post.responsibilities')} hint={t('common.optional')}>
        {responsibilities.map((r, i) => (
          <Row key={i} style={{ marginBottom: space.sm }}>
            <Input value={r} onChangeText={(v) => setResponsibility(i, v)}
              placeholder="Arrange items on shelves" style={{ flex: 1 }} />
            <Pressable onPress={() => removeResponsibility(i)} hitSlop={10}>
              <Ionicons name="close-circle" size={24} color={colors.muted} />
            </Pressable>
          </Row>
        ))}
        <Pressable onPress={addResponsibility} style={s.addRow}>
          <Ionicons name="add-circle-outline" size={19} color={colors.blue} />
          <Text style={s.addText}>{t('post.addResponsibility')}</Text>
        </Pressable>
      </Field>
    </View>
  )
}

/* ---------------------------------------------------- 4. schedule --------- */

export function StepSchedule({ draft, set, t }) {
  const days = draft.workingDays || []
  const toggleDay = (d) =>
    set({ workingDays: days.includes(d) ? days.filter((x) => x !== d) : [...days, d] })
  const oneDay = draft.engagementModel === 'ONE_DAY'
  // A few days and a few weeks both run between two dates. "Ongoing" is a
  // contradiction for them, and without dates a worker cannot tell which days
  // they are being asked to turn up - which is the whole point of the answer.
  const shortTerm = draft.engagementModel === 'FEW_DAYS'
    || draft.engagementModel === 'FEW_WEEKS'
  const span = daysBetween(draft.startDate, draft.endDate)

  return (
    <View>
      <Head title={t('post.scheduleTitle')} />

      {oneDay ? (
        <Field label={t('post.workDate')}>
          <DateField value={draft.workDate} onChange={(v) => set({ workDate: v })}
            placeholder={t('post.chooseDate')} />
        </Field>
      ) : (
        <>
          <Field label={t('post.workingDays')}>
            <View style={s.dayRow}>
              {DAYS.map((d) => (
                <Pressable
                  key={d.value}
                  onPress={() => toggleDay(d.value)}
                  style={[s.day, days.includes(d.value) && s.dayOn]}
                >
                  <Text style={[s.dayText, days.includes(d.value) && s.dayTextOn]}>{d.en}</Text>
                </Pressable>
              ))}
            </View>
          </Field>

          {/* Only work measured in months can be open-ended. */}
          {shortTerm ? null : (
            <Field label={t('post.duration')}>
              <ChoiceCard
                selected={draft.durationType === 'ONGOING'}
                onPress={() => set({ durationType: 'ONGOING' })}
                icon="infinite-outline"
                title={t('post.ongoing')}
              />
              <ChoiceCard
                selected={draft.durationType === 'SPECIFIC'}
                onPress={() => set({ durationType: 'SPECIFIC' })}
                icon="calendar-outline"
                title={t('post.specificPeriod')}
              />
            </Field>
          )}

          {shortTerm || draft.durationType === 'SPECIFIC' ? (
            <Row align="flex-start">
              <Field label={t('post.startDate')} style={{ flex: 1 }}>
                <DateField value={draft.startDate} onChange={(v) => set({ startDate: v })}
                  placeholder={t('post.chooseDate')} />
              </Field>
              <Field label={t('post.endDate')} style={{ flex: 1 }}>
                {/* Cannot end before it starts, so the picker will not offer it. */}
                <DateField value={draft.endDate} onChange={(v) => set({ endDate: v })}
                  placeholder={t('post.chooseDate')} minimumDate={dateOf(draft.startDate)}
                  maximumDate={shortTerm ? lastAllowed(draft.startDate) : undefined} />
              </Field>
            </Row>
          ) : null}

          {/* Said while they are choosing, not after they press Continue. */}
          {shortTerm && span > 0 ? (
            <Small style={{ marginTop: -space.sm, marginBottom: space.md }}>
              {span > MAX_SHORT_DAYS
                ? t('post.tooLongForShort')
                : t('post.spanDays', { days: span })}
            </Small>
          ) : null}
        </>
      )}

      <Field label={t('post.shiftTimings')}>
        <Row align="flex-start">
          <View style={{ flex: 1 }}>
            <Small style={{ marginBottom: 5 }}>{t('post.startTime')}</Small>
            <Input value={draft.startTime} onChangeText={(v) => set({ startTime: v })}
              placeholder="09:00" />
          </View>
          <View style={{ flex: 1 }}>
            <Small style={{ marginBottom: 5 }}>{t('post.endTime')}</Small>
            <Input value={draft.endTime} onChangeText={(v) => set({ endTime: v })}
              placeholder="18:00" />
          </View>
        </Row>
      </Field>

      <Field label={t('post.breakTime')} hint={t('common.optional')}>
        <View style={s.wrap}>
          {[0, 30, 60, 90].map((m) => (
            <Chip key={m} label={m === 0 ? 'None' : `${m} min`}
              selected={(draft.breakMinutes || 0) === m}
              onPress={() => set({ breakMinutes: m })} />
          ))}
        </View>
      </Field>
    </View>
  )
}

/* ---------------------------------------------------- 5. salary ----------- */

export function StepSalary({ draft, set, t }) {
  const units = (ENGAGEMENT_MODELS.find((m) => m.value === draft.engagementModel)?.units)
    || ['DAILY', 'MONTHLY']
  const allowed = SALARY_UNITS.filter((u) => units.includes(u.value))
  const split = splitPrice(draft.salary)
  const benefits = draft.benefits || []
  const toggleBenefit = (v) =>
    set({ benefits: benefits.includes(v) ? benefits.filter((x) => x !== v) : [...benefits, v] })

  return (
    <View>
      <Head title={t('post.salaryTitle')} />

      <Field label={t('post.salaryType')}>
        <View style={s.wrap}>
          {allowed.map((u) => (
            <Chip key={u.value} label={t(`post.${u.key}`)} selected={draft.salaryUnit === u.value}
              onPress={() => set({ salaryUnit: u.value })} />
          ))}
        </View>
      </Field>

      <Field label={t('post.amount')}>
        <Input
          value={draft.salary ? String(draft.salary) : ''}
          onChangeText={(v) => set({ salary: v.replace(/\D/g, '') })}
          placeholder="700"
          keyboardType="number-pad"
          prefix="₹"
        />
      </Field>

      {/* What the employer pays, and nothing else. How the platform is funded
          is between us and nobody else: an employer does not need to know what
          we pay the worker any more than the worker needs to know what was
          posted. One number, the one they are agreeing to. */}
      {split.total > 0 ? (
        <Card style={{ marginBottom: space.lg }} padded={false}>
          <View style={[s.splitRow, s.splitTotal]}>
            <Text style={[s.splitKey, { fontWeight: '700' }]}>{t('post.youPay')}</Text>
            <Text style={[s.splitValue, { fontSize: 19 }]}>{money(split.total)}</Text>
          </View>
          <View style={{ padding: space.md }}>
            <Small>{t('post.payNote')}</Small>
          </View>
        </Card>
      ) : null}

      <Field label={t('post.benefits')} hint={t('common.optional')}>
        {BENEFITS.map((bn) => (
          <CheckRow key={bn.value} checked={benefits.includes(bn.value)}
            onToggle={() => toggleBenefit(bn.value)}>
            <Row gap={space.sm}>
              <Ionicons name={bn.icon} size={18} color={colors.body} />
              <Body style={{ fontSize: 14.5 }}>{t(`post.${bn.key}`)}</Body>
            </Row>
          </CheckRow>
        ))}
      </Field>
    </View>
  )
}

/* ---------------------------------------------------- 6. requirements ----- */

export function StepRequirements({ draft, set, t }) {
  const skills = draft.requiredSkills || []
  const langs = draft.languages || []
  const toggle = (key, list, v) =>
    set({ [key]: list.includes(v) ? list.filter((x) => x !== v) : [...list, v] })

  return (
    <View>
      <Head title={t('post.requirementsTitle')} />

      <Field label={t('post.skills')}>
        <View style={s.wrap}>
          {SKILLS.map((sk) => (
            <Chip key={sk} label={sk} selected={skills.includes(sk)}
              onPress={() => toggle('requiredSkills', skills, sk)} />
          ))}
        </View>
      </Field>

      <Field label={t('post.experience')}>
        <View style={s.wrap}>
          {[
            { v: 0, l: t('post.noExperience') },
            { v: 1, l: '1+ yr' }, { v: 2, l: '2+ yr' }, { v: 5, l: '5+ yr' },
          ].map((o) => (
            <Chip key={o.v} label={o.l} selected={(draft.minExperienceYears || 0) === o.v}
              onPress={() => set({ minExperienceYears: o.v })} />
          ))}
        </View>
      </Field>

      <Field label={t('post.languages')}>
        <View style={s.wrap}>
          {LANGUAGE_OPTIONS.map((l) => (
            <Chip key={l} label={l} selected={langs.includes(l)}
              onPress={() => toggle('languages', langs, l)} />
          ))}
        </View>
      </Field>

      <Field label={t('post.gender')}>
        <View style={s.wrap}>
          {[['ANY', 'anyGender'], ['MALE', 'male'], ['FEMALE', 'female']].map(([v, k]) => (
            <Chip key={v} label={t(`post.${k}`)} selected={(draft.genderPreference || 'ANY') === v}
              onPress={() => set({ genderPreference: v })} />
          ))}
        </View>
      </Field>

      <Field label={t('post.ageRange')} hint={t('common.optional')}>
        <Row>
          <Input value={draft.minAge ? String(draft.minAge) : ''}
            onChangeText={(v) => set({ minAge: v.replace(/\D/g, '') })}
            placeholder="18" keyboardType="number-pad" style={{ flex: 1 }} />
          <Input value={draft.maxAge ? String(draft.maxAge) : ''}
            onChangeText={(v) => set({ maxAge: v.replace(/\D/g, '') })}
            placeholder="45" keyboardType="number-pad" style={{ flex: 1 }} />
        </Row>
      </Field>
    </View>
  )
}

/* ---------------------------------------------------- 7. hiring ----------- */

export function StepHiring({ draft, set, t }) {
  return (
    <View>
      <Head title={t('post.hiringTitle')} sub={t('post.hiringSub')} />

      {HIRING_METHODS.map((m) => (
        <ChoiceCard
          key={m.value}
          selected={draft.hiringMethod === m.value}
          onPress={() => set({ hiringMethod: m.value })}
          icon={m.icon}
          title={t(`post.${m.titleKey}`)}
          sub={t(`post.${m.subKey}`)}
        />
      ))}

      <Field label={t('post.deadline')} hint={t('common.optional')} style={{ marginTop: space.lg }}>
        <DateField value={draft.applicationDeadline}
          onChange={(v) => set({ applicationDeadline: v })}
          placeholder={t('post.chooseDate')} />
      </Field>

      <CheckRow checked={draft.autoClose !== false} onToggle={() => set({ autoClose: draft.autoClose === false })}>
        <Body style={{ fontSize: 14.5 }}>{t('post.autoClose')}</Body>
      </CheckRow>
    </View>
  )
}

/* ---------------------------------------------------- 8. review ----------- */

export function StepReview({ draft, lang, t, onEdit }) {
  const split = splitPrice(draft.salary)
  const model = ENGAGEMENT_MODELS.find((m) => m.value === draft.engagementModel)
  const worker = WORKER_TYPES.find((w) => w.value === draft.workerCategory)
  const unit = SALARY_UNITS.find((u) => u.value === draft.salaryUnit)

  const Section = ({ title, step, children }) => (
    <Card style={{ marginBottom: space.md }}>
      <Row style={{ marginBottom: space.sm }}>
        <Text style={s.sectionTitle}>{title}</Text>
        <Text style={s.editLink} onPress={() => onEdit(step)}>{t('common.edit')}</Text>
      </Row>
      {children}
    </Card>
  )

  return (
    <View>
      <Head title={t('post.reviewTitle')} sub={t('post.reviewSub')} />

      <Section title={t('post.workerType')} step={1}>
        <KV k={t('post.workerType')} v={worker ? (worker[lang] || worker.en) : '—'} />
        <KV k={t('post.employmentType')} v={model ? (model[lang] || model.en) : '—'} />
      </Section>

      <Section title={t('post.detailsTitle')} step={3}>
        <KV k={t('post.jobTitle')} v={draft.title} strong />
        <KV k={t('post.openings')} v={String(draft.workersNeeded || 1)} />
        {draft.description ? <KV k={t('post.description')} v={draft.description} /> : null}
      </Section>

      <Section title={t('post.scheduleTitle')} step={4}>
        {draft.engagementModel === 'ONE_DAY'
          ? <KV k={t('post.workDate')} v={draft.workDate} />
          : <KV k={t('post.workingDays')} v={(draft.workingDays || []).join(', ') || '—'} />}
        <KV k={t('post.shiftTimings')}
          v={draft.startTime ? `${draft.startTime} – ${draft.endTime}` : '—'} />
        {draft.breakMinutes ? <KV k={t('post.breakTime')} v={`${draft.breakMinutes} min`} /> : null}
      </Section>

      <Section title={t('post.salaryTitle')} step={5}>
        <KV k={t('post.youPay')} v={`${money(split.total)}${unit ? ` ${t(`common.${unit.key}`)}` : ''}`} strong />
        {(draft.benefits || []).length
          ? <KV k={t('post.benefits')} v={(draft.benefits || []).join(', ')} /> : null}
      </Section>

      <Section title={t('post.requirementsTitle')} step={6}>
        <KV k={t('post.skills')} v={(draft.requiredSkills || []).join(', ') || '—'} />
        <KV k={t('post.experience')}
          v={draft.minExperienceYears ? `${draft.minExperienceYears}+ yr` : t('post.noExperience')} />
        <KV k={t('post.languages')} v={(draft.languages || []).join(', ') || '—'} />
      </Section>

      <Section title={t('post.hiringTitle')} step={7}>
        <KV
          k={t('post.hiringTitle')}
          v={t(`post.${HIRING_METHODS.find((m) => m.value === draft.hiringMethod)?.titleKey || 'direct'}`)}
        />
        {draft.applicationDeadline ? <KV k={t('post.deadline')} v={draft.applicationDeadline} /> : null}
      </Section>
    </View>
  )
}

const s = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: space.md },
  tile: {
    width: '31%', minHeight: 96, borderRadius: radius.lg, borderWidth: 2, borderColor: colors.line,
    alignItems: 'center', justifyContent: 'center', gap: 7, padding: space.sm,
    backgroundColor: colors.white,
  },
  tileOn: { borderColor: colors.blue, backgroundColor: colors.blueSoft },
  tileText: { fontSize: 11.5, fontWeight: '600', color: colors.body, textAlign: 'center', lineHeight: 15 },
  tick: {
    position: 'absolute', top: 6, right: 6, width: 18, height: 18, borderRadius: 9,
    backgroundColor: colors.blue, alignItems: 'center', justifyContent: 'center',
  },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  stepBtn: {
    width: 52, height: 52, borderRadius: radius.md, borderWidth: 1.5, borderColor: colors.line,
    alignItems: 'center', justifyContent: 'center', backgroundColor: colors.white,
  },
  stepBtnText: { fontSize: 26, fontWeight: '600', color: colors.ink, lineHeight: 30 },
  counter: {
    flex: 1, height: 52, borderRadius: radius.md, borderWidth: 1.5, borderColor: colors.line,
    alignItems: 'center', justifyContent: 'center', backgroundColor: colors.white,
  },
  counterText: { fontSize: 22, fontWeight: '800', color: colors.ink },
  addRow: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: space.sm },
  addText: { fontSize: 14.5, fontWeight: '700', color: colors.blue },
  dayRow: { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
  day: {
    minWidth: 46, height: 44, borderRadius: radius.sm, borderWidth: 1.5, borderColor: colors.line,
    alignItems: 'center', justifyContent: 'center', paddingHorizontal: 8, backgroundColor: colors.white,
  },
  dayOn: { backgroundColor: colors.blue, borderColor: colors.blue },
  dayText: { fontSize: 13, fontWeight: '700', color: colors.body },
  dayTextOn: { color: colors.white },
  splitRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: space.lg, paddingVertical: space.md,
    borderBottomWidth: 1, borderBottomColor: colors.line,
  },
  splitMuted: { backgroundColor: colors.soft },
  splitTotal: { backgroundColor: colors.greenSoft, borderBottomWidth: 0 },
  splitKey: { fontSize: 14.5, color: colors.body },
  splitValue: { fontSize: 16, fontWeight: '800', color: colors.ink },
  sectionTitle: { flex: 1, fontSize: 15.5, fontWeight: '800', color: colors.ink },
  editLink: { fontSize: 13.5, fontWeight: '700', color: colors.blue },
})
