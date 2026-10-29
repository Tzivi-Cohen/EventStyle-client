import { describe, expect, it, vi } from 'vitest'
import { ApiError } from '../api/apiError'
import { DEFAULT_CONTACT, parseGoogleClientId, withDefault } from '../config/env'
import { clientUser } from '../test/fixtures'
import { afterLoginPath, homeFor } from './authRedirect'
import { getErrorMessage } from './errorMessages'
import { eventFiltersReducer, initialEventFilters, toEventQuery } from './eventFiltersReducer'
import { formatDate, formatPhone, formatPrice } from './format'
import { isLinkExpired, MIN_REFRESH_MS, nextRefreshDelay, REFRESH_MARGIN_MS } from './photoLinks'
import { initialUploadState, MAX_FILE_SIZE_BYTES, uploadReducer } from './uploadReducer'
import { validateEmail, validateHttpsUrl, validateMoney, validatePassword, validatePhone } from './validation'

const file = (name: string, type = 'image/png', size = 1000) => new File([new Uint8Array(size)], name, { type })

describe('getErrorMessage – Hebrew messages for every server error', () => {
  it.each([
    [new ApiError(401, 'INVALID_CREDENTIALS', 'Invalid email or password'), 'אימייל או סיסמה שגויים'],
    [new ApiError(401, 'UNAUTHORIZED', 'Invalid or expired token'), 'פג תוקף ההתחברות. יש להתחבר מחדש'],
    [new ApiError(403, 'FORBIDDEN', 'You can delete only photos you uploaded'), 'אפשר למחוק רק תמונות שהעליתם.'],
    [new ApiError(409, 'PUBLISH_CONSENT_REQUIRED', 'x'), 'אין הסכמה של בעלת האירוע לפרסום התמונה'],
    [new ApiError(409, 'ALREADY_PUBLISHED', 'x'), 'התמונה כבר נמצאת בגלריה'],
    [new ApiError(409, 'PHOTO_IN_GALLERY', 'x'), 'נוצר עותק בגלריה בזמן המחיקה. נסו שוב'],
    [new ApiError(502, 'STORAGE_DELETE_FAILED', 'x'), 'המחיקה לא הושלמה בשירות התמונות. התמונה הוסתרה – נסו שוב'],
    [new ApiError(0, 'NETWORK_ERROR', 'x'), 'אין חיבור לשרת. בדקו את החיבור ונסו שוב'],
    [new ApiError(500, 'INTERNAL_ERROR', 'stack trace here'), 'אירעה שגיאה בשרת. נסו שוב'],
  ])('%s', (error, expected) => {
    expect(getErrorMessage(error)).toBe(expected)
  })

  it('uses details: duplicate files, photo limit, attempts left, retry-after', () => {
    expect(getErrorMessage(new ApiError(409, 'DUPLICATE_PHOTO', 'x', { duplicates: [{ file: 'a.jpg', photoId: 1 }] }))).toContain('a.jpg')
    expect(getErrorMessage(new ApiError(409, 'PHOTO_LIMIT_REACHED', 'x', { limit: 50, current: 48, requested: 5 }))).toBe(
      'אפשר להעלות עד 50 תמונות לאירוע. נותר מקום ל-2 בלבד',
    )
    expect(getErrorMessage(new ApiError(409, 'PHOTO_LIMIT_REACHED', 'x', { limit: 50, current: 50, requested: 1 }))).toBe('האירוע הגיע למגבלה של 50 תמונות')
    expect(getErrorMessage(new ApiError(400, 'INVALID_CODE', 'x', { attemptsLeft: 3 }))).toBe('קוד האימות שגוי. נותרו 3 ניסיונות')
    expect(getErrorMessage(new ApiError(429, 'TOO_MANY_REQUESTS', 'x', { retryAfterSeconds: 42 }))).toBe('יש להמתין 42 שניות לפני ניסיון נוסף')
  })

  it('never shows internal server text; unknown codes fall back by HTTP status', () => {
    expect(getErrorMessage(new ApiError(503, 'SOMETHING_NEW', 'db host 10.0.0.1 down'))).toBe('השירות אינו זמין כרגע. נסו שוב מאוחר יותר')
    expect(getErrorMessage(new Error('boom'))).toBe('אירעה שגיאה בשרת. נסו שוב')
  })
})

