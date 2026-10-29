import { fireEvent, screen, waitFor, within } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'
import { makeRequest } from './fixtures'
import { renderApp } from './render'
import { API, db, server, TOKENS } from './server'

const location = () => screen.getByTestId('location').textContent
const lastRequest = (method: string, path: string) => [...db.requests].reverse().find((r) => r.method === method && r.path === path)

async function fillRequestForm(user: ReturnType<typeof renderApp>['user']) {
  await user.type(await screen.findByLabelText(/שם האירוע/), 'בת מצווה לשירה')
  await user.selectOptions(screen.getByLabelText(/סוג האירוע/), 'BatMitzvah')
  fireEvent.change(screen.getByLabelText(/^תאריך/), { target: { value: '2027-03-18' } })
  await user.type(screen.getByLabelText(/מיקום/), 'רעננה')
  await user.clear(screen.getByLabelText(/מספר אורחים/))
  await user.type(screen.getByLabelText(/מספר אורחים/), '120')
  await user.clear(screen.getByLabelText(/תקציב משוער/))
  await user.type(screen.getByLabelText(/תקציב משוער/), '9000')
  await user.selectOptions(await screen.findByLabelText(/^חבילה/), '1')
  await user.type(screen.getByLabelText(/צבע \/ סגנון/), 'לבנדר')
  await user.type(screen.getByLabelText(/קונספט העיצוב/), 'קונספט פרובאנס עם לבנדר ונרות')
}

describe('Client: sending a design request', () => {
  it('sends only the allowlisted fields, shows success and opens the pending request', async () => {
    const { user } = renderApp('/my-events', { as: 'client' })
    await user.click(await screen.findByRole('link', { name: '+ בקשה חדשה לעיצוב' }))
    expect(location()).toBe('/my-events/new')
    await fillRequestForm(user)
    await user.click(screen.getByRole('button', { name: 'שליחת הבקשה' }))

    await waitFor(() => expect(location()).toMatch(/^\/my-events\/\d+$/))
    expect(lastRequest('POST', '/events/requests')?.body).toEqual({
      eventName: 'בת מצווה לשירה',
      eventType: 'BatMitzvah',
      eventDate: '2027-03-18',
      location: 'רעננה',
      packageId: 1,
      themeColor: 'לבנדר',
      guestCount: 120,
      budget: 9000,
      description: 'קונספט פרובאנס עם לבנדר ונרות',
      clientNotes: null,
    })
    expect(await screen.findByText(/הבקשה נשלחה/)).toBeInTheDocument()
    expect(await screen.findByRole('heading', { name: 'הבקשה ממתינה לאישור הסטודיו' })).toBeInTheDocument()
    // לפני אישור אין העלאת תמונות
    expect(screen.queryByText(/העלאת תמונות/)).not.toBeInTheDocument()
  })

  it('validates the form in the browser – nothing is sent', async () => {
    const { user } = renderApp('/my-events/new', { as: 'client' })
    await user.click(await screen.findByRole('button', { name: 'שליחת הבקשה' }))
    expect(await screen.findByText('יש לבחור תאריך')).toBeInTheDocument()
    expect(screen.getByText('יש לבחור חבילה')).toBeInTheDocument()
    // התקציב מתחיל ריק (לא 0) וחובה למלא אותו
    expect(screen.getByLabelText(/תקציב משוער/)).toHaveValue(null)
    expect(screen.getByText('יש להזין מספר')).toBeInTheDocument()
    expect(db.requests.some((r) => r.path === '/events/requests')).toBe(false)
  })

  it('a duplicate request shows the server message in Hebrew and stays on the form', async () => {
    db.events.push(makeRequest({ eventDate: '2027-03-18' }))
    const { user } = renderApp('/my-events/new', { as: 'client' })
    await fillRequestForm(user)
    await user.click(screen.getByRole('button', { name: 'שליחת הבקשה' }))
    expect(await screen.findByText('כבר קיימת בקשה או אירוע בשם הזה בתאריך הזה.')).toBeInTheDocument()
    expect(location()).toBe('/my-events/new')
    expect(screen.queryByText(/הבקשה נשלחה/)).not.toBeInTheDocument()
  })

  it('a double click sends one request', async () => {
    let release!: () => void
    let calls = 0
    server.use(
      http.post(`${API}/events/requests`, async () => {
        calls += 1
        await new Promise<void>((resolve) => (release = resolve))
        return HttpResponse.json({ ...makeRequest({ id: 55 }), photos: [] }, { status: 201 })
      }),
    )
    db.events.push(makeRequest({ id: 55 }))
    const { user } = renderApp('/my-events/new', { as: 'client' })
    await fillRequestForm(user)
    await user.dblClick(screen.getByRole('button', { name: 'שליחת הבקשה' }))
    expect(await screen.findByRole('button', { name: 'שולח...' })).toBeDisabled()
    release()
    await waitFor(() => expect(location()).toBe('/my-events/55'))
    expect(calls).toBe(1)
  })

  it('a client whose email was never verified sends a request without any code', async () => {
    db.users[TOKENS.client].emailVerified = false
    const { user } = renderApp('/my-events/new', { as: 'client' })
    await fillRequestForm(user)
    await user.click(screen.getByRole('button', { name: 'שליחת הבקשה' }))
    await waitFor(() => expect(location()).toMatch(/^\/my-events\/\d+$/))
    expect(await screen.findByText(/הבקשה נשלחה/)).toBeInTheDocument()
  })
})

