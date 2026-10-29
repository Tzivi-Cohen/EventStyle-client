import type { Page, Route } from '@playwright/test'

/**
 * Mock API לבדיקות E2E – מבנה תשובות זהה לשרת (docs/openapi.json). מצב נפרד לכל בדיקה.
 * כל בקשה לכתובת שאינה האפליקציה המקומית או ה-API המדומה נחסמת.
 */
export const E2E_API = 'http://api.e2e.test/api'

const PNG_1PX = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==', 'base64')

const client = { id: 2, fullName: 'נועה לוי', email: 'noa@test.com', phone: '050-1234567', address: null, role: 'Client', emailVerified: true, googleLinked: false, createdAt: '2026-10-01T09:00:00.000Z' }
const admin = { ...client, id: 1, fullName: 'מנהלת הסטודיו', email: 'admin@test.com', role: 'Admin' }

const img = (name: string) => `http://img.e2e.test/${name}.png`
const future = () => new Date(Date.now() + 10 * 60_000).toISOString()

export type MockState = ReturnType<typeof createState>

function createState() {
  return {
    requests: [] as { method: string; path: string; body?: unknown }[],
    photos: [
      {
        id: 101, eventId: 10, url: img('p101'), urlExpiresAt: future(), isPrivate: true, publishConsent: false, publishedInGallery: false,
        uploadedById: 2, galleryItemId: null as number | null, createdAt: '2026-10-20T12:00:00.000Z', publicId: 'eventstyle/events/10/p101', storageType: 'authenticated',
      },
    ],
    nextId: 200,
    /** בקשות לעיצוב שהלקוחה שלחה בבדיקה (מזהים מ-50) */
    eventRequests: [] as Record<string, unknown>[],
  }
}

const event = {
  id: 10, eventName: 'יום הולדת 30 לנועה', clientName: 'נועה לוי', clientEmail: 'noa@test.com', eventType: 'Birthday', eventDate: '2026-12-15',
  location: 'תל אביב', packageId: 4, package: { id: 4, name: 'יום הולדת קלאסי' }, themeColor: '#F4C2C2', guestCount: 80, budget: 4500,
  status: 'Preparing', coverImageUrl: null, notes: 'פנימי', userId: 2, createdAt: '2026-10-01T09:00:00.000Z', updatedAt: '2026-10-10T09:00:00.000Z',
}

const packages = [
  { id: 1, name: 'Basic', description: 'עיצוב שולחן מרכזי', price: 1200, features: ['שולחן מרכזי'], imageUrl: img('basic'), eventType: null, sortOrder: 0 },
  { id: 4, name: 'יום הולדת קלאסי', description: 'שולחן מתוקים ובלונים', price: 1500, features: ['שולחן מתוקים', 'קשת בלונים'], imageUrl: img('bday'), eventType: 'Birthday', sortOrder: 1 },
]

const gallery = [
  { id: 3, title: 'בת מצווה בגווני זהב', category: 'BatMitzvah', url: img('g3'), publicId: null, isFeatured: true, sortOrder: 0, createdAt: '2026-10-05T10:00:00.000Z' },
  { id: 4, title: 'יום הולדת פסטל', category: 'Birthday', url: img('g4'), publicId: null, isFeatured: false, sortOrder: 0, createdAt: '2026-10-06T10:00:00.000Z' },
]

const json = (route: Route, body: unknown, status = 200) => route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(body) })
const fail = (route: Route, status: number, code: string, message: string) => json(route, { error: { code, message } }, status)
const page = (data: unknown[]) => ({ data, pagination: { page: 1, limit: 10, totalItems: data.length, totalPages: data.length ? 1 : 0 } })

