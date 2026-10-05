import type { ReactNode, SVGProps } from 'react'

type IconName =
  | 'search' | 'send' | 'back' | 'plus' | 'check' | 'chat' | 'inbox'
  | 'channels' | 'contacts' | 'phone' | 'video' | 'settings' | 'attach'
  | 'emoji' | 'microphone' | 'close'

type Props = SVGProps<SVGSVGElement> & { name: IconName }

export function Icon({ name, ...props }: Props) {
  const paths: Record<IconName, ReactNode> = {
    search: <><circle cx="11" cy="11" r="7"/><path d="m20 20-3.8-3.8"/></>,
    send: <><path d="M22 2 11 13"/><path d="m22 2-7 20-4-9-9-4Z"/></>,
    back: <path d="m15 18-6-6 6-6"/>,
    plus: <><path d="M12 5v14"/><path d="M5 12h14"/></>,
    check: <><path d="m4 12 4 4 8-9"/><path d="m11 15 2 2 7-9"/></>,
    chat: <><path d="M5 18.5 3.8 21l3.5-1.2c1.3.8 2.9 1.2 4.7 1.2 5 0 9-3.7 9-8.4S17 4.2 12 4.2s-9 3.7-9 8.4c0 2.3.8 4.3 2 5.9Z"/><path d="M8 12h.01M12 12h.01M16 12h.01"/></>,
    inbox: <><rect x="4" y="5" width="16" height="14" rx="3"/><path d="M4 10h16"/></>,
    channels: <><rect x="4" y="6" width="16" height="13" rx="3"/><path d="M7 9h10M7 13h6"/></>,
    contacts: <><circle cx="9" cy="9" r="3"/><circle cx="16.5" cy="10" r="2.5"/><path d="M3.5 19c.6-3.2 2.5-5 5.5-5s4.9 1.8 5.5 5"/><path d="M14 15c2.9-.4 5 .9 6 3.7"/></>,
    phone: <path d="M6.4 3.8 9 3l1.4 4.1-1.8 1.4c1.1 2.4 2.9 4.2 5.3 5.3l1.4-1.8 4.1 1.4-.8 2.6c-.4 1.4-1.8 2.3-3.2 2-6.1-1.2-10.9-6-12.1-12.1-.3-1.4.6-2.8 2-3.2l1.1-.3Z"/>,
    video: <><rect x="3.5" y="6" width="12" height="12" rx="3"/><path d="m15.5 10 5-2.5v9l-5-2.5"/></>,
    settings: <><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1-2.8 2.8-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.6V21h-4v-.1a1.7 1.7 0 0 0-1-1.6 1.7 1.7 0 0 0-1.9.3l-.1.1L4.2 17l.1-.1a1.7 1.7 0 0 0 .3-1.9A1.7 1.7 0 0 0 3 14H3v-4h.1a1.7 1.7 0 0 0 1.6-1 1.7 1.7 0 0 0-.3-1.9L4.2 7 7 4.2l.1.1a1.7 1.7 0 0 0 1.9.3 1.7 1.7 0 0 0 1-1.6V3h4v.1a1.7 1.7 0 0 0 1 1.6 1.7 1.7 0 0 0 1.9-.3l.1-.1L19.8 7l-.1.1a1.7 1.7 0 0 0-.3 1.9 1.7 1.7 0 0 0 1.6 1h.1v4H21a1.7 1.7 0 0 0-1.6 1Z"/></>,
    attach: <path d="m8.5 12.5 5.3-5.3a3 3 0 0 1 4.2 4.2l-7 7a5 5 0 1 1-7.1-7.1l7.4-7.4"/>,
    emoji: <><rect x="4" y="4" width="16" height="16" rx="5"/><path d="M8 10h.01M16 10h.01M8.5 14.5c2.2 1.7 4.8 1.7 7 0"/></>,
    microphone: <><rect x="9" y="3" width="6" height="11" rx="3"/><path d="M6.5 11.5a5.5 5.5 0 0 0 11 0M12 17v4"/></>,
    close: <><path d="m6 6 12 12"/><path d="M18 6 6 18"/></>,
  }

  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
      {paths[name]}
    </svg>
  )
}
