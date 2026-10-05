import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from 'react'
import { Icon } from '../../components/Icon'

interface Props {
  onSend: (message: string) => Promise<void>
}

export function MessageComposer({ onSend }: Props) {
  const [value, setValue] = useState('')
  const [sending, setSending] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    const element = textareaRef.current
    if (!element) return
    element.style.height = 'auto'
    element.style.height = `${Math.min(element.scrollHeight, 116)}px`
  }, [value])

  const submit = async (event?: FormEvent) => {
    event?.preventDefault()
    const text = value.trim()
    if (!text || sending) return
    setSending(true)
    setValue('')
    try { await onSend(text) } finally { setSending(false) }
  }

  const onKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault()
      void submit()
    }
  }

  return (
    <div className="composer-wrap">
      <form className="composer" onSubmit={submit}>
        <button className="composer__side-button" type="button" disabled title="Вложения не входят в тестовое задание" aria-label="Вложение"><Icon name="attach"/></button>
        <textarea ref={textareaRef} rows={1} maxLength={4000} value={value} onChange={(event) => setValue(event.target.value)} onKeyDown={onKeyDown} placeholder="Сообщение" aria-label="Сообщение" />
        <button className="composer__side-button composer__desktop-extra" type="button" disabled title="Не входит в тестовое задание" aria-label="Эмодзи"><Icon name="emoji"/></button>
        {value.trim() ? (
          <button className="send-button" type="submit" disabled={sending} aria-label="Отправить"><Icon name="send" /></button>
        ) : (
          <button className="composer__side-button" type="button" disabled title="Голосовые сообщения не входят в тестовое задание" aria-label="Микрофон"><Icon name="microphone"/></button>
        )}
      </form>
    </div>
  )
}
