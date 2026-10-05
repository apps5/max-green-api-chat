import { useCallback, useEffect, useState } from 'react'
import { NavigationRail } from '../components/NavigationRail'
import { LoginPage } from '../features/auth/LoginPage'
import { ChatPanel } from '../features/chat/ChatPanel'
import { ChatSidebar } from '../features/chat/ChatSidebar'
import { NewChatDialog } from '../features/chat/NewChatDialog'
import { useChatController } from '../features/chat/useChatController'
import { getSession } from '../services/api'

type SessionState = 'loading' | 'anonymous' | 'authenticated'

export function App() {
  const [sessionState, setSessionState] = useState<SessionState>('loading')
  const [idInstance, setIdInstance] = useState('')

  useEffect(() => {
    let active = true
    getSession()
      .then((session) => {
        if (!active) return
        if (session.authenticated && session.idInstance) {
          setIdInstance(session.idInstance)
          setSessionState('authenticated')
        } else {
          setSessionState('anonymous')
        }
      })
      .catch(() => active && setSessionState('anonymous'))

    return () => { active = false }
  }, [])

  const handleUnauthorized = useCallback(() => {
    setIdInstance('')
    setSessionState('anonymous')
  }, [])

  const chat = useChatController({
    enabled: sessionState === 'authenticated',
    onUnauthorized: handleUnauthorized,
  })

  if (sessionState === 'loading') {
    return <div className="app-loading" aria-label="Загрузка"><span className="app-loading__mark">MAX</span></div>
  }

  if (sessionState === 'anonymous') {
    return (
      <LoginPage
        onConnected={(connectedId) => {
          setIdInstance(connectedId)
          setSessionState('authenticated')
        }}
      />
    )
  }

  return (
    <div className="app-shell">
      <NavigationRail />
      <ChatSidebar
        chats={chat.filteredChats}
        activeChatId={chat.chatId}
        search={chat.search}
        onSearchChange={chat.setSearch}
        onSelectChat={chat.openChat}
        onCreateChat={chat.openCreateChat}
      />
      <ChatPanel
        chatId={chat.chatId}
        chatName={chat.chatName}
        chatSubtitle={chat.selectedChat?.phoneNumber ? `+${chat.selectedChat.phoneNumber}` : `GREEN-API ${idInstance}`}
        messages={chat.visibleMessages}
        isMobileOpen={chat.mobileChatOpen}
        error={chat.chatError}
        onBack={() => chat.setMobileChatOpen(false)}
        onSend={chat.sendMessage}
        onCreateChat={chat.openCreateChat}
      />
      <NewChatDialog
        open={chat.newChatOpen}
        loading={chat.newChatLoading}
        error={chat.newChatError}
        onClose={chat.closeCreateChat}
        onSubmit={chat.createNewChat}
      />
    </div>
  )
}
