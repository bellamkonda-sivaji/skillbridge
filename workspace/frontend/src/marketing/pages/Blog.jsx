import React, { useMemo, useState } from 'react'
import { Link, useParams, Navigate } from 'react-router-dom'
import Icon from '../icons'
import {
  Section, SectionHead, Card, Btn, CtaBand, PageHead, useDocumentTitle,
} from '../components'
import { POSTS, POST_BODIES, BLOG_FILTERS, SITE } from '../content'

function ArticleCard({ post }) {
  return (
    <Link to={`/blog/${post.id}`} className="mk-card hover mk-article">
      <div className="thumb" style={{ background: post.tone }}>
        <Icon name={post.icon} size={34} />
      </div>
      <div className="body">
        <span className="tag">{post.tag}</span>
        <h3 className="mk-h3">{post.title}</h3>
        <p className="mk-sub" style={{ marginTop: 8 }}>{post.excerpt}</p>
        <span className="date">{post.date}</span>
      </div>
    </Link>
  )
}

export function BlogList() {
  useDocumentTitle('Blog & Resources')
  const [filter, setFilter] = useState('All')

  const posts = useMemo(
    () => (filter === 'All' ? POSTS : POSTS.filter((p) => p.tag === filter)),
    [filter]
  )

  return (
    <>
      <PageHead
        eyebrow="Resources"
        title="Tips, stories and insights"
        sub="Useful information for workers and businesses."
      >
        <div className="mk-chips" style={{ justifyContent: 'center', marginTop: 26 }}>
          {BLOG_FILTERS.map((f) => (
            <button
              key={f}
              className="mk-chip"
              aria-pressed={filter === f}
              onClick={() => setFilter(f)}
            >
              {f}
            </button>
          ))}
        </div>
      </PageHead>

      <Section style={{ paddingTop: 8 }}>
        {posts.length > 0 ? (
          <div className="mk-grid mk-grid-3">
            {posts.map((p) => <ArticleCard key={p.id} post={p} />)}
          </div>
        ) : (
          <p className="mk-sub mk-center">No articles in this category yet — check back soon.</p>
        )}
      </Section>

      <Section tone="soft">
        <Card className="mk-center" style={{ padding: 36, maxWidth: 600, margin: '0 auto' }}>
          <h3 className="mk-h2" style={{ fontSize: 24 }}>Have something to share?</h3>
          <p className="mk-mt-8">
            If you have a story about finding work or building a team locally, we would
            like to hear it — and possibly publish it.
          </p>
          <div className="mk-cta-row center">
            <Btn to="/contact" variant="outline">Tell us your story</Btn>
          </div>
        </Card>
      </Section>

      <CtaBand
        title="Put the advice to work"
        primary={{ to: '/worker/login', label: 'Find work' }}
        secondary={{ to: '/employer/login', label: 'Hire workers' }}
      />
    </>
  )
}

export function BlogPost() {
  const { id } = useParams()
  const post = POSTS.find((p) => p.id === id)
  useDocumentTitle(post ? post.title : 'Article')

  if (!post) return <Navigate to="/blog" replace />
  const body = POST_BODIES[post.id] || [post.excerpt]
  const related = POSTS.filter((p) => p.id !== post.id).slice(0, 3)

  return (
    <>
      <header className="mk-page-head">
        <div className="mk-container" style={{ maxWidth: 760 }}>
          <Link to="/blog" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 14, fontWeight: 600 }}>
            <Icon name="chevronLeft" size={15} /> All articles
          </Link>
          <div className="mk-eyebrow" style={{ marginTop: 20 }}>{post.tag}</div>
          <h1 className="mk-h1" style={{ marginTop: 12, fontSize: 36 }}>{post.title}</h1>
          <p className="mk-sub">{post.date} · {SITE.name} team</p>
        </div>
      </header>

      <Section style={{ paddingTop: 8 }}>
        <article style={{ maxWidth: 680, margin: '0 auto' }}>
          <div
            style={{
              height: 180, borderRadius: 16, background: post.tone,
              display: 'grid', placeItems: 'center', color: '#fff', marginBottom: 32,
            }}
          >
            <Icon name={post.icon} size={48} />
          </div>
          {body.map((p, i) => (
            <p key={i} style={{ fontSize: 16.5, marginBottom: 18 }}>{p}</p>
          ))}

          <Card className="mk-mt-32" style={{ padding: 24 }}>
            <h3 className="mk-h3">Ready to start?</h3>
            <p className="mk-mt-8">
              Creating a profile takes two minutes and costs workers nothing.
            </p>
            <div className="mk-cta-row">
              <Btn to="/worker/login" size="sm">Find work</Btn>
              <Btn to="/employer/login" variant="outline" size="sm">Hire workers</Btn>
            </div>
          </Card>
        </article>
      </Section>

      <Section tone="soft">
        <SectionHead title="More articles" />
        <div className="mk-grid mk-grid-3">
          {related.map((p) => <ArticleCard key={p.id} post={p} />)}
        </div>
      </Section>
    </>
  )
}
