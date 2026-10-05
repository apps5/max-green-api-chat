import { Icon } from './Icon'

const items = [
  ['chat', 'Все'],
  ['inbox', 'Новые'],
  ['channels', 'Каналы'],
  ['contacts', 'Контакты'],
  ['phone', 'Звонки'],
] as const

export function NavigationRail() {
  return (
    <nav className="navigation-rail" aria-label="Разделы MAX">
      <div className="navigation-rail__items">
        {items.map(([icon, label], index) => (
          <button key={label} className={`rail-item ${index === 0 ? 'rail-item--active' : ''}`} type="button" disabled={index !== 0} title={index !== 0 ? 'Не входит в тестовое задание' : undefined}>
            <Icon name={icon} />
            <span>{label}</span>
          </button>
        ))}
      </div>
      <button className="rail-item" type="button" disabled title="Не входит в тестовое задание">
        <Icon name="settings" />
        <span>Настройки</span>
      </button>
    </nav>
  )
}
