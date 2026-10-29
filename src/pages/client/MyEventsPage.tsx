import { useReducer } from 'react'
import { Link } from 'react-router-dom'
import { EventCard } from '../../components/EventCard'
import { EventFiltersBar, type SortOption } from '../../components/EventFiltersBar'
import { EmptyState } from '../../components/ui/EmptyState'
import { PageHeader } from '../../components/ui/PageHeader'
import { Pagination } from '../../components/ui/Pagination'
import { QueryState } from '../../components/ui/QueryState'
import { useDebouncedValue } from '../../hooks/useDebouncedValue'
import { useMyEvents } from '../../hooks/useEvents'
import { eventFiltersReducer, hasActiveFilters, initialEventFilters, toEventQuery } from '../../utils/eventFiltersReducer'

const SORT_OPTIONS: SortOption[] = [
  { value: 'eventDate:desc', label: 'תאריך – מהמאוחר' },
  { value: 'eventDate:asc', label: 'תאריך – מהמוקדם' },
  { value: 'budget:asc', label: 'תקציב – מהנמוך לגבוה' },
  { value: 'budget:desc', label: 'תקציב – מהגבוה לנמוך' },
  { value: 'eventName:asc', label: 'שם האירוע – א-ת' },
  { value: 'createdAt:desc', label: 'נשלחו לאחרונה' },
]

const MY_FILTERS = { ...initialEventFilters, limit: 9 }

export function MyEventsPage() {
  const [filters, dispatch] = useReducer(eventFiltersReducer, MY_FILTERS)
  const search = useDebouncedValue(filters.search)
  const query = useMyEvents(toEventQuery(filters, search))

  return (
    <main className="page container">
      <PageHeader
        eyebrow="האזור האישי"
        title="האירועים שלי"
        description="הבקשות שלך, סטטוס ההכנות, פרטי האירוע ותמונות."
        actions={
          <Link to="/my-events/new" className="btn">
            + בקשה חדשה לעיצוב
          </Link>
        }
      />

      <EventFiltersBar filters={filters} dispatch={dispatch} searchPlaceholder="שם האירוע" sortOptions={SORT_OPTIONS} />

      <QueryState
        query={query}
        loadingLabel="טוען את האירועים..."
        isEmpty={(result) => result.data.length === 0}
        empty={
          hasActiveFilters(filters) ? (
            <EmptyState
              title="לא נמצאו אירועים מתאימים"
              description="נסי לשנות את החיפוש או את המסננים."
              action={
                <button type="button" className="btn btn-outline" onClick={() => dispatch({ type: 'reset' })}>
                  ניקוי המסננים
                </button>
              }
            />
          ) : (
            <EmptyState
              title="עדיין אין אירועים בחשבון"
              description="שלחי בקשה לעיצוב אירוע – היא תופיע כאן עם הסטטוס שלה."
              action={
                <Link to="/my-events/new" className="btn">
                  שליחת בקשה ראשונה
                </Link>
              }
            />
          )
        }
      >
        {(result) => (
          <>
            <p className="results-count muted small" role="status">
              {result.pagination.totalItems} אירועים ובקשות
            </p>
            <ul className="card-grid grid-cols-[repeat(auto-fill,minmax(min(100%,300px),1fr))]">
              {result.data.map((event) => (
                <li key={event.id}>
                  <EventCard event={event} />
                </li>
              ))}
            </ul>
            <Pagination meta={result.pagination} onPageChange={(page) => dispatch({ type: 'page', page })} />
          </>
        )}
      </QueryState>
    </main>
  )
}
