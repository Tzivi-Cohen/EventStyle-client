/// <reference types="vitest/config" />
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.test.{ts,tsx}'],
    // סביבת Test: כתובת API מדומה – כל הבקשות נענות ב-Mock API (MSW). אין פנייה לשרת או למסד אמיתיים
    env: {
      VITE_API_URL: 'http://api.test/api',
      VITE_GOOGLE_CLIENT_ID: '',
      VITE_CONTACT_EMAIL: '',
      VITE_CONTACT_PHONE: '',
    },
    testTimeout: 15_000,
  },
})
