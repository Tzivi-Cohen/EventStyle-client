import { useReducer, useState } from 'react'
import { Link } from 'react-router-dom'
import { EventFiltersBar, type SortOption } from '../../components/EventFiltersBar'
import { StatusBadge } from '../../components/ui/Badges'
import { ConfirmDialog } from '../../components/ui/ConfirmDialog'
import { EmptyState } from '../../components/ui/EmptyState'
import { PageHeader } from '../../components/ui/PageHeader'
import { Pagination } from '../../components/ui/Pagination'
import { QueryState } from '../../components/ui/QueryState'
import { useDebouncedValue } from '../../hooks/useDebouncedValue'
import { useAdminEvents, useDeleteEvent, useUpdateEventStatus } from '../../hooks/useEvents'
import { useToast } from '../../hooks/useToast'
import { OPERATIONAL_EVENT_STATUSES, type EventStatus } from '../../types/common'
import type { EventItem } from '../../types/event'
import { getErrorMessage } from '../../utils/errorMessages'
import { eventFiltersReducer, hasActiveFilters, initialEventFilters, toEventQuery } from '../../utils/eventFiltersReducer'
import { tabClass, tabListClass } from '../../styles/tabClasses'
import { EVENT_STATUS_LABELS, EVENT_TYPE_LABELS, formatDate, formatPrice, isRequestStatus } from '../../utils/format'

const SORT_OPTIONS: SortOption[] = [
  { value: 'eventDate:desc', label: 'תאריך – מהמאוחר' },
  { value: 'eventDate:asc', label: 'תאריך – מהמוקדם' },
  { value: 'budget:desc', label: 'תקציב – מהגבוה' },
  { value: 'budget:asc', label: 'תקציב – מהנמוך' },
  { value: 'clientName:asc', label: 'שם לקוח – א-ת' },
  { value: 'clientName:desc', label: 'שם לקוח – ת-א' },
  { value: 'createdAt:desc', label: 'נוצרו לאחרונה' },
]

const PENDING_COUNT = { status: 'Pending' as const, page: 1, limit: 1 }

/**
 * כל האירועים והבקשות (GET /events): חיפוש, סינון, מיון ועמודים מתבצעים בשרת.
 * בקשה (ממתינה / נדחתה) לא מקבלת סטטוס תפעולי מהרשימה – היא נבדקת בעמוד שלה (אישור או דחייה).
 */
