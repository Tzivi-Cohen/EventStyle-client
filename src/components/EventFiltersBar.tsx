import type { Dispatch } from 'react'
import { EVENT_STATUSES, EVENT_TYPES, type EventStatus, type EventType } from '../types/common'
import type { EventSortField } from '../types/event'
import { isBudgetRangeInvalid, type EventFiltersAction, type EventFiltersState } from '../utils/eventFiltersReducer'
import { filterClasses } from '../styles/filterClasses'
import { EVENT_STATUS_LABELS, EVENT_TYPE_LABELS } from '../utils/format'

export type SortOption = { value: `${EventSortField}:${'asc' | 'desc'}`; label: string }

export function EventFiltersBar({
  filters,
  dispatch,
  searchPlaceholder,
  sortOptions,
}: {
  filters: EventFiltersState
  dispatch: Dispatch<EventFiltersAction>
  searchPlaceholder: string
  sortOptions: SortOption[]
}) {
  const rangeInvalid = isBudgetRangeInvalid(filters)
  return (
    <div className={filterClasses.bar} role="search" aria-label="חיפוש וסינון אירועים">
      <label className={filterClasses.wide}>
        <span>חיפוש</span>
        <input
          type="search"
          placeholder={searchPlaceholder}
          value={filters.search}
          maxLength={100}
          onChange={(e) => dispatch({ type: 'search', value: e.target.value })}
        />
      </label>
      <label className={filterClasses.field}>
        <span>סוג אירוע</span>
        <select value={filters.eventType} onChange={(e) => dispatch({ type: 'eventType', value: e.target.value as EventType | '' })}>
          <option value="">הכול</option>
          {EVENT_TYPES.map((t) => (
            <option key={t} value={t}>
              {EVENT_TYPE_LABELS[t]}
            </option>
          ))}
        </select>
      </label>
      <label className={filterClasses.field}>
        <span>סטטוס</span>
        <select value={filters.status} onChange={(e) => dispatch({ type: 'status', value: e.target.value as EventStatus | '' })}>
          <option value="">הכול</option>
          {EVENT_STATUSES.map((s) => (
            <option key={s} value={s}>
              {EVENT_STATUS_LABELS[s]}
            </option>
          ))}
        </select>
      </label>
      <fieldset className={filterClasses.range}>
        <legend className={filterClasses.legend}>תקציב (₪)</legend>
        <div className={filterClasses.rangeInputs}>
          <input
            className={filterClasses.rangeInput}
            type="number"
            min={0}
            inputMode="numeric"
            placeholder="מ-"
            aria-label="תקציב מינימלי"
            aria-invalid={rangeInvalid || undefined}
            value={filters.minBudget}
            onChange={(e) => dispatch({ type: 'minBudget', value: e.target.value })}
          />
          <span aria-hidden="true">–</span>
          <input
            className={filterClasses.rangeInput}
            type="number"
            min={0}
            inputMode="numeric"
            placeholder="עד"
            aria-label="תקציב מקסימלי"
            aria-invalid={rangeInvalid || undefined}
            value={filters.maxBudget}
            onChange={(e) => dispatch({ type: 'maxBudget', value: e.target.value })}
          />
        </div>
        {rangeInvalid && (
          <span className={filterClasses.error} role="alert">
            התקציב המינימלי גדול מהמקסימלי
          </span>
        )}
      </fieldset>
      <label className={filterClasses.field}>
        <span>מיון</span>
        <select
          value={`${filters.sortBy}:${filters.sortDir}`}
          onChange={(e) => {
            const [sortBy, sortDir] = e.target.value.split(':') as [EventSortField, 'asc' | 'desc']
            dispatch({ type: 'sort', sortBy, sortDir })
          }}
        >
          {sortOptions.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </label>
      <button type="button" className="btn btn-ghost btn-sm" onClick={() => dispatch({ type: 'reset' })}>
        איפוס
      </button>
    </div>
  )
}
