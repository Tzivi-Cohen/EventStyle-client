import { Link, useParams } from 'react-router-dom'
import { EventSummary } from '../../components/EventSummary'
import { RequestStatusPanel } from '../../components/RequestStatusPanel'
import { EventPhotosPanel } from '../../components/photos/EventPhotosPanel'
import { StatusBadge, StatusProgress } from '../../components/ui/Badges'
import { PageHeader } from '../../components/ui/PageHeader'
import { QueryState } from '../../components/ui/QueryState'
import { useEvent } from '../../hooks/useEvents'
import { EVENT_TYPE_LABELS, isRequestStatus } from '../../utils/format'

export function MyEventDetailsPage() {
  const id = Number(useParams().id)
  const query = useEvent(id)

  return (
    <main className="page container">
      <p>
        <Link to="/my-events">→ חזרה לאירועים שלי</Link>
      </p>
      <QueryState query={query} loadingLabel="טוען את האירוע...">
        {(event) => (
          <>
            <PageHeader
              eyebrow={EVENT_TYPE_LABELS[event.eventType]}
              title={event.eventName}
              description={<StatusBadge status={event.status} />}
            />
            {isRequestStatus(event.status) ? (
              <RequestStatusPanel
                event={event}
                actions={
                  event.status === 'Pending' && (
                    <Link to={`/my-events/${event.id}/edit`} className="btn">
                      עריכת בקשה
                    </Link>
                  )
                }
              />
            ) : (
              <section className="card card-padded">
                <h2 className="section-title">סטטוס ההכנות</h2>
                <StatusProgress status={event.status} />
              </section>
            )}
            <section className="card card-padded">
              <h2 className="section-title">{isRequestStatus(event.status) ? 'פרטי הבקשה' : 'פרטי האירוע'}</h2>
              <EventSummary event={event} />
            </section>
            {!isRequestStatus(event.status) && <EventPhotosPanel eventId={event.id} eventType={event.eventType} mode="owner" />}
          </>
        )}
      </QueryState>
    </main>
  )
}
