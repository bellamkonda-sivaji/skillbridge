import React, { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import Icon from '../icons'
import {
  Section, SectionHead, Card, IconBox, Btn, Accordion, PageHead, useDocumentTitle,
} from '../components'
import { HELP_TOPICS, FAQS, SITE } from '../content'

export default function Help() {
  useDocumentTitle('Help & Support')
  const [q, setQ] = useState('')

  const results = useMemo(() => {
    const term = q.trim().toLowerCase()
    if (!term) return FAQS
    return FAQS.filter(
      (f) => f.q.toLowerCase().includes(term) || f.a.toLowerCase().includes(term)
    )
  }, [q])

  return (
    <>
      <PageHead
        eyebrow="Help centre"
        title="How can we help you?"
        sub="Search our help articles, or get in touch with the team."
      >
        <div style={{ maxWidth: 540, margin: '26px auto 0' }}>
          <div className="mk-search">
            <Icon name="search" size={18} style={{ color: '#64748b', flexShrink: 0 }} />
            <input
              type="search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search for help articles…"
              aria-label="Search help articles"
            />
          </div>
        </div>
      </PageHead>

      {/* ---------- Topics ---------- */}
      <Section style={{ paddingTop: 8 }}>
        <div className="mk-grid mk-grid-2">
          {HELP_TOPICS.map((t) => (
            <Card key={t.title} hover style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
              <IconBox name={t.icon} tone={t.tone} small size={19} />
              <span>
                <h3 className="mk-h3">{t.title}</h3>
                <p className="mk-mt-8">{t.text}</p>
              </span>
            </Card>
          ))}
        </div>
      </Section>

      {/* ---------- FAQs ---------- */}
      <Section tone="soft">
        <SectionHead
          eyebrow="Frequently asked"
          title={q ? `${results.length} ${results.length === 1 ? 'result' : 'results'} for “${q}”` : 'Common questions'}
        />
        <div style={{ maxWidth: 800, margin: '0 auto' }}>
          {results.length > 0 ? (
            <Accordion items={results} />
          ) : (
            <Card className="mk-center" style={{ padding: 36 }}>
              <IconBox name="search" tone="slate" size={20} />
              <h3 className="mk-h3">Nothing matched “{q}”</h3>
              <p className="mk-mt-8">Try a different word, or contact our support team directly.</p>
              <div className="mk-cta-row center">
                <Btn to="/contact" size="sm">Contact support</Btn>
              </div>
            </Card>
          )}
        </div>
      </Section>

      {/* ---------- Still need help ---------- */}
      <Section>
        <div className="mk-grid mk-grid-3">
          <Card>
            <IconBox name="mail" />
            <h3 className="mk-h3">Email us</h3>
            <p className="mk-mt-8">
              Write any time. We reply within one working day, and wage issues are prioritised.
            </p>
            <p className="mk-mt-16"><a href={`mailto:${SITE.email}`}>{SITE.email}</a></p>
          </Card>
          <Card>
            <IconBox name="phone" tone="green" />
            <h3 className="mk-h3">Call us</h3>
            <p className="mk-mt-8">Speak to the support team during business hours.</p>
            <p className="mk-mt-16"><a href={`tel:${SITE.phone.replace(/\s/g, '')}`}>{SITE.phone}</a></p>
            <p className="mk-sub">{SITE.hours}</p>
          </Card>
          <Card>
            <IconBox name="shield" tone="rose" />
            <h3 className="mk-h3">Raise a grievance</h3>
            <p className="mk-mt-8">
              Unresolved complaint? Our grievance process has published timelines.
            </p>
            <p className="mk-mt-16"><Link to="/legal/grievance">Grievance redressal →</Link></p>
          </Card>
        </div>

        <div className="mk-note mk-mt-32">
          <strong>Already have an account?</strong> Signing in gives support the full history of
          your jobs and payments, which means a faster answer.{' '}
          <Link to="/login">Log in</Link>.
        </div>
      </Section>
    </>
  )
}
