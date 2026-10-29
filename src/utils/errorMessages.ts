import { ApiError } from '../api/apiError'

/** הודעה ידידותית בעברית לכל קוד שגיאה של השרת. פרטים פנימיים של השרת לא מוצגים למשתמשת */
const ERROR_MESSAGES_HE: Record<string, string> = {
  VALIDATION_ERROR: 'חלק מהשדות אינם תקינים. בדקו ונסו שוב',
  UNAUTHORIZED: 'פג תוקף ההתחברות. יש להתחבר מחדש',
  INVALID_CREDENTIALS: 'אימייל או סיסמה שגויים',
  FORBIDDEN: 'אין לך הרשאה לפעולה הזו',
  NOT_FOUND: 'הפריט לא נמצא',
  CONFLICT: 'לא ניתן להשלים את הפעולה במצב הנוכחי',
  TOO_MANY_REQUESTS: 'יותר מדי ניסיונות. נסו שוב בעוד כמה דקות',
  FILE_TOO_LARGE: 'הקובץ גדול מדי (עד 5MB)',
  UNSUPPORTED_FILE_TYPE: 'ניתן להעלות רק תמונות JPEG, PNG או WEBP',
  STORAGE_NOT_CONFIGURED: 'שירות התמונות אינו זמין כרגע',
  UPLOAD_FAILED: 'העלאת התמונה נכשלה. נסו שוב',
  STORAGE_DELETE_FAILED: 'המחיקה לא הושלמה בשירות התמונות. התמונה הוסתרה – נסו שוב',
  PHOTO_LIMIT_REACHED: 'אפשר להעלות עד 50 תמונות לאירוע',
  DUPLICATE_PHOTO: 'התמונה כבר הועלתה לאירוע הזה',
  PUBLISH_CONSENT_REQUIRED: 'אין הסכמה של בעלת האירוע לפרסום התמונה',
  ALREADY_PUBLISHED: 'התמונה כבר נמצאת בגלריה',
  PHOTO_IN_GALLERY: 'נוצר עותק בגלריה בזמן המחיקה. נסו שוב',
  GOOGLE_AUTH_FAILED: 'ההתחברות עם Google נכשלה. נסו שוב',
  GOOGLE_UNAVAILABLE: 'לא ניתן לאמת את ההתחברות מול Google כרגע. נסו שוב בעוד רגע',
  GOOGLE_AUTH_NOT_CONFIGURED: 'התחברות עם Google אינה זמינה כרגע',
  INTERNAL_ERROR: 'אירעה שגיאה בשרת. נסו שוב',
  NETWORK_ERROR: 'אין חיבור לשרת. בדקו את החיבור ונסו שוב',
  TIMEOUT: 'השרת לא הגיב בזמן. ייתכן שהפעולה עדיין מתבצעת – רעננו את העמוד לפני שתנסו שוב',
  CANCELLED: 'הפעולה בוטלה',
}

/** כשאין קוד מוכר – לפי סטטוס ה-HTTP */
const STATUS_MESSAGES_HE: Record<number, string> = {
  400: 'הבקשה אינה תקינה',
  401: 'יש להתחבר כדי להמשיך',
  403: 'אין לך הרשאה לפעולה הזו',
  404: 'הפריט לא נמצא',
  409: 'לא ניתן להשלים את הפעולה במצב הנוכחי',
  413: 'הקובץ גדול מדי',
  429: 'יותר מדי בקשות. נסו שוב בעוד כמה דקות',
  500: 'אירעה שגיאה בשרת. נסו שוב',
  502: 'שירות חיצוני אינו זמין כרגע. נסו שוב',
  503: 'השירות אינו זמין כרגע. נסו שוב מאוחר יותר',
}

