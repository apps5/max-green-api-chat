import type { ChatMessage, ChatSummary } from './chat'

export interface SessionStatus {
  authenticated: boolean
  idInstance: string | null
  stateInstance?: string
}

export interface ChatsResponse {
  chats: ChatSummary[]
}

export interface CreateChatResponse {
  chatId: string
  phoneNumber: string
}

export interface HistoryResponse {
  messages: ChatMessage[]
}

export interface PollResponse {
  messages: ChatMessage[]
}

export interface SendMessageResponse {
  idMessage: string
}
