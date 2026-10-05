import { useCallback, useEffect, useMemo, useState } from 'react'
import { createChat, pollMessages, sendTextMessage } from '../../services/api'
import type { ChatMessage, ChatSummary } from '../../types/chat'

interface UseChatControllerOptions {
  enabled: boolean
  onUnauthorized: () => void
}

function isUnauthorized(error: unknown): boolean {
  return error instanceof Error && (error as Error & { status?: number }).status === 401
}

export function useChatController({ enabled, onUnauthorized }: UseChatControllerOptions) {
  const [chatId, setChatId] = useState('')
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [knownChats, setKnownChats] = useState<Map<string, ChatSummary>>(() => new Map())
  const [search, setSearch] = useState('')
  const [mobileChatOpen, setMobileChatOpen] = useState(false)
  const [newChatOpen, setNewChatOpen] = useState(false)
  const [newChatLoading, setNewChatLoading] = useState(false)
  const [newChatError, setNewChatError] = useState<string | null>(null)
  const [chatError, setChatError] = useState<string | null>(null)

  useEffect(() => {
    if (enabled) return
    setChatId('')
    setMessages([])
    setKnownChats(new Map())
    setSearch('')
    setMobileChatOpen(false)
    setNewChatOpen(false)
    setNewChatLoading(false)
    setNewChatError(null)
    setChatError(null)
  }, [enabled])

  useEffect(() => {
    if (!enabled) return

    let active = true
    let timer: number | undefined

    const poll = async () => {
      try {
        const response = await pollMessages()
        if (!active) return

        if (response.messages.length > 0) {
          setMessages((current) => {
            const ids = new Set(current.map((item) => item.id))
            return [...current, ...response.messages.filter((item) => !ids.has(item.id))]
          })

          setKnownChats((current) => {
            const next = new Map(current)
            for (const message of response.messages) {
              const existing = next.get(message.chatId)
              next.set(message.chatId, {
                chatId: message.chatId,
                phoneNumber: message.phoneNumber || existing?.phoneNumber,
                title: message.chatName || message.senderName || existing?.title || message.phoneNumber || `Чат ${message.chatId}`,
                lastMessage: message.text,
                timestamp: message.timestamp,
              })
            }
            return next
          })
          setChatError(null)
        }
      } catch (pollError) {
        if (!active) return
        if (isUnauthorized(pollError)) {
          onUnauthorized()
          return
        }
        setChatError(pollError instanceof Error ? pollError.message : 'Ошибка получения сообщений')
      } finally {
        if (active) timer = window.setTimeout(poll, 900)
      }
    }

    void poll()
    return () => {
      active = false
      if (timer) window.clearTimeout(timer)
    }
  }, [enabled, onUnauthorized])

  const allChats = useMemo(() => {
    const merged = new Map(knownChats)
    for (const message of messages) {
      const existing = merged.get(message.chatId)
      if (!existing || message.timestamp >= (existing.timestamp ?? 0)) {
        merged.set(message.chatId, {
          chatId: message.chatId,
          phoneNumber: message.phoneNumber || existing?.phoneNumber,
          title: message.chatName || message.senderName || existing?.title || message.phoneNumber || `Чат ${message.chatId}`,
          lastMessage: message.text,
          timestamp: message.timestamp,
        })
      }
    }
    return [...merged.values()].sort((a, b) => (b.timestamp ?? 0) - (a.timestamp ?? 0))
  }, [knownChats, messages])

  const filteredChats = useMemo(() => {
    const query = search.trim().toLocaleLowerCase('ru-RU')
    if (!query) return allChats
    return allChats.filter((chat) => `${chat.title} ${chat.phoneNumber ?? ''} ${chat.lastMessage}`.toLocaleLowerCase('ru-RU').includes(query))
  }, [allChats, search])

  const selectedChat = allChats.find((chat) => chat.chatId === chatId)
  const visibleMessages = useMemo(() => messages.filter((message) => message.chatId === chatId), [chatId, messages])

  const openCreateChat = useCallback(() => {
    setNewChatError(null)
    setNewChatOpen(true)
  }, [])

  const closeCreateChat = useCallback(() => {
    if (!newChatLoading) setNewChatOpen(false)
  }, [newChatLoading])

  const createNewChat = useCallback(async (phoneNumber: string) => {
    setNewChatLoading(true)
    setNewChatError(null)
    try {
      const created = await createChat(phoneNumber)
      setKnownChats((current) => {
        const next = new Map(current)
        next.set(created.chatId, {
          chatId: created.chatId,
          phoneNumber: created.phoneNumber,
          title: `+${created.phoneNumber}`,
          lastMessage: '',
        })
        return next
      })
      setChatId(created.chatId)
      setMobileChatOpen(true)
      setSearch('')
      setNewChatOpen(false)
    } catch (createError) {
      if (isUnauthorized(createError)) {
        onUnauthorized()
        setNewChatOpen(false)
        return
      }
      setNewChatError(createError instanceof Error ? createError.message : 'Не удалось создать чат')
    } finally {
      setNewChatLoading(false)
    }
  }, [onUnauthorized])

  const sendMessage = useCallback(async (text: string) => {
    if (!chatId) return

    const optimisticId = `local-${crypto.randomUUID()}`
    const timestamp = Math.floor(Date.now() / 1000)
    const optimistic: ChatMessage = {
      id: optimisticId,
      chatId,
      text,
      timestamp,
      direction: 'outgoing',
      status: 'sending',
      chatName: selectedChat?.title,
      phoneNumber: selectedChat?.phoneNumber,
    }

    setMessages((current) => [...current, optimistic])
    setChatError(null)

    try {
      const result = await sendTextMessage(chatId, text)
      setMessages((current) => current.map((message) => message.id === optimisticId ? { ...message, id: result.idMessage, status: 'sent' } : message))
      setKnownChats((current) => {
        const next = new Map(current)
        const currentChat = next.get(chatId)
        if (currentChat) next.set(chatId, { ...currentChat, lastMessage: text, timestamp })
        return next
      })
    } catch (sendError) {
      setMessages((current) => current.map((message) => message.id === optimisticId ? { ...message, status: 'error' } : message))
      if (isUnauthorized(sendError)) onUnauthorized()
      else setChatError(sendError instanceof Error ? sendError.message : 'Не удалось отправить сообщение')
    }
  }, [chatId, onUnauthorized, selectedChat?.phoneNumber, selectedChat?.title])

  const openChat = useCallback((nextChatId: string) => {
    setChatId(nextChatId)
    setMobileChatOpen(true)
  }, [])

  return {
    chatId,
    chatName: selectedChat?.title || '',
    selectedChat,
    visibleMessages,
    filteredChats,
    search,
    setSearch,
    mobileChatOpen,
    setMobileChatOpen,
    newChatOpen,
    newChatLoading,
    newChatError,
    chatError,
    openChat,
    openCreateChat,
    closeCreateChat,
    createNewChat,
    sendMessage,
  }
}
