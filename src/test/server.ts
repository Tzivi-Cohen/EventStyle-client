import { http, HttpResponse, type JsonBodyType } from 'msw'
import { setupServer } from 'msw/node'
import type { EventItem, EventRequestInput } from '../types/event'
import type { AdminEventPhoto, EventPhoto } from '../types/photo'
import type { User } from '../types/user'
import { adminUser, clientUser, events, galleryItems, makePhotos, packages, toPublicGallery } from './fixtures'

export const API = 'http://api.test/api'

export const TOKENS = { client: 'client-token', admin: 'admin-token', expired: 'expired-token' } as const

type Db = {
  users: Record<string, User>
  photos: AdminEventPhoto[]
  events: EventItem[]
  requests: { method: string; path: string; search: string; body?: unknown; auth: string | null }[]
  nextPhotoId: number
}

export const db: Db = { users: {}, photos: [], events: [], requests: [], nextPhotoId: 200 }

export function resetMockDb() {
  db.users = { [TOKENS.client]: { ...clientUser }, [TOKENS.admin]: { ...adminUser } }
  db.photos = makePhotos()
  db.events = events.map((e) => ({ ...e }))
  db.requests = []
  db.nextPhotoId = 200
}

export const error = (status: number, code: string, message: string, details?: JsonBodyType) =>
  HttpResponse.json({ error: { code, message, ...(details !== undefined && { details }) } }, { status })

function currentUser(request: Request): User | null {
  const header = request.headers.get('authorization')
  if (!header?.startsWith('Bearer ')) return null
  return db.users[header.slice(7)] ?? null
}

function guard(request: Request, role?: 'Admin'): User | Response {
  const user = currentUser(request)
  if (!user) return error(401, 'UNAUTHORIZED', 'Invalid or expired token')
  if (role && user.role !== role) return error(403, 'FORBIDDEN', 'You do not have permission to perform this action')
  return user
}

function filterEvents(list: EventItem[], url: URL, searchClient: boolean) {
  const q = Object.fromEntries(url.searchParams)
  const search = q.search?.toLowerCase()
  const sortBy = (q.sortBy ?? 'eventDate') as 'eventDate' | 'budget' | 'clientName' | 'eventName' | 'createdAt'
  const dir = q.sortDir === 'asc' ? 1 : -1
  const compare = (a: EventItem, b: EventItem) =>
    sortBy === 'budget' ? a.budget - b.budget : String(a[sortBy]).localeCompare(String(b[sortBy]), 'he')
  return list
    .filter(
      (e) =>
        (!search || e.eventName.toLowerCase().includes(search) || (searchClient && e.clientName.toLowerCase().includes(search))) &&
        (!q.status || e.status === q.status) &&
        (!q.eventType || e.eventType === q.eventType) &&
        (q.minBudget === undefined || e.budget >= Number(q.minBudget)) &&
        (q.maxBudget === undefined || e.budget <= Number(q.maxBudget)),
    )
    .sort((a, b) => dir * compare(a, b) || dir * (a.id - b.id))
}

function page<T>(items: T[], url: URL) {
  const pageNo = Number(url.searchParams.get('page') ?? 1)
  const limit = Number(url.searchParams.get('limit') ?? 10)
  return {
    data: items.slice((pageNo - 1) * limit, pageNo * limit),
    pagination: { page: pageNo, limit, totalItems: items.length, totalPages: Math.ceil(items.length / limit) },
  }
}

export function photoFor(photo: AdminEventPhoto, user: User): EventPhoto | AdminEventPhoto {
  if (user.role === 'Admin') return { ...photo, uploadedByMe: photo.uploadedById === user.id, canDelete: true }
  const { publicId: _a, storageType: _b, uploadedById, galleryItemId: _d, ...rest } = photo
  return { ...rest, uploadedByMe: uploadedById === user.id, canDelete: uploadedById === user.id }
}

