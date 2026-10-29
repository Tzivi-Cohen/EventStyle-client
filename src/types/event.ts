import type { EventStatus, EventType, PageParams } from './common'
import type { EventPhoto } from './photo'

/** אירוע (השם Event תפוס בדפדפן, לכן EventItem) */
export type EventItem = {
  id: number
  eventName: string
  clientName: string
  clientEmail: string
  eventType: EventType
  /** "YYYY-MM-DD" */
  eventDate: string
  location: string
  packageId: number
  package?: { id: number; name: string }
  themeColor: string
  guestCount: number
  budget: number
  status: EventStatus
  coverImageUrl: string | null
  /** רק למנהלת */
  notes?: string | null
  /** קונספט העיצוב והערות מיוחדות – נכתבים בבקשת הלקוחה */
  description: string | null
  clientNotes: string | null
  /** סיבת דחייה (רשות) – גלויה ללקוחה */
  rejectionReason: string | null
  /** מתי הבקשה אושרה או נדחתה. null באירוע שנוצר בידי המנהלת ובבקשה ממתינה */
  reviewedAt: string | null
  /** רק למנהלת – מי אישרה או דחתה */
  reviewedById?: number | null
  userId: number | null
  /** רק ברשימות */
  photoCount?: number
  /** רק באירוע בודד */
  photos?: EventPhoto[]
  createdAt: string
  updatedAt: string
}

/** גוף POST /events ו-PUT /events/:id (שדות לא מוכרים נדחים בשרת) */
export type EventInput = {
  eventName: string
  clientName: string
  clientEmail: string
  eventType: EventType
  eventDate: string
  location: string
  packageId: number
  themeColor: string
  guestCount: number
  budget: number
  status?: EventStatus
  coverImageUrl?: string | null
  notes?: string | null
}

/**
 * גוף POST /events/requests – Allowlist של השרת: רק השדות האלה.
 * הבעלים, השם, האימייל והסטטוס (Pending) נקבעים בשרת.
 */
export type EventRequestInput = {
  eventName: string
  eventType: EventType
  eventDate: string
  location: string
  packageId: number
  themeColor: string
  guestCount: number
  budget: number
  description: string
  clientNotes: string | null
}

export const EVENT_SORT_FIELDS = ['eventDate', 'budget', 'clientName', 'eventName', 'createdAt'] as const
export type EventSortField = (typeof EVENT_SORT_FIELDS)[number]

export type EventFilters = PageParams & {
  search?: string
  eventType?: EventType
  status?: EventStatus
  packageId?: number
  minBudget?: number
  maxBudget?: number
  sortBy?: EventSortField
  sortDir?: 'asc' | 'desc'
}
