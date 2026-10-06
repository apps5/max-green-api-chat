import { useCallback, useEffect, useMemo, useState } from 'react'
import { createChat, getChatHistory, getChats, pollMessages, sendTextMessage } from '../../services/api'
import type { ChatMessage, ChatSummary } from '../../types/chat'

interface UseChatControllerOptions {
  enabled: boolean
  onUnauthorized: () => void
}

function isUnauthorized(error: unknown): boolean {
  return error instanceof Error && (error as Error & { status?: number }).status === 401
}

function mergeMessages(current: ChatMessage[], incoming: ChatMessage[]): ChatMessage[] {
  const byId = new Map(current.map((message) => [message.id, message]))
  for (const message of incoming) byId.set(message.id, { ...byId.get(message.id), ...message })
  return [...byId.values()].sort((a, b) => a.timestamp - b.timestamp)
}

export function useChatController({ enabled, onUnauthorized }: UseChatControllerOptions) {
  const [chatId, setChatId] = useState('')
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [knownChats, setKnownChats] = useState<ChatSummary[]>([])
  const [search, setSearch] = useState('')
  const [mobileChatOpen, setMobileChatOpen] = useState(false)
  const [newChatOpen, setNewChatOpen] = useState(false)
  const [newChatLoading, setNewChatLoading] = useState(false)
  const [newChatError, setNewChatError] = useState<string | null>(null)
  const [chatError, setChatError] = useState<string | null>(null)
  const [historyLoading, setHistoryLoading] = useState(false)

  const reset = useCallback(() => {
    setChatId('')
    setMessages([])
    setKnownChats([])
    setSearch('')
    setMobileChatOpen(false)
    setNewChatOpen(false)
    setNewChatLoading(false)
    setNewChatError(null)
    setChatError(null)
    setHistoryLoading(false)
  }, [])

  useEffect(() => {
    if (!enabled) reset()
  }, [enabled, reset])

  useEffect(() => {
    if (!enabled) return
    let active = true

    void getChats()
      .then(({ chats }) => {
        if (!active) return
        setKnownChats(chats)
        setChatId((current) => current || chats[0]?.chatId || '')
      })
      .catch((error) => {
        if (!active) return
        if (isUnauthorized(error)) onUnauthorized()
        else setChatError(error instanceof Error ? error.message : 'Не удалось загрузить чаты')
      })

    return () => { active = false }
  }, [enabled, onUnauthorized])

  useEffect(() => {
    if (!enabled || !chatId) return
    let active = true
    setHistoryLoading(true)

    void getChatHistory(chatId)
      .then(({ messages: history }) => {
        if (!active) return
        setMessages((current) => mergeMessages(current, history))
        const latest = history.at(-1)
        if (latest) {
          setKnownChats((current) => current.map((chat) =>
            chat.chatId === chatId ? { ...chat, lastMessage: latest.text, timestamp: latest.timestamp } : chat,
          ))
        }
        setChatError(null)
      })
      .catch((error) => {
        if (!active) return
        if (isUnauthorized(error)) onUnauthorized()
        else setChatError(error instanceof Error ? error.message : 'Не удалось загрузить историю')
      })
      .finally(() => active && setHistoryLoading(false))

    return () => { active = false }
  }, [chatId, enabled, onUnauthorized])

  useEffect(() => {
    if (!enabled) return

    let active = true
    let timer: number | undefined

    const poll = async () => {
      try {
        const response = await pollMessages()
        if (!active) return

        if (response.messages.length > 0) {
          setMessages((current) => mergeMessages(current, response.messages))
          setKnownChats((current) => {
            const next = [...current]
            for (const message of response.messages) {
              const index = next.findIndex((chat) => chat.chatId === message.chatId)
              const fallbackTitle = message.chatName || message.senderName || message.phoneNumber || `Чат ${message.chatId}`
              const update: ChatSummary = {
                ...(index >= 0 ? next[index] : { chatId: message.chatId, title: fallbackTitle }),
                title: index >= 0 ? next[index].title : fallbackTitle,
                phoneNumber: message.phoneNumber || (index >= 0 ? next[index].phoneNumber : undefined),
                lastMessage: message.text,
                timestamp: message.timestamp,
              }
              if (index >= 0) next[index] = update
              else next.unshift(update)
            }
            return next
          })
          setChatError(null)
        }
      } catch (error) {
        if (!active) return
        if (isUnauthorized(error)) {
          onUnauthorized()
          return
        }
        setChatError(error instanceof Error ? error.message : 'Ошибка получения сообщений')
      } finally {
        if (active) timer = window.setTimeout(poll, 1200)
      }
    }

    void poll()
    return () => {
      active = false
      if (timer) window.clearTimeout(timer)
    }
  }, [enabled, onUnauthorized])

  const allChats = useMemo(() => {
    return knownChats.map((chat) => {
      const latest = messages.filter((message) => message.chatId === chat.chatId).at(-1)
      return latest ? { ...chat, lastMessage: latest.text, timestamp: latest.timestamp } : chat
    })
  }, [knownChats, messages])

  const filteredChats = useMemo(() => {
    const query = search.trim().toLocaleLowerCase('ru-RU')
    if (!query) return allChats
    return allChats.filter((chat) =>
      `${chat.title} ${chat.phoneNumber ?? ''} ${chat.lastMessage ?? ''}`.toLocaleLowerCase('ru-RU').includes(query),
    )
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
        if (current.some((chat) => chat.chatId === created.chatId)) return current
        return [{
          chatId: created.chatId,
          phoneNumber: created.phoneNumber,
          title: `+${created.phoneNumber}`,
          type: 'user',
        }, ...current]
      })
      setChatId(created.chatId)
      setMobileChatOpen(true)
      setSearch('')
      setNewChatOpen(false)
    } catch (error) {
      if (isUnauthorized(error)) {
        onUnauthorized()
        setNewChatOpen(false)
        return
      }
      setNewChatError(error instanceof Error ? error.message : 'Не удалось создать чат')
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

    setMessages((current) => mergeMessages(current, [optimistic]))
    setChatError(null)

    try {
      const result = await sendTextMessage(chatId, text)
      setMessages((current) => current.map((message) =>
        message.id === optimisticId ? { ...message, id: result.idMessage, status: 'sent' } : message,
      ))
      setKnownChats((current) => current.map((chat) =>
        chat.chatId === chatId ? { ...chat, lastMessage: text, timestamp } : chat,
      ))
    } catch (error) {
      setMessages((current) => current.map((message) =>
        message.id === optimisticId ? { ...message, status: 'error' } : message,
      ))
      if (isUnauthorized(error)) onUnauthorized()
      else setChatError(error instanceof Error ? error.message : 'Не удалось отправить сообщение')
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
    historyLoading,
    openChat,
    openCreateChat,
    closeCreateChat,
    createNewChat,
    sendMessage,
  }
}
