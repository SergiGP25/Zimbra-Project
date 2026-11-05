import React from 'react'
import { MailMessage } from '../types'

interface MailListProps {
  messages: MailMessage[]
  loading: boolean
}

export const MailList: React.FC<MailListProps> = ({ messages, loading }) => {
  if (loading) {
    return <div className="loading-state">Cargando correos desde Zimbra...</div>
  }

  if (messages.length === 0) {
    return <div className="empty-state">No se encontraron correos en la bandeja de entrada.</div>
  }

  return (
    <div className="mail-list">
      {messages.map((msg) => (
        <div key={msg.id} className={`mail-card ${msg.is_unread ? 'unread' : ''}`}>
          <div className="mail-header">
            <span className="mail-sender">{msg.sender}</span>
            <span className="mail-date">{msg.date}</span>
          </div>
          <div className="mail-subject">{msg.subject}</div>
          {msg.fragment && <div className="mail-snippet">{msg.fragment}</div>}
        </div>
      ))}
    </div>
  )
}

