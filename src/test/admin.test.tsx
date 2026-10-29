import { screen, waitFor, within } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'
import { renderApp } from './render'
import { API, db, error, server } from './server'

const location = () => screen.getByTestId('location').textContent

describe('Admin: photos waiting for publication', () => {
  it('lists consented photos not yet in the gallery and publishes one as a separate copy', async () => {
    db.photos[0].publishConsent = true
    const { user } = renderApp('/admin/photos', { as: 'admin' })
    expect(await screen.findByRole('link', { name: 'יום הולדת 30 לנועה' })).toBeInTheDocument()
    expect(db.requests.find((r) => r.path === '/admin/event-photos')?.search).toBe('?publishConsent=true&inGallery=false&page=1&limit=12')

    await user.click(screen.getByRole('button', { name: 'פרסום בגלריה' }))
    const dialog = await screen.findByRole('dialog', { name: 'פרסום בגלריה' })
    await user.type(within(dialog).getByLabelText(/כותרת/), 'שולחן מתוקים ורוד')
    await user.click(within(dialog).getByLabelText('תמונה מובילה'))
    await user.click(within(dialog).getByRole('button', { name: 'פרסום' }))

    expect(await screen.findByText('התמונה פורסמה בגלריה')).toBeInTheDocument()
    expect(db.requests.find((r) => r.method === 'POST' && r.path.endsWith('/publish'))).toMatchObject({
      path: '/events/10/photos/101/publish',
      body: { title: 'שולחן מתוקים ורוד', category: 'Birthday', isPublished: true, isFeatured: true, sortOrder: 0 },
    })
    await waitFor(() => expect(screen.getByText('אין תמונות שממתינות לפרסום')).toBeInTheDocument())
  })

  it.each([
    ['PUBLISH_CONSENT_REQUIRED', 'אין הסכמה של בעלת האירוע לפרסום התמונה'],
    ['ALREADY_PUBLISHED', 'התמונה כבר נמצאת בגלריה'],
  ])('%s from the server is shown in the dialog', async (code, message) => {
    db.photos[0].publishConsent = true
    server.use(http.post(`${API}/events/10/photos/101/publish`, () => error(409, code, 'x')))
    const { user } = renderApp('/admin/photos', { as: 'admin' })
    await user.click(await screen.findByRole('button', { name: 'פרסום בגלריה' }))
    const dialog = await screen.findByRole('dialog')
    await user.type(within(dialog).getByLabelText(/כותרת/), 'כותרת')
    await user.click(within(dialog).getByRole('button', { name: 'פרסום' }))
    expect(await within(dialog).findByText(message)).toBeInTheDocument()
  })

  it('publish dialog validates the title', async () => {
    db.photos[0].publishConsent = true
    const { user } = renderApp('/admin/photos', { as: 'admin' })
    await user.click(await screen.findByRole('button', { name: 'פרסום בגלריה' }))
    await user.click(within(await screen.findByRole('dialog')).getByRole('button', { name: 'פרסום' }))
    expect(await screen.findByText('כותרת של 2–120 תווים')).toBeInTheDocument()
    expect(db.requests.some((r) => r.path.endsWith('/publish'))).toBe(false)
  })
})

describe('Admin: event photos', () => {
  it('the admin sees every photo, can delete any of them, publishes only consented photos and cannot change consent', async () => {
    renderApp('/admin/events/10', { as: 'admin' })
    await waitFor(() => expect(document.querySelectorAll('.photo-grid > li')).toHaveLength(3))
    const cards = document.querySelectorAll<HTMLElement>('.photo-grid > li')
    expect(within(cards[0]).getByText('אין הסכמה')).toBeInTheDocument()
    expect(within(cards[0]).queryByRole('button', { name: 'פרסום בגלריה' })).not.toBeInTheDocument()
    expect(within(cards[1]).getByText('בגלריה')).toBeInTheDocument()
    expect(within(cards[1]).queryByRole('button', { name: 'פרסום בגלריה' })).not.toBeInTheDocument()
    cards.forEach((card) => expect(within(card).getByRole('button', { name: 'מחיקה' })).toBeInTheDocument())
    expect(screen.queryByRole('checkbox', { name: 'מסכימה לפרסום בגלריה' })).not.toBeInTheDocument()
    expect(screen.getByText('הערות פנימיות')).toBeInTheDocument()
  })
})

