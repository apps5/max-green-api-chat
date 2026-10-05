import { randomUUID } from 'node:crypto'
import type { Request, Response } from 'express'
import type { GreenApiCredentials } from './types.js'

const COOKIE_NAME = 'max_chat_session'
const SESSION_TTL_MS = 12 * 60 * 60 * 1000

interface SessionRecord {
  credentials: GreenApiCredentials
  expiresAt: number
}

const sessions = new Map<string, SessionRecord>()

function readCookies(request: Request): Record<string, string> {
  const header = request.headers.cookie
  if (!header) return {}

  return Object.fromEntries(
    header.split(';').map((item) => {
      const [name, ...rest] = item.trim().split('=')
      return [name, decodeURIComponent(rest.join('='))]
    }),
  )
}

export function createSession(response: Response, credentials: GreenApiCredentials): void {
  const sessionId = randomUUID()
  sessions.set(sessionId, { credentials, expiresAt: Date.now() + SESSION_TTL_MS })
  response.cookie(COOKIE_NAME, sessionId, {
    httpOnly: true,
    sameSite: 'strict',
    secure: process.env.NODE_ENV === 'production' && process.env.COOKIE_SECURE === 'true',
    maxAge: SESSION_TTL_MS,
    path: '/',
  })
}

export function getSession(request: Request): SessionRecord | null {
  const sessionId = readCookies(request)[COOKIE_NAME]
  if (!sessionId) return null

  const session = sessions.get(sessionId)
  if (!session) return null

  if (session.expiresAt <= Date.now()) {
    sessions.delete(sessionId)
    return null
  }

  session.expiresAt = Date.now() + SESSION_TTL_MS
  return session
}

export function destroySession(request: Request, response: Response): void {
  const sessionId = readCookies(request)[COOKIE_NAME]
  if (sessionId) sessions.delete(sessionId)
  response.clearCookie(COOKIE_NAME, { path: '/' })
}

setInterval(() => {
  const now = Date.now()
  for (const [sessionId, session] of sessions) {
    if (session.expiresAt <= now) sessions.delete(sessionId)
  }
}, 60 * 60 * 1000).unref()
