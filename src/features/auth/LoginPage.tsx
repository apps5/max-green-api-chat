import { useState, type FormEvent } from 'react'
import { connectSession } from '../../services/api'

interface Props {
  onConnected: (idInstance: string) => void
}

export function LoginPage({ onConnected }: Props) {
  const [idInstance, setIdInstance] = useState('')
  const [apiTokenInstance, setApiTokenInstance] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const id = idInstance.trim()
    const token = apiTokenInstance.trim()
    if (!id || !token || submitting) return

    setSubmitting(true)
    setError(null)
    try {
      const session = await connectSession(id, token)
      if (session.authenticated && session.idInstance) onConnected(session.idInstance)
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Не удалось подключиться к GREEN-API')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="login-page">
      <section className="login-card" aria-labelledby="login-title">
        <div className="login-brand" aria-hidden="true">MAX</div>
        <div className="login-copy">
          <h1 id="login-title">Подключение к MAX</h1>
          <p>Введите данные вашего инстанса GREEN-API.</p>
        </div>

        <form className="login-form" onSubmit={submit}>
          <label>
            <span>idInstance</span>
            <input
              inputMode="numeric"
              autoComplete="off"
              value={idInstance}
              onChange={(event) => setIdInstance(event.target.value.replace(/\D/g, ''))}
              placeholder="Например, 3100000000"
              required
            />
          </label>

          <label>
            <span>apiTokenInstance</span>
            <input
              type="password"
              autoComplete="off"
              value={apiTokenInstance}
              onChange={(event) => setApiTokenInstance(event.target.value)}
              placeholder="Введите токен"
              required
            />
          </label>

          {error && <div className="form-error" role="alert">{error}</div>}

          <button className="primary-button login-form__submit" type="submit" disabled={!idInstance.trim() || !apiTokenInstance.trim() || submitting}>
            {submitting ? 'Подключение…' : 'Войти'}
          </button>
        </form>

        <p className="login-note">Данные используются сервером только для текущей сессии и не сохраняются в браузере.</p>
      </section>
    </main>
  )
}
