import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { eventsApi } from '../api/eventsApi'
import { queryKeys } from '../api/queryClient'
import type { EventStatus } from '../types/common'
import type { EventFilters, EventInput, EventRequestInput } from '../types/event'

export function useMyEvents(filters: EventFilters) {
  return useQuery({
    queryKey: queryKeys.myEvents(filters),
    queryFn: () => eventsApi.my(filters),
    placeholderData: keepPreviousData,
  })
}

export function useAdminEvents(filters: EventFilters) {
  return useQuery({
    queryKey: queryKeys.events(filters),
    queryFn: () => eventsApi.list(filters),
    placeholderData: keepPreviousData,
  })
}

export function useEvent(id: number) {
  return useQuery({
    queryKey: queryKeys.event(id),
    queryFn: () => eventsApi.get(id),
    enabled: Number.isInteger(id) && id > 0,
  })
}

function useInvalidateEvents() {
  const queryClient = useQueryClient()
  return () => queryClient.invalidateQueries({ queryKey: ['events'] })
}

export function useCreateEvent() {
  const invalidate = useInvalidateEvents()
  return useMutation({ mutationFn: (data: EventInput) => eventsApi.create(data), onSuccess: invalidate })
}

export function useUpdateEvent(id: number) {
  const invalidate = useInvalidateEvents()
  return useMutation({ mutationFn: (data: EventInput) => eventsApi.update(id, data), onSuccess: invalidate })
}

export function useUpdateEventStatus() {
  const invalidate = useInvalidateEvents()
  return useMutation({
    mutationFn: ({ id, status }: { id: number; status: EventStatus }) => eventsApi.updateStatus(id, status),
    onSuccess: invalidate,
  })
}

export function useCreateRequest() {
  const invalidate = useInvalidateEvents()
  return useMutation({ mutationFn: (data: EventRequestInput) => eventsApi.createRequest(data), onSuccess: invalidate })
}

export function useUpdateRequest(id: number) {
  const invalidate = useInvalidateEvents()
  return useMutation({ mutationFn: (data: Partial<EventRequestInput>) => eventsApi.updateRequest(id, data), onSuccess: invalidate })
}

export function useReviewRequest() {
  const invalidate = useInvalidateEvents()
  return useMutation({
    mutationFn: ({ id, decision, reason = null }: { id: number; decision: 'approve' | 'reject'; reason?: string | null }) =>
      decision === 'approve' ? eventsApi.approve(id) : eventsApi.reject(id, reason),
    onSuccess: invalidate,
  })
}

export function useDeleteEvent() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => eventsApi.remove(id),
    onSuccess: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: ['events'] }),
        queryClient.invalidateQueries({ queryKey: ['gallery'] }),
        queryClient.invalidateQueries({ queryKey: ['photos'] }),
      ]),
  })
}
