export interface GreenApiCredentials {
  apiUrl: string
  idInstance: string
  apiTokenInstance: string
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
    }
  }
}

export interface UiMessage {
  id: string
  chatId: string
  text: string
  timestamp: number
  direction: 'incoming'
  senderName?: string
  chatName?: string
  phoneNumber?: string
}
