import { screen, waitFor, within } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'
import { tokenStorage } from '../utils/tokenStorage'
import { renderApp } from './render'
import { API, db, server, TOKENS } from './server'

const location = () => screen.getByTestId('location').textContent

describe('Login (email + password)', () => {
  it('logs in, stores the token, loads the user and goes to the role home page', async () => {
    const { user } = renderApp('/login')
    await user.type(await screen.findByLabelText(/אימייל/), 'noa@test.com')
    await user.type(screen.getByLabelText(/סיסמה/), 'Password1')
    await user.click(screen.getByRole('button', { name: 'התחברות' }))

    await waitFor(() => expect(location()).toBe('/my-events'))
    expect(tokenStorage.get()).toBe(TOKENS.client)
    expect(await screen.findByRole('link', { name: 'נועה לוי' })).toBeInTheDocument()
    expect(db.requests.find((r) => r.path === '/auth/login')?.body).toEqual({ email: 'noa@test.com', password: 'Password1' })
  })

  it('admin goes to /admin after login', async () => {
    const { user } = renderApp('/login')
    await user.type(await screen.findByLabelText(/אימייל/), 'admin@test.com')
    await user.type(screen.getByLabelText(/סיסמה/), 'Password1')
    await user.click(screen.getByRole('button', { name: 'התחברות' }))
    await waitFor(() => expect(location()).toBe('/admin'))
  })

  it('empty fields are validated in the form and no request is sent', async () => {
    const { user } = renderApp('/login')
    await user.click(await screen.findByRole('button', { name: 'התחברות' }))
    expect(await screen.findByText('יש להזין כתובת אימייל')).toBeInTheDocument()
    expect(screen.getByText('יש להזין סיסמה')).toBeInTheDocument()
    expect(db.requests.some((r) => r.path === '/auth/login')).toBe(false)
  })

  it('wrong password shows a clear message and does not log in', async () => {
    const { user } = renderApp('/login')
    await user.type(await screen.findByLabelText(/אימייל/), 'noa@test.com')
    await user.type(screen.getByLabelText(/סיסמה/), 'Wrong1234')
    await user.click(screen.getByRole('button', { name: 'התחברות' }))
    expect(await screen.findByText('אימייל או סיסמה שגויים')).toBeInTheDocument()
    expect(tokenStorage.get()).toBeNull()
  })

  it('the submit button is disabled while sending – a double click sends one request', async () => {
    let release!: () => void
    let calls = 0
    server.use(
      http.post(`${API}/auth/login`, async () => {
        calls += 1
        await new Promise<void>((resolve) => (release = resolve))
        return HttpResponse.json({ token: TOKENS.client, user: db.users[TOKENS.client] })
      }),
    )
    const { user } = renderApp('/login')
    await user.type(await screen.findByLabelText(/אימייל/), 'noa@test.com')
    await user.type(screen.getByLabelText(/סיסמה/), 'Password1')
    await user.dblClick(screen.getByRole('button', { name: 'התחברות' }))
    expect(await screen.findByRole('button', { name: 'מתחבר...' })).toBeDisabled()
    release()
    await waitFor(() => expect(location()).toBe('/my-events'))
    expect(calls).toBe(1)
  })
})

