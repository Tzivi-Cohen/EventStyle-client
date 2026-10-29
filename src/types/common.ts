// טיפוסים משותפים – לפי ה-Swagger של השרת (docs/openapi.json) ו-FRONTEND-API-GUIDE.md

export const EVENT_TYPES = ['Birthday', 'BatMitzvah', 'Brit', 'Corporate', 'Private'] as const
/** סטטוסים תפעוליים – רק המנהלת מנהלת אותם, אחרי שהאירוע אושר או נוצר על ידה */
export const OPERATIONAL_EVENT_STATUSES = ['New', 'Planning', 'Preparing', 'Ready', 'Completed'] as const
/** כל הסטטוסים, כולל בקשות לקוחות: Pending (ממתינה לאישור) ו-Rejected (נדחתה) */
export const EVENT_STATUSES = [...OPERATIONAL_EVENT_STATUSES, 'Pending', 'Rejected'] as const

export type EventType = (typeof EVENT_TYPES)[number]
export type EventStatus = (typeof EVENT_STATUSES)[number]

export type PaginationMeta = {
  page: number
  limit: number
  totalItems: number
  /** 0 כשאין תוצאות */
  totalPages: number
}

/** תשובת רשימה: GET /events, /events/my, /gallery, /admin/gallery, /admin/event-photos */
export type Paginated<T> = {
  data: T[]
  pagination: PaginationMeta
}

export type PageParams = {
  page?: number
  limit?: number
}

/** מבנה השגיאה האחיד של השרת */
export type ApiErrorBody = {
  error: {
    code: string
    message: string
    details?: unknown
  }
}

export type Health = {
  status: 'ok' | 'error'
  database: 'ok' | 'unreachable'
  uptimeSeconds: number
  timestamp: string
}