describe('Admin: events management', () => {
  it('shows the events table with server-side search and status filter', async () => {
    const { user } = renderApp('/admin/events', { as: 'admin' })
    expect(await screen.findByRole('link', { name: 'כנס שנתי' })).toBeInTheDocument()
    await user.type(screen.getByRole('searchbox'), 'נועה')
    await waitFor(() => expect(db.requests.some((r) => r.path === '/events' && r.search.includes('search=%D7%A0%D7%95%D7%A2%D7%94'))).toBe(true))
    await waitFor(() => expect(screen.queryByRole('link', { name: 'כנס שנתי' })).not.toBeInTheDocument())

    await user.selectOptions(screen.getByLabelText('סטטוס', { selector: 'select' }), 'Ready')
    expect(await screen.findByText('לא נמצאו אירועים')).toBeInTheDocument()
  })

  it('updates a status inline (PATCH) and refreshes', async () => {
    const { user } = renderApp('/admin/events', { as: 'admin' })
    await user.selectOptions(await screen.findByLabelText('סטטוס של כנס שנתי'), 'Preparing')
    expect(await screen.findByText('הסטטוס של "כנס שנתי" עודכן לבהכנות')).toBeInTheDocument()
    expect(db.requests.find((r) => r.method === 'PATCH')).toMatchObject({ path: '/events/11/status', body: { status: 'Preparing' } })
  })

  it('deletes an event only after confirmation', async () => {
    const { user } = renderApp('/admin/events', { as: 'admin' })
    const row = (await screen.findByRole('link', { name: 'כנס שנתי' })).closest('tr')!
    await user.click(within(row).getByRole('button', { name: 'מחיקה' }))
    const dialog = await screen.findByRole('dialog', { name: 'מחיקת אירוע' })
    await user.click(within(dialog).getByRole('button', { name: 'ביטול' }))
    expect(db.requests.some((r) => r.method === 'DELETE')).toBe(false)

    await user.click(within(row).getByRole('button', { name: 'מחיקה' }))
    await user.click(within(await screen.findByRole('dialog')).getByRole('button', { name: 'מחיקה לצמיתות' }))
    expect(await screen.findByText('האירוע נמחק')).toBeInTheDocument()
    await waitFor(() => expect(screen.queryByRole('link', { name: 'כנס שנתי' })).not.toBeInTheDocument())
  })

  it('creates an event: validation, only allowed packages, and the list is refreshed', async () => {
    const { user } = renderApp('/admin/events/new', { as: 'admin' })
    await user.click(await screen.findByRole('button', { name: 'יצירת האירוע' }))
    expect(await screen.findByText('יש לבחור תאריך')).toBeInTheDocument()
    expect(screen.getByText('יש לבחור חבילה')).toBeInTheDocument()
    expect(db.requests.some((r) => r.method === 'POST' && r.path === '/events')).toBe(false)

    const packageSelect = screen.getByLabelText(/^חבילה/)
    const options = within(packageSelect).getAllByRole('option').map((o) => o.textContent)
    expect(options.some((o) => o?.includes('יום הולדת קלאסי'))).toBe(true)
    expect(options.some((o) => o?.includes('Basic'))).toBe(true)
    expect(options.some((o) => o?.includes('בת מצווה זהב'))).toBe(false)

    await user.type(screen.getByLabelText(/שם האירוע/), 'ברית לתינוק')
    await user.type(screen.getByLabelText(/שם הלקוח/), 'משפחת כהן')
    await user.type(screen.getByLabelText(/אימייל הלקוח/), 'Cohen@Test.com')
    await user.type(screen.getByLabelText(/^תאריך/), '2026-12-20')
    await user.type(screen.getByLabelText(/^מיקום/), 'ירושלים')
    await user.selectOptions(packageSelect, '1')
    await user.type(screen.getByLabelText(/צבע \/ סגנון/), 'תכלת')
    await user.clear(screen.getByLabelText(/תקציב/))
    await user.type(screen.getByLabelText(/תקציב/), '2500')
    await user.click(screen.getByRole('button', { name: 'יצירת האירוע' }))

    await waitFor(() => expect(location()).toBe('/admin/events/77'))
    expect(db.requests.find((r) => r.method === 'POST' && r.path === '/events')?.body).toMatchObject({
      eventName: 'ברית לתינוק',
      clientEmail: 'cohen@test.com',
      packageId: 1,
      budget: 2500,
      guestCount: 50,
      coverImageUrl: null,
      notes: null,
    })
    expect(await screen.findByText('האירוע יקושר ללקוחה אחרי שתירשם ותאמת את האימייל')).toBeInTheDocument()
  })
})

