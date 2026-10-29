import type { EventStatus, EventType, PageParams } from './common'
import type { EventPhoto } from './photo'

export type EventItem = {
  id: number
  eventName: string
  clientName: string
  clientEmail: string
  eventType: EventType
  eventDate: string
  location: string
  packageId: number
  package?: { id: number; name: string }
  themeColor: string
  guestCount: number
  budget: number
  status: EventStatus
  coverImageUrl: string | null
  notes?: string | null
  description: string | null
  clientNotes: string | null
  rejectionReason: string | null
  reviewedAt: string | null
  reviewedById?: number | null
  userId: number | null
  photoCount?: number
  photos?: EventPhoto[]
  createdAt: string
  updatedAt: string
}

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
