import React, { useMemo, useState } from 'react'
import { ScrollView, StyleSheet, View } from 'react-native'
import { useTranslation } from 'react-i18next'
import { SafeAreaView } from 'react-native-safe-area-context'
import { AppBar, Button, ErrorNote, Row, Small, Steps } from '../../ui'
import {
  StepWorkerType, StepEmployment, StepDetails, StepSchedule, StepSalary,
  StepRequirements, StepHiring, StepReview,
} from './steps'
import * as jobsApi from '../../api/jobs'
import { errorText } from '../../api/client'
import { colors, space } from '../../theme'

const TOTAL = 8
const LABELS = ['Who', 'Length', 'Work', 'When', 'Pay', 'Needs', 'Hiring', 'Check']

/** Turns "22 / 04 / 2026" into the ISO date the API expects, or nothing. */
function isoFrom(text) {
  if (!text) return undefined
  const parts = String(text).split(/[^0-9]+/).filter(Boolean)
  if (parts.length !== 3) return undefined
  const [d, m, y] = parts
  if (String(y).length !== 4) return undefined
  return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`
}

/** The API serialises shift times as HH:mm, so seconds are a parse error. */
const time = (t) => (t && /^\d{1,2}:\d{2}$/.test(t) ? t.padStart(5, '0') : undefined)

/**
 * Posting a job, in eight steps.
 *
 * The draft lives in this one screen rather than being passed between
 * navigator routes, so going back never loses what was typed - which is the
 * fastest way to make someone abandon a form on a phone.
 */
export default function PostJob({ navigation }) {
  const { t, i18n } = useTranslation()
  const lang = i18n.language || 'en'
  const [step, setStep] = useState(1)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [draft, setDraft] = useState({
    workerCategory: '', engagementModel: '', title: '', workersNeeded: 1,
    description: '', responsibilities: [], workingDays: ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'],
    durationType: 'ONGOING', startTime: '09:00', endTime: '18:00', breakMinutes: 0,
    salaryUnit: 'DAILY', salary: '', benefits: [], requiredSkills: [],
    minExperienceYears: 0, languages: [], genderPreference: 'ANY',
    hiringMethod: 'DIRECT', autoClose: true,
    // Every text field starts as a string. Starting undefined makes React
    // switch the input from uncontrolled to controlled on first keystroke.
    workDate: '', startDate: '', endDate: '', applicationDeadline: '',
    minAge: '', maxAge: '',
  })

  const set = (patch) => setDraft((d) => ({ ...d, ...patch }))

  // What each step needs before it can be left. Stated per step so the reason
  // a button is disabled is always the thing on screen.
  const blocked = useMemo(() => {
    if (step === 1 && !draft.workerCategory) return 'Choose the kind of worker'
    if (step === 2 && !draft.engagementModel) return 'Choose how long you need them'
    if (step === 3 && !String(draft.title).trim()) return 'Give the job a name'
    if (step === 4) {
      if (draft.engagementModel === 'ONE_DAY' && !isoFrom(draft.workDate)) return 'Choose the day of work'
      if (draft.engagementModel !== 'ONE_DAY' && !(draft.workingDays || []).length) return 'Choose the working days'
      if (!draft.startTime || !draft.endTime) return 'Add the shift time'
    }
    if (step === 5 && !(Number(draft.salary) > 0)) return 'Enter what you will pay'
    return ''
  }, [step, draft])

  const publish = async () => {
    setBusy(true); setError('')
    try {
      const body = {
        title: String(draft.title).trim(),
        description: draft.description || undefined,
        workerCategory: draft.workerCategory,
        engagementModel: draft.engagementModel,
        workType: draft.engagementModel === 'MONTHS' || draft.engagementModel === 'PERMANENT'
          ? 'MONTHLY' : 'DAILY',
        requiredSkills: draft.requiredSkills?.length ? draft.requiredSkills : [String(draft.title).trim()],
        responsibilities: (draft.responsibilities || []).filter(Boolean),
        workersNeeded: Number(draft.workersNeeded) || 1,
        salary: Number(draft.salary),
        salaryUnit: draft.salaryUnit,
        workingDays: draft.engagementModel === 'ONE_DAY' ? [] : draft.workingDays,
        workDate: isoFrom(draft.workDate),
        startDate: isoFrom(draft.startDate),
        endDate: isoFrom(draft.endDate),
        durationType: draft.durationType,
        shifts: draft.startTime ? [{
          startTime: time(draft.startTime),
          endTime: time(draft.endTime),
          breakMinutes: Number(draft.breakMinutes) || 0,
        }] : [],
        minExperienceYears: Number(draft.minExperienceYears) || 0,
        languages: draft.languages,
        genderPreference: draft.genderPreference,
        hiringMethod: draft.hiringMethod,
        applicationDeadline: isoFrom(draft.applicationDeadline),
        benefits: (draft.benefits || []).map((b) => ({ benefitType: b })),
      }
      const job = await jobsApi.createJob(body)
      navigation.replace('JobPublished', { job })
    } catch (err) {
      setError(errorText(err, 'We could not post this job. Please check the details.'))
      setStep(TOTAL)
    } finally {
      setBusy(false)
    }
  }

  const back = () => (step === 1 ? navigation.goBack() : setStep((x) => x - 1))
  const forward = () => (step === TOTAL ? publish() : setStep((x) => x + 1))

  const props = { draft, set, lang, t }

  return (
    <SafeAreaView style={s.fill} edges={['top', 'left', 'right']}>
      <AppBar title={t('post.title')} onBack={back} />
      <View style={s.stepsBar}>
        <Steps total={TOTAL} current={step} labels={LABELS} />
      </View>

      <ScrollView
        style={s.fill}
        contentContainerStyle={{ padding: space.lg, paddingBottom: space.xxxl }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <ErrorNote>{error}</ErrorNote>
        {step === 1 ? <StepWorkerType {...props} /> : null}
        {step === 2 ? <StepEmployment {...props} /> : null}
        {step === 3 ? <StepDetails {...props} /> : null}
        {step === 4 ? <StepSchedule {...props} /> : null}
        {step === 5 ? <StepSalary {...props} /> : null}
        {step === 6 ? <StepRequirements {...props} /> : null}
        {step === 7 ? <StepHiring {...props} /> : null}
        {step === 8 ? <StepReview draft={draft} lang={lang} t={t} onEdit={setStep} /> : null}
      </ScrollView>

      <View style={s.footer}>
        {blocked ? <Small style={{ marginBottom: space.sm }}>{blocked}</Small> : null}
        <Row>
          {step > 1 ? (
            <Button title={t('common.back')} tone="quiet" onPress={back} style={{ flex: 1 }} />
          ) : null}
          <Button
            title={step === TOTAL ? t('post.publish') : t('common.continue')}
            icon={step === TOTAL ? 'rocket-outline' : undefined}
            iconRight={step === TOTAL ? undefined : 'arrow-forward'}
            onPress={forward}
            loading={busy}
            disabled={Boolean(blocked)}
            style={{ flex: step > 1 ? 2 : 1 }}
          />
        </Row>
      </View>
    </SafeAreaView>
  )
}

const s = StyleSheet.create({
  fill: { flex: 1, backgroundColor: colors.bg },
  stepsBar: {
    paddingHorizontal: space.md, backgroundColor: colors.white,
    borderBottomWidth: 1, borderBottomColor: colors.line,
  },
  footer: {
    paddingHorizontal: space.lg, paddingTop: space.md, paddingBottom: space.lg,
    backgroundColor: colors.white, borderTopWidth: 1, borderTopColor: colors.line,
  },
})
