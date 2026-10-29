import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { EventSummary } from '../../components/EventSummary'
import { RequestStatusPanel } from '../../components/RequestStatusPanel'
import { EventPhotosPanel } from '../../components/photos/EventPhotosPanel'
import { Badge, StatusBadge, StatusProgress } from '../../components/ui/Badges'
import { ConfirmDialog } from '../../components/ui/ConfirmDialog'
import { Field } from '../../components/ui/Field'
import { PageHeader } from '../../components/ui/PageHeader'
import { QueryState } from '../../components/ui/QueryState'
import { useDeleteEvent, useEvent, useReviewRequest, useUpdateEventStatus } from '../../hooks/useEvents'
import { useToast } from '../../hooks/useToast'
import { OPERATIONAL_EVENT_STATUSES, type EventStatus } from '../../types/common'
import { getErrorMessage } from '../../utils/errorMessages'
import { filterClasses } from '../../styles/filterClasses'
import { EVENT_STATUS_LABELS, EVENT_TYPE_LABELS, isRequestStatus } from '../../utils/format'

const REASON_MAX = 500

export function AdminEventDetailsPage() {
  const id = Number(useParams().id)
  const navigate = useNavigate()
  const toast = useToast()
  const query = useEvent(id)
  const updateStatus = useUpdateEventStatus()
  const deleteEvent = useDeleteEvent()
  const [confirmDelete, setConfirmDelete] = useState(false)
  const review = useReviewRequest()
  const [rejecting, setRejecting] = useState(false)
  const [reason, setReason] = useState('')

  async function onReview(decision: 'approve' | 'reject') {
    try {
      await review.mutateAsync({ id, decision, reason: reason.trim() || null })
      toast.success(decision === 'approve' ? 'הבקשה אושרה – האירוע בסטטוס "חדש"' : 'הבקשה נדחתה')
      setRejecting(false)
      setReason('')
    } catch (e) {
      toast.error(getErrorMessage(e))
      setRejecting(false)
    }
  }

  async function onStatus(status: EventStatus) {
    try {
      await updateStatus.mutateAsync({ id, status })
      toast.success(`הסטטוס עודכן ל${EVENT_STATUS_LABELS[status]}`)
    } catch (e) {
      toast.error(getErrorMessage(e))
    }
  }

  async function onDelete() {
    try {
      await deleteEvent.mutateAsync(id)
      toast.success('האירוע נמחק')
      navigate('/admin/events', { replace: true })
    } catch (e) {
      toast.error(getErrorMessage(e))
      setConfirmDelete(false)
    }
  }

  return (
    <>
      <p>
        <Link to="/admin/events">→ לכל האירועים</Link>
      </p>
      <QueryState query={query} loadingLabel="טוען את האירוע...">
        {(event) => (
          <>
            <PageHeader
              eyebrow={EVENT_TYPE_LABELS[event.eventType]}
              title={event.eventName}
              description={
                <>
                  {event.clientName} · <span dir="ltr">{event.clientEmail}</span>{' '}
                  {event.userId === null ? <Badge tone="warning">לא מקושר לחשבון</Badge> : <Badge tone="success">מקושר לחשבון</Badge>}
                </>
              }
              actions={
                <>
                  {!isRequestStatus(event.status) && (
                    <Link to={`/admin/events/${event.id}/edit`} className="btn btn-outline">
                      עריכה
                    </Link>
                  )}
                  <button type="button" className="btn btn-ghost danger" onClick={() => setConfirmDelete(true)}>
                    מחיקה
                  </button>
                </>
              }
            />
            {isRequestStatus(event.status) ? (
              <RequestStatusPanel
                event={event}
                actions={
                  event.status === 'Pending' && (
                    <>
                      <button type="button" className="btn" disabled={review.isPending} onClick={() => void onReview('approve')}>
                        {review.isPending && !rejecting ? 'מאשר...' : 'אישור הבקשה'}
                      </button>
                      <button type="button" className="btn btn-ghost danger" disabled={review.isPending} onClick={() => setRejecting(true)}>
                        דחייה
                      </button>
                    </>
                  )
                }
              />
            ) : (
              <section className="card card-padded">
                <div className="section-head">
                  <h2 className="section-title">סטטוס ההכנות</h2>
                  <label className={filterClasses.inline}>
                    <span>עדכון סטטוס</span>
                    <select value={event.status} disabled={updateStatus.isPending} onChange={(e) => void onStatus(e.target.value as EventStatus)}>
                      {OPERATIONAL_EVENT_STATUSES.map((s) => (
                        <option key={s} value={s}>
                          {EVENT_STATUS_LABELS[s]}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
                <StatusProgress status={event.status} />
              </section>
            )}
            <section className="card card-padded">
              <div className="section-head">
                <h2 className="section-title">{isRequestStatus(event.status) ? 'פרטי הבקשה' : 'פרטי האירוע'}</h2>
                <StatusBadge status={event.status} />
              </div>
              <EventSummary event={event} />
            </section>
            {!isRequestStatus(event.status) && <EventPhotosPanel eventId={event.id} eventType={event.eventType} mode="admin" />}

            {rejecting && (
              <ConfirmDialog
                title="דחיית בקשה"
                confirmLabel="דחיית הבקשה"
                danger
                busy={review.isPending}
                onConfirm={() => void onReview('reject')}
                onCancel={() => setRejecting(false)}
              >
                <p>הבקשה תישמר במערכת ותינעל לעריכה. הלקוחה תראה שהבקשה נדחתה.</p>
                <Field id="reject-reason" label="סיבת הדחייה (רשות – מוצגת ללקוחה)">
                  <textarea id="reject-reason" rows={3} maxLength={REASON_MAX} value={reason} onChange={(e) => setReason(e.target.value)} />
                </Field>
              </ConfirmDialog>
            )}

            {confirmDelete && (
              <ConfirmDialog
                title="מחיקת אירוע"
                confirmLabel="מחיקה לצמיתות"
                danger
                busy={deleteEvent.isPending}
                onConfirm={() => void onDelete()}
                onCancel={() => setConfirmDelete(false)}
              >
                <p>כל התמונות של האירוע יימחקו, וגם עותקים שלהן שפורסמו בגלריה. הפעולה אינה הפיכה.</p>
              </ConfirmDialog>
            )}
          </>
        )}
      </QueryState>
    </>
  )
}
