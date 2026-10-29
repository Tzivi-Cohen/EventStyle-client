import type { EventType } from './common'

export type Package = {
  id: number
  name: string
  description: string
  price: number
  features: string[]
  imageUrl: string
  eventType: EventType | null
  sortOrder: number
}

export type AdminPackage = Package & {
  isActive: boolean
  eventCount?: number
  createdAt: string
  updatedAt: string
}

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

export type AdminPackageFilters = {
  eventType?: EventType | 'general'
  isActive?: boolean
}
