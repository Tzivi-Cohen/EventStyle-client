import { expect, test } from '@playwright/test'
import { installMockApi } from './mockApi'

test('guest: home → price list per event type → gallery with enlarged view', async ({ page }) => {
  await installMockApi(page)
  await page.goto('/')
  await expect(page.getByRole('heading', { level: 1 })).toContainText('עיצוב שמספר את')
  await page.getByRole('navigation', { name: 'ניווט ראשי' }).getByRole('link', { name: 'חבילות ומחירים' }).click()
  await page.getByRole('tab', { name: 'יום הולדת' }).click()
  await expect(page.getByRole('heading', { name: 'חבילות ליום הולדת' })).toBeVisible()
  await expect(page).toHaveURL(/\/packages\?type=Birthday$/)

  await page.getByRole('navigation', { name: 'ניווט ראשי' }).getByRole('link', { name: 'גלריה' }).click()
  await page.getByRole('link', { name: /יום הולדת/ }).first().click()
  await page.getByRole('button', { name: 'הגדלת התמונה: יום הולדת פסטל' }).click()
  await expect(page.getByRole('dialog', { name: 'יום הולדת פסטל' })).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(page.getByRole('dialog')).toHaveCount(0)
})

test('client: login → my event → upload a private photo → give consent → logout', async ({ page }) => {
  const api = await installMockApi(page)
  await page.goto('/my-events/10')
  await expect(page).toHaveURL(/\/login$/)

  await page.getByLabel('אימייל').fill('noa@test.com')
  await page.getByLabel('סיסמה').fill('Password1')
  await page.getByRole('button', { name: 'התחברות' }).click()
  await expect(page).toHaveURL(/\/my-events\/10$/)
  await expect(page.getByRole('heading', { name: 'יום הולדת 30 לנועה' })).toBeVisible()

  await page.getByLabel('בחירת תמונות').setInputFiles({ name: 'table.png', mimeType: 'image/png', buffer: Buffer.alloc(800) })
  await page.getByRole('button', { name: 'העלאת 1 תמונות' }).click()
  await expect(page.getByText('התמונה הועלתה בהצלחה')).toBeVisible()
  await expect(page.locator('.photo-grid > li')).toHaveCount(2)

  const first = page.locator('.photo-grid > li').first()
  await first.getByRole('checkbox', { name: 'מסכימה לפרסום בגלריה' }).check()
  await expect(page.getByText('ההסכמה לפרסום נשמרה. הפרסום עצמו נעשה בידי הסטודיו')).toBeVisible()
  expect(api.requests.find((r) => r.method === 'PUT')?.body).toEqual({ publishConsent: true })

  await page.reload()
  await expect(page.getByRole('heading', { name: 'יום הולדת 30 לנועה' })).toBeVisible()

  await page.getByRole('button', { name: 'התנתקות' }).click()
  await expect(page).toHaveURL(/\/$/)
  await page.goto('/my-events')
  await expect(page).toHaveURL(/\/login$/)
})

