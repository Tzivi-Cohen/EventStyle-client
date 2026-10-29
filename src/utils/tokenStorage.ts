// שמירת ה-JWT של EventStyle בלבד (לא ה-ID Token של Google).
// localStorage – כי השרת עובד עם Bearer Token בלי Cookies.
const TOKEN_KEY = 'eventstyle_token'

export const tokenStorage = {
  get(): string | null {
    try {
      return localStorage.getItem(TOKEN_KEY)
    } catch {
      return null
    }
  },
  set(token: string) {
    try {
      localStorage.setItem(TOKEN_KEY, token)
    } catch {
      // אחסון חסום (למשל חלון פרטי מוגבל) – ההתחברות תחזיק עד רענון הדף
    }
  },
  clear() {
    try {
      localStorage.removeItem(TOKEN_KEY)
    } catch {
      // אין מה למחוק
    }
  },
}
