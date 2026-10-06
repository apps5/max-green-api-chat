import type {
  ChatsResponse,
  CreateChatResponse,
  HistoryResponse,
  PollResponse,
  SendMessageResponse,
  SessionStatus,
} from '../types/api'

const jsonHeaders = { 'Content-Type': 'application/json' }

async function parseResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const body = await response.json().catch(() => null) as { error?: string } | null
    const error = new Error(body?.error ?? `HTTP ${response.status}`)
    Object.assign(error, { status: response.status })
    throw error
  }

  if (response.status === 204) return undefined as T
  return response.json() as Promise<T>
}

export function getSession(): Promise<SessionStatus> {
  return fetch('/api/session').then(parseResponse<SessionStatus>)
}

export function connectSession(idInstance: string, apiTokenInstance: string): Promise<SessionStatus> {
  return fetch('/api/session', {
    method: 'POST',
    headers: jsonHeaders,
    body: JSON.stringify({ idInstance, apiTokenInstance }),
  }).then(parseResponse<SessionStatus>)
}

export function disconnectSession(): Promise<void> {
  return fetch('/api/session', { method: 'DELETE' }).then(parseResponse<void>)
}

export function getChats(): Promise<ChatsResponse> {
  return fetch('/api/chats').then(parseResponse<ChatsResponse>)
}

export function createChat(phoneNumber: string): Promise<CreateChatResponse> {
  return fetch('/api/chats/resolve', {
    method: 'POST',
    headers: jsonHeaders,
    body: JSON.stringify({ phoneNumber }),
  }).then(parseResponse<CreateChatResponse>)
}

export function getChatHistory(chatId: string): Promise<HistoryResponse> {
  return fetch('/api/chats/history', {
    method: 'POST',
    headers: jsonHeaders,
    body: JSON.stringify({ chatId }),
  }).then(parseResponse<HistoryResponse>)
}

export function sendTextMessage(chatId: string, message: string): Promise<SendMessageResponse> {
  return fetch('/api/messages/send', {
    method: 'POST',
    headers: jsonHeaders,
    body: JSON.stringify({ chatId, message }),
  }).then(parseResponse<SendMessageResponse>)
}

export function pollMessages(): Promise<PollResponse> {
  return fetch('/api/messages/poll').then(parseResponse<PollResponse>)
}
