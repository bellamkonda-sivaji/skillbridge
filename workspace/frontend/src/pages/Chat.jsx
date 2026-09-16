import React, { useEffect, useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../context/AuthContext'
import api, { errMsg } from '../api'
import { EmptyState, Spinner } from '../components/ui'
import { useStomp, useStompChat } from '../hooks/useStomp'

export default function Chat() {
  const { t } = useTranslation()
  const { user } = useAuth()
  const location = useLocation()
  const [conversations, setConversations] = useState([])
  const [active, setActive] = useState(null)
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(true)
  const [text, setText] = useState('')
  const msgsRef = useRef(null)
  const initRef = useRef(false)

  const loadConversations = () => {
    api.get('/chat/conversations').then((res) => {
      setConversations(res.data)
      const st = location.state
      if (st && (st.workerId || st.recipientId) && !initRef.current) {
        const recipientId = st.workerId || st.recipientId
        const existing = res.data.find((c) =>
          (user.role === 'EMPLOYER' && c.workerId === recipientId) ||
          (user.role === 'WORKER' && c.employerId === recipientId)
        )
        if (existing) {
          setActive(existing.id)
        } else {
          api.post('/chat/send', { recipientId, jobId: st.jobId || null, content: 'Hello! I would like to connect with you.' })
            .then(() => loadConversations())
            .catch((e) => alert(errMsg(e)))
        }
        initRef.current = true
      }
    }).catch(() => {})
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    loadConversations()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.state])

  useStomp((msg) => {
    if (msg.type === 'conversation' || msg.type === 'chat') loadConversations()
  })

  const openConversation = async (id) => {
    setActive(id)
    try {
      const res = await api.get(`/chat/conversations/${id}/messages`)
      setMessages(res.data)
      await api.patch(`/chat/conversations/${id}/read`)
      loadConversations()
    } catch (e) { alert(errMsg(e)) }
  }

  useStompChat(active, (m) => {
    setMessages((prev) => {
      if (prev.some((x) => x.id === m.id)) return prev
      return [...prev, m]
    })
    if (m.senderId !== user.id) {
      api.patch(`/chat/conversations/${active}/read`).catch(() => {})
      loadConversations()
    }
    setTimeout(() => msgsRef.current?.scrollTo({ top: msgsRef.current.scrollHeight }), 50)
  })

  const send = async () => {
    if (!text.trim() || !active) return
    try {
      const res = await api.post('/chat/send', { conversationId: active, content: text.trim() })
      setMessages((prev) => [...prev, res.data])
      setText('')
      loadConversations()
      setTimeout(() => msgsRef.current?.scrollTo({ top: msgsRef.current.scrollHeight }), 50)
    } catch (e) { alert(errMsg(e)) }
  }

  const otherName = (c) => {
    if (!user) return ''
    return user.role === 'EMPLOYER' ? c.workerName : c.employerName
  }

  if (loading) return <div className="page container"><Spinner /></div>

  return (
    <div className="page container">
      <h2 style={{ marginBottom: 16 }}>{t('chat.title')}</h2>
      <div className="chat-wrap">
        <div className="chat-list">
          {conversations.length === 0 && <div className="empty-state" style={{ padding: 30 }}><p>{t('chat.title')}</p></div>}
          {conversations.map((c) => (
            <div key={c.id} className={`chat-item ${active === c.id ? 'active' : ''}`} onClick={() => openConversation(c.id)}>
              <div className="name">
                {otherName(c)}
                {c.unreadCount > 0 && <span className="badge badge-red" style={{ marginLeft: 8 }}>{c.unreadCount}</span>}
              </div>
              <div className="preview">{c.lastMessage || '...'}</div>
              {c.jobTitle && <div className="muted">💼 {c.jobTitle}</div>}
            </div>
          ))}
        </div>
        <div className="chat-main">
          {!active ? (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <EmptyState emoji="💬" text={t('chat.noConversation')} />
            </div>
          ) : (
            <>
              <div className="chat-header">
                {conversations.find((c) => c.id === active)?.jobTitle && (
                  <span className="muted">💼 {conversations.find((c) => c.id === active).jobTitle} · </span>
                )}
                {otherName(conversations.find((c) => c.id === active))}
              </div>
              <div className="chat-msgs" ref={msgsRef}>
                {messages.map((m) => (
                  <div key={m.id} className={`msg ${m.senderId === user.id ? 'mine' : 'theirs'}`}>
                    {m.content}
                    <span className="time">{new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                ))}
              </div>
              <div className="chat-input">
                <input
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && send()}
                  placeholder={t('chat.placeholder')}
                />
                <button className="btn btn-primary" onClick={send}>{t('common.send')}</button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
