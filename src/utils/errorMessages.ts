import { ApiError } from '../api/apiClient'

const ERROR_MESSAGES_HE: Record<string, string> = {
  VALIDATION_ERROR: 'יש שדות לא תקינים',
  UNAUTHORIZED: 'פג תוקף ההתחברות. יש להתחבר מחדש',
  FORBIDDEN: 'אין לך הרשאה לפעולה הזו',
  NOT_FOUND: 'הפריט לא נמצא',
  CONFLICT: 'לא ניתן להשלים את הפעולה בגלל חשבון קיים',
  TOO_MANY_REQUESTS: 'יותר מדי ניסיונות התחברות. נסו שוב בעוד כמה דקות',
  GOOGLE_AUTH_FAILED: 'ההתחברות עם Google נכשלה. נסו שוב',
  GOOGLE_UNAVAILABLE: 'לא ניתן לאמת את ההתחברות מול Google כרגע. נסו שוב בעוד רגע',
  GOOGLE_AUTH_NOT_CONFIGURED: 'התחברות עם Google אינה זמינה כרגע בשרת',
  INTERNAL_ERROR: 'אירעה שגיאה בשרת. נסו שוב',
  NETWORK_ERROR: 'אין חיבור לשרת. בדקו שהשרת פועל ונסו שוב',
}

// ב-409 של POST /auth/google השרת מבחין בין המקרים רק לפי message (כולם CONFLICT)
const GOOGLE_CONFLICT_MESSAGES_HE: Record<string, string> = {
  'This account must sign in with email and password':
    'חשבון מנהלת אינו יכול להתחבר עם Google.',
  'This email is already linked to a different Google account':
    'כתובת האימייל הזו כבר מקושרת לחשבון Google אחר.',
  'An account with this email already exists. Sign in with your email and password':
    'כבר קיים חשבון עם כתובת האימייל הזו, ולא ניתן לקשר אותו אוטומטית לחשבון Google.',
  'An unverified account with this email already exists. Verify the email with the code first, then sign in with Google':
    'כבר קיים חשבון עם כתובת האימייל הזו שעדיין לא אומת, ולכן לא ניתן להתחבר אליו עם Google.',
}

export function getErrorMessage(error: unknown): string {
  if (!(error instanceof ApiError)) return ERROR_MESSAGES_HE.INTERNAL_ERROR
  if (error.code === 'CONFLICT') {
    return GOOGLE_CONFLICT_MESSAGES_HE[error.message] ?? ERROR_MESSAGES_HE.CONFLICT
  }
  if (error.code === 'TOO_MANY_REQUESTS') {
    const wait = (error.details as { retryAfterSeconds?: number } | undefined)?.retryAfterSeconds
    if (wait) return `יותר מדי ניסיונות. נסו שוב בעוד ${wait} שניות`
  }
  return ERROR_MESSAGES_HE[error.code] ?? ERROR_MESSAGES_HE.INTERNAL_ERROR
}
