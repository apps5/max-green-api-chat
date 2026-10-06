import type {
  GreenApiChat,
  GreenApiCredentials,
  GreenApiHistoryMessage,
  IncomingNotification,
  UiChat,
  UiMessage,
} from './types.js'

type UiMessageStatus = NonNullable<UiMessage['status']>

function normalizeMessageStatus(status: string | undefined): UiMessageStatus | undefined {
  return status === 'sent' || status === 'delivered' || status === 'read' ? status : undefined
}

interface StateResponse {
  stateInstance: string
}

interface CheckAccountResponse {
  exist?: boolean
  chatId?: string
  fromCache?: boolean
  status?: boolean
  reason?: string
}

interface SendMessageResponse {
  idMessage: string
}

export class GreenApiError extends Error {
  constructor(message: string, public readonly statusCode = 502) {
    super(message)
    this.name = 'GreenApiError'
  }
}

export class GreenApiClient {
  constructor(private readonly credentials: GreenApiCredentials) {}

  private endpoint(method: string): string {
    const { apiUrl, idInstance, apiTokenInstance } = this.credentials
    return `${apiUrl}/waInstance${idInstance}/${method}/${apiTokenInstance}`
  }

  private async request<T>(url: string, init?: RequestInit): Promise<T> {
    const response = await fetch(url, init)
    const raw = await response.text()
    let body: unknown = null

    if (raw) {
      try {
        body = JSON.parse(raw)
      } catch {
        body = raw
      }
    }

    if (!response.ok) {
      const detail = typeof body === 'string' ? body : JSON.stringify(body)
      throw new GreenApiError(`GREEN-API ${response.status}: ${detail}`, response.status >= 500 ? 502 : 400)
    }

    return body as T
  }

  async getState(): Promise<string> {
    const result = await this.request<StateResponse>(this.endpoint('getStateInstance'))
    return result.stateInstance
  }

  async getChats(): Promise<UiChat[]> {
    const chats = await this.request<GreenApiChat[]>(this.endpoint('getChats'))
    if (!Array.isArray(chats)) return []

    return chats.map((chat) => ({
      chatId: chat.chatId,
      title: chat.name?.trim() || (chat.phoneNumber ? `+${chat.phoneNumber}` : `Чат ${chat.chatId}`),
      type: chat.type || 'user',
      phoneNumber: chat.phoneNumber ? String(chat.phoneNumber) : undefined,
    }))
  }

  async getChatHistory(chatId: string, count = 100): Promise<UiMessage[]> {
    const history = await this.request<GreenApiHistoryMessage[]>(this.endpoint('getChatHistory'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chatId, count }),
    })

    if (!Array.isArray(history)) return []

    return history
      .map((message, index): UiMessage | null => {
        if (message.type !== 'incoming' && message.type !== 'outgoing') return null

        const isTextMessage =
          message.typeMessage === 'textMessage' || message.typeMessage === 'extendedTextMessage'
        if (!isTextMessage) return null

        const text =
          typeof message.textMessage === 'string' && message.textMessage.trim()
            ? message.textMessage
            : message.extendedTextMessage?.text

        if (typeof text !== 'string' || !text.trim()) return null

        return {
          id: message.idMessage || `history-${chatId}-${message.timestamp ?? 0}-${index}`,
          chatId: message.chatId || chatId,
          text,
          timestamp: message.timestamp ?? Math.floor(Date.now() / 1000),
          direction: message.type,
          status: normalizeMessageStatus(message.statusMessage),
          senderName: message.type === 'incoming' ? message.senderName : undefined,
        }
      })
      .filter((message): message is UiMessage => message !== null)
      .sort((a, b) => a.timestamp - b.timestamp)
  }

  async checkAccount(phoneNumber: string): Promise<{ chatId: string; phoneNumber: string }> {
    const result = await this.request<CheckAccountResponse>(this.endpoint('checkAccount'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phoneNumber: Number(phoneNumber) }),
    })

    if (result.status === false) {
      throw new GreenApiError(result.reason || 'Не удалось проверить номер в MAX', 400)
    }
    if (!result.exist || !result.chatId) {
      throw new GreenApiError('На этом номере не найден аккаунт MAX', 400)
    }

    return { chatId: result.chatId, phoneNumber }
  }

  async sendMessage(chatId: string, message: string): Promise<SendMessageResponse> {
    return this.request<SendMessageResponse>(this.endpoint('sendMessage'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chatId, message }),
    })
  }

  async receiveTextMessages(limit = 20): Promise<UiMessage[]> {
    const messages: UiMessage[] = []

    for (let index = 0; index < limit; index += 1) {
      const notification = await this.request<IncomingNotification | null>(
        `${this.endpoint('receiveNotification')}?receiveTimeout=5`,
      )

      if (!notification?.receiptId) break

      const body = notification.body
      if (
        body?.typeWebhook === 'incomingMessageReceived' &&
        body.messageData?.typeMessage === 'textMessage' &&
        typeof body.messageData.textMessageData?.textMessage === 'string' &&
        typeof body.senderData?.chatId === 'string'
      ) {
        messages.push({
          id: body.idMessage ?? `incoming-${notification.receiptId}`,
          chatId: body.senderData.chatId,
          text: body.messageData.textMessageData.textMessage,
          timestamp: body.timestamp ?? Math.floor(Date.now() / 1000),
          direction: 'incoming',
          senderName: body.senderData.senderName,
          chatName: body.senderData.chatName,
          phoneNumber: body.senderData.senderPhoneNumber?.toString(),
        })
      }

      await this.request(`${this.endpoint('deleteNotification')}/${notification.receiptId}`, { method: 'DELETE' })

      if (messages.length > 0) break
    }

    return messages
  }
}
