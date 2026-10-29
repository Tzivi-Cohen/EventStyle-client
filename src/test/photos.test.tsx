import { fireEvent, screen, waitFor, within } from '@testing-library/react'
import { http } from 'msw'
import { describe, expect, it } from 'vitest'
import { ADMIN_ONLY_PHOTO_FIELDS } from './fixtures'
import { renderApp } from './render'
import { API, db, error, server } from './server'

const png = (name: string) => new File([new Uint8Array(500)], name, { type: 'image/png' })

async function openMyEvent() {
  const app = renderApp('/my-events/10', { as: 'client' })
  await screen.findByRole('heading', { name: 'יום הולדת 30 לנועה' })
  await screen.findByRole('list', { name: '' }).catch(() => null)
  await waitFor(() => expect(screen.getAllByRole('listitem').length).toBeGreaterThan(0))
  return app
}

const photoCard = (index: number) => document.querySelectorAll<HTMLElement>('.photo-grid > li')[index]

describe('Client: event details and private photos', () => {
  it('shows status, details (no internal notes) and the private photos with temporary links', async () => {
    await openMyEvent()
    expect(screen.getByRole('list', { name: /סטטוס ההכנות: בתכנון/ })).toBeInTheDocument()
    expect(screen.queryByText('הערות פנימיות')).not.toBeInTheDocument()
    const images = await screen.findAllByRole('img', { name: /תמונה מ-/ })
    expect(images).toHaveLength(3)
    expect(images[0]).toHaveAttribute('src', expect.stringContaining('signature='))
    expect(screen.getAllByText('פרטית')).toHaveLength(2)
    expect(screen.getByText('ציבורית (ישנה)')).toBeInTheDocument()
  })

  it('uses the real response shape: the client never receives publicId or storage details', async () => {
    await openMyEvent()
    const photos = (await (await fetch(`${API}/events/10/photos`, { headers: { Authorization: 'Bearer client-token' } })).json()) as object[]
    for (const field of ADMIN_ONLY_PHOTO_FIELDS) expect(photos[0]).not.toHaveProperty(field)
    expect(document.body.innerHTML).not.toContain('eventstyle/events/10/p101')
  })

  it('delete is offered only when canDelete is true (photos she uploaded)', async () => {
    await openMyEvent()
    expect(within(photoCard(0)).getByRole('button', { name: 'מחיקה' })).toBeInTheDocument()
    expect(within(photoCard(1)).queryByRole('button', { name: 'מחיקה' })).not.toBeInTheDocument()
    expect(within(photoCard(0)).getByText('העלית')).toBeInTheDocument()
  })

  it('deletes a photo after confirmation and refreshes the list', async () => {
    const { user } = await openMyEvent()
    await user.click(within(photoCard(0)).getByRole('button', { name: 'מחיקה' }))
    const dialog = await screen.findByRole('dialog', { name: 'מחיקת תמונה' })
    await user.click(within(dialog).getByRole('button', { name: 'מחיקה' }))
    expect(await screen.findByText('התמונה נמחקה')).toBeInTheDocument()
    await waitFor(() => expect(screen.getAllByRole('img', { name: /תמונה מ-/ })).toHaveLength(2))
    expect(db.requests.some((r) => r.method === 'DELETE' && r.path === '/events/10/photos/101')).toBe(true)
  })

  it('a storage failure while deleting shows a clear message', async () => {
    server.use(http.delete(`${API}/events/10/photos/101`, () => error(502, 'STORAGE_DELETE_FAILED', 'x', { galleryItemIds: [1] })))
    const { user } = await openMyEvent()
    await user.click(within(photoCard(0)).getByRole('button', { name: 'מחיקה' }))
    await user.click(within(await screen.findByRole('dialog')).getByRole('button', { name: 'מחיקה' }))
    expect(await screen.findByText('המחיקה לא הושלמה בשירות התמונות. התמונה הוסתרה – נסו שוב')).toBeInTheDocument()
  })
})