function photoFor(photo: MockState['photos'][number], role: string, userId: number) {
  const base = {
    id: photo.id, eventId: photo.eventId, url: photo.url, urlExpiresAt: photo.urlExpiresAt, isPrivate: photo.isPrivate,
    publishConsent: photo.publishConsent, publishedInGallery: photo.publishedInGallery, uploadedByMe: photo.uploadedById === userId,
    canDelete: role === 'Admin' || photo.uploadedById === userId, createdAt: photo.createdAt,
  }
  return role === 'Admin' ? { ...base, publicId: photo.publicId, storageType: photo.storageType, uploadedById: photo.uploadedById, galleryItemId: photo.galleryItemId } : base
}

export async function installMockApi(page_: Page): Promise<MockState> {
  const state = createState()

  // כל דבר חיצוני (גופנים, תמונות אמיתיות, Google) – חסום. תמונות המדומות מוחזרות כ-PNG קטן
  await page_.route('**/*', (route) => {
    const url = new URL(route.request().url())
    if (url.hostname === 'localhost') return route.continue()
    if (url.hostname === 'img.e2e.test') return route.fulfill({ status: 200, contentType: 'image/png', body: PNG_1PX })
    if (url.href.startsWith(E2E_API)) return route.fallback()
    return route.abort()
  })

  await page_.route(`${E2E_API}/**`, async (route) => {
    const request = route.request()
    const url = new URL(request.url())
    const path = url.pathname.replace('/api', '')
    const method = request.method()
    const contentType = request.headers()['content-type'] ?? ''
    const body = contentType.includes('application/json') ? request.postDataJSON() : undefined
    state.requests.push({ method, path, body })

    const auth = request.headers()['authorization']
    const user = auth === 'Bearer client-token' ? client : auth === 'Bearer admin-token' ? admin : null

    if (method === 'POST' && path === '/auth/login') {
      const { email, password } = body as { email: string; password: string }
      if (password !== 'Password1') return fail(route, 401, 'INVALID_CREDENTIALS', 'Invalid email or password')
      if (email === client.email) return json(route, { token: 'client-token', user: client })
      if (email === admin.email) return json(route, { token: 'admin-token', user: admin })
      return fail(route, 401, 'INVALID_CREDENTIALS', 'Invalid email or password')
    }
    if (method === 'GET' && path === '/packages') {
      const type = url.searchParams.get('eventType')
      return json(route, packages.filter((p) => !type || p.eventType === type || p.eventType === null))
    }
    if (method === 'GET' && path === '/gallery') {
      const category = url.searchParams.get('category')
      const featured = url.searchParams.get('featured') === 'true'
      return json(route, page(gallery.filter((g) => (!category || g.category === category) && (!featured || g.isFeatured))))
    }
    if (method === 'GET' && path === '/gallery/summary') {
      return json(route, ['Birthday', 'BatMitzvah', 'Brit', 'Corporate', 'Private'].map((category) => {
        const items = gallery.filter((g) => g.category === category)
        return { category, count: items.length, cover: items[0] ?? null }
      }))
    }

    // מכאן – נתיבים מוגנים
    if (!user) return fail(route, 401, 'UNAUTHORIZED', 'Missing Bearer token')
    if (method === 'GET' && path === '/auth/me') return json(route, { user })
    if (method === 'GET' && path === '/events/my') {
      if (user.role !== 'Client') return json(route, page([]))
      const status = url.searchParams.get('status')
      const mine = [{ ...event, notes: undefined, photoCount: state.photos.length }, ...state.eventRequests.map((r) => ({ ...r, photoCount: 0 }))]
      return json(route, page(mine.filter((e) => !status || e.status === status)))
    }
    if (method === 'POST' && path === '/events/requests') {
      const created = {
        ...(body as object), id: 50 + state.eventRequests.length, clientName: client.fullName, clientEmail: client.email, userId: client.id,
        package: { id: 1, name: 'Basic' }, status: 'Pending', coverImageUrl: null, rejectionReason: null, reviewedAt: null,
        createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
      }
      state.eventRequests.push(created)
      return json(route, { ...created, photos: [] }, 201)
    }
    const requestPath = path.match(/^\/events\/(5\d)(\/request|\/approve)?$/)
    const eventRequest = requestPath && state.eventRequests.find((r) => r.id === Number(requestPath[1]))
    if (eventRequest && method === 'GET' && !requestPath[2]) return json(route, { ...eventRequest, photos: [] })
    if (eventRequest && method === 'PATCH' && requestPath[2] === '/request') {
      if (eventRequest.status !== 'Pending') return fail(route, 409, 'CONFLICT', 'Only a pending request can be edited')
      Object.assign(eventRequest, body as object)
      return json(route, { ...eventRequest, photos: [] })
    }
    if (method === 'GET' && path === '/events/10') {
      const { notes, ...rest } = event
      return json(route, { ...rest, ...(user.role === 'Admin' && { notes }), photos: state.photos.map((p) => photoFor(p, user.role, user.id)) })
    }
    if (method === 'GET' && path === '/events/10/photos') return json(route, state.photos.map((p) => photoFor(p, user.role, user.id)))
    if (method === 'POST' && path === '/events/10/photos') {
      const created = { ...state.photos[0], id: state.nextId++, url: img(`new${state.nextId}`), urlExpiresAt: future(), uploadedById: user.id, publishConsent: false, publishedInGallery: false, galleryItemId: null, createdAt: new Date().toISOString() }
      state.photos.push(created)
      return json(route, [photoFor(created, user.role, user.id)], 201)
    }
    const consent = path.match(/^\/events\/10\/photos\/(\d+)\/consent$/)
    if (method === 'PUT' && consent) {
      if (user.role !== 'Client') return fail(route, 403, 'FORBIDDEN', 'Only the event owner can change the publish consent')
      const photo = state.photos.find((p) => p.id === Number(consent[1]))!
      photo.publishConsent = (body as { publishConsent: boolean }).publishConsent
      if (!photo.publishConsent) { photo.publishedInGallery = false; photo.galleryItemId = null }
      return json(route, photoFor(photo, user.role, user.id))
    }
    if (user.role !== 'Admin') return fail(route, 403, 'FORBIDDEN', 'You do not have permission to perform this action')
    if (method === 'GET' && path === '/events') {
      const status = url.searchParams.get('status')
      const all = [{ ...event, photoCount: state.photos.length }, ...state.eventRequests.map((r) => ({ ...r, photoCount: 0 }))]
      return json(route, page(all.filter((e) => !status || e.status === status)))
    }
    if (eventRequest && method === 'POST' && requestPath[2] === '/approve') {
      if (eventRequest.status !== 'Pending') return fail(route, 409, 'CONFLICT', 'This request was already reviewed')
      Object.assign(eventRequest, { status: 'New', reviewedAt: new Date().toISOString(), reviewedById: admin.id })
      return json(route, { ...eventRequest, photos: [] })
    }
    if (method === 'GET' && path === '/admin/event-photos') {
      const pending = url.searchParams.get('publishConsent') === 'true' && url.searchParams.get('inGallery') === 'false'
      const list = state.photos.filter((p) => !pending || (p.publishConsent && p.galleryItemId === null))
      return json(route, page(list.map((p) => ({ ...photoFor(p, 'Admin', 1), event: { id: 10, eventName: event.eventName, eventType: event.eventType, clientName: event.clientName } }))))
    }
    const publish = path.match(/^\/events\/10\/photos\/(\d+)\/publish$/)
    if (method === 'POST' && publish) {
      const photo = state.photos.find((p) => p.id === Number(publish[1]))!
      if (!photo.publishConsent) return fail(route, 409, 'PUBLISH_CONSENT_REQUIRED', 'The event owner has not given consent to publish this photo')
      photo.galleryItemId = 300
      photo.publishedInGallery = true
      return json(route, { ...gallery[1], id: 300, title: (body as { title: string }).title, isPublished: true, sourceEventPhotoId: photo.id, updatedAt: new Date().toISOString() }, 201)
    }
    return fail(route, 404, 'NOT_FOUND', `No mock for ${method} ${path}`)
  })

  return state
}
