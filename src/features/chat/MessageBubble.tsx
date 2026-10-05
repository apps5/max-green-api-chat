import { Icon } from '../../components/Icon'
import type { ChatMessage } from '../../types/chat'

interface Props {
  message: ChatMessage
  showSender?: boolean
}

const timeFormatter = new Intl.DateTimeFormat('ru-RU', { hour: '2-digit', minute: '2-digit' })

export function MessageBubble({ message, showSender = false }: Props) {
  const outgoing = message.direction === 'outgoing'
  const date = new Date(message.timestamp * 1000)

  return (
    <div className={`message-line ${outgoing ? 'message-line--outgoing' : ''}`}>
      <div className={`message-bubble ${outgoing ? 'message-bubble--outgoing' : 'message-bubble--incoming'} ${message.status === 'error' ? 'message-bubble--error' : ''}`}>
        {!outgoing && showSender && <div className="message-bubble__sender">{message.senderName || message.chatName || 'Собеседник'}</div>}
        <div className="message-bubble__text">{message.text}</div>
        <div className="message-bubble__meta">
          <time>{timeFormatter.format(date)}</time>
          {outgoing && message.status !== 'error' && <Icon name="check" />}
          {message.status === 'error' && <span className="message-bubble__failed" title="Не отправлено">!</span>}
        </div>
      </div>
    </div>
  )
}