describe('Client: temporary links', () => {
  it('an expired link (image fails to load) is refreshed with GET /events/:id/photos/:photoId', async () => {
    await openMyEvent()
    const [first] = await screen.findAllByRole('img', { name: /תמונה מ-/ })
    const oldSrc = first.getAttribute('src')
    first.dispatchEvent(new Event('error'))
    await waitFor(() => expect(db.requests.some((r) => r.path === '/events/10/photos/101' && r.method === 'GET')).toBe(true))
    await waitFor(() => expect(screen.getAllByRole('img', { name: /תמונה מ-/ })[0].getAttribute('src')).toContain('signature=fresh'))
    expect(screen.getAllByRole('img', { name: /תמונה מ-/ })[0].getAttribute('src')).not.toBe(oldSrc)
  })

  it('url=null shows a placeholder with a reload button that requests a fresh link', async () => {
    db.photos[0].url = null
    db.photos[0].urlExpiresAt = null
    const { user } = await openMyEvent()
    const placeholder = await screen.findByRole('img', { name: /לא זמינה כרגע/ })
    expect(placeholder).toBeInTheDocument()
    await user.click(within(photoCard(0)).getByRole('button', { name: 'טעינה מחדש' }))
    await waitFor(() => expect(within(photoCard(0)).getByRole('img', { name: /תמונה מ-/ })).toHaveAttribute('src', expect.stringContaining('fresh')))
  })

  it('a broken link is refreshed only once (no request loop)', async () => {
    await openMyEvent()
    const [first] = await screen.findAllByRole('img', { name: /תמונה מ-/ })
    first.dispatchEvent(new Event('error'))
    await waitFor(() => expect(screen.getAllByRole('img', { name: /תמונה מ-/ })[0].getAttribute('src')).toContain('fresh'))
    const refreshed = screen.getAllByRole('img', { name: /תמונה מ-/ })[0]
    refreshed.dispatchEvent(new Event('error'))
    await waitFor(() => expect(db.requests.filter((r) => r.path === '/events/10/photos/101').length).toBe(2))
    refreshed.dispatchEvent(new Event('error'))
    await new Promise((r) => setTimeout(r, 50))
    expect(db.requests.filter((r) => r.path === '/events/10/photos/101').length).toBeLessThanOrEqual(2)
  })
})

describe('Client: upload private photos', () => {
  it('uploads with multipart (field "photos"), shows success and adds the new photo', async () => {
    const { user } = await openMyEvent()
    await user.upload(screen.getByLabelText('בחירת תמונות'), [png('a.png'), png('b.png')])
    await user.click(screen.getByRole('button', { name: 'העלאת 2 תמונות' }))
    expect(await screen.findByText('2 תמונות הועלו בהצלחה')).toBeInTheDocument()
    await waitFor(() => expect(screen.getAllByRole('img', { name: /תמונה מ-/ })).toHaveLength(5))
  })

  it('wrong type and too many files are rejected before sending', async () => {
    await openMyEvent()
    const input = screen.getByLabelText('בחירת תמונות')
    fireEvent.change(input, { target: { files: [new File(['x'], 'doc.pdf', { type: 'application/pdf' }), ...Array.from({ length: 11 }, (_, i) => png(`p${i}.png`))] } })
    expect(await screen.findByText(/doc.pdf: סוג קובץ לא נתמך/)).toBeInTheDocument()
    expect(screen.getByText(/p10.png: עד 10 תמונות בכל העלאה/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'העלאת 10 תמונות' })).toBeInTheDocument()
    expect(db.requests.some((r) => r.method === 'POST' && r.path === '/events/10/photos')).toBe(false)
  })

  it('DUPLICATE_PHOTO: the file names are shown, the selection is kept for a retry', async () => {
    server.use(
      http.post(`${API}/events/10/photos`, () =>
        error(409, 'DUPLICATE_PHOTO', 'This photo was already uploaded to this event', { duplicates: [{ file: 'a.png', photoId: 101 }] }),
      ),
    )
    const { user } = await openMyEvent()
    await user.upload(screen.getByLabelText('בחירת תמונות'), [png('a.png')])
    await user.click(screen.getByRole('button', { name: 'העלאת 1 תמונות' }))
    expect(await screen.findByText('התמונות האלה כבר הועלו לאירוע: a.png')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'הסרת a.png' })).toBeInTheDocument()
  })

  it('PHOTO_LIMIT_REACHED from the server is explained', async () => {
    server.use(http.post(`${API}/events/10/photos`, () => error(409, 'PHOTO_LIMIT_REACHED', 'x', { limit: 50, current: 49, requested: 2 })))
    const { user } = await openMyEvent()
    await user.upload(screen.getByLabelText('בחירת תמונות'), [png('a.png'), png('b.png')])
    await user.click(screen.getByRole('button', { name: 'העלאת 2 תמונות' }))
    expect(await screen.findByText('אפשר להעלות עד 50 תמונות לאירוע. נותר מקום ל-1 בלבד')).toBeInTheDocument()
  })

  it('a full event (50 photos) hides the uploader and explains the limit', async () => {
    db.photos = Array.from({ length: 50 }, (_, i) => ({ ...db.photos[0], id: 1000 + i }))
    renderApp('/my-events/10', { as: 'client' })
    expect(await screen.findByText(/האירוע הגיע למגבלה של 50 תמונות/)).toBeInTheDocument()
    expect(screen.queryByLabelText('בחירת תמונות')).not.toBeInTheDocument()
  })
})

