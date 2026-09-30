import React from 'react'
import Icon from '../icons'
import {
  Section, SectionHead, Card, IconBox, Btn, CtaBand, PageHead, useDocumentTitle,
} from '../components'
import { SAFETY, SAFETY_PRACTICES } from '../content'

const BADGES = [
  { label: 'Mobile verified', text: 'Number confirmed by one-time password.' },
  { label: 'Identity verified', text: 'Government ID checked against the profile name.' },
  { label: 'Documents checked', text: 'Licence or qualification confirmed where the role needs it.' },
  { label: 'Business verified', text: 'Registration, location and contact details confirmed.' },
  { label: 'Payment verified', text: 'A valid bank or UPI account is linked for wages.' },
]

export default function Safety() {
  useDocumentTitle('Safety & Verification')

  return (
    <>
      <PageHead
        eyebrow="Trust & safety"
        title="A safer platform for everyone"
        sub="We verify identities, businesses and payments to build trust on both sides of every hire."
      />

      {/* ---------- Three pillars ---------- */}
      <Section style={{ paddingTop: 8 }}>
        <div className="mk-grid mk-grid-3">
          {SAFETY.map((s) => (
            <Card key={s.title} hover>
              <IconBox name={s.icon} tone={s.tone} />
              <h3 className="mk-h3">{s.title}</h3>
              <p className="mk-mt-8">{s.text}</p>
            </Card>
          ))}
        </div>

        <div className="mk-note mk-mt-32">
          <strong>Our commitment.</strong> We follow privacy, security and compliance best
          practices to keep your data safe — and we only ask for a document when the job
          or the law actually requires it.
        </div>
      </Section>

      {/* ---------- Verification badges ---------- */}
      <Section tone="soft">
        <div className="mk-grid mk-grid-2" style={{ alignItems: 'center', gap: 40 }}>
          <div>
            <div className="mk-eyebrow">What "verified" means</div>
            <h2 className="mk-h2 mk-mt-8">We show you what was actually checked</h2>
            <p className="mk-lead">
              A single “Verified” tick hides more than it tells. JobOn shows the specific
              checks that have been completed on a profile, so you can judge for yourself.
            </p>
            <p className="mk-sub">
              Identity documents such as Aadhaar are handled according to applicable UIDAI and
              data-protection requirements. Document numbers are never displayed to other users,
              and images are not retained beyond the verification period.
            </p>
            <div className="mk-cta-row">
              <Btn to="/legal/privacy" variant="outline" size="sm">Read the privacy policy</Btn>
            </div>
          </div>
          <Card style={{ padding: 26 }}>
            <h3 className="mk-h3">Verification badges</h3>
            <div className="mk-checks" style={{ marginTop: 18 }}>
              {BADGES.map((b) => (
                <div className="mk-check" key={b.label}>
                  <span className="ico" style={{ background: '#d1fae5', color: '#047857' }}>
                    <Icon name="check" size={15} strokeWidth={2.4} />
                  </span>
                  <span className="txt"><strong>{b.label}</strong>{b.text}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </Section>

      {/* ---------- Practices ---------- */}
      <Section>
        <SectionHead
          eyebrow="How we protect both sides"
          title="Trust is built into the workflow"
          sub="Not a badge bolted on at the end, but rules that shape how a job moves from posting to payment."
        />
        <div className="mk-grid mk-grid-3">
          {SAFETY_PRACTICES.map((p, i) => (
            <Card key={p.title} hover>
              <IconBox
                name={['shield', 'star', 'lock', 'chat', 'eye', 'bell'][i]}
                tone={['green', 'amber', 'violet', 'sky', 'teal', 'rose'][i]}
                small
                size={18}
              />
              <h3 className="mk-h3" style={{ marginTop: 14 }}>{p.title}</h3>
              <p className="mk-mt-8">{p.text}</p>
            </Card>
          ))}
        </div>
      </Section>

      {/* ---------- Safety tips ---------- */}
      <Section tone="tint">
        <div className="mk-grid mk-grid-2" style={{ gap: 32 }}>
          <Card style={{ padding: 26 }}>
            <IconBox name="user" />
            <h3 className="mk-h3">Staying safe as a worker</h3>
            <div className="mk-checks" style={{ marginTop: 16 }}>
              {[
                'Never pay anyone for a job — no genuine employer on JobOn asks for money.',
                'Keep conversations in the app, so there is a record if something goes wrong.',
                'Check the verification badges and ratings before you agree to a shift.',
                'Confirm the wage, hours and address in writing before you travel.',
                'Report anything that does not match the job description.',
              ].map((t) => (
                <div className="mk-check" key={t}>
                  <span className="ico"><Icon name="check" size={15} strokeWidth={2.4} /></span>
                  <span className="txt">{t}</span>
                </div>
              ))}
            </div>
          </Card>
          <Card style={{ padding: 26 }}>
            <IconBox name="briefcase" tone="violet" />
            <h3 className="mk-h3">Staying safe as an employer</h3>
            <div className="mk-checks" style={{ marginTop: 16 }}>
              {[
                'Complete your business verification so workers know who they are meeting.',
                'Describe the work honestly — hours, duties and wage as they really are.',
                'Use in-app chat and scheduling so both sides have the same details.',
                'Fund the job through the platform to protect yourself in a dispute.',
                'Rate workers fairly; the record follows them to their next job.',
              ].map((t) => (
                <div className="mk-check" key={t}>
                  <span className="ico"><Icon name="check" size={15} strokeWidth={2.4} /></span>
                  <span className="txt">{t}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </Section>

      {/* ---------- Report ---------- */}
      <Section>
        <Card className="mk-center" style={{ padding: 36, maxWidth: 620, margin: '0 auto' }}>
          <IconBox name="shield" tone="rose" />
          <h3 className="mk-h2" style={{ fontSize: 24 }}>Something wrong? Tell us.</h3>
          <p className="mk-mt-8">
            Report a job, a message or a user from anywhere in the app, or contact us directly.
            Wage complaints are prioritised and every report gets a response.
          </p>
          <div className="mk-cta-row center">
            <Btn to="/contact">Report a concern</Btn>
            <Btn to="/legal/grievance" variant="outline">Grievance process</Btn>
          </div>
        </Card>
      </Section>

      <CtaBand
        title="Hire and work with confidence"
        primary={{ to: '/register', label: 'Create your account' }}
        secondary={{ to: '/help', label: 'Visit the Help Centre' }}
      />
    </>
  )
}
