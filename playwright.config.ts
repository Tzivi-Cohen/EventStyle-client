import { defineConfig, devices } from '@playwright/test'

/**
 * בדיקות End-to-End בדפדפן אמיתי, בסביבה בטוחה:
 * - האפליקציה נבנית עם כתובת API מדומה (http://api.e2e.test/api) ומוגשת מקומית ב-vite preview.
 * - כל בקשה ל-API נענית ב-Mock (e2e/mockApi.ts). בקשות לכל כתובת חיצונית אחרת נחסמות.
 * - אין פנייה לשרת, למסד הנתונים או ל-Cloudinary האמיתיים, ושום נתון אמיתי לא משתנה.
 * - משתמשים ב-Chrome שמותקן במחשב (channel: chrome) – אין צורך בהורדת דפדפן.
 */
export default defineConfig({
  testDir: './e2e',
  timeout: 30_000,
  fullyParallel: false,
  retries: 0,
  reporter: [['list']],
  use: {
    baseURL: 'http://localhost:4173',
    channel: 'chrome',
    locale: 'he-IL',
    trace: 'off',
  },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'], channel: 'chrome' }, testIgnore: /mobile.spec.ts/ },
    { name: 'mobile', use: { ...devices['Pixel 7'], channel: 'chrome' }, testMatch: /mobile\.spec\.ts/ },
  ],
  webServer: {
    command: 'npm run build:e2e && npx vite preview --outDir dist-e2e --port 4173 --strictPort',
    url: 'http://localhost:4173',
    reuseExistingServer: false,
    timeout: 120_000,
    // כתובת API מדומה – נכנסת לבנייה של סביבת e2e בלבד, ונענית ב-Mock בתוך הבדיקות
    env: { VITE_API_URL: 'http://api.e2e.test/api', VITE_GOOGLE_CLIENT_ID: '' },
  },
})