describe('Client: publish consent', () => {
  it('gives consent (PUT { publishConsent: true }) – the photo is not published automatically', async () => {
    const { user } = await openMyEvent()
    const toggle = within(photoCard(0)).getByRole('checkbox', { name: 'מסכימה לפרסום בגלריה' })
    expect(toggle).not.toBeChecked()
    await user.click(toggle)
    expect(await screen.findByText('ההסכמה לפרסום נשמרה. הפרסום עצמו נעשה בידי הסטודיו')).toBeInTheDocument()
    await waitFor(() => expect(within(photoCard(0)).getByRole('checkbox')).toBeChecked())
    expect(db.requests.find((r) => r.method === 'PUT')?.body).toEqual({ publishConsent: true })
    expect(within(photoCard(0)).queryByText('בגלריה')).not.toBeInTheDocument()
  })

  it('the switch changes immediately (optimistic) and rolls back with a message if the server fails', async () => {
    server.use(http.put(`${API}/events/10/photos/101/consent`, () => error(500, 'INTERNAL_ERROR', 'db down')))
    const { user } = await openMyEvent()
    const toggle = within(photoCard(0)).getByRole('checkbox', { name: 'מסכימה לפרסום בגלריה' })
    await user.click(toggle)
    expect(await screen.findByText('אירעה שגיאה בשרת. נסו שוב')).toBeInTheDocument()
    await waitFor(() => expect(within(photoCard(0)).getByRole('checkbox')).not.toBeChecked())
  })

  it('revoking consent of a published photo asks for confirmation and removes it from the gallery', async () => {
    const { user } = await openMyEvent()
    expect(within(photoCard(1)).getByText('בגלריה')).toBeInTheDocument()
    await user.click(within(photoCard(1)).getByRole('checkbox', { name: 'מסכימה לפרסום בגלריה' }))
    const dialog = await screen.findByRole('dialog', { name: 'ביטול ההסכמה לפרסום' })
    expect(within(dialog).getByText(/יסיר אותה מהגלריה הציבורית/)).toBeInTheDocument()
    await user.click(within(dialog).getByRole('button', { name: 'ביטול ההסכמה' }))
    expect(await screen.findByText('ההסכמה בוטלה')).toBeInTheDocument()
    await waitFor(() => expect(within(photoCard(1)).queryByText('בגלריה')).not.toBeInTheDocument())
    expect(db.requests.find((r) => r.method === 'PUT')).toMatchObject({ path: '/events/10/photos/102/consent', body: { publishConsent: false } })
  })
})
