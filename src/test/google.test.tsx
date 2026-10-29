import { screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { tokenStorage } from '../utils/tokenStorage'
import { renderApp } from './render'
import { db, TOKENS } from './server'

const google = vi.hoisted(() => ({ credential: 'google-new' as string | undefined, logout: vi.fn() }))

vi.mock('@react-oauth/google', () => ({
  GoogleOAuthProvider: ({ children }: { children: React.ReactNode }) => children,
  GoogleLogin: ({ onSuccess, text }: { onSuccess: (r: { credential?: string }) => void; text?: string }) => (
    <button type="button" onClick={() => onSuccess({ credential: google.credential })}>
      {text === 'signup_with' ? 'הרשמה באמצעות Google' : 'כניסה באמצעות Google'}
    </button>
  ),
  googleLogout: google.logout,
}))

vi.mock('../config/env', async (importOriginal) => {
  const mod = await importOriginal<typeof import('../config/env')>()
  return { ...mod, env: { ...mod.env, googleClientId: 'test-client.apps.googleusercontent.com' } }
})

const location = () => screen.getByTestId('location').textContent

beforeEach(() => {
  google.credential = 'google-new'
  google.logout.mockClear()
})

describe('Both screens offer Google and email + password as alternatives', () => {
  it('login screen: Google button, email + password form and a link to register', async () => {
    renderApp('/login')
    expect(await screen.findByRole('button', { name: 'כניסה באמצעות Google' })).toBeInTheDocument()
    expect(screen.getByText('או עם אימייל וסיסמה')).toBeInTheDocument()
    expect(screen.getByLabelText(/אימייל/)).toBeInTheDocument()
    expect(screen.getByLabelText(/סיסמה/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'התחברות' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'להרשמה' })).toHaveAttribute('href', '/register')
  })

  it('register screen: Google button, the registration form and a link to login', async () => {
    renderApp('/register')
    expect(await screen.findByRole('button', { name: 'הרשמה באמצעות Google' })).toBeInTheDocument()
    expect(screen.getByLabelText(/שם מלא/)).toBeInTheDocument()
    expect(screen.getByLabelText(/^אימייל/)).toBeInTheDocument()
    expect(screen.getByLabelText(/^סיסמה/)).toBeInTheDocument()
    expect(screen.getByLabelText(/אימות סיסמה/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'הרשמה' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'להתחברות' })).toHaveAttribute('href', '/login')
  })

  it('switching between the screens keeps the page the user came from', async () => {
    const { user } = renderApp('/my-events/10')
    await user.click(await screen.findByRole('link', { name: 'להרשמה' }))
    expect(location()).toBe('/register')
    await user.click(screen.getByRole('link', { name: 'להתחברות' }))
    google.credential = 'google-existing'
    await user.click(await screen.findByRole('button', { name: 'כניסה באמצעות Google' }))
    await waitFor(() => expect(location()).toBe('/my-events/10'))
  })
})