describe('Admin: double submit protection', () => {
  it('a double click on "create event" creates only one event', async () => {
    let calls = 0
    let release!: () => void
    server.use(
      http.post(`${API}/events`, async ({ request }) => {
        calls += 1
        const body = (await request.json()) as Record<string, unknown>
        await new Promise<void>((resolve) => (release = resolve))
        return HttpResponse.json({ ...body, id: 78, userId: 2, package: { id: 1, name: 'Basic' }, status: 'New', createdAt: 'x', updatedAt: 'x', photos: [] }, { status: 201 })
      }),
    )
    const { user } = renderApp('/admin/events/new', { as: 'admin' })
    await user.type(await screen.findByLabelText(/שם האירוע/), 'אירוע בדיקה')
    await user.type(screen.getByLabelText(/שם הלקוח/), 'לקוחה')
    await user.type(screen.getByLabelText(/אימייל הלקוח/), 'a@test.com')
    await user.type(screen.getByLabelText(/^תאריך/), '2026-12-20')
    await user.type(screen.getByLabelText(/^מיקום/), 'חיפה')
    await user.selectOptions(screen.getByLabelText(/^חבילה/), '1')
    await user.type(screen.getByLabelText(/צבע \/ סגנון/), 'זהב')
    await user.dblClick(screen.getByRole('button', { name: 'יצירת האירוע' }))
    expect(await screen.findByRole('button', { name: 'שומר...' })).toBeDisabled()
    release()
    await waitFor(() => expect(location()).toBe('/admin/events/78'))
    expect(calls).toBe(1)
  })
})

describe('Admin: packages and gallery', () => {
  it('lists all packages including archived ones and creates a package', async () => {
    const { user } = renderApp('/admin/packages', { as: 'admin' })
    expect(await screen.findByText('בת מצווה זהב')).toBeInTheDocument()
    expect(within(screen.getByRole('table')).getByText('בארכיון')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: '+ חבילה חדשה' }))
    const dialog = await screen.findByRole('dialog', { name: 'חבילה חדשה' })
    await user.type(within(dialog).getByLabelText(/^שם/), 'Premium')
    await user.clear(within(dialog).getByLabelText(/^מחיר/))
    await user.type(within(dialog).getByLabelText(/^מחיר/), '2800')
    await user.type(within(dialog).getByLabelText(/תיאור/), 'חבילה מורחבת')
    await user.type(within(dialog).getByLabelText(/מה כלול/), 'שולחן{enter}בלונים')
    await user.type(within(dialog).getByLabelText(/קישור לתמונה/), 'http://not-secure.test/a.jpg')
    await user.click(within(dialog).getByRole('button', { name: 'שמירה' }))
    expect(await within(dialog).findByText('יש להזין כתובת שמתחילה ב-https://')).toBeInTheDocument()

    await user.clear(within(dialog).getByLabelText(/קישור לתמונה/))
    await user.type(within(dialog).getByLabelText(/קישור לתמונה/), 'https://img.test/p.jpg')
    await user.click(within(dialog).getByRole('button', { name: 'שמירה' }))
    expect(await screen.findByText('החבילה נוצרה')).toBeInTheDocument()
    expect(db.requests.find((r) => r.method === 'POST' && r.path === '/packages')?.body).toEqual({
      name: 'Premium',
      description: 'חבילה מורחבת',
      price: 2800,
      features: ['שולחן', 'בלונים'],
      imageUrl: 'https://img.test/p.jpg',
      eventType: null,
      isActive: true,
      sortOrder: 0,
    })
  })

  it('gallery: re-publishing a copy without consent shows the server error', async () => {
    server.use(http.patch(`${API}/gallery/5`, () => error(409, 'PUBLISH_CONSENT_REQUIRED', 'x')))
    const { user } = renderApp('/admin/gallery', { as: 'admin' })
    const card = (await screen.findByText('טיוטה מוסתרת')).closest('li')!
    await user.click(within(card).getByRole('button', { name: 'פרסום' }))
    expect(await screen.findByText('אין הסכמה של בעלת האירוע לפרסום התמונה')).toBeInTheDocument()
  })
})
