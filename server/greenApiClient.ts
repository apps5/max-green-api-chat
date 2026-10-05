import type { GreenApiCredentials, IncomingNotification, UiMessage } from './types.js'

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