describe('Sign in with Google', () => {
  it('existing user: goes straight to the personal area, no password and no registration screen', async () => {
    google.credential = 'google-existing'
    const { user } = renderApp('/login')
    await user.click(await screen.findByRole('button', { name: 'כניסה באמצעות Google' }))

    await waitFor(() => expect(location()).toBe('/my-events'))
    expect(tokenStorage.get()).toBe('google-existing-token')
    expect(db.requests.find((r) => r.path === '/auth/google')?.body).toEqual({ idToken: 'google-existing' })
    expect(db.requests.some((r) => r.path === '/auth/login' || r.path === '/auth/register')).toBe(false)
    expect(await screen.findByText('שלום, נועה לוי')).toBeInTheDocument()
  })

  it('new user from the login screen: the account is created and she goes to the personal area', async () => {
    const { user } = renderApp('/login')
    await user.click(await screen.findByRole('button', { name: 'כניסה באמצעות Google' }))
    await waitFor(() => expect(location()).toBe('/my-events'))
    expect(tokenStorage.get()).toBe('google-new-token')
    expect(await screen.findByText('ברוכה הבאה, מיכל גוגל!')).toBeInTheDocument()
  })

  it('returns to the protected page she asked for', async () => {
    google.credential = 'google-existing'
    const { user } = renderApp('/my-events/10')
    await user.click(await screen.findByRole('button', { name: 'כניסה באמצעות Google' }))
    await waitFor(() => expect(location()).toBe('/my-events/10'))
  })

  it('invalid Google token: a clear error, no session', async () => {
    google.credential = 'google-bad'
    const { user } = renderApp('/login')
    await user.click(await screen.findByRole('button', { name: 'כניסה באמצעות Google' }))
    expect(await screen.findByText('ההתחברות עם Google נכשלה. נסו שוב')).toBeInTheDocument()
    expect(tokenStorage.get()).toBeNull()
    expect(location()).toBe('/login')
  })

  it('admin account cannot use Google (409) – told to use email and password', async () => {
    google.credential = 'google-admin'
    const { user } = renderApp('/login')
    await user.click(await screen.findByRole('button', { name: 'כניסה באמצעות Google' }))
    expect(await screen.findByText('חשבון מנהלת מתחבר רק עם אימייל וסיסמה.')).toBeInTheDocument()
    expect(tokenStorage.get()).toBeNull()
  })

  it('Google returned no credential: an error and no request to the server', async () => {
    google.credential = undefined
    const { user } = renderApp('/login')
    await user.click(await screen.findByRole('button', { name: 'כניסה באמצעות Google' }))
    expect(await screen.findByText('Google לא החזיר אישור התחברות. נסו שוב')).toBeInTheDocument()
    expect(db.requests.some((r) => r.path === '/auth/google')).toBe(false)
  })
})

describe('Register with Google', () => {
  it('new user: account created by Google, no password asked, straight to the personal area', async () => {
    const { user } = renderApp('/register')
    await user.click(await screen.findByRole('button', { name: 'הרשמה באמצעות Google' }))

    await waitFor(() => expect(location()).toBe('/my-events'))
    expect(tokenStorage.get()).toBe('google-new-token')
    expect(db.requests.some((r) => r.path === '/auth/register')).toBe(false)
    expect(await screen.findByText('ברוכה הבאה, מיכל גוגל!')).toBeInTheDocument()
  })

  it('existing user: no duplicate account – she is simply signed in', async () => {
    google.credential = 'google-existing'
    const { user } = renderApp('/register')
    await user.click(await screen.findByRole('button', { name: 'הרשמה באמצעות Google' }))
    await waitFor(() => expect(location()).toBe('/my-events'))
    expect(await screen.findByText('כבר יש לך חשבון – התחברת בהצלחה, נועה לוי')).toBeInTheDocument()
    expect(db.requests.filter((r) => r.path === '/auth/google')).toHaveLength(1)
  })
})

describe('Google session: reload and logout', () => {
  it('after a reload the Google session is restored from the stored system token', async () => {
    google.credential = 'google-existing'
    const first = renderApp('/login')
    await first.user.click(await screen.findByRole('button', { name: 'כניסה באמצעות Google' }))
    await waitFor(() => expect(location()).toBe('/my-events'))
    first.unmount()

    renderApp('/account')
    expect(await screen.findByRole('heading', { name: 'הפרטים שלי' })).toBeInTheDocument()
    expect(screen.getByText('מחובר עם Google')).toBeInTheDocument()
  })

  it('logout clears the session and disables Google auto sign-in', async () => {
    tokenStorage.set(TOKENS.client)
    const { user } = renderApp('/my-events')
    await user.click(await screen.findByRole('button', { name: 'התנתקות' }))
    expect(tokenStorage.get()).toBeNull()
    expect(google.logout).toHaveBeenCalled()
    await waitFor(() => expect(location()).toBe('/'))
  })
})