describe('Register (no email code)', () => {
  it('registers and goes straight to the personal area – no verification screen, no code request', async () => {
    const { user } = renderApp('/register')
    await user.type(await screen.findByLabelText(/שם מלא/), 'דנה כהן')
    await user.type(screen.getByLabelText(/^אימייל/), 'dana@test.com')
    await user.type(screen.getByLabelText(/טלפון/), '050-7654321')
    await user.type(screen.getByLabelText(/^סיסמה/), 'Secret123')
    await user.type(screen.getByLabelText(/אימות סיסמה/), 'Secret123')
    await user.click(screen.getByRole('button', { name: 'הרשמה' }))

    await waitFor(() => expect(location()).toBe('/my-events'))
    expect(await screen.findByText('ההרשמה הושלמה – ברוכה הבאה, דנה כהן!')).toBeInTheDocument()
    expect(tokenStorage.get()).toBe('new-token')
    expect(screen.queryByText(/קוד אימות|לאימות/)).not.toBeInTheDocument()
    expect(db.requests.some((r) => /verify-email|resend-code/.test(r.path))).toBe(false)
    expect(screen.getByRole('link', { name: '+ בקשה חדשה לעיצוב' })).toBeInTheDocument()
  })

  it('an old /verify-email link no longer shows a code screen', async () => {
    renderApp('/verify-email', { as: 'client' })
    expect(await screen.findByRole('heading', { name: /הדף לא נמצא/ })).toBeInTheDocument()
    expect(screen.queryByLabelText(/קוד אימות/)).not.toBeInTheDocument()
  })

  it('validates the form: password rules and matching confirmation', async () => {
    const { user } = renderApp('/register')
    await user.type(await screen.findByLabelText(/^סיסמה/), 'onlyletters')
    await user.type(screen.getByLabelText(/אימות סיסמה/), 'different1')
    await user.click(screen.getByRole('button', { name: 'הרשמה' }))
    expect(await screen.findByText('הסיסמה חייבת להכיל לפחות ספרה אחת')).toBeInTheDocument()
    expect(screen.getByText('הסיסמאות אינן תואמות')).toBeInTheDocument()
    expect(db.requests.some((r) => r.path === '/auth/register')).toBe(false)
  })

  it('an existing email shows the server conflict in Hebrew', async () => {
    const { user } = renderApp('/register')
    await user.type(await screen.findByLabelText(/שם מלא/), 'נועה')
    await user.type(screen.getByLabelText(/^אימייל/), 'noa@test.com')
    await user.type(screen.getByLabelText(/טלפון/), '050-7654321')
    await user.type(screen.getByLabelText(/^סיסמה/), 'Secret123')
    await user.type(screen.getByLabelText(/אימות סיסמה/), 'Secret123')
    await user.click(screen.getByRole('button', { name: 'הרשמה' }))
    expect(await screen.findByText('כבר קיים חשבון עם כתובת האימייל הזו. נסו להתחבר.')).toBeInTheDocument()
    expect(tokenStorage.get()).toBeNull()
    expect(screen.queryByText(/ההרשמה הושלמה/)).not.toBeInTheDocument()
    expect(location()).toBe('/register')
  })

  it('the register button is disabled while sending – a double click sends one request', async () => {
    let release!: () => void
    let calls = 0
    server.use(
      http.post(`${API}/auth/register`, async () => {
        calls += 1
        await new Promise<void>((resolve) => (release = resolve))
        const created = { ...db.users[TOKENS.client], id: 50, email: 'dana@test.com', emailVerified: false }
        db.users['new-token'] = created
        return HttpResponse.json({ message: 'Registration successful', token: 'new-token', user: created }, { status: 201 })
      }),
    )
    const { user } = renderApp('/register')
    await user.type(await screen.findByLabelText(/שם מלא/), 'דנה כהן')
    await user.type(screen.getByLabelText(/^אימייל/), 'dana@test.com')
    await user.type(screen.getByLabelText(/טלפון/), '050-7654321')
    await user.type(screen.getByLabelText(/^סיסמה/), 'Secret123')
    await user.type(screen.getByLabelText(/אימות סיסמה/), 'Secret123')
    await user.dblClick(screen.getByRole('button', { name: 'הרשמה' }))
    expect(await screen.findByRole('button', { name: 'נרשם...' })).toBeDisabled()
    expect(screen.queryByText(/ההרשמה הושלמה/)).not.toBeInTheDocument()
    release()
    await waitFor(() => expect(location()).toBe('/my-events'))
    expect(calls).toBe(1)
  })

  it('a server failure while saving shows an error and no success', async () => {
    server.use(http.post(`${API}/auth/register`, () => HttpResponse.json({ error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } }, { status: 500 })))
    const { user } = renderApp('/register')
    await user.type(await screen.findByLabelText(/שם מלא/), 'דנה כהן')
    await user.type(screen.getByLabelText(/^אימייל/), 'dana@test.com')
    await user.type(screen.getByLabelText(/טלפון/), '050-7654321')
    await user.type(screen.getByLabelText(/^סיסמה/), 'Secret123')
    await user.type(screen.getByLabelText(/אימות סיסמה/), 'Secret123')
    await user.click(screen.getByRole('button', { name: 'הרשמה' }))
    expect(await screen.findByText('אירעה שגיאה בשרת. נסו שוב')).toBeInTheDocument()
    expect(tokenStorage.get()).toBeNull()
    expect(screen.queryByText(/ההרשמה הושלמה/)).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'הרשמה' })).toBeEnabled()
  })

  it('an existing client that was never verified logs in straight to the personal area', async () => {
    db.users[TOKENS.client].emailVerified = false
    const { user } = renderApp('/login')
    await user.type(await screen.findByLabelText(/אימייל/), 'noa@test.com')
    await user.type(screen.getByLabelText(/סיסמה/), 'Password1')
    await user.click(screen.getByRole('button', { name: 'התחברות' }))
    await waitFor(() => expect(location()).toBe('/my-events'))
    expect(screen.queryByText(/לאימות/)).not.toBeInTheDocument()
  })
})

