import type { EventType, PageParams } from './common'

/**
 * תמונת אירוע כפי שהשרת מחזיר ללקוחה. אין כאן publicId או פרטי אחסון.
 * url של תמונה פרטית הוא קישור חתום וזמני (10 דקות) – אסור לשמור אותו מעבר למצב הנוכחי של המסך.
 */
export type EventPhoto = {
  id: number
  eventId: number
  /** פרטית: קישור זמני. ישנה (ציבורית): קישור קבוע. null = אין קישור כרגע */
  url: string | null
  /** מתי הקישור מפסיק לעבוד. null בתמונה ישנה */
  urlExpiresAt: string | null
  isPrivate: boolean
  publishConsent: boolean
  publishedInGallery: boolean
  uploadedByMe: boolean
  canDelete: boolean
  createdAt: string
}

/** תמונת אירוע בתשובה למנהלת */
export type AdminEventPhoto = EventPhoto & {
  publicId: string | null
  storageType: 'public' | 'authenticated'
  uploadedById: number | null
  /** העותק בגלריה (מפורסם או מוסתר) */
  galleryItemId: number | null
}

/** שורה ב-GET /admin/event-photos */
export type AdminEventPhotoListItem = AdminEventPhoto & {
  event: { id: number; eventName: string; eventType: EventType; clientName: string }
}

export type AdminPhotoFilters = PageParams & {
  eventId?: number
  publishConsent?: boolean
  inGallery?: boolean
}

/** גוף POST /events/:id/photos/:photoId/publish */
export type PublishInput = {
  title: string
  category?: EventType
  isPublished?: boolean
  isFeatured?: boolean
  sortOrder?: number
}

export const isAdminPhoto = (photo: EventPhoto): photo is AdminEventPhoto => 'storageType' in photo
