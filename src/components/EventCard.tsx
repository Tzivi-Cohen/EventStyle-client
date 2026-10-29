import { Link } from 'react-router-dom'
import type { EventItem } from '../types/event'
import { EVENT_TYPE_LABELS, formatDate, formatPrice } from '../utils/format'
import { eventTypeBackground } from '../styles/eventTypeBackgrounds'
import { StatusBadge } from './ui/Badges'
import { SafeImage } from './ui/SafeImage'

export function EventCard({ event }: { event: EventItem }) {
  const editable = event.status === 'Pending'
  return (
    <article className="group card event-card flex h-full flex-col transition-[transform,box-shadow] duration-250 ease-studio hover:[transform:translateY(-3px)] hover:shadow-raised">
      <div className={`relative grid aspect-video place-items-center overflow-hidden ${eventTypeBackground[event.eventType]}`}>
        {event.coverImageUrl ? (
          <SafeImage src={event.coverImageUrl} alt={event.eventName} className="absolute inset-0 h-full w-full object-cover transition-transform duration-600 ease-studio group-hover:[transform:scale(1.04)]" />
        ) : (
          <span className="text-[2.4rem] text-gold opacity-55" aria-hidden="true">
            ✦
          </span>
        )}
        <span className="absolute start-3 top-3">
          <StatusBadge status={event.status} className="shadow-[0_2px_8px_rgb(28_35_51_/_0.12)]" />
        </span>
      </div>
      <div className="card-body flex flex-1 flex-col">
        <p className="eyebrow">{EVENT_TYPE_LABELS[event.eventType]}</p>
        <h2 className="mb-1 text-[1.3rem]">{event.eventName}</h2>
        <p className="muted small mb-3">
          {formatDate(event.eventDate)} · {event.location}
        </p>
        {event.description && <p className="mb-3 line-clamp-3 text-ink-soft">{event.description}</p>}
        <dl className="mx-0 mt-auto mb-4 grid grid-cols-[1fr_1fr] gap-3 border-t border-line pt-3">
          <div>
            <dt className="text-[0.78rem] text-ink-soft">תקציב משוער</dt>
            <dd className="m-0 font-semibold">{formatPrice(event.budget)}</dd>
          </div>
          <div>
            <dt className="text-[0.78rem] text-ink-soft">חבילה</dt>
            <dd className="m-0 font-semibold">{event.package?.name ?? '—'}</dd>
          </div>
        </dl>
        <div className="flex flex-wrap gap-2">
          <Link to={`/my-events/${event.id}`} className="btn btn-sm">
            צפייה בפרטים
            <span className="sr-only"> של {event.eventName}</span>
          </Link>
          {editable && (
            <Link to={`/my-events/${event.id}/edit`} className="btn btn-outline btn-sm">
              עריכת בקשה
              <span className="sr-only"> {event.eventName}</span>
            </Link>
          )}
        </div>
      </div>
    </article>
  )
}