describe('Session: reload, logout, expired token', () => {
  it('after a page reload the user is restored from the stored token (GET /auth/me)', async () => {
    renderApp('/account', { as: 'client' })
    expect(await screen.findByRole('heading', { name: 'הפרטים שלי' })).toBeInTheDocument()
    expect(db.requests.some((r) => r.path === '/auth/me')).toBe(true)
  })

  it('logout removes the token, clears the user and blocks protected pages', async () => {
    const { user } = renderApp('/my-events', { as: 'client' })
    await user.click(await screen.findByRole('button', { name: 'התנתקות' }))
    expect(tokenStorage.get()).toBeNull()
    await waitFor(() => expect(location()).toBe('/'))
    expect(screen.getByRole('link', { name: 'התחברות' })).toBeInTheDocument()
  })

  it('logout clears cached server data, including temporary photo links', async () => {
    const { user, queryClient } = renderApp('/my-events/10', { as: 'client' })
    expect(await screen.findAllByRole('img', { name: /תמונה מ-/ })).not.toHaveLength(0)
    expect(queryClient.getQueryCache().getAll().length).toBeGreaterThan(0)
    await user.click(screen.getByRole('button', { name: 'התנתקות' }))
    await waitFor(() => expect(queryClient.getQueryCache().find({ queryKey: ['events', 'detail', 10, 'photos'] })).toBeUndefined())
  })

  it('an expired token (401) logs out and shows a message on the login page', async () => {
    renderApp('/my-events', { as: 'expired' })
    await waitFor(() => expect(location()).toBe('/login'))
    expect(tokenStorage.get()).toBeNull()
  })

  it('a token that expires during work redirects to login with a clear notice', async () => {
    const { user } = renderApp('/my-events', { as: 'client' })
    await screen.findByRole('heading', { name: 'האירועים שלי' })
    delete db.users[TOKENS.client]
    await user.click(await screen.findByRole('link', { name: /יום הולדת 30 לנועה/ }))
    await waitFor(() => expect(location()).toBe('/login'))
    expect(await screen.findByText('פג תוקף ההתחברות. יש להתחבר מחדש.')).toBeInTheDocument()
  })
})

describe('Profile', () => {
  it('edits name and address; empty address deletes it (address: null)', async () => {
    db.users[TOKENS.client].address = 'רחוב הרצל 1'
    const { user } = renderApp('/account', { as: 'client' })
    const address = await screen.findByLabelText(/כתובת/)
    await waitFor(() => expect(address).toHaveValue('רחוב הרצל 1'))
    await user.clear(address)
    await user.click(screen.getByRole('button', { name: 'שמירת שינויים' }))
    await waitFor(() => expect(db.requests.find((r) => r.method === 'PATCH')?.body).toEqual({ address: null }))
    expect(await screen.findByText('הפרטים נשמרו')).toBeInTheDocument()
    expect(within(screen.getByRole('main')).queryByRole('textbox', { name: /אימייל/ })).not.toBeInTheDocument()
  })
})
