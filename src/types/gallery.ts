import type { EventType, PageParams } from './common'

export type GalleryItem = {
  id: number
  title: string
  category: EventType
  url: string
  publicId: string | null
  isFeatured: boolean
  sortOrder: number
  createdAt: string
}

export type AdminGalleryItem = GalleryItem & {
  isPublished: boolean
  sourceEventPhotoId: number | null
  updatedAt: string
}

export type GallerySummaryItem = {
  category: EventType
  count: number
  cover: GalleryItem | null
}

export type GalleryFilters = PageParams & {
  category?: EventType
  featured?: boolean
}

export type AdminGalleryFilters = PageParams & {
  category?: EventType
  isPublished?: boolean
  isFeatured?: boolean
}

export type GalleryUpdate = {
  title?: string
  category?: EventType
  isPublished?: boolean
  isFeatured?: boolean
  sortOrder?: number
}

export type GalleryUploadInput = {
  title: string
  category: EventType
  isPublished?: boolean
  isFeatured?: boolean
  sortOrder?: number
}
