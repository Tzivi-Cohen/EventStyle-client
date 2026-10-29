import { QueryClient } from '@tanstack/react-query'
import { ApiError } from './apiError'

/** שגיאות שלא כדאי לנסות שוב (הבקשה עצמה שגויה, או שאין הרשאה) */
const isClientError = (error: unknown) => error instanceof ApiError && error.status >= 400 && error.status < 500

export function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        refetchOnWindowFocus: false,
        retry: (failureCount, error) => !isClientError(error) && failureCount < 1,
      },
      mutations: { retry: false },
    },
  })
}

/**
 * מפתחות ה-Cache במקום אחד – כך שכל רענון (invalidateQueries) משתמש בדיוק באותו מפתח.
 * כל מפתח מתחיל בשם הישות, כך ש-invalidate על ['events'] מרענן את כל רשימות האירועים והפרטים.
 */
export const queryKeys = {
  packages: (eventType?: string) => ['packages', eventType ?? 'all'] as const,
  adminPackages: (filters: object) => ['packages', 'admin', filters] as const,
  gallery: (filters: object) => ['gallery', 'public', filters] as const,
  gallerySummary: () => ['gallery', 'summary'] as const,
  adminGallery: (filters: object) => ['gallery', 'admin', filters] as const,
  events: (filters: object) => ['events', 'list', filters] as const,
  myEvents: (params: object) => ['events', 'my', params] as const,
  event: (id: number) => ['events', 'detail', id] as const,
  eventPhotos: (eventId: number) => ['events', 'detail', eventId, 'photos'] as const,
  adminPhotos: (filters: object) => ['photos', 'admin', filters] as const,
}