describe('Client: editing a pending request', () => {
  it('the edit button appears only on pending requests', async () => {
    db.events.push(makeRequest({ id: 20 }), makeRequest({ id: 21, eventName: 'בקשה שאושרה', status: 'New' }), makeRequest({ id: 22, eventName: 'בקשה שנדחתה', status: 'Rejected' }))
    renderApp('/my-events', { as: 'client' })
    expect(await screen.findByRole('link', { name: /עריכת בקשה בת מצווה לשירה/ })).toHaveAttribute('href', '/my-events/20/edit')
    expect(screen.queryByRole('link', { name: /עריכת בקשה בקשה שאושרה/ })).not.toBeInTheDocument()
    expect(screen.queryByRole('link', { name: /עריכת בקשה בקשה שנדחתה/ })).not.toBeInTheDocument()
  })

  it('saves only the changed fields (PATCH) and shows the update without a reload', async () => {
    db.events.push(makeRequest())
    const { user } = renderApp('/my-events/20', { as: 'client' })
    await user.click(await screen.findByRole('link', { name: 'עריכת בקשה' }))
    const guests = await screen.findByLabelText(/מספר אורחים/)
    await waitFor(() => expect(guests).toHaveValue(120))
    await user.clear(guests)
    await user.type(guests, '140')
    await user.click(screen.getByRole('button', { name: 'שמירת שינויים' }))

    await waitFor(() => expect(location()).toBe('/my-events/20'))
    expect(lastRequest('PATCH', '/events/20/request')?.body).toEqual({ guestCount: 140 })
    expect(await screen.findByText('הבקשה עודכנה')).toBeInTheDocument()
    expect(await screen.findByText('140')).toBeInTheDocument()
  })

  it('an approved request is read-only: the edit page shows that it is locked', async () => {
    db.events.push(makeRequest({ status: 'New' }))
    renderApp('/my-events/20/edit', { as: 'client' })
    expect(await screen.findByText('הבקשה נעולה לעריכה')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'שמירת שינויים' })).not.toBeInTheDocument()
  })

  it('a rejected request shows the reason, read-only, without photos', async () => {
    db.events.push(makeRequest({ status: 'Rejected', rejectionReason: 'התאריך כבר תפוס', reviewedAt: '2026-10-28T10:00:00.000Z' }))
    renderApp('/my-events/20', { as: 'client' })
    expect(await screen.findByRole('heading', { name: 'הבקשה נדחתה' })).toBeInTheDocument()
    expect(screen.getByText('התאריך כבר תפוס')).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'עריכת בקשה' })).not.toBeInTheDocument()
  })

  it('if the request was approved meanwhile, saving shows the 409 message', async () => {
    db.events.push(makeRequest())
    const { user } = renderApp('/my-events/20/edit', { as: 'client' })
    const guests = await screen.findByLabelText(/מספר אורחים/)
    await waitFor(() => expect(guests).toHaveValue(120))
    db.events.find((e) => e.id === 20)!.status = 'New' // המנהלת אישרה בזמן העריכה
    await user.clear(guests)
    await user.type(guests, '10')
    await user.click(screen.getByRole('button', { name: 'שמירת שינויים' }))
    expect(await screen.findByText('אפשר לערוך רק בקשה שממתינה לאישור. הבקשה כבר נבדקה.')).toBeInTheDocument()
  })
})

