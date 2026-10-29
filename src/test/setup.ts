import '@testing-library/jest-dom/vitest'
import { cleanup, configure } from '@testing-library/react'
import { afterAll, afterEach, beforeAll, beforeEach } from 'vitest'
import { resetMockDb, server } from './server'

// ממשק הניהול נטען ב-Lazy Loading: ברינדור הראשון בקובץ הטעינה עלולה לעבור את ברירת המחדל (1 שנייה)
// כשהמחשב עמוס. 5 שניות – עדיין הרבה מתחת ל-testTimeout (15 שניות)
configure({ asyncUtilTimeout: 5_000 })

// כל בקשה שאין לה Handler נכשלת – כך לא נשלחת בטעות בקשה לשרת אמיתי
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))
beforeEach(() => {
  resetMockDb()
  localStorage.clear()
})
afterEach(() => {
  cleanup()
  server.resetHandlers()
})
afterAll(() => server.close())

// jsdom לא מממש scrollTo / matchMedia – נדרשים לחלק מהרכיבים
window.scrollTo = () => {}
