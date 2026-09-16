import React, { useState } from 'react'

export function Modal({ open, onClose, title, children }) {
  if (!open) return null
  return (
    <div className="modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        {title && <h3>{title}</h3>}
        {children}
      </div>
    </div>
  )
}

export function TagInput({ value, onChange, placeholder }) {
  const [text, setText] = useState('')

  const add = () => {
    const items = text.split(',').map((s) => s.trim()).filter(Boolean)
    if (items.length) {
      onChange([...new Set([...value, ...items])])
      setText('')
    }
  }

  return (
    <div className="tag-input">
      {(value || []).map((tag) => (
        <span key={tag} className="tag">
          {tag}
          <button type="button" onClick={() => onChange(value.filter((x) => x !== tag))}>×</button>
        </span>
      ))}
      <input
        value={text}
        placeholder={placeholder}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); add() }
          if (e.key === 'Backspace' && !text && value.length) onChange(value.slice(0, -1))
        }}
        onBlur={add}
      />
    </div>
  )
}