function eventAccess(request: Request, id: number): { user: User; event: EventItem } | Response {
  const user = guard(request)
  if (user instanceof Response) return user
  const event = db.events.find((e) => e.id === id)
  if (!event) return error(404, 'NOT_FOUND', 'Event not found')
  if (user.role !== 'Admin' && event.userId !== user.id) return error(403, 'FORBIDDEN', 'You do not have access to this event')
  return { user, event }
}

const record = async (request: Request) => {
  const url = new URL(request.url)
  let body: unknown
  const type = request.headers.get('content-type') ?? ''
  if (type.includes('application/json')) body = await request.clone().json()
  db.requests.push({ method: request.method, path: url.pathname.replace('/api', ''), search: url.search, body, auth: request.headers.get('authorization') })
}

export const handlers = [
  http.all(`${API}/*`, async ({ request }) => {
    await record(request)
    return undefined
  }),

  http.post(`${API}/auth/login`, async ({ request }) => {
    const { email, password } = (await request.json()) as { email: string; password: string }
    const entry = Object.entries(db.users).find(([, u]) => u.email === email)
    if (!entry || password !== 'Password1') return error(401, 'INVALID_CREDENTIALS', 'Invalid email or password')
    return HttpResponse.json({ token: entry[0], user: entry[1] })
  }),
  http.post(`${API}/auth/register`, async ({ request }) => {
    const body = (await request.json()) as { fullName: string; email: string; phone: string }
    if (Object.values(db.users).some((u) => u.email === body.email)) return error(409, 'CONFLICT', 'An account with this email already exists')
    const user: User = { ...clientUser, id: 50, fullName: body.fullName, email: body.email, phone: body.phone, emailVerified: false }
    db.users['new-token'] = user
    return HttpResponse.json({ message: 'Registration successful', token: 'new-token', user }, { status: 201 })
  }),
  http.post(`${API}/auth/google`, async ({ request }) => {
    const { idToken } = (await request.json()) as { idToken: string }
    if (idToken === 'google-existing') {
      const user = { ...db.users[TOKENS.client], googleLinked: true }
      db.users['google-existing-token'] = user
      return HttpResponse.json({ token: 'google-existing-token', user, isNewUser: false })
    }
    if (idToken === 'google-new') {
      const user: User = { ...clientUser, id: 60, fullName: 'מיכל גוגל', email: 'michal@gmail.com', phone: null, googleLinked: true }
      db.users['google-new-token'] = user
      return HttpResponse.json({ token: 'google-new-token', user, isNewUser: true })
    }
    if (idToken === 'google-admin') return error(409, 'CONFLICT', 'This account must sign in with email and password')
    return error(401, 'GOOGLE_AUTH_FAILED', 'Invalid or expired Google token')
  }),
  http.get(`${API}/auth/me`, ({ request }) => {
    const user = guard(request)
    return user instanceof Response ? user : HttpResponse.json({ user })
  }),
  http.patch(`${API}/auth/me`, async ({ request }) => {
    const user = guard(request)
    if (user instanceof Response) return user
    const body = (await request.json()) as Partial<User>
    Object.assign(user, body)
    return HttpResponse.json({ user })
  }),

  http.get(`${API}/packages`, ({ request }) => {
    const type = new URL(request.url).searchParams.get('eventType')
    const active = packages.filter((p) => p.isActive && (!type || p.eventType === type || p.eventType === null))
    return HttpResponse.json(active.map(({ isActive: _a, eventCount: _c, createdAt: _cr, updatedAt: _u, ...p }) => p))
  }),
  http.get(`${API}/admin/packages`, ({ request }) => {
    const user = guard(request, 'Admin')
    return user instanceof Response ? user : HttpResponse.json(packages)
  }),
  http.post(`${API}/packages`, async ({ request }) => {
    const user = guard(request, 'Admin')
    if (user instanceof Response) return user
    const body = (await request.json()) as object
    return HttpResponse.json({ ...packages[0], ...body, id: 99, eventCount: 0 }, { status: 201 })
  }),

  http.get(`${API}/gallery`, ({ request }) => {
    const url = new URL(request.url)
    const category = url.searchParams.get('category')
    const featured = url.searchParams.get('featured')
    const items = galleryItems.filter(
      (g) => g.isPublished && (!category || g.category === category) && (featured !== 'true' || g.isFeatured),
    )
    return HttpResponse.json(page(items.map(toPublicGallery), url))
  }),
  http.get(`${API}/gallery/summary`, () =>
    HttpResponse.json(
      ['Birthday', 'BatMitzvah', 'Brit', 'Corporate', 'Private'].map((category) => {
        const items = galleryItems.filter((g) => g.isPublished && g.category === category)
        return { category, count: items.length, cover: items[0] ? toPublicGallery(items[0]) : null }
      }),
    ),
  ),
  http.get(`${API}/admin/gallery`, ({ request }) => {
    const user = guard(request, 'Admin')
    return user instanceof Response ? user : HttpResponse.json(page(galleryItems, new URL(request.url)))
  }),
  http.patch(`${API}/gallery/:id`, async ({ request, params }) => {
    const user = guard(request, 'Admin')
    if (user instanceof Response) return user
    const item = galleryItems.find((g) => g.id === Number(params.id))
    if (!item) return error(404, 'NOT_FOUND', 'Gallery item not found')
    return HttpResponse.json({ ...item, ...((await request.json()) as object) })
  }),

  http.get(`${API}/events/my`, ({ request }) => {
    const user = guard(request)
    if (user instanceof Response) return user
    const url = new URL(request.url)
    const mine = filterEvents(db.events.filter((e) => e.userId === user.id), url, false).map(({ notes: _n, ...e }) => ({
      ...e,
      photoCount: db.photos.filter((p) => p.eventId === e.id).length,
    }))
    return HttpResponse.json(page(mine, url))
  }),
  http.get(`${API}/events`, ({ request }) => {
    const user = guard(request, 'Admin')
    if (user instanceof Response) return user
    const url = new URL(request.url)
    const list = filterEvents(db.events, url, true).map((e) => ({ ...e, photoCount: db.photos.filter((p) => p.eventId === e.id).length }))
    return HttpResponse.json(page(list, url))
  }),
  http.post(`${API}/events/requests`, async ({ request }) => {
    const user = guard(request)
    if (user instanceof Response) return user
    if (user.role !== 'Client') return error(403, 'FORBIDDEN', 'You do not have permission to perform this action')
    const body = (await request.json()) as EventRequestInput
    const duplicate = db.events.some(
      (e) =>
        e.userId === user.id &&
        e.eventDate === body.eventDate &&
        e.eventName.toLowerCase() === body.eventName.toLowerCase() &&
        e.status !== 'Rejected',
    )
    if (duplicate) return error(409, 'CONFLICT', 'You already have a request or an event with this name on this date')
    const created: EventItem = {
      ...body,
      id: 90 + db.events.length,
      clientName: user.fullName,
      clientEmail: user.email,
      package: { id: body.packageId, name: 'Basic' },
      status: 'Pending',
      coverImageUrl: null,
      rejectionReason: null,
      reviewedAt: null,
      userId: user.id,
      createdAt: '2026-10-28T09:00:00.000Z',
      updatedAt: '2026-10-28T09:00:00.000Z',
    }
    db.events.push(created)
    return HttpResponse.json({ ...created, photos: [] }, { status: 201 })
  }),
  http.patch(`${API}/events/:id/request`, async ({ request, params }) => {
    const access = eventAccess(request, Number(params.id))
    if (access instanceof Response) return access
    if (access.user.role !== 'Client') return error(403, 'FORBIDDEN', 'You do not have permission to perform this action')
    if (access.event.status !== 'Pending') return error(409, 'CONFLICT', 'Only a pending request can be edited')
    Object.assign(access.event, (await request.json()) as Partial<EventRequestInput>)
    const { notes: _n, ...rest } = access.event
    return HttpResponse.json({ ...rest, photos: [] })
  }),
  http.post(`${API}/events/:id/:decision`, async ({ request, params }) => {
    if (params.decision !== 'approve' && params.decision !== 'reject') return undefined
    const user = guard(request, 'Admin')
    if (user instanceof Response) return user
    const event = db.events.find((e) => e.id === Number(params.id))
    if (!event) return error(404, 'NOT_FOUND', 'Event not found')
    if (event.status !== 'Pending') return error(409, 'CONFLICT', 'This request was already reviewed')
    const reason = params.decision === 'reject' ? (((await request.json()) as { reason: string | null }).reason ?? null) : null
    Object.assign(event, {
      status: params.decision === 'approve' ? 'New' : 'Rejected',
      rejectionReason: reason,
      reviewedAt: '2026-10-28T10:00:00.000Z',
      reviewedById: user.id,
    })
    return HttpResponse.json({ ...event, photos: [] })
  }),
  http.post(`${API}/events`, async ({ request }) => {
    const user = guard(request, 'Admin')
    if (user instanceof Response) return user
    const body = (await request.json()) as EventItem
    const created: EventItem = { ...body, id: 77, userId: null, package: { id: body.packageId, name: 'Basic' }, createdAt: '2026-10-27T09:00:00.000Z', updatedAt: '2026-10-27T09:00:00.000Z' }
    db.events.push(created)
    return HttpResponse.json({ ...created, photos: [] }, { status: 201 })
  }),
  http.get(`${API}/events/:id`, ({ request, params }) => {
    const access = eventAccess(request, Number(params.id))
    if (access instanceof Response) return access
    const { user, event } = access
    const { notes, ...rest } = event
    return HttpResponse.json({
      ...rest,
      ...(user.role === 'Admin' && { notes }),
      photos: db.photos.filter((p) => p.eventId === event.id).map((p) => photoFor(p, user)),
    })
  }),
  http.patch(`${API}/events/:id/status`, async ({ request, params }) => {
    const user = guard(request, 'Admin')
    if (user instanceof Response) return user
    const event = db.events.find((e) => e.id === Number(params.id))!
    if (event.status === 'Pending' || event.status === 'Rejected') {
      return error(409, 'CONFLICT', 'A request must be approved or rejected before its status can be managed')
    }
    event.status = ((await request.json()) as { status: EventItem['status'] }).status
    return HttpResponse.json(event)
  }),
  http.delete(`${API}/events/:id`, ({ request, params }) => {
    const user = guard(request, 'Admin')
    if (user instanceof Response) return user
    db.events = db.events.filter((e) => e.id !== Number(params.id))
    return new HttpResponse(null, { status: 204 })
  }),

  http.get(`${API}/events/:id/photos`, ({ request, params }) => {
    const access = eventAccess(request, Number(params.id))
    if (access instanceof Response) return access
    return HttpResponse.json(db.photos.filter((p) => p.eventId === access.event.id).map((p) => photoFor(p, access.user)))
  }),
  http.get(`${API}/events/:id/photos/:photoId`, ({ request, params }) => {
    const access = eventAccess(request, Number(params.id))
    if (access instanceof Response) return access
    const photo = db.photos.find((p) => p.id === Number(params.photoId) && p.eventId === access.event.id)
    if (!photo) return error(404, 'NOT_FOUND', 'Photo not found for this event')
    photo.url = `https://api.cloudinary.test/download?public_id=p${photo.id}&signature=fresh${Date.now()}`
    photo.urlExpiresAt = new Date(Date.now() + 10 * 60_000).toISOString()
    return HttpResponse.json(photoFor(photo, access.user))
  }),
  http.post(`${API}/events/:id/photos`, async ({ request, params }) => {
    const access = eventAccess(request, Number(params.id))
    if (access instanceof Response) return access
    const files = (await request.formData()).getAll('photos') as File[]
    if (files.length === 0) return error(400, 'VALIDATION_ERROR', 'At least one image file is required in field "photos"')
    const created = files.map((file) => {
      const photo: AdminEventPhoto = {
        id: db.nextPhotoId++,
        eventId: access.event.id,
        url: `https://api.cloudinary.test/download?public_id=new&signature=s${db.nextPhotoId}`,
        urlExpiresAt: new Date(Date.now() + 10 * 60_000).toISOString(),
        isPrivate: true,
        publishConsent: false,
        publishedInGallery: false,
        uploadedByMe: true,
        canDelete: true,
        createdAt: new Date().toISOString(),
        publicId: `eventstyle/events/${access.event.id}/${file.name}`,
        storageType: 'authenticated',
        uploadedById: access.user.id,
        galleryItemId: null,
      }
      db.photos.push(photo)
      return photoFor(photo, access.user)
    })
    return HttpResponse.json(created, { status: 201 })
  }),
  http.delete(`${API}/events/:id/photos/:photoId`, ({ request, params }) => {
    const access = eventAccess(request, Number(params.id))
    if (access instanceof Response) return access
    const photo = db.photos.find((p) => p.id === Number(params.photoId) && p.eventId === access.event.id)
    if (!photo) return error(404, 'NOT_FOUND', 'Photo not found for this event')
    if (access.user.role !== 'Admin' && photo.uploadedById !== access.user.id) return error(403, 'FORBIDDEN', 'You can delete only photos you uploaded')
    db.photos = db.photos.filter((p) => p !== photo)
    return new HttpResponse(null, { status: 204 })
  }),
  http.put(`${API}/events/:id/photos/:photoId/consent`, async ({ request, params }) => {
    const access = eventAccess(request, Number(params.id))
    if (access instanceof Response) return access
    if (access.event.userId !== access.user.id) return error(403, 'FORBIDDEN', 'Only the event owner can change the publish consent')
    const body = (await request.json()) as Record<string, unknown>
    if (typeof body.publishConsent !== 'boolean' || Object.keys(body).length !== 1) {
      return error(400, 'VALIDATION_ERROR', 'Validation failed', [{ field: 'publishConsent', message: 'publishConsent must be a boolean' }])
    }
    const photo = db.photos.find((p) => p.id === Number(params.photoId) && p.eventId === access.event.id)
    if (!photo) return error(404, 'NOT_FOUND', 'Photo not found for this event')
    photo.publishConsent = body.publishConsent
    if (!body.publishConsent) {
      photo.publishedInGallery = false
      photo.galleryItemId = null
    }
    return HttpResponse.json(photoFor(photo, access.user))
  }),
  http.post(`${API}/events/:id/photos/:photoId/publish`, async ({ request, params }) => {
    const user = guard(request, 'Admin')
    if (user instanceof Response) return user
    const photo = db.photos.find((p) => p.id === Number(params.photoId) && p.eventId === Number(params.id))
    if (!photo) return error(404, 'NOT_FOUND', 'Photo not found for this event')
    if (!photo.publishConsent) return error(409, 'PUBLISH_CONSENT_REQUIRED', 'The event owner has not given consent to publish this photo')
    if (photo.galleryItemId) return error(409, 'ALREADY_PUBLISHED', 'This photo already has a copy in the gallery', { galleryItemId: photo.galleryItemId })
    const body = (await request.json()) as { title: string; isPublished?: boolean }
    photo.galleryItemId = 300
    photo.publishedInGallery = body.isPublished ?? true
    return HttpResponse.json({ ...galleryItems[0], id: 300, title: body.title, sourceEventPhotoId: photo.id }, { status: 201 })
  }),
  http.get(`${API}/admin/event-photos`, ({ request }) => {
    const user = guard(request, 'Admin')
    if (user instanceof Response) return user
    const url = new URL(request.url)
    const consent = url.searchParams.get('publishConsent')
    const inGallery = url.searchParams.get('inGallery')
    const list = db.photos
      .filter((p) => (consent === null || String(p.publishConsent) === consent) && (inGallery === null || String(p.galleryItemId !== null) === inGallery))
      .map((p) => {
        const event = db.events.find((e) => e.id === p.eventId)!
        return { ...photoFor(p, user), event: { id: event.id, eventName: event.eventName, eventType: event.eventType, clientName: event.clientName } }
      })
    return HttpResponse.json(page(list, url))
  }),
]

export const server = setupServer(...handlers)
