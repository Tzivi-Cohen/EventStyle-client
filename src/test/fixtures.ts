import type { EventItem } from '../types/event'
import type { AdminGalleryItem, GalleryItem } from '../types/gallery'
import type { AdminPackage } from '../types/package'
import type { AdminEventPhoto } from '../types/photo'
import type { User } from '../types/user'

export const clientUser: User = {
  id: 2,
  fullName: 'נועה לוי',
  email: 'noa@test.com',
  phone: '050-1234567',
  address: null,
  role: 'Client',
  emailVerified: true,
  googleLinked: false,
  createdAt: '2026-10-01T09:00:00.000Z',
}

export const adminUser: User = {
  ...clientUser,
  id: 1,
  fullName: 'מנהלת הסטודיו',
  email: 'admin@test.com',
  role: 'Admin',
}

export const packages: AdminPackage[] = [
  {
    id: 1,
    name: 'Basic',
    description: 'עיצוב שולחן מרכזי',
    price: 1200,
    features: ['שולחן מרכזי', 'התאמת צבעים'],
    imageUrl: 'https://img.test/basic.jpg',
    eventType: null,
    sortOrder: 0,
    isActive: true,
    eventCount: 1,
    createdAt: '2026-10-01T09:00:00.000Z',
    updatedAt: '2026-10-01T09:00:00.000Z',
  },
  {
    id: 4,
    name: 'יום הולדת קלאסי',
    description: 'שולחן מתוקים ובלונים',
    price: 1500,
    features: ['שולחן מתוקים', 'קשת בלונים'],
    imageUrl: 'https://img.test/birthday.jpg',
    eventType: 'Birthday',
    sortOrder: 1,
    isActive: true,
    eventCount: 0,
    createdAt: '2026-10-01T09:00:00.000Z',
    updatedAt: '2026-10-01T09:00:00.000Z',
  },
  {
    id: 6,
    name: 'בת מצווה זהב',
    description: 'עיצוב בגווני זהב',
    price: 3200,
    features: ['קשת פרחים'],
    imageUrl: 'https://img.test/bat.jpg',
    eventType: 'BatMitzvah',
    sortOrder: 0,
    isActive: false,
    eventCount: 0,
    createdAt: '2026-10-01T09:00:00.000Z',
    updatedAt: '2026-10-01T09:00:00.000Z',
  },
]

export const galleryItems: AdminGalleryItem[] = [
  {
    id: 3,
    title: 'בת מצווה בגווני זהב',
    category: 'BatMitzvah',
    url: 'https://cdn.test/gallery/3.jpg',
    publicId: null,
    isFeatured: true,
    sortOrder: 0,
    createdAt: '2026-10-05T10:00:00.000Z',
    isPublished: true,
    sourceEventPhotoId: null,
    updatedAt: '2026-10-05T10:00:00.000Z',
  },
  {
    id: 4,
    title: 'יום הולדת פסטל',
    category: 'Birthday',
    url: 'https://cdn.test/gallery/4.jpg',
    publicId: 'eventstyle/gallery/4',
    isFeatured: false,
    sortOrder: 0,
    createdAt: '2026-10-06T10:00:00.000Z',
    isPublished: true,
    sourceEventPhotoId: null,
    updatedAt: '2026-10-06T10:00:00.000Z',
  },
  {
    id: 5,
    title: 'טיוטה מוסתרת',
    category: 'Birthday',
    url: 'https://cdn.test/gallery/5.jpg',
    publicId: 'eventstyle/gallery/5',
    isFeatured: false,
    sortOrder: 0,
    createdAt: '2026-10-07T10:00:00.000Z',
    isPublished: false,
    sourceEventPhotoId: null,
    updatedAt: '2026-10-07T10:00:00.000Z',
  },
]

export function toPublicGallery({ isPublished: _p, sourceEventPhotoId: _s, updatedAt: _u, ...item }: AdminGalleryItem): GalleryItem {
  return item
}

