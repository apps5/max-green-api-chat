import type { ChatMessage } from './chat'

export interface SessionStatus {
  authenticated: boolean
  idInstance: string | null
  stateInstance?: string
}

export interface CreateChatResponse {
  chatId: string
  phoneNumber: string
}

export interface PollResponse {
  messages: ChatMessage[]
}

export interface SendMessageResponse {
  idMessage: string
}
