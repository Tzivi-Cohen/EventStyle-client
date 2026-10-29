import type { EventType } from './common'

export type Package = {
  id: number
  name: string
  description: string
  /** מחיר המחירון הנוכחי (₪). לא נשמר בהזמנות */
  price: number
  features: string[]
  imageUrl: string
  /** null = חבילה כללית שמתאימה לכל סוג אירוע */
  eventType: EventType | null
  sortOrder: number
}

/** חבילה בממשק הניהול (GET /admin/packages, POST/PUT /packages) */
export type AdminPackage = Package & {
  /** false = בארכיון */
  isActive: boolean
  eventCount?: number
  createdAt: string
  updatedAt: string
}

/** גוף POST /packages ו-PUT /packages/:id */
export type PackageInput = {
  name: string
  description: string
  price: number
  features: string[]
  imageUrl: string
  eventType: EventType | null
  isActive?: boolean
  sortOrder?: number
}

/** סינון ברשימת הניהול: סוג אירוע, או general לחבילות כלליות */
export type AdminPackageFilters = {
  eventType?: EventType | 'general'
  isActive?: boolean
}
