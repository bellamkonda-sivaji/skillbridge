import React, { useEffect, useRef } from 'react'
import { Client } from '@stomp/stompjs'

export function useStomp(onMessage) {
  const clientRef = useRef(null)
  const handlerRef = useRef(onMessage)
  handlerRef.current = onMessage

  useEffect(() => {
    const token = localStorage.getItem('sb_token')
    if (!token) return

    const client = new Client({
      brokerURL: `${window.location.protocol === 'https:' ? 'wss' : 'ws'}://${window.location.host}/ws`,
      connectHeaders: {},
      reconnectDelay: 4000,
      heartbeatIncoming: 10000,
      heartbeatOutgoing: 10000
    })

    client.onConnect = () => {
      const user = JSON.parse(localStorage.getItem('sb_user') || 'null')
      const accountType = localStorage.getItem('sb_account_type') || user?.accountType
      if (!user || !accountType) return
      // Topics are namespaced by account type, because ids repeat across the
      // separate worker / employer / admin tables.
      client.subscribe(`/topic/notifications/${accountType}/${user.id}`, (msg) => {
        try {
          handlerRef.current?.({ type: 'notification', payload: JSON.parse(msg.body) })
        } catch {}
      })
      client.subscribe(`/topic/chat/*`, (msg) => {
        try {
          const body = msg.body
          const match = msg.destination
          handlerRef.current?.({ type: 'chat', payload: { body, destination: match } })
        } catch {}
      })
      client.subscribe(`/topic/conversations/${accountType}/${user.id}`, (msg) => {
        try {
          handlerRef.current?.({ type: 'conversation', payload: JSON.parse(msg.body) })
        } catch {}
      })
    }

    client.activate()
    clientRef.current = client
    return () => {
      client.deactivate()
    }
  }, [])

  return clientRef
}

export function useStompChat(conversationId, onChatMessage) {
  const clientRef = useRef(null)
  const cbRef = useRef(onChatMessage)
  cbRef.current = onChatMessage

  useEffect(() => {
    const token = localStorage.getItem('sb_token')
    if (!token || !conversationId) return

    const client = new Client({
      brokerURL: `${window.location.protocol === 'https:' ? 'wss' : 'ws'}://${window.location.host}/ws`,
      reconnectDelay: 4000
    })
    client.onConnect = () => {
      client.subscribe(`/topic/chat/${conversationId}`, (msg) => {
        try {
          cbRef.current?.(JSON.parse(msg.body))
        } catch {}
      })
    }
    client.activate()
    clientRef.current = client
    return () => client.deactivate()
  }, [conversationId])

  return clientRef
}
