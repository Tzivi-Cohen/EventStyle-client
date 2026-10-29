/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL: string
  /** Client ID (Web application) של Google – אינו סוד. ה-Client Secret לעולם לא נמצא בצד הלקוח */
  readonly VITE_GOOGLE_CLIENT_ID?: string
  /** פרטי יצירת קשר להזמנות (רשות). אם חסרים – פרטי הסטודיו הציבוריים (DEFAULT_CONTACT) */
  readonly VITE_CONTACT_EMAIL?: string
  readonly VITE_CONTACT_PHONE?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
