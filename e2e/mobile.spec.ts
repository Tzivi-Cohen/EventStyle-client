import { expect, test } from '@playwright/test'
import { installMockApi } from './mockApi'

/** התאמה לנייד: תפריט נפתח, אין גלילה אופקית, טבלאות וכרטיסים מתאימים לרוחב */

test('mobile: menu toggle, navigation and no horizontal scroll', async ({ page }) => {
  await installMockApi(page)
  await page.goto('/')
  const toggle = page.getByRole('button', { name: 'פתיחת התפריט' })
  await expect(toggle).toBeVisible()
  await expect(page.getByRole('navigation', { name: 'ניווט ראשי' })).toBeHidden()
  await toggle.click()
  await page.getByRole('navigation', { name: 'ניווט ראשי' }).getByRole('link', { name: 'חבילות ומחירים' }).click()
  await expect(page).toHaveURL(/\/packages$/)
  await expect(page.getByRole('navigation', { name: 'ניווט ראשי' })).toBeHidden() // נסגר אחרי מעבר עמוד

  for (const path of ['/', '/packages', '/gallery', '/login', '/register', '/contact']) {
    await page.goto(path)
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
    expect(overflow, `horizontal scroll on ${path}`).toBeLessThanOrEqual(1)
  }
})

test('mobile: client area – event cards, filters and the request form fit the screen', async ({ page }) => {
  await installMockApi(page)
  await page.goto('/login')
  await page.getByLabel('אימייל').fill('noa@test.com')
  await page.getByLabel('סיסמה').fill('Password1')
  await page.getByRole('button', { name: 'התחברות' }).click()
  await expect(page.getByRole('heading', { name: 'יום הולדת 30 לנועה' })).toBeVisible()

  for (const path of ['/my-events', '/my-events/new', '/my-events/10', '/account']) {
    await page.goto(path)
    await expect(page.locator('main h1')).toBeVisible()
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
    expect(overflow, `horizontal scroll on ${path}`).toBeLessThanOrEqual(1)
  }
})
