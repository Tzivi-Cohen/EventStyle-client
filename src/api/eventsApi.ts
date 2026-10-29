import type { EventStatus, Paginated } from '../types/common'
import type { EventFilters, EventInput, EventItem, EventRequestInput } from '../types/event'
import type { GalleryItem } from '../types/gallery'
import type { AdminEventPhotoListItem, AdminPhotoFilters, EventPhoto, PublishInput } from '../types/photo'
import { apiClient, type UploadOptions } from './apiClient'

export const eventsApi = {
  list: (filters: EventFilters = {}) => apiClient.get<Paginated<EventItem>>('/events', filters),
  my: (filters: EventFilters = {}) => apiClient.get<Paginated<EventItem>>('/events/my', filters),
  get: (id: number) => apiClient.get<EventItem>(`/events/${id}`),
  create: (data: EventInput) => apiClient.post<EventItem>('/events', data),
  update: (id: number, data: EventInput) => apiClient.put<EventItem>(`/events/${id}`, data),
  updateStatus: (id: number, status: EventStatus) => apiClient.patch<EventItem>(`/events/${id}/status`, { status }),
  remove: (id: number) => apiClient.delete(`/events/${id}`),
  createRequest: (data: EventRequestInput) => apiClient.post<EventItem>('/events/requests', data),
  updateRequest: (id: number, data: Partial<EventRequestInput>) => apiClient.patch<EventItem>(`/events/${id}/request`, data),
  approve: (id: number) => apiClient.post<EventItem>(`/events/${id}/approve`),
  reject: (id: number, reason: string | null) => apiClient.post<EventItem>(`/events/${id}/reject`, { reason }),
}

export const photosApi = {
  list: (eventId: number) => apiClient.get<EventPhoto[]>(`/events/${eventId}/photos`),
  get: (eventId: number, photoId: number) => apiClient.get<EventPhoto>(`/events/${eventId}/photos/${photoId}`),
  upload: (eventId: number, files: File[], options?: UploadOptions) => {
    const form = new FormData()
    files.forEach((file) => form.append('photos', file))
    return apiClient.upload<EventPhoto[]>(`/events/${eventId}/photos`, form, options)
  },
  remove: (eventId: number, photoId: number) => apiClient.delete(`/events/${eventId}/photos/${photoId}`),
  setConsent: (eventId: number, photoId: number, publishConsent: boolean) =>
    apiClient.put<EventPhoto>(`/events/${eventId}/photos/${photoId}/consent`, { publishConsent }),
  publish: (eventId: number, photoId: number, data: PublishInput) =>
    apiClient.post<GalleryItem>(`/events/${eventId}/photos/${photoId}/publish`, data),
  adminList: (filters: AdminPhotoFilters = {}) =>
    apiClient.get<Paginated<AdminEventPhotoListItem>>('/admin/event-photos', filters),
}
