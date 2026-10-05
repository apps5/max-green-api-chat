import { useEffect, useRef } from 'react'
import { Avatar } from '../../components/Avatar'
import { Icon } from '../../components/Icon'
import type { ChatMessage } from '../../types/chat'
import { MessageBubble } from './MessageBubble'
import { MessageComposer } from './MessageComposer'

interface Props {
  chatId: string
  chatName: string
  chatSubtitle: string
  messages: ChatMessage[]
  isMobileOpen: boolean
  error: string | null
  onBack: () => void
  onSend: (message: string) => Promise<void>
  onCreateChat: () => void
}

export function ChatPanel({ chatId, chatName, chatSubtitle, messages, isMobileOpen, error, onBack, onSend, onCreateChat }: Props) {
  const endRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: messages.length > 1 ? 'smooth' : 'auto' })
  }, [messages])

  return (
    <main className={`chat-panel ${isMobileOpen ? 'chat-panel--mobile-open' : ''}`}>
      {chatId ? (
        <>
          <header className="chat-header">
            <button className="icon-button chat-header__back" onClick={onBack} aria-label="Назад"><Icon name="back" /></button>
            <Avatar label={chatName} size="sm" />
            <div className="chat-header__identity">
              <strong>{chatName}</strong>
              <span>{chatSubtitle}</span>
            </div>
            <div className="chat-header__actions" aria-label="Дополнительные действия не входят в тестовое задание">
              <button className="icon-button" type="button" disabled title="Не входит в тестовое задание"><Icon name="phone"/></button>
              <button className="icon-button" type="button" disabled title="Не входит в тестовое задание"><Icon name="video"/></button>
              <button className="icon-button" type="button" disabled title="Не входит в тестовое задание"><Icon name="search"/></button>
            </div>
          </header>

          <section className="messages" aria-live="polite">
            <div className="messages__inner">
              {messages.length === 0 && <div className="day-marker">Сегодня</div>}
              {messages.map((message, index) => (
                <MessageBubble key={message.id} message={message} showSender={message.direction === 'incoming' && (index === 0 || messages[index - 1]?.direction !== 'incoming')} />
              ))}
              <div ref={endRef} />
            </div>
          </section>

          {error && <div className="error-toast">{error}</div>}
          <MessageComposer onSend={onSend} />
        </>
      ) : (
        <section className="chat-placeholder">
          <div className="chat-placeholder__content">
            <span className="chat-placeholder__logo">MAX</span>
            <h2>Выберите чат</h2>
            <p>Откройте существующий диалог или создайте новый по номеру телефона.</p>
            <button className="primary-button" type="button" onClick={onCreateChat}>Новый чат</button>
          </div>
        </section>
      )}
    </main>
  )
}
