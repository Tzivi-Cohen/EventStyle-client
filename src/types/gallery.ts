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

/** פריט גלריה בממשק הניהול */
export type AdminGalleryItem = GalleryItem & {
  /** false = מוסתר מכל הנתיבים הציבוריים */
  isPublished: boolean
  /** תמונת האירוע שממנה נוצר העותק. null בפריט שהועלה ישירות לגלריה */
  sourceEventPhotoId: number | null
  updatedAt: string
}

/** שורה בתשובת GET /gallery/summary – אחת לכל סוג אירוע */
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

/** גוף PATCH /gallery/:id – לפחות שדה אחד */
export type GalleryUpdate = {
  title?: string
  category?: EventType
  isPublished?: boolean
  isFeatured?: boolean
  sortOrder?: number
}

/** שדות הטקסט של POST /gallery (multipart) */
export type GalleryUploadInput = {
  title: string
  category: EventType
  isPublished?: boolean
  isFeatured?: boolean
  sortOrder?: number
}
