export interface GreenApiCredentials {
  apiUrl: string
  idInstance: string
  apiTokenInstance: string
}

export interface GreenApiChat {
  chatId: string
  name?: string
  type?: 'user' | 'group' | 'channel' | 'bot' | string
  phoneNumber?: number
}

export interface GreenApiHistoryMessage {
  type?: 'incoming' | 'outgoing'
  idMessage?: string
  timestamp?: number
  statusMessage?: string
  typeMessage?: string
  chatId?: string
  senderName?: string
  textMessage?: string
  extendedTextMessage?: {
    text?: string
  }
}

export interface IncomingNotification {
  receiptId: number
  body?: {
    typeWebhook?: string
    timestamp?: number
    idMessage?: string
    senderData?: {
      chatId?: string
      chatName?: string
      senderName?: string
      senderPhoneNumber?: number | string
    }
    messageData?: {
      typeMessage?: string
      textMessageData?: {
        textMessage?: string
      }
      extendedTextMessageData?: {
        text?: string
      }
    }
  }
}

export interface UiMessage {
  id: string
  chatId: string
  text: string
  timestamp: number
  direction: 'incoming' | 'outgoing'
  status?: 'sent' | 'delivered' | 'read'
  senderName?: string
  chatName?: string
  phoneNumber?: string
}

export interface UiChat {
  chatId: string
  title: string
  type: string
  phoneNumber?: string
}
