export type MessageDirection = 'incoming' | 'outgoing'
export type MessageStatus = 'sending' | 'sent' | 'error'

export interface ChatMessage {
  id: string
  chatId: string
  text: string
  timestamp: number
  direction: MessageDirection
  status?: MessageStatus
  senderName?: string
  chatName?: string
  phoneNumber?: string
}

export interface ChatSummary {
  chatId: string
  title: string
  phoneNumber?: string
  lastMessage: string
  timestamp?: number
}
