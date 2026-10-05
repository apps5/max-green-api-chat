import { useEffect, useRef, useState, type FormEvent } from 'react'
import { Icon } from '../../components/Icon'

interface Props {
  open: boolean
  loading: boolean
  error: string | null
  onClose: () => void
  onSubmit: (phoneNumber: string) => Promise<void>
}

export function NewChatDialog({ open, loading, error, onClose, onSubmit }: Props) {
  const [value, setValue] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!open) return
    setValue('')
    const timer = window.setTimeout(() => inputRef.current?.focus(), 40)
    return () => window.clearTimeout(timer)
  }, [open])

  if (!open) return null

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const phoneNumber = value.replace(/\D/g, '')
    if (!phoneNumber || loading) return
    await onSubmit(phoneNumber)
  }

  return (
    <div className="dialog-backdrop" role="presentation" onMouseDown={onClose}>
      <form className="new-chat-dialog" onSubmit={submit} onMouseDown={(event) => event.stopPropagation()}>
        <div className="new-chat-dialog__head">
          <div>
            <h2>Новый чат</h2>
            <p>Введите номер телефона пользователя MAX.</p>
          </div>
          <button className="icon-button" type="button" onClick={onClose} aria-label="Закрыть"><Icon name="close" /></button>
        </div>

        <label className="field-label" htmlFor="new-chat-phone">Номер телефона</label>
        <input
          ref={inputRef}
          id="new-chat-phone"
          className="dialog-input"
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          value={value}
          onChange={(event) => setValue(event.target.value)}
          placeholder="79991234567"
          aria-describedby="phone-hint"
        />
        <p className="field-hint" id="phone-hint">РФ: 7XXXXXXXXXX · РБ: 375XXXXXXXXX</p>
        {error && <div className="form-error form-error--compact" role="alert">{error}</div>}

        <button className="primary-button" type="submit" disabled={!value.replace(/\D/g, '') || loading}>
          {loading ? 'Проверяем…' : 'Создать чат'}
        </button>
      </form>
    </div>
  )
}
