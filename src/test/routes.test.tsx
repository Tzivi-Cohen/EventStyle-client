import { screen, waitFor, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { renderApp } from './render'

const location = () => screen.getByTestId('location').textContent

describe('Routing and permissions (client side – the server checks again)', () => {
  it.each(['/my-events', '/my-events/10', '/account', '/admin', '/admin/events'])('a guest opening %s is sent to /login', async (path) => {
    renderApp(path)
    await waitFor(() => expect(location()).toBe('/login'))
  })

  it('after login the guest returns to the page she asked for', async () => {
    const { user } = renderApp('/my-events/10')
    await user.type(await screen.findByLabelText(/אימייל/), 'noa@test.com')
    await user.type(screen.getByLabelText(/סיסמה/), 'Password1')
    await user.click(screen.getByRole('button', { name: 'התחברות' }))
    await waitFor(() => expect(location()).toBe('/my-events/10'))
  })

  it('a client cannot open the admin area (→ /forbidden) and sees no admin link', async () => {
    renderApp('/admin', { as: 'client' })
    await waitFor(() => expect(location()).toBe('/forbidden'))
    expect(screen.getByText('אין לך הרשאה לדף הזה')).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'ניהול' })).not.toBeInTheDocument()
  })

  it('an admin cannot open the client area, and sees the admin navigation', async () => {
    renderApp('/my-events', { as: 'admin' })
    await waitFor(() => expect(location()).toBe('/forbidden'))
    expect(screen.getByRole('link', { name: 'ניהול' })).toBeInTheDocument()
  })

  it('an event of another client: the server answers 403 and a friendly message is shown', async () => {
    renderApp('/my-events/11', { as: 'client' })
    expect(await screen.findByText('אין לך גישה לאירוע הזה.')).toBeInTheDocument()
  })

  it('unknown routes show a Not Found page with a way back', async () => {
    renderApp('/no-such-page')
    expect(await screen.findByText('הדף לא נמצא')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'חזרה לדף הבית' })).toHaveAttribute('href', '/')
  })

  it('the active page is marked in the main navigation', async () => {
    renderApp('/gallery')
    const nav = await screen.findByRole('navigation', { name: 'ניווט ראשי' })
    const link = within(nav).getByRole('link', { name: 'גלריה' })
    expect(link).toHaveClass('active')
    expect(link).toHaveAttribute('aria-current', 'page')
  })
})