describe('uploadReducer (useReducer for the photo upload)', () => {
  it('accepts valid images and rejects wrong type, large files and the same file twice', () => {
    const state = uploadReducer(initialUploadState, {
      type: 'add',
      remaining: 50,
      files: [file('a.png'), file('doc.pdf', 'application/pdf'), file('big.jpg', 'image/jpeg', MAX_FILE_SIZE_BYTES + 1), file('a.png')],
    })
    expect(state.files.map((f) => f.file.name)).toEqual(['a.png'])
    expect(state.rejected.map((r) => r.name)).toEqual(['doc.pdf', 'big.jpg', 'a.png'])
  })

  it('respects 10 per request and the remaining room in the event (limit 50)', () => {
    const many = Array.from({ length: 12 }, (_, i) => file(`p${i}.png`))
    expect(uploadReducer(initialUploadState, { type: 'add', files: many, remaining: 50 }).files).toHaveLength(10)
    const nearlyFull = uploadReducer(initialUploadState, { type: 'add', files: many, remaining: 3 })
    expect(nearlyFull.files).toHaveLength(3)
    expect(nearlyFull.rejected[0].reason).toBe('נותר מקום ל-3 תמונות בלבד באירוע')
  })

  it('progress → success resets the selection; failure keeps it for a retry', () => {
    let state = uploadReducer(initialUploadState, { type: 'add', files: [file('a.png')], remaining: 50 })
    state = uploadReducer(state, { type: 'start' })
    state = uploadReducer(state, { type: 'progress', percent: 140 })
    expect(state).toMatchObject({ status: 'uploading', progress: 100 })
    const failed = uploadReducer(state, { type: 'failure', message: 'כפולה' })
    expect(failed).toMatchObject({ status: 'error', message: 'כפולה' })
    expect(failed.files).toHaveLength(1)
    const done = uploadReducer(state, { type: 'success', count: 1 })
    expect(done).toMatchObject({ status: 'success', files: [], message: 'התמונה הועלתה בהצלחה' })
  })
})

describe('eventFiltersReducer (useReducer for the admin events table)', () => {
  it('any filter or sort change returns to page 1', () => {
    let state = eventFiltersReducer(initialEventFilters, { type: 'page', page: 4 })
    state = eventFiltersReducer(state, { type: 'status', value: 'Ready' })
    expect(state).toMatchObject({ status: 'Ready', page: 1 })
    state = eventFiltersReducer(eventFiltersReducer(state, { type: 'page', page: 3 }), { type: 'sort', sortBy: 'budget', sortDir: 'asc' })
    expect(state.page).toBe(1)
  })

  it('empty values are not sent to the server (empty params return 400)', () => {
    expect(toEventQuery(initialEventFilters)).toEqual({ page: 1, limit: 10, sortBy: 'eventDate', sortDir: 'desc' })
    expect(toEventQuery({ ...initialEventFilters, eventType: 'Brit' }, '  noa ')).toMatchObject({ eventType: 'Brit', search: 'noa' })
  })
})

