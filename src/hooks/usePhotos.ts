import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useCallback, useRef } from 'react'
import { photosApi } from '../api/eventsApi'
import { queryKeys } from '../api/queryClient'
import type { AdminPhotoFilters, EventPhoto, PublishInput } from '../types/photo'
import { nextRefreshDelay } from '../utils/photoLinks'

/**
 * תמונות האירוע עם קישורי צפייה זמניים.
 * הרשימה מתרעננת אוטומטית דקה לפני שהקישור הראשון פג (refetchInterval) – כך הקישורים לא "נשברים" במסך פתוח.
 */
export function useEventPhotos(eventId: number) {
  return useQuery({
    queryKey: queryKeys.eventPhotos(eventId),
    queryFn: () => photosApi.list(eventId),
    refetchInterval: (query) => nextRefreshDelay(query.state.data),
    staleTime: 0,
  })
}

/**
 * רענון קישור של תמונה אחת (GET /events/:id/photos/:photoId) – כשתמונה נכשלת בטעינה או שהקישור פג.
 * כל קישור מתרענן לכל היותר פעם אחת, כדי שתמונה שבורה לא תיצור לולאת בקשות.
 */
export function useRefreshPhotoLink(eventId: number) {
  const queryClient = useQueryClient()
  const attempted = useRef(new Set<string>())

  return useCallback(
    async (photo: EventPhoto) => {
      const attemptKey = `${photo.id}:${photo.url ?? 'none'}`
      if (attempted.current.has(attemptKey)) return null
      attempted.current.add(attemptKey)
      const fresh = await photosApi.get(eventId, photo.id)
      queryClient.setQueryData<EventPhoto[]>(queryKeys.eventPhotos(eventId), (list) =>
        list?.map((p) => (p.id === fresh.id ? fresh : p)),
      )
      return fresh
    },
    [eventId, queryClient],
  )
}

/** אחרי שינוי בתמונות: רשימת התמונות, פרטי האירוע (photoCount) והרשימה של המנהלת */
function useInvalidatePhotos(eventId: number) {
  const queryClient = useQueryClient()
  return () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: queryKeys.event(eventId) }),
      queryClient.invalidateQueries({ queryKey: ['events', 'my'] }),
      queryClient.invalidateQueries({ queryKey: ['events', 'list'] }),
      queryClient.invalidateQueries({ queryKey: ['photos'] }),
    ])
}

export function useUploadPhotos(eventId: number) {
  const invalidate = useInvalidatePhotos(eventId)
  return useMutation({
    mutationFn: ({ files, onProgress }: { files: File[]; onProgress?: (percent: number) => void }) =>
      photosApi.upload(eventId, files, { onProgress }),
    onSuccess: invalidate,
  })
}

export function useDeletePhoto(eventId: number) {
  const queryClient = useQueryClient()
  const invalidate = useInvalidatePhotos(eventId)
  return useMutation({
    mutationFn: (photoId: number) => photosApi.remove(eventId, photoId),
    // מחיקת תמונה שפורסמה מסירה גם את העותק בגלריה
    onSuccess: () => Promise.all([invalidate(), queryClient.invalidateQueries({ queryKey: ['gallery'] })]),
    onSettled: () => queryClient.invalidateQueries({ queryKey: queryKeys.eventPhotos(eventId) }),
  })
}

export function useSetConsent(eventId: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ photoId, publishConsent }: { photoId: number; publishConsent: boolean }) =>
      photosApi.setConsent(eventId, photoId, publishConsent),
    onSuccess: (updated) => {
      queryClient.setQueryData<EventPhoto[]>(queryKeys.eventPhotos(eventId), (list) =>
        list?.map((p) => (p.id === updated.id ? updated : p)),
      )
      // ביטול הסכמה מסיר את העותק מהגלריה
      return Promise.all([
        queryClient.invalidateQueries({ queryKey: ['gallery'] }),
        queryClient.invalidateQueries({ queryKey: ['photos'] }),
      ])
    },
  })
}

export function usePublishPhoto(eventId: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ photoId, data }: { photoId: number; data: PublishInput }) => photosApi.publish(eventId, photoId, data),
    onSuccess: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.eventPhotos(eventId) }),
        queryClient.invalidateQueries({ queryKey: ['gallery'] }),
        queryClient.invalidateQueries({ queryKey: ['photos'] }),
      ]),
  })
}

export function useAdminPhotos(filters: AdminPhotoFilters) {
  return useQuery({
    queryKey: queryKeys.adminPhotos(filters),
    queryFn: () => photosApi.adminList(filters),
    placeholderData: keepPreviousData,
    refetchInterval: (query) => nextRefreshDelay(query.state.data?.data),
  })
}