/** ב-409 (CONFLICT) ובחלק מהשגיאות השרת מבחין בין המקרים רק לפי message */
const MESSAGE_OVERRIDES_HE: Record<string, string> = {
  'This account must sign in with email and password': 'חשבון מנהלת מתחבר רק עם אימייל וסיסמה.',
  'This email is already linked to a different Google account': 'כתובת האימייל הזו כבר מקושרת לחשבון Google אחר.',
  'An account with this email already exists. Sign in with your email and password':
    'כבר קיים חשבון עם כתובת האימייל הזו. התחברו עם אימייל וסיסמה.',
  'An account with this email already exists': 'כבר קיים חשבון עם כתובת האימייל הזו. נסו להתחבר.',
  'The account was changed by another request. Please try again': 'החשבון השתנה בבקשה אחרת. נסו שוב.',
  'A package with this name already exists for this event type': 'כבר קיימת חבילה בשם הזה לסוג האירוע הזה.',
  'The email address of this Google account is not verified': 'כתובת האימייל של חשבון Google הזה אינה מאומתת.',
  'You can delete only photos you uploaded': 'אפשר למחוק רק תמונות שהעליתם.',
  'Only the event owner can change the publish consent': 'רק בעלת האירוע יכולה לשנות את ההסכמה לפרסום.',
  'You do not have access to this event': 'אין לך גישה לאירוע הזה.',
  'You already have a request or an event with this name on this date': 'כבר קיימת בקשה או אירוע בשם הזה בתאריך הזה.',
  'You can have at most 5 pending requests': 'אפשר לשלוח עד 5 בקשות שממתינות לאישור. המתיני לתשובה על בקשה קיימת.',
  'Only a pending request can be edited': 'אפשר לערוך רק בקשה שממתינה לאישור. הבקשה כבר נבדקה.',
  'This request was already reviewed': 'הבקשה כבר נבדקה (אושרה או נדחתה).',
  'A request must be approved or rejected before it can be edited': 'יש לאשר או לדחות את הבקשה לפני עריכה.',
  'A request must be approved or rejected before its status can be managed': 'יש לאשר או לדחות את הבקשה לפני ניהול הסטטוס.',
  'Photos can be added only after the request is approved': 'אפשר להעלות תמונות רק אחרי שהבקשה אושרה.',
  'The same photo was sent more than once in this request': 'אותה תמונה נבחרה יותר מפעם אחת.',
}

export function getErrorMessage(error: unknown): string {
  if (!(error instanceof ApiError)) return ERROR_MESSAGES_HE.INTERNAL_ERROR
  const override = MESSAGE_OVERRIDES_HE[error.message]
  if (override) return override
  if (error.code === 'CONFLICT' && error.message.startsWith('Cannot change the event type')) {
    return 'לא ניתן לשנות את סוג האירוע של החבילה: יש הזמנות קיימות מסוג אחר שמשתמשות בה.'
  }
  if (error.code === 'TOO_MANY_REQUESTS') {
    const wait = (error.details as { retryAfterSeconds?: number } | undefined)?.retryAfterSeconds
    if (wait) return `יש להמתין ${wait} שניות לפני ניסיון נוסף`
  }
  if (error.code === 'INVALID_CODE') {
    const left = (error.details as { attemptsLeft?: number } | undefined)?.attemptsLeft
    if (left !== undefined) return `קוד האימות שגוי. נותרו ${left} ניסיונות`
  }
  if (error.code === 'DUPLICATE_PHOTO') {
    const files = (error.details as { duplicates?: { file: string }[] } | undefined)?.duplicates?.map((d) => d.file)
    if (files?.length) return `התמונות האלה כבר הועלו לאירוע: ${files.join(', ')}`
  }
  if (error.code === 'PHOTO_LIMIT_REACHED') {
    const d = error.details as { limit?: number; current?: number } | undefined
    if (d?.limit !== undefined && d.current !== undefined) {
      const left = Math.max(d.limit - d.current, 0)
      return left === 0
        ? `האירוע הגיע למגבלה של ${d.limit} תמונות`
        : `אפשר להעלות עד ${d.limit} תמונות לאירוע. נותר מקום ל-${left} בלבד`
    }
  }
  return ERROR_MESSAGES_HE[error.code] ?? STATUS_MESSAGES_HE[error.status] ?? ERROR_MESSAGES_HE.INTERNAL_ERROR
}