describe('photoLinks – temporary view links', () => {
  const now = Date.parse('2026-11-01T10:00:00Z')
  it('detects expired / missing links; legacy public links never expire', () => {
    expect(isLinkExpired({ url: 'x', urlExpiresAt: '2026-11-01T09:59:59Z' }, now)).toBe(true)
    expect(isLinkExpired({ url: 'x', urlExpiresAt: '2026-11-01T10:05:00Z' }, now)).toBe(false)
    expect(isLinkExpired({ url: null, urlExpiresAt: null }, now)).toBe(true)
    expect(isLinkExpired({ url: 'x', urlExpiresAt: null }, now)).toBe(false)
  })

  it('refreshes a minute before the first link expires, never faster than 15 seconds', () => {
    expect(nextRefreshDelay([{ urlExpiresAt: '2026-11-01T10:10:00Z' }, { urlExpiresAt: '2026-11-01T10:08:00Z' }], now)).toBe(8 * 60_000 - REFRESH_MARGIN_MS)
    expect(nextRefreshDelay([{ urlExpiresAt: '2026-11-01T10:00:30Z' }], now)).toBe(MIN_REFRESH_MS)
    expect(nextRefreshDelay([{ urlExpiresAt: null }], now)).toBe(false)
    expect(nextRefreshDelay(undefined, now)).toBe(false)
  })
})

describe('validation – same rules as the server schemas', () => {
  it('password, phone, email, https url, money', () => {
    expect(validatePassword('short1')).not.toBe(true)
    expect(validatePassword('longpassword')).toBe('הסיסמה חייבת להכיל לפחות ספרה אחת')
    expect(validatePassword('Password1')).toBe(true)
    expect(validatePhone('050-1234567')).toBe(true)
    expect(validatePhone('12')).not.toBe(true)
    expect(validateEmail('noa@test.com')).toBe(true)
    expect(validateEmail('noa@')).not.toBe(true)
    expect(validateHttpsUrl('http://x.com/a.jpg')).not.toBe(true)
    expect(validateHttpsUrl('https://x.com/a.jpg')).toBe(true)
    expect(validateMoney(10.555)).not.toBe(true)
    expect(validateMoney(-1)).not.toBe(true)
    expect(validateMoney(99.99)).toBe(true)
  })
})

describe('format and redirects', () => {
  it('formats dates without timezone shifts and prices in ILS', () => {
    expect(formatDate('2026-12-05')).toBe('05/12/2026')
    expect(formatPrice(1200)).toContain('1,200')
  })

  it('after login: admin → /admin; client (verified or not) → /my-events or the original page – never a verify page', () => {
    expect(afterLoginPath({ ...clientUser, emailVerified: false })).toBe('/my-events')
    expect(afterLoginPath({ ...clientUser, role: 'Admin' })).toBe('/admin')
    expect(afterLoginPath(clientUser)).toBe('/my-events')
    expect(afterLoginPath(clientUser, '/my-events/10')).toBe('/my-events/10')
    expect(homeFor(clientUser)).toBe('/my-events')
  })
})

describe('contact details', () => {
  it('uses VITE_CONTACT_* when set, and the studio public details when empty or missing', () => {
    expect(withDefault(' 050-1112222 ', DEFAULT_CONTACT.phone)).toBe('050-1112222')
    expect(withDefault('', DEFAULT_CONTACT.phone)).toBe('0534134130')
    expect(withDefault(undefined, DEFAULT_CONTACT.email)).toBe('tc104130@gmail.com')
  })

  it('formats an Israeli mobile number for display, other formats stay as they are', () => {
    expect(formatPhone('0534134130')).toBe('053-4134130')
    expect(formatPhone('03-5551234')).toBe('03-5551234')
    expect(formatPhone('+972534134130')).toBe('+972534134130')
  })
})

describe('env – Google Client ID', () => {
  it('accepts a Web Client ID, treats empty or malformed values as "not configured"', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    expect(parseGoogleClientId(' 1234-abc_DEF.apps.googleusercontent.com ')).toBe('1234-abc_DEF.apps.googleusercontent.com')
    expect(parseGoogleClientId('')).toBeNull()
    expect(parseGoogleClientId(undefined)).toBeNull()
    expect(warn).not.toHaveBeenCalled()
    expect(parseGoogleClientId('1234-abc.apps.googleusercontent.comAfter implementing, I will run')).toBeNull()
    expect(parseGoogleClientId('not-a-client-id')).toBeNull()
    expect(warn).toHaveBeenCalledTimes(2)
    warn.mockRestore()
  })
})
