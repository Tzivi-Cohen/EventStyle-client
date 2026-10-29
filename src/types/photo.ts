import type { EventType, PageParams } from './common'

export type EventPhoto = {
  id: number
  eventId: number
  url: string | null
  urlExpiresAt: string | null
  isPrivate: boolean
  publishConsent: boolean
  publishedInGallery: boolean
  uploadedByMe: boolean
  canDelete: boolean
  createdAt: string
}

export type AdminEventPhoto = EventPhoto & {
  publicId: string | null
  storageType: 'public' | 'authenticated'
  uploadedById: number | null
  galleryItemId: number | null
}

export type AdminEventPhotoListItem = AdminEventPhoto & {
  event: { id: number; eventName: string; eventType: EventType; clientName: string }
}

export type AdminPhotoFilters = PageParams & {
  eventId?: number
  publishConsent?: boolean
  inGallery?: boolean
}

export type PublishInput = {
  title: string
  category?: EventType
  isPublished?: boolean
  isFeatured?: boolean
  sortOrder?: number
}

export const isAdminPhoto = (photo: EventPhoto): photo is AdminEventPhoto => 'storageType' in photo
