import React, { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import Icon from './icons'

/**
 * The animated explainer that sits on the public site, before anyone signs in.
 *
 * Deliberately not a video file. A video is a megabyte download on a 2G
 * connection, it cannot be translated without re-recording, and a screen reader
 * gets nothing from it. This is a few kilobytes of markup that plays the same
 * story, reads in Telugu or Hindi, and degrades to a plain list of steps if
 * someone has asked their phone to stop animations.
 *
 * Two tracks, because the two sides of the marketplace need to see their own
 * half: a worker watches themselves find work and get paid; a shop owner
 * watches themselves post a job and hire.
 */

const SCENE_MS = 4200

/** Each step is a little scene: an icon, a caption, and what the phone shows. */
const TRACKS = {
  worker: [
    { icon: 'user',        art: 'signup',  k: 'signup' },
    { icon: 'search',      art: 'browse',  k: 'browse' },
    { icon: 'checkCircle', art: 'apply',   k: 'apply' },
    { icon: 'phone',       art: 'call',    k: 'call' },
    { icon: 'clock',       art: 'punch',   k: 'punch' },
    { icon: 'wallet',      art: 'paid',    k: 'paid' },
  ],
  employer: [
    { icon: 'briefcase',   art: 'post',    k: 'post' },
    { icon: 'users',       art: 'matched', k: 'matched' },
    { icon: 'phone',       art: 'call',    k: 'callEmp' },
    { icon: 'checkCircle', art: 'hire',    k: 'hire' },
    { icon: 'clock',       art: 'track',   k: 'track' },
    { icon: 'rupee',       art: 'pay',     k: 'pay' },
  ],
}

export default function HowItWorksFilm() {
  const { t } = useTranslation()
  const [side, setSide] = useState('worker')
  const [i, setI] = useState(0)
  const [playing, setPlaying] = useState(true)
  const reduced = useRef(false)

  useEffect(() => {
    // Somebody who has turned animations off gets the steps, not the motion.
    reduced.current = window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches || false
    if (reduced.current) setPlaying(false)
  }, [])

  const steps = TRACKS[side]

  useEffect(() => {
    if (!playing) return undefined
    const id = setTimeout(() => setI((n) => (n + 1) % steps.length), SCENE_MS)
    return () => clearTimeout(id)
  }, [playing, i, steps.length])

  // Switching side restarts the story rather than landing mid-way through it.
  const pick = (s) => { setSide(s); setI(0); setPlaying(true) }

  const step = steps[i]
  const label = (suffix) => t(`film.${step.k}.${suffix}`, FALLBACK[step.k]?.[suffix] || '')

  return (
    <section className="film" aria-label={t('film.title', 'How JobOn works')}>
      <div className="mk-container">
        <header className="film-head">
          <h2 className="mk-h2">{t('film.title', 'How JobOn works')}</h2>
          <p className="mk-lede">{t('film.sub', 'Watch it in under a minute. No signing up to look.')}</p>

          <div className="film-switch" role="tablist">
            {[['worker', t('film.iWantWork', 'I want work')],
              ['employer', t('film.iWantHire', 'I want to hire')]].map(([v, txt]) => (
              <button key={v} role="tab" aria-selected={side === v}
                className={`film-tab${side === v ? ' on' : ''}`} onClick={() => pick(v)}>
                <Icon name={v === 'worker' ? 'user' : 'store'} size={16} />
                {txt}
              </button>
            ))}
          </div>
        </header>

        <div className="film-stage">
          {/* the phone, and what is on its screen right now */}
          <div className="film-phone" aria-hidden="true">
            <div className="film-notch" />
            <div className="film-screen">
              <Scene art={step.art} side={side} n={i} />
            </div>
          </div>

          {/* the caption, which is the part that actually explains it */}
          <div className="film-caption">
            <span className="film-step">
              {t('film.step', 'Step')} {i + 1} / {steps.length}
            </span>
            <span className={`film-ic ${side}`}><Icon name={step.icon} size={26} /></span>
            <h3 key={`${side}-${i}-t`} className="film-t">{label('t')}</h3>
            <p key={`${side}-${i}-d`} className="film-d">{label('d')}</p>

            <div className="film-dots" role="tablist">
              {steps.map((s, n) => (
                <button key={s.k} role="tab" aria-selected={n === i}
                  aria-label={`${t('film.step', 'Step')} ${n + 1}`}
                  className={`film-dot${n === i ? ' on' : ''}${n < i ? ' done' : ''}`}
                  onClick={() => { setI(n); setPlaying(false) }}>
                  <span className="bar" style={{ animationDuration: `${SCENE_MS}ms`, animationPlayState: playing && n === i ? 'running' : 'paused' }} />
                </button>
              ))}
            </div>

            <div className="film-controls">
              <button className="film-play" onClick={() => setPlaying((p) => !p)}
                aria-label={playing ? t('film.pause', 'Pause') : t('film.play', 'Play')}>
                <Icon name={playing ? 'close' : 'play'} size={15} />
                {playing ? t('film.pause', 'Pause') : t('film.play', 'Play')}
              </button>
              <Link className="mk-btn mk-btn-primary mk-btn-sm"
                to={side === 'worker' ? '/join?role=WORKER' : '/join?role=EMPLOYER'}>
                {side === 'worker' ? t('film.ctaWorker', 'Find work now') : t('film.ctaEmployer', 'Post a job')}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

/**
 * What the phone shows. Pure markup and CSS — the movement is what carries the
 * meaning for someone who cannot read the caption.
 */
function Scene({ art, side, n }) {
  const { t } = useTranslation()
  const w = (k, d) => t(`film.ui.${k}`, d)
  const key = `${art}-${n}`
  switch (art) {
    case 'signup':
      return (
        <div className="sc" key={key}>
          <div className="sc-avatar pop"><Icon name="user" size={30} /></div>
          <div className="sc-line w70 slide" />
          <div className="sc-line w50 slide d1" />
          <div className="sc-pill green pop d2"><Icon name="check" size={13} /> {w('ready', 'Ready')}</div>
        </div>
      )
    case 'browse':
      return (
        <div className="sc grid" key={key}>
          {['store', 'car', 'broom', 'hammer', 'cup', 'box'].map((ic, x) => (
            <span className={`sc-tile pop d${x}`} key={ic}><Icon name={ic} size={20} /></span>
          ))}
        </div>
      )
    case 'apply':
      return (
        <div className="sc" key={key}>
          <div className="sc-card slide">
            <span className="sc-pay">₹900</span>
            <span className="sc-sub">/day</span>
          </div>
          <div className="sc-btn green pop d2">
            <Icon name="checkCircle" size={16} /> {w('apply', 'Apply')}
          </div>
          <span className="sc-tap d2" />
        </div>
      )
    case 'call':
    case 'callEmp':
      return (
        <div className="sc" key={key}>
          <div className="sc-ring"><span /><span /><span /></div>
          <div className="sc-avatar blue pop"><Icon name="phone" size={28} /></div>
          <div className="sc-line w60 slide d2" />
        </div>
      )
    case 'punch':
      return (
        <div className="sc" key={key}>
          <div className="sc-punch pop"><Icon name="clock" size={30} /></div>
          <div className="sc-btn big green pop d1">{w('start', 'Start work')}</div>
          <div className="sc-pill amber pop d3">09:02</div>
        </div>
      )
    case 'paid':
    case 'pay':
      return (
        <div className="sc" key={key}>
          <div className="sc-coin pop"><Icon name="rupee" size={26} /></div>
          <div className="sc-amount rise">₹900</div>
          <div className="sc-pill green pop d2"><Icon name="check" size={13} /> {w('paid', 'Paid')}</div>
        </div>
      )
    case 'post':
      return (
        <div className="sc" key={key}>
          <div className="sc-line w80 slide" />
          <div className="sc-line w60 slide d1" />
          <div className="sc-pay small slide d2">₹900 <span className="sc-sub">/day</span></div>
          <div className="sc-btn blue pop d3">{w('post', 'Post')}</div>
        </div>
      )
    case 'matched':
      return (
        <div className="sc rows" key={key}>
          {[0, 1, 2].map((x) => (
            <div className={`sc-row slide d${x}`} key={x}>
              <span className="sc-dot" />
              <span className="sc-line w50" />
              <span className="sc-mini green">{92 - x * 9}%</span>
            </div>
          ))}
        </div>
      )
    case 'hire':
      return (
        <div className="sc" key={key}>
          <div className="sc-avatar orange pop"><Icon name="user" size={28} /></div>
          <div className="sc-btn green big pop d2"><Icon name="check" size={16} /> {w('hired', 'Hired')}</div>
        </div>
      )
    case 'track':
      return (
        <div className="sc rows" key={key}>
          {[0, 1, 2].map((x) => (
            <div className={`sc-row slide d${x}`} key={x}>
              <span className="sc-dot green" />
              <span className="sc-line w40" />
              <span className="sc-mini">8h</span>
            </div>
          ))}
        </div>
      )
    default:
      return <div className="sc" key={key} />
  }
}

/** English fallbacks, so the section still reads if a key is missing. */
const FALLBACK = {
  signup:   { t: 'Sign up with your phone', d: 'Your mobile number is all you need. Pick your language first.' },
  browse:   { t: 'Pick the work you know', d: 'Tap a picture — shop, driving, cooking, cleaning, mestri. No typing.' },
  apply:    { t: 'Tap once to apply', d: 'See the pay and how far away it is before you decide.' },
  call:     { t: 'The shop owner rings you', d: 'No interview. You talk, you agree, you go.' },
  punch:    { t: 'Press start when you reach', d: 'One button when you start, one when you finish.' },
  paid:     { t: 'Money reaches your account', d: 'JobOn holds the money from day one, so you always get paid.' },
  post:     { t: 'Post what you need', d: 'Pick the work, set the wage and the days. Two minutes.' },
  matched:  { t: 'Nearby workers appear', d: 'Ranked by skill, distance and how they have worked before.' },
  callEmp:  { t: 'Ring them yourself', d: 'One tap to call. Agree it on the phone, the way you always have.' },
  hire:     { t: 'Confirm the person', d: 'Send a work confirmation. They get it on their phone at once.' },
  track:    { t: 'See who turned up', d: 'Attendance for every worker, every day, on one screen.' },
  pay:      { t: 'Pay safely, once', d: 'Money is released when the work is done. No cash, no arguments.' },
}