export const events: EventItem[] = [
  {
    id: 10,
    eventName: 'יום הולדת 30 לנועה',
    clientName: 'נועה לוי',
    clientEmail: 'noa@test.com',
    eventType: 'Birthday',
    eventDate: '2026-12-15',
    location: 'תל אביב',
    packageId: 4,
    package: { id: 4, name: 'יום הולדת קלאסי' },
    themeColor: '#F4C2C2',
    guestCount: 80,
    budget: 4500,
    status: 'Planning',
    coverImageUrl: null,
    notes: 'להזמין בלונים',
    description: 'קונספט ורוד עתיק וזהב עם שולחן מתוקים',
    clientNotes: null,
    rejectionReason: null,
    reviewedAt: null,
    userId: 2,
    createdAt: '2026-10-01T09:00:00.000Z',
    updatedAt: '2026-10-10T09:00:00.000Z',
  },
  {
    id: 11,
    eventName: 'כנס שנתי',
    clientName: 'חברת אלפא',
    clientEmail: 'alpha@test.com',
    eventType: 'Corporate',
    eventDate: '2026-11-20',
    location: 'חיפה',
    packageId: 1,
    package: { id: 1, name: 'Basic' },
    themeColor: 'כחול',
    guestCount: 200,
    budget: 9000,
    status: 'New',
    coverImageUrl: null,
    notes: null,
    description: null,
    clientNotes: null,
    rejectionReason: null,
    reviewedAt: null,
    userId: null,
    createdAt: '2026-10-02T09:00:00.000Z',
    updatedAt: '2026-10-02T09:00:00.000Z',
  },
]

export function makeRequest(overrides: Partial<EventItem> = {}): EventItem {
  return {
    ...events[0],
    id: 20,
    eventName: 'בת מצווה לשירה',
    eventType: 'BatMitzvah',
    eventDate: '2027-03-18',
    location: 'רעננה',
    packageId: 1,
    package: { id: 1, name: 'Basic' },
    themeColor: 'לבנדר',
    guestCount: 120,
    budget: 9000,
    status: 'Pending',
    notes: null,
    description: 'קונספט פרובאנס: לבנדר, עץ טבעי ונרות',
    clientNotes: 'הכניסה לאולם משעה 16:00',
    createdAt: '2026-10-28T09:00:00.000Z',
    updatedAt: '2026-10-28T09:00:00.000Z',
    ...overrides,
  }
}

const future = (minutes: number) => new Date(Date.now() + minutes * 60_000).toISOString()

export function makePhotos(): AdminEventPhoto[] {
  return [
    {
      id: 101,
      eventId: 10,
      url: 'https://api.cloudinary.test/download?public_id=p101&signature=sig1',
      urlExpiresAt: future(10),
      isPrivate: true,
      publishConsent: false,
      publishedInGallery: false,
      uploadedByMe: true,
      canDelete: true,
      createdAt: '2026-10-20T12:00:00.000Z',
      publicId: 'eventstyle/events/10/p101',
      storageType: 'authenticated',
      uploadedById: 2,
      galleryItemId: null,
    },
    {
      id: 102,
      eventId: 10,
      url: 'https://api.cloudinary.test/download?public_id=p102&signature=sig2',
      urlExpiresAt: future(10),
      isPrivate: true,
      publishConsent: true,
      publishedInGallery: true,
      uploadedByMe: false,
      canDelete: false,
      createdAt: '2026-10-21T12:00:00.000Z',
      publicId: 'eventstyle/events/10/p102',
      storageType: 'authenticated',
      uploadedById: 1,
      galleryItemId: 30,
    },
    {
      id: 103,
      eventId: 10,
      url: 'https://cdn.test/legacy/103.jpg',
      urlExpiresAt: null,
      isPrivate: false,
      publishConsent: false,
      publishedInGallery: false,
      uploadedByMe: false,
      canDelete: false,
      createdAt: '2026-10-19T12:00:00.000Z',
      publicId: 'legacy-103',
      storageType: 'public',
      uploadedById: null,
      galleryItemId: null,
    },
  ]
}

export const ADMIN_ONLY_PHOTO_FIELDS = ['publicId', 'storageType', 'uploadedById', 'galleryItemId'] as const
