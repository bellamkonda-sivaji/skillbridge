import React from 'react'
import { Link } from 'react-router-dom'
import { Section, Card, IconBox, Btn, useDocumentTitle } from '../components'

export default function NotFound() {
  useDocumentTitle('Page not found')

  return (
    <Section>
      <Card className="mk-center" style={{ padding: 48, maxWidth: 560, margin: '0 auto' }}>
        <IconBox name="search" tone="slate" size={22} />
        <h1 className="mk-h2">We couldn't find that page</h1>
        <p className="mk-lead">
          The link may be old, or the page may have moved. Here are a few good places to go next.
        </p>
        <div className="mk-cta-row center">
          <Btn to="/">Back to home</Btn>
          <Btn to="/jobs" variant="outline">Find jobs</Btn>
          <Btn to="/help" variant="outline">Help centre</Btn>
        </div>
        <p className="mk-sub">
          Still stuck? <Link to="/contact">Contact us</Link> and we will point you the right way.
        </p>
      </Card>
    </Section>
  )
}