export function AdminEventsPage() {
  const toast = useToast()
  const [filters, dispatch] = useReducer(eventFiltersReducer, initialEventFilters)
  const search = useDebouncedValue(filters.search)
  const query = useAdminEvents(toEventQuery(filters, search))
  const pendingCount = useAdminEvents(PENDING_COUNT).data?.pagination.totalItems
  const updateStatus = useUpdateEventStatus()
  const deleteEvent = useDeleteEvent()
  const [toDelete, setToDelete] = useState<EventItem | null>(null)

  async function onStatusChange(event: EventItem, status: EventStatus) {
    try {
      await updateStatus.mutateAsync({ id: event.id, status })
      toast.success(`הסטטוס של "${event.eventName}" עודכן ל${EVENT_STATUS_LABELS[status]}`)
    } catch (e) {
      toast.error(getErrorMessage(e))
    }
  }

  async function onDelete() {
    if (!toDelete) return
    try {
      await deleteEvent.mutateAsync(toDelete.id)
      toast.success('האירוע נמחק')
      // מחקנו את הפריט האחרון בעמוד – חוזרים לעמוד הקודם
      if (query.data && query.data.data.length === 1 && filters.page > 1) dispatch({ type: 'page', page: filters.page - 1 })
    } catch (e) {
      toast.error(getErrorMessage(e))
    } finally {
      setToDelete(null)
    }
  }

  return (
    <>
      <PageHeader
        eyebrow="ניהול"
        title="אירועים"
        actions={
          <Link to="/admin/events/new" className="btn">
            + אירוע חדש
          </Link>
        }
      />

      <div className={tabListClass} role="group" aria-label="תצוגה מהירה">
        <button type="button" className={tabClass(filters.status === '')} aria-pressed={filters.status === ''} onClick={() => dispatch({ type: 'status', value: '' })}>
          הכול
        </button>
        <button
          type="button"
          className={tabClass(filters.status === 'Pending')}
          aria-pressed={filters.status === 'Pending'}
          onClick={() => dispatch({ type: 'status', value: 'Pending' })}
        >
          בקשות ממתינות{pendingCount ? ` (${pendingCount})` : ''}
        </button>
      </div>

      <EventFiltersBar filters={filters} dispatch={dispatch} searchPlaceholder="שם אירוע או שם לקוח" sortOptions={SORT_OPTIONS} />

      <QueryState
        query={query}
        loadingLabel="טוען אירועים..."
        isEmpty={(result) => result.data.length === 0}
        empty={
          <EmptyState
            title="לא נמצאו אירועים"
            description={hasActiveFilters(filters) ? 'נסי לשנות את החיפוש או את המסננים.' : 'עדיין לא נוצרו אירועים.'}
          />
        }
      >
        {(result) => (
          <>
            <div className="table-wrap">
              <table className="table">
                <caption className="sr-only">רשימת האירועים</caption>
                <thead>
                  <tr>
                    <th scope="col">אירוע</th>
                    <th scope="col">לקוח</th>
                    <th scope="col">תאריך</th>
                    <th scope="col">סוג</th>
                    <th scope="col">חבילה</th>
                    <th scope="col">תקציב</th>
                    <th scope="col">תמונות</th>
                    <th scope="col">סטטוס</th>
                    <th scope="col">
                      <span className="sr-only">פעולות</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {result.data.map((event) => (
                    <tr key={event.id}>
                      <td data-label="אירוע">
                        <Link to={`/admin/events/${event.id}`}>{event.eventName}</Link>
                      </td>
                      <td data-label="לקוח">
                        {event.clientName}
                        {event.userId === null && <span className="muted small"> (לא מקושר)</span>}
                      </td>
                      <td data-label="תאריך">{formatDate(event.eventDate)}</td>
                      <td data-label="סוג">{EVENT_TYPE_LABELS[event.eventType]}</td>
                      <td data-label="חבילה">{event.package?.name ?? '—'}</td>
                      <td data-label="תקציב">{formatPrice(event.budget)}</td>
                      <td data-label="תמונות">{event.photoCount ?? 0}</td>
                      <td data-label="סטטוס">
                        {isRequestStatus(event.status) ? (
                          <StatusBadge status={event.status} />
                        ) : (
                          <>
                            <label className="sr-only" htmlFor={`status-${event.id}`}>
                              סטטוס של {event.eventName}
                            </label>
                            <select
                              id={`status-${event.id}`}
                              className="status-select"
                              value={event.status}
                              disabled={updateStatus.isPending}
                              onChange={(e) => void onStatusChange(event, e.target.value as EventStatus)}
                            >
                              {OPERATIONAL_EVENT_STATUSES.map((s) => (
                                <option key={s} value={s}>
                                  {EVENT_STATUS_LABELS[s]}
                                </option>
                              ))}
                            </select>
                          </>
                        )}
                      </td>
                      <td className="row-actions">
                        {event.status === 'Pending' ? (
                          <Link to={`/admin/events/${event.id}`} className="btn btn-sm">
                            לבדיקה<span className="sr-only"> של {event.eventName}</span>
                          </Link>
                        ) : (
                          event.status !== 'Rejected' && (
                            <Link to={`/admin/events/${event.id}/edit`} className="btn btn-ghost btn-sm">
                              עריכה
                            </Link>
                          )
                        )}
                        <button type="button" className="btn btn-ghost btn-sm danger" onClick={() => setToDelete(event)}>
                          מחיקה
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination meta={result.pagination} onPageChange={(page) => dispatch({ type: 'page', page })} />
          </>
        )}
      </QueryState>

      {toDelete && (
        <ConfirmDialog
          title="מחיקת אירוע"
          confirmLabel="מחיקה לצמיתות"
          danger
          busy={deleteEvent.isPending}
          onConfirm={() => void onDelete()}
          onCancel={() => setToDelete(null)}
        >
          <p>
            למחוק את "{toDelete.eventName}"? כל התמונות של האירוע יימחקו, וגם עותקים שלהן שפורסמו בגלריה. הפעולה אינה הפיכה.
          </p>
        </ConfirmDialog>
      )}
    </>
  )
}
