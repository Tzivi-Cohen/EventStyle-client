import { screen, waitFor, within } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'
import { renderApp } from './render'
import { API, db, error, server } from './server'

describe('Packages and price list per event type', () => {
  it('shows active packages grouped by event type, plus general packages; archived ones are not shown', async () => {
    renderApp('/packages')
    expect(await screen.findByRole('heading', { name: 'יום הולדת', level: 2 })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'חבילות כלליות', level: 2 })).toBeInTheDocument()
    expect(screen.getByText('יום הולדת קלאסי')).toBeInTheDocument()
    expect(screen.queryByText('בת מצווה זהב')).not.toBeInTheDocument() // בארכיון
    expect(screen.getAllByText(/1,500/).length).toBeGreaterThan(0)
  })

  it('choosing an event type requests that type from the server and keeps it in the URL', async () => {
    const { user } = renderApp('/packages')
    await user.click(await screen.findByRole('tab', { name: 'יום הולדת' }))
    expect(await screen.findByRole('heading', { name: 'חבילות ליום הולדת' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'חבילות כלליות שמתאימות גם לאירוע הזה' })).toBeInTheDocument()
    expect(db.requests.some((r) => r.path === '/packages' && r.search === '?eventType=Birthday')).toBe(true)
    expect(screen.getByTestId('location')).toHaveTextContent('/packages?type=Birthday')
  })

  it('Loading → Error with retry', async () => {
    server.use(http.get(`${API}/packages`, () => error(500, 'INTERNAL_ERROR', 'Internal server error')))
    renderApp('/packages')
    expect(screen.getByText('טוען את המחירון...')).toBeInTheDocument()
    expect(await screen.findByText('אירעה שגיאה בשרת. נסו שוב')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'נסו שוב' })).toBeInTheDocument()
  })

  it('Empty state when there are no packages', async () => {
    server.use(http.get(`${API}/packages`, () => HttpResponse.json([])))
    renderApp('/packages')
    expect(await screen.findByText('עדיין אין חבילות להצגה')).toBeInTheDocument()
  })

  it('server is down → a friendly network message, no white screen', async () => {
    server.use(http.get(`${API}/packages`, () => HttpResponse.error()))
    renderApp('/packages')
    expect(await screen.findByText('אין חיבור לשרת. בדקו את החיבור ונסו שוב')).toBeInTheDocument()
  })
})

describe('Public gallery', () => {
  it('the gallery index shows one card per event type with published counts only', async () => {
    renderApp('/gallery')
    const birthday = await screen.findByRole('link', { name: /יום הולדת/ })
    expect(within(birthday).getByText('1 תמונות')).toBeInTheDocument() // הפריט המוסתר לא נספר
    expect(screen.getAllByText('עדיין אין תמונות').length).toBeGreaterThan(0)
  })

  it('a category page shows only published items, with an enlarged view', async () => {
    const { user } = renderApp('/gallery/Birthday')
    const tile = await screen.findByRole('button', { name: 'הגדלת התמונה: יום הולדת פסטל' })
    expect(screen.queryByText('טיוטה מוסתרת')).not.toBeInTheDocument()
    await user.click(tile)
    const dialog = await screen.findByRole('dialog', { name: 'יום הולדת פסטל' })
    expect(within(dialog).getByRole('img', { name: 'יום הולדת פסטל' })).toBeInTheDocument()
    await user.keyboard('{Escape}')
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
    expect(db.requests.find((r) => r.path === '/gallery')?.search).toBe('?category=Birthday&page=1&limit=12')
  })

  it('empty category and unknown category', async () => {
    renderApp('/gallery/Brit')
    expect(await screen.findByText('עדיין אין תמונות בגלריה הזו')).toBeInTheDocument()
  })

  it('an unknown category is a Not Found page (no request with an invalid category)', async () => {
    renderApp('/gallery/Wedding')
    expect(await screen.findByText('הדף לא נמצא')).toBeInTheDocument()
  })

  it('a broken image shows a placeholder instead of a broken icon', async () => {
    renderApp('/gallery/Birthday')
    const img = await screen.findByRole('img', { name: 'יום הולדת פסטל' })
    img.dispatchEvent(new Event('error'))
    expect(await screen.findByRole('img', { name: 'יום הולדת פסטל – התמונה אינה זמינה' })).toBeInTheDocument()
  })

  it('the home page shows featured works from the server', async () => {
    renderApp('/')
    expect(await screen.findByRole('button', { name: 'הגדלת התמונה: בת מצווה בגווני זהב' })).toBeInTheDocument()
    expect(db.requests.some((r) => r.path === '/gallery' && r.search.includes('featured=true'))).toBe(true)
  })
})

describe('Contact – the studio phone and email', () => {
  it('"Direct contact" shows a clickable phone (tel:) and email (mailto:), and no "coming soon" notice', async () => {
    renderApp('/contact')
    const main = await screen.findByRole('main')
    const phone = await within(main).findByRole('link', { name: 'חיוג לסטודיו: 053-4134130' })
    expect(phone).toHaveAttribute('href', 'tel:0534134130')
    expect(within(phone).getByText('053-4134130')).toHaveAttribute('dir', 'ltr')
    const email = within(main).getByRole('link', { name: 'שליחת מייל לסטודיו: tc104130@gmail.com' })
    expect(email).toHaveAttribute('href', 'mailto:tc104130@gmail.com')
    expect(screen.queryByText(/יתפרסמו כאן בקרוב/)).not.toBeInTheDocument()
  })

  it('the footer on every page shows the same details – one source, nothing contradicting', async () => {
    renderApp('/packages')
    const footer = await screen.findByRole('contentinfo')
    expect(within(footer).getByRole('link', { name: /053-4134130/ })).toHaveAttribute('href', 'tel:0534134130')
    expect(within(footer).getByRole('link', { name: /tc104130@gmail\.com/ })).toHaveAttribute('href', 'mailto:tc104130@gmail.com')
    expect(document.querySelectorAll('a[href^="tel:"]')).toHaveLength(1)
    expect(document.querySelectorAll('a[href^="mailto:"]')).toHaveLength(1)
  })
})
