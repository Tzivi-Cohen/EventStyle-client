export const PHONE_PATTERN = /^\+?[0-9][0-9\s-]{6,18}$/
export const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
export const CODE_PATTERN = /^\d{6}$/
export const ADDRESS_MAX_LENGTH = 200

export function validatePassword(value: string): true | string {
  if (value.length < 8) return 'הסיסמה חייבת להכיל לפחות 8 תווים'
  if (value.length > 72) return 'הסיסמה יכולה להכיל עד 72 תווים'
  if (!/[A-Za-z]/.test(value)) return 'הסיסמה חייבת להכיל לפחות אות אחת באנגלית'
  if (!/[0-9]/.test(value)) return 'הסיסמה חייבת להכיל לפחות ספרה אחת'
  return true
}

export function validateFullName(value: string): true | string {
  const trimmed = value.trim()
  if (trimmed.length < 2) return 'השם חייב להכיל לפחות 2 תווים'
  if (trimmed.length > 100) return 'השם יכול להכיל עד 100 תווים'
  return true
}

export function validatePhone(value: string): true | string {
  return PHONE_PATTERN.test(value.trim()) || 'מספר טלפון לא תקין (7–19 ספרות, אפשר + בהתחלה)'
}

export function validateEmail(value: string): true | string {
  const trimmed = value.trim()
  if (!trimmed) return 'יש להזין כתובת אימייל'
  return (EMAIL_PATTERN.test(trimmed) && trimmed.length <= 254) || 'כתובת אימייל לא תקינה'
}

export function validateHttpsUrl(value: string): true | string {
  try {
    const url = new URL(value.trim())
    return url.protocol === 'https:' || 'יש להזין כתובת שמתחילה ב-https://'
  } catch {
    return 'יש להזין כתובת https תקינה'
  }
}

export function validateMoney(value: number): true | string {
  if (!Number.isFinite(value)) return 'יש להזין מספר'
  if (value < 0) return 'הסכום לא יכול להיות שלילי'
  if (Math.abs(value * 100 - Math.round(value * 100)) > 1e-6) return 'עד 2 ספרות אחרי הנקודה'
  return true
}