test('request: client sends a design request → edits it → admin approves → client sees the event', async ({ page }) => {
  const api = await installMockApi(page)
  const login = async (email: string) => {
    await page.goto('/login')
    await page.getByLabel('אימייל').fill(email)
    await page.getByLabel('סיסמה').fill('Password1')
    await page.getByRole('button', { name: 'התחברות' }).click()
  }

  await login('noa@test.com')
  await page.getByRole('link', { name: '+ בקשה חדשה לעיצוב' }).click()
  await page.getByLabel('שם האירוע').fill('בת מצווה לשירה')
  await page.getByLabel('סוג האירוע').selectOption('BatMitzvah')
  await page.getByLabel('תאריך').fill('2027-03-18')
  await page.getByLabel('מיקום').fill('רעננה')
  await page.getByLabel('מספר אורחים').fill('120')
  await page.getByLabel('תקציב משוער (₪)').fill('9000')
  await page.getByLabel('חבילה').selectOption('1')
  await page.getByLabel('צבע / סגנון מרכזי').fill('לבנדר')
  await page.getByLabel('קונספט העיצוב').fill('קונספט פרובאנס עם לבנדר ונרות')
  await page.getByRole('button', { name: 'שליחת הבקשה' }).click()

  await expect(page.getByRole('heading', { name: 'הבקשה ממתינה לאישור הסטודיו' })).toBeVisible()
  expect(api.requests.filter((r) => r.method === 'POST' && r.path === '/events/requests')).toHaveLength(1)

  await page.getByRole('link', { name: 'עריכת בקשה' }).click()
  await page.getByLabel('מספר אורחים').fill('140')
  await page.getByRole('button', { name: 'שמירת שינויים' }).click()
  await expect(page.getByText('הבקשה עודכנה')).toBeVisible()
  expect(api.requests.find((r) => r.method === 'PATCH')?.body).toEqual({ guestCount: 140 })
  await page.getByRole('button', { name: 'התנתקות' }).click()

  await login('admin@test.com')
  await page.goto('/admin/events')
  await page.getByRole('button', { name: /בקשות ממתינות/ }).click()
  await page.getByRole('link', { name: /לבדיקה/ }).click()
  await page.getByRole('button', { name: 'אישור הבקשה' }).click()
  await expect(page.getByText('הבקשה אושרה – האירוע בסטטוס "חדש"')).toBeVisible()
  await page.getByRole('button', { name: 'התנתקות' }).click()

  await login('noa@test.com')
  await page.goto('/my-events')
  const card = page.locator('.event-card', { hasText: 'בת מצווה לשירה' })
  await expect(card.getByText('חדש')).toBeVisible()
  await expect(card.getByRole('link', { name: /עריכת בקשה/ })).toHaveCount(0)
})

test('admin: login → photos waiting for publication → publish to the gallery', async ({ page }) => {
  const api = await installMockApi(page)
  await page.goto('/login')
  await page.getByLabel('אימייל').fill('admin@test.com')
  await page.getByLabel('סיסמה').fill('Password1')
  await page.getByRole('button', { name: 'התחברות' }).click()
  await expect(page).toHaveURL(/\/admin$/)

  await page.getByRole('navigation', { name: 'ניווט ממשק הניהול' }).getByRole('link', { name: 'תמונות לפרסום' }).click()
  await expect(page.getByText('אין תמונות שממתינות לפרסום')).toBeVisible()

  api.photos[0].publishConsent = true
  await page.reload()
  await page.getByRole('button', { name: 'פרסום בגלריה' }).click()
  const dialog = page.getByRole('dialog', { name: 'פרסום בגלריה' })
  await dialog.getByLabel('כותרת').fill('שולחן מתוקים ורוד')
  await dialog.getByRole('button', { name: 'פרסום' }).click()
  await expect(page.getByText('התמונה פורסמה בגלריה')).toBeVisible()
  await expect(page.getByText('אין תמונות שממתינות לפרסום')).toBeVisible()
  expect(api.requests.find((r) => r.path === '/events/10/photos/101/publish')?.body).toMatchObject({ title: 'שולחן מתוקים ורוד' })
})

test('wrong password and server down show clear messages (no white screen)', async ({ page }) => {
  await installMockApi(page)
  await page.goto('/login')
  await page.getByLabel('אימייל').fill('noa@test.com')
  await page.getByLabel('סיסמה').fill('Wrong1234')
  await page.getByRole('button', { name: 'התחברות' }).click()
  await expect(page.getByText('אימייל או סיסמה שגויים')).toBeVisible()

  await page.route('http://api.e2e.test/api/packages*', (route) => route.abort())
  await page.goto('/packages')
  await expect(page.getByText('אין חיבור לשרת. בדקו את החיבור ונסו שוב')).toBeVisible()
})

test('keyboard: skip link and visible focus', async ({ page }) => {
  await installMockApi(page)
  await page.goto('/')
  await page.keyboard.press('Tab')
  const skip = page.getByRole('link', { name: 'דילוג לתוכן הראשי' })
  await expect(skip).toBeFocused()
  await expect(skip).toBeInViewport()
})
