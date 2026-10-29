import type { ReactNode } from 'react'
import type { EventItem } from '../types/event'
import { formatDateTime } from '../utils/format'

export function RequestStatusPanel({ event, actions }: { event: EventItem; actions?: ReactNode }) {
  if (event.status === 'Pending') {
    return (
      <section className="request-panel request-pending" aria-labelledby="request-state">
        <div>
          <h2 id="request-state" className="section-title">
            הבקשה ממתינה לאישור הסטודיו
          </h2>
          <p>אפשר לערוך את פרטי הבקשה עד שהיא נבדקת. אחרי האישור האירוע עובר לניהול הסטודיו, ואפשר יהיה להעלות תמונות.</p>
        </div>
        {actions && <div className="request-actions">{actions}</div>}
      </section>
    )
  }
  if (event.status === 'Rejected') {
    return (
      <section className="request-panel request-rejected" aria-labelledby="request-state">
        <div>
          <h2 id="request-state" className="section-title">
            הבקשה נדחתה
          </h2>
          {event.rejectionReason ? (
            <p>
              <strong>סיבה:</strong> {event.rejectionReason}
            </p>
          ) : (
            <p>לפרטים נוספים אפשר ליצור קשר עם הסטודיו.</p>
          )}
          {event.reviewedAt && <p className="muted small">נבדקה ב-{formatDateTime(event.reviewedAt)}</p>}
        </div>
        {actions && <div className="request-actions">{actions}</div>}
      </section>
    )
  }
  return null
}
