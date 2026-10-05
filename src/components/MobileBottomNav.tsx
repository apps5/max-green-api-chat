import { Icon } from './Icon'

export function MobileBottomNav() {
  return (
    <nav className="mobile-bottom-nav" aria-label="Навигация MAX">
      <button type="button" disabled><Icon name="contacts"/><span>Контакты</span></button>
      <button type="button" disabled><Icon name="phone"/><span>Звонки</span></button>
      <button type="button" className="is-active"><Icon name="chat"/><span>Чаты</span></button>
      <button type="button" disabled><Icon name="settings"/><span>Настройки</span></button>
    </nav>
  )
}