describe('Client: search, filters and sorting (server side)', () => {
  it('sends search, status, budget range and sort to GET /events/my', async () => {
    db.events.push(makeRequest())
    const { user } = renderApp('/my-events', { as: 'client' })
    await screen.findByRole('heading', { name: 'בת מצווה לשירה' })
    await user.selectOptions(screen.getByLabelText('סטטוס'), 'Pending')
    await user.type(screen.getByLabelText('תקציב מינימלי'), '5000')
    await user.selectOptions(screen.getByLabelText('מיון'), 'budget:asc')
    await waitFor(() => {
      const search = new URLSearchParams(lastRequest('GET', '/events/my')?.search)
      expect(Object.fromEntries(search)).toMatchObject({ status: 'Pending', minBudget: '5000', sortBy: 'budget', sortDir: 'asc' })
    })
    expect(await screen.findByRole('heading', { name: 'בת מצווה לשירה' })).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'יום הולדת 30 לנועה' })).not.toBeInTheDocument()
  })

  it('an inverted budget range shows a message and is not sent', async () => {
    const { user } = renderApp('/my-events', { as: 'client' })
    await screen.findByRole('heading', { name: 'יום הולדת 30 לנועה' })
    await user.type(screen.getByLabelText('תקציב מינימלי'), '9000')
    await user.type(screen.getByLabelText('תקציב מקסימלי'), '100')
    expect(await screen.findByText('התקציב המינימלי גדול מהמקסימלי')).toBeInTheDocument()
    expect(db.requests.filter((r) => r.path === '/events/my').some((r) => r.search.includes('maxBudget'))).toBe(false)
  })

  it('no results with filters → a clear empty state with a reset button', async () => {
    const { user } = renderApp('/my-events', { as: 'client' })
    await screen.findByRole('heading', { name: 'יום הולדת 30 לנועה' })
    await user.selectOptions(screen.getByLabelText('סטטוס'), 'Rejected')
    expect(await screen.findByText('לא נמצאו אירועים מתאימים')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'ניקוי המסננים' }))
    expect(await screen.findByRole('heading', { name: 'יום הולדת 30 לנועה' })).toBeInTheDocument()
  })
})

describe('Admin: reviewing requests', () => {
  it('the pending tab lists requests with a review link instead of a status selector', async () => {
    db.events.push(makeRequest())
    const { user } = renderApp('/admin/events', { as: 'admin' })
    await user.click(await screen.findByRole('button', { name: /בקשות ממתינות/ }))
    const row = (await screen.findByRole('link', { name: 'בת מצווה לשירה' })).closest('tr')!
    expect(within(row).getByText('ממתינה לאישור')).toBeInTheDocument()
    expect(within(row).queryByRole('combobox')).not.toBeInTheDocument()
    expect(within(row).getByRole('link', { name: /לבדיקה/ })).toHaveAttribute('href', '/admin/events/20')
    expect(new URLSearchParams(lastRequest('GET', '/events')?.search).get('status')).toBe('Pending')
  })

  it('approve: the request becomes an event in status "New" with status management', async () => {
    db.events.push(makeRequest())
    const { user } = renderApp('/admin/events/20', { as: 'admin' })
    await user.click(await screen.findByRole('button', { name: 'אישור הבקשה' }))
    expect(await screen.findByText('הבקשה אושרה – האירוע בסטטוס "חדש"')).toBeInTheDocument()
    expect(lastRequest('POST', '/events/20/approve')).toBeDefined()
    expect(await screen.findByLabelText('עדכון סטטוס')).toHaveValue('New')
  })

  it('reject with a reason: the request is kept and locked', async () => {
    db.events.push(makeRequest())
    const { user } = renderApp('/admin/events/20', { as: 'admin' })
    await user.click(await screen.findByRole('button', { name: 'דחייה' }))
    await user.type(screen.getByLabelText(/סיבת הדחייה/), 'התאריך כבר תפוס')
    await user.click(screen.getByRole('button', { name: 'דחיית הבקשה' }))
    expect(await screen.findByText('הבקשה נדחתה')).toBeInTheDocument()
    expect(lastRequest('POST', '/events/20/reject')?.body).toEqual({ reason: 'התאריך כבר תפוס' })
    expect(await screen.findByRole('heading', { name: 'הבקשה נדחתה' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'אישור הבקשה' })).not.toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'עריכה' })).not.toBeInTheDocument()
  })

  it('a request reviewed meanwhile by another admin shows a clear 409 message', async () => {
    db.events.push(makeRequest())
    const { user } = renderApp('/admin/events/20', { as: 'admin' })
    const approve = await screen.findByRole('button', { name: 'אישור הבקשה' })
    db.events.find((e) => e.id === 20)!.status = 'Rejected'
    await user.click(approve)
    expect(await screen.findByText('הבקשה כבר נבדקה (אושרה או נדחתה).')).toBeInTheDocument()
  })

  it('a client cannot reach the admin review screen', async () => {
    db.events.push(makeRequest())
    renderApp('/admin/events/20', { as: 'client' })
    await waitFor(() => expect(location()).toBe('/forbidden'))
  })
})
