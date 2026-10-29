export const EVENT_TYPES = ['Birthday', 'BatMitzvah', 'Brit', 'Corporate', 'Private'] as const
export const OPERATIONAL_EVENT_STATUSES = ['New', 'Planning', 'Preparing', 'Ready', 'Completed'] as const
export const EVENT_STATUSES = [...OPERATIONAL_EVENT_STATUSES, 'Pending', 'Rejected'] as const

export type EventType = (typeof EVENT_TYPES)[number]
export type EventStatus = (typeof EVENT_STATUSES)[number]

export type PaginationMeta = {
  page: number
  limit: number
  totalItems: number
  totalPages: number
}

export type Paginated<T> = {
  data: T[]
  pagination: PaginationMeta
}

export type PageParams = {
  page?: number
  limit?: number
}

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
