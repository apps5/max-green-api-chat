interface Props {
  label: string
  size?: 'sm' | 'md'
}

function initials(label: string): string {
  const parts = label.trim().split(/\s+/).filter(Boolean)
  if (!parts.length) return 'M'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return `${parts[0][0] ?? ''}${parts[1][0] ?? ''}`.toUpperCase()
}

export function Avatar({ label, size = 'md' }: Props) {
  return <div className={`avatar avatar--${size}`} aria-hidden="true">{initials(label)}</div>
}
