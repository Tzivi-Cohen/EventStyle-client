import type { EventItem } from '../types/event'
import { EVENT_TYPE_LABELS, formatDate, formatPrice } from '../utils/format'

/** פרטי אירוע או בקשה לקריאה – משותף ללקוחה ולמנהלת. notes מוצג רק אם השרת החזיר אותו (מנהלת) */
export function EventSummary({ event }: { event: EventItem }) {
  return (
    <dl className="details details-grid">
      <dt>סוג אירוע</dt>
      <dd>{EVENT_TYPE_LABELS[event.eventType]}</dd>
      <dt>תאריך</dt>
      <dd>{formatDate(event.eventDate)}</dd>
      <dt>מיקום</dt>
      <dd>{event.location}</dd>
      <dt>חבילה</dt>
      <dd>{event.package?.name ?? '—'}</dd>
      <dt>מספר אורחים</dt>
      <dd>{event.guestCount}</dd>
      <dt>תקציב משוער</dt>
      <dd>{formatPrice(event.budget)}</dd>
      <dt>צבע / סגנון</dt>
      <dd>
        <span className="theme-color">
          {/^#[0-9a-f]{3,8}$/i.test(event.themeColor) && <span className="swatch" style={{ background: event.themeColor }} aria-hidden="true" />}
          {event.themeColor}
        </span>
      </dd>
      {event.description && (
        <>
          <dt>קונספט העיצוב</dt>
          <dd className="long-text">{event.description}</dd>
        </>
      )}
      {event.clientNotes && (
        <>
          <dt>הערות מיוחדות</dt>
          <dd className="long-text">{event.clientNotes}</dd>
        </>
      )}
      {event.notes !== undefined && (
        <>
          <dt>הערות פנימיות</dt>
          <dd>{event.notes || '—'}</dd>
        </>
      )}
    </dl>
  )
}
