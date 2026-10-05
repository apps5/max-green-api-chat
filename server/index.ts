import 'dotenv/config'
import express, { type NextFunction, type Request, type Response } from 'express'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { GreenApiClient, GreenApiError } from './greenApiClient.js'
import { createSession, destroySession, getSession } from './sessionStore.js'
import type { GreenApiCredentials } from './types.js'

const app = express()
const apiUrl = (process.env.GREEN_API_URL ?? 'https://api.green-api.com').replace(/\/$/, '')

app.disable('x-powered-by')
app.use(express.json({ limit: '32kb' }))

function normalizeIdInstance(value: unknown): string {
  const id = typeof value === 'string' ? value.trim() : ''
  if (!/^\d+$/.test(id)) throw new ClientError('idInstance должен содержать только цифры')
  return id
}

function normalizeToken(value: unknown): string {
  const token = typeof value === 'string' ? value.trim() : ''
  if (!token) throw new ClientError('apiTokenInstance обязателен')
  if (token.length > 512) throw new ClientError('apiTokenInstance имеет некорректную длину')
  return token
}

function normalizePhone(value: unknown): string {
  const phone = typeof value === 'string' ? value.replace(/\D/g, '') : ''
  if (!/^7\d{10}$/.test(phone) && !/^375\d{9}$/.test(phone)) {
    throw new ClientError('Введите номер РФ или РБ в международном формате, например 79991234567')
  }
  return phone
}

function normalizeMessage(value: unknown): string {
  const message = typeof value === 'string' ? value.trim() : ''
  if (!message) throw new ClientError('Введите текст сообщения')
  if (message.length > 4000) throw new ClientError('Максимальная длина сообщения — 4000 символов')
  return message
}

function clientFor(request: Request): GreenApiClient {
  const session = getSession(request)
  if (!session) throw new UnauthorizedError()
  return new GreenApiClient(session.credentials)
}

class ClientError extends Error {
  readonly statusCode = 400
}

class UnauthorizedError extends Error {
  readonly statusCode = 401
  constructor() {
    super('Сессия не найдена. Введите данные GREEN-API повторно.')
  }
}

app.get('/api/health', (_request, response) => {
  response.json({ ok: true })
})

app.get('/api/session', (request, response) => {
  const session = getSession(request)
  response.json({ authenticated: Boolean(session), idInstance: session?.credentials.idInstance ?? null })
})

app.post('/api/session', async (request, response, next) => {
  try {
    const credentials: GreenApiCredentials = {
      apiUrl,
      idInstance: normalizeIdInstance(request.body?.idInstance),
      apiTokenInstance: normalizeToken(request.body?.apiTokenInstance),
    }

    const client = new GreenApiClient(credentials)
    const stateInstance = await client.getState()

    if (stateInstance !== 'authorized') {
      throw new ClientError(`Инстанс не готов к работе. Текущий статус: ${stateInstance}`)
    }

    createSession(response, credentials)
    response.json({ authenticated: true, idInstance: credentials.idInstance, stateInstance })
  } catch (error) {
    next(error)
  }
})

app.delete('/api/session', (request, response) => {
  destroySession(request, response)
  response.status(204).end()
})

app.post('/api/chats', async (request, response, next) => {
  try {
    const phoneNumber = normalizePhone(request.body?.phoneNumber)
    const chat = await clientFor(request).checkAccount(phoneNumber)
    response.json(chat)
  } catch (error) {
    next(error)
  }
})

app.post('/api/messages/send', async (request, response, next) => {
  try {
    const chatId = typeof request.body?.chatId === 'string' ? request.body.chatId.trim() : ''
    if (!chatId) throw new ClientError('Не выбран чат')

    const message = normalizeMessage(request.body?.message)
    const result = await clientFor(request).sendMessage(chatId, message)
    response.json(result)
  } catch (error) {
    next(error)
  }
})

app.get('/api/messages/poll', async (request, response, next) => {
  try {
    const messages = await clientFor(request).receiveTextMessages()
    response.json({ messages })
  } catch (error) {
    next(error)
  }
})

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const distPath = path.resolve(__dirname, '../dist')
app.use(express.static(distPath))
app.use((_request, response) => response.sendFile(path.join(distPath, 'index.html')))

app.use((error: unknown, _request: Request, response: Response, _next: NextFunction) => {
  const message = error instanceof Error ? error.message : 'Внутренняя ошибка сервера'
  const statusCode =
    error instanceof GreenApiError || error instanceof ClientError || error instanceof UnauthorizedError
      ? error.statusCode
      : 500

  if (statusCode >= 500) console.error(error)
  response.status(statusCode).json({ error: message })
})

const port = Number(process.env.PORT ?? 3000)
app.listen(port, '0.0.0.0', () => {
  console.log(`MAX GREEN-API chat listening on :${port}`)
})
