import { Avatar } from '../../components/Avatar'
import { Icon } from '../../components/Icon'
import { MobileBottomNav } from '../../components/MobileBottomNav'
import type { ChatSummary } from '../../types/chat'

interface Props {
  chats: ChatSummary[]
  activeChatId: string
  search: string
  onSearchChange: (value: string) => void
  onSelectChat: (chatId: string) => void
  onCreateChat: () => void
}

function formatSidebarTime(timestamp?: number): string {
  if (!timestamp) return ''
  const date = new Date(timestamp * 1000)
  const now = new Date()
  if (date.toDateString() === now.toDateString()) {
    return new Intl.DateTimeFormat('ru-RU', { hour: '2-digit', minute: '2-digit' }).format(date)
  }
  return new Intl.DateTimeFormat('ru-RU', { day: '2-digit', month: '2-digit' }).format(date)
}

export function ChatSidebar({ chats, activeChatId, search, onSearchChange, onSelectChat, onCreateChat }: Props) {
  return (
    <aside className="sidebar">
      <div className="sidebar__header-row">
        <h1>Чаты</h1>
        <button className="new-chat-button" type="button" onClick={onCreateChat} aria-label="Новый чат"><Icon name="plus"/></button>
      </div>

      <label className="sidebar__search">
        <Icon name="search" />
        <input value={search} onChange={(event) => onSearchChange(event.target.value)} placeholder="Найти" aria-label="Поиск по чатам" />
      </label>

      <div className="mobile-chat-tabs" aria-hidden="true">
        <span className="is-active">Все</span><span>Новые</span><span>Каналы</span>
      </div>

      <div className="chat-list">
        {chats.length === 0 ? (
          <div className="chat-list__empty">
            <p>Здесь появятся ваши диалоги.</p>
            <button type="button" onClick={onCreateChat}>Начать новый чат</button>
          </div>
        ) : chats.map((chat) => (
          <button key={chat.chatId} className={`chat-row ${chat.chatId === activeChatId ? 'chat-row--active' : ''}`} onClick={() => onSelectChat(chat.chatId)} type="button">
            <Avatar label={chat.title} />
            <span className="chat-row__content">
              <span className="chat-row__line">
                <strong>{chat.title}</strong>
                <time>{formatSidebarTime(chat.timestamp)}</time>
              </span>
              <span className="chat-row__preview">{chat.lastMessage || 'Нет сообщений'}</span>
            </span>
          </button>
        ))}
      </div>

      <MobileBottomNav />
    </aside>
  )
}
