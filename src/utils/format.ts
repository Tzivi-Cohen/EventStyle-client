import type { EventStatus, EventType } from '../types/common'

export const EVENT_TYPE_LABELS: Record<EventType, string> = {
  Birthday: 'יום הולדת',
  BatMitzvah: 'בת מצווה',
  Brit: 'ברית / בריתה',
  Corporate: 'אירוע חברה',
  Private: 'אירוע פרטי',
}

export const EVENT_TYPE_DESCRIPTIONS: Record<EventType, string> = {
  Birthday: 'עיצוב חגיגי ואישי לכל גיל',
  BatMitzvah: 'עיצוב מרגש ליום המיוחד',
  Brit: 'עיצוב עדין וחם לשמחה המשפחתית',
  Corporate: 'עיצוב מוקפד לאירועים עסקיים',
  Private: 'עיצוב בהתאמה אישית לכל אירוע',
}

export const EVENT_STATUS_LABELS: Record<EventStatus, string> = {
  New: 'חדש',
  Planning: 'בתכנון',
  Preparing: 'בהכנות',
  Ready: 'מוכן',
  Completed: 'הושלם',
  Pending: 'ממתינה לאישור',
  Rejected: 'נדחתה',
}

export function formatPhone(phone: string): string {
  const digits = phone.trim()
  return /^05\d{8}$/.test(digits) ? `${digits.slice(0, 3)}-${digits.slice(3)}` : digits
}

export const isRequestStatus = (status: EventStatus) => status === 'Pending' || status === 'Rejected'

export const ROLE_LABELS = { Admin: 'מנהלת', Client: 'לקוחה' } as const

export function formatDate(dateOnly: string): string {
  const [y, m, d] = dateOnly.slice(0, 10).split('-')
  return y && m && d ? `${d}/${m}/${y}` : dateOnly
}

export function formatDateTime(iso: string): string {
  const date = new Date(iso)
  return Number.isNaN(date.getTime())
    ? iso
    : date.toLocaleString('he-IL', { dateStyle: 'short', timeStyle: 'short' })
}

const currency = new Intl.NumberFormat('he-IL', { style: 'currency', currency: 'ILS', maximumFractionDigits: 2 })

export function formatPrice(value: number): string {
  return currency.format(value)
}
