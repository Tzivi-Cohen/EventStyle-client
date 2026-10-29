import type { EventStatus, EventType } from '../types/common'
import type { EventFilters, EventSortField } from '../types/event'

/**
 * מסנני רשימת האירועים – של המנהלת ושל הלקוחה (useReducer): כל שינוי בחיפוש, סינון או מיון מחזיר לעמוד 1,
 * כדי שלא יוצג עמוד שכבר לא קיים בתוצאות החדשות.
 */
export type EventFiltersState = Required<Pick<EventFilters, 'page' | 'limit' | 'sortBy' | 'sortDir'>> & {
  search: string
  eventType: EventType | ''
  status: EventStatus | ''
  /** טווח תקציב – כפי שהוקלד בשדה (מחרוזת ריקה = בלי גבול) */
  minBudget: string
  maxBudget: string
}

export type EventFiltersAction =
  | { type: 'search'; value: string }
  | { type: 'eventType'; value: EventType | '' }
  | { type: 'status'; value: EventStatus | '' }
  | { type: 'minBudget'; value: string }
  | { type: 'maxBudget'; value: string }
  | { type: 'sort'; sortBy: EventSortField; sortDir: 'asc' | 'desc' }
  | { type: 'page'; page: number }
  | { type: 'reset' }

export const initialEventFilters: EventFiltersState = {
  search: '',
  eventType: '',
  status: '',
  minBudget: '',
  maxBudget: '',
  sortBy: 'eventDate',
  sortDir: 'desc',
  page: 1,
  limit: 10,
}

export function eventFiltersReducer(state: EventFiltersState, action: EventFiltersAction): EventFiltersState {
  switch (action.type) {
    case 'search':
      return { ...state, search: action.value, page: 1 }
    case 'eventType':
      return { ...state, eventType: action.value, page: 1 }
    case 'status':
      return { ...state, status: action.value, page: 1 }
    case 'minBudget':
      return { ...state, minBudget: action.value, page: 1 }
    case 'maxBudget':
      return { ...state, maxBudget: action.value, page: 1 }
    case 'sort':
      return { ...state, sortBy: action.sortBy, sortDir: action.sortDir, page: 1 }
    case 'page':
      return { ...state, page: Math.max(1, action.page) }
    case 'reset':
      return { ...initialEventFilters, limit: state.limit }
  }
}

/** ערך תקציב תקין מהשדה: מספר לא שלילי, אחרת undefined (לא נשלח לשרת) */
function budgetValue(value: string): number | undefined {
  if (!value.trim()) return undefined
  const number = Number(value)
  return Number.isFinite(number) && number >= 0 ? number : undefined
}

/** טווח התקציב הפוך (מינימום גדול מהמקסימום) – מוצגת הודעה, והטווח לא נשלח */
export function isBudgetRangeInvalid(state: EventFiltersState): boolean {
  const min = budgetValue(state.minBudget)
  const max = budgetValue(state.maxBudget)
  return min !== undefined && max !== undefined && min > max
}

/** האם יש חיפוש או סינון פעילים – כדי להבדיל בין "אין תוצאות" ל"אין עדיין אירועים" */
export function hasActiveFilters(state: EventFiltersState): boolean {
  return Boolean(state.search.trim() || state.eventType || state.status || state.minBudget.trim() || state.maxBudget.trim())
}

/** המרה לפרמטרים לשרת: ערכים ריקים לא נשלחים (השרת מחזיר 400 על פרמטר ריק) */
export function toEventQuery(state: EventFiltersState, search = state.search): EventFilters {
  return {
    page: state.page,
    limit: state.limit,
    sortBy: state.sortBy,
    sortDir: state.sortDir,
    ...(search.trim() && { search: search.trim() }),
    ...(state.eventType && { eventType: state.eventType }),
    ...(state.status && { status: state.status }),
    ...(!isBudgetRangeInvalid(state) && {
      ...(budgetValue(state.minBudget) !== undefined && { minBudget: budgetValue(state.minBudget) }),
      ...(budgetValue(state.maxBudget) !== undefined && { maxBudget: budgetValue(state.maxBudget) }),
    }),
  }
}
