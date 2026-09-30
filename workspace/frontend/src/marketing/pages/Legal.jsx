import React from 'react'
import { Link, useParams, Navigate } from 'react-router-dom'
import Icon from '../icons'
import {
  Section, Card, IconBox, Btn, PageHead, useDocumentTitle,
} from '../components'
import { LEGAL_DOCS, SITE } from '../content'

/**
 * These policies are written in plain language for the people who use
 * JobOn. They are drafts and must be reviewed by counsel before launch,
 * which is what the notice below states plainly to any visitor.
 */
function DraftNotice() {
  return (
    <div className="mk-note">
      <strong>Draft — pending legal review.</strong> These policies describe how JobOn
      intends to operate and are published for transparency. They are not yet final and do
      not constitute legal advice. Questions? Write to{' '}
      <a href={`mailto:${SITE.email}`}>{SITE.email}</a>.
    </div>
  )
}

export function LegalIndex() {
  useDocumentTitle('Legal & Policies')

  return (
    <>
      <PageHead
        eyebrow="Legal"
        title="Legal & Policies"
        sub="Your rights and trust are important to us."
      />

      <Section style={{ paddingTop: 8 }}>
        <div style={{ maxWidth: 800, margin: '0 auto' }}>
          <DraftNotice />
          <div className="mk-list mk-mt-24">
            {LEGAL_DOCS.map((d) => (
              <Link className="mk-list-row" to={`/legal/${d.id}`} key={d.id}>
                <span>
                  <span className="t">{d.title}</span>
                  <span className="d">{d.summary}</span>
                </span>
                <span className="arrow"><Icon name="chevronRight" size={18} /></span>
              </Link>
            ))}
          </div>

          <Card className="mk-mt-32">
            <IconBox name="shield" tone="green" />
            <h3 className="mk-h3">How we handle your data</h3>
            <p className="mk-mt-8">
              We collect only what a job or the law actually requires, we never sell personal
              data, and your past wages stay private unless you choose to share them.
            </p>
            <div className="mk-cta-row">
              <Btn to="/legal/privacy" variant="outline" size="sm">Read the Privacy Policy</Btn>
              <Btn to="/safety" variant="outline" size="sm">Safety & verification</Btn>
            </div>
          </Card>
        </div>
      </Section>
    </>
  )
}

export function LegalDoc() {
  const { slug } = useParams()
  const doc = LEGAL_DOCS.find((d) => d.id === slug)
  useDocumentTitle(doc ? doc.title : 'Legal')

  if (!doc) return <Navigate to="/legal" replace />

  return (
    <>
      <header className="mk-page-head">
        <div className="mk-container" style={{ maxWidth: 780 }}>
          <Link to="/legal" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 14, fontWeight: 600 }}>
            <Icon name="chevronLeft" size={15} /> All policies
          </Link>
          <h1 className="mk-h1" style={{ marginTop: 20, fontSize: 36 }}>{doc.title}</h1>
          <p className="mk-sub">Last updated {doc.updated}</p>
        </div>
      </header>

      <Section style={{ paddingTop: 8 }}>
        <div style={{ maxWidth: 720, margin: '0 auto' }}>
          <DraftNotice />
          <p className="mk-lead">{doc.summary}</p>

          {doc.sections.map((s, i) => (
            <section key={s.h} style={{ marginTop: i === 0 ? 34 : 30 }}>
              <h2 className="mk-h3" style={{ fontSize: 19 }}>{s.h}</h2>
              <p style={{ marginTop: 10, fontSize: 16 }}>{s.p}</p>
            </section>
          ))}

          <hr className="mk-divider mk-mt-40" />

          <Card className="mk-mt-32">
            <h3 className="mk-h3">Questions about this policy?</h3>
            <p className="mk-mt-8">
              Write to <a href={`mailto:${SITE.email}`}>{SITE.email}</a> or use the contact
              form, and we will explain anything that is unclear.
            </p>
            <div className="mk-cta-row">
              <Btn to="/contact" variant="outline" size="sm">Contact us</Btn>
            </div>
          </Card>

          <div className="mk-mt-32">
            <h3 className="mk-h3" style={{ fontSize: 16, marginBottom: 12 }}>Other policies</h3>
            <div className="mk-chips">
              {LEGAL_DOCS.filter((d) => d.id !== doc.id).map((d) => (
                <Link className="mk-tag" to={`/legal/${d.id}`} key={d.id}>{d.title}</Link>
              ))}
            </div>
          </div>
        </div>
      </Section>
    </>
  )
}
