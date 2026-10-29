import type { User } from '../types/user'

/**
 * לאן עוברים אחרי התחברות או הרשמה (סיסמה או Google) – אין מסך אימות באמצע:
 * - אם הגיעה מדף מוגן – חוזרים אליו.
 * - אחרת: מנהלת → ממשק הניהול, לקוחה → האירועים שלי.
 */
export function homeFor(user: User): string {
  return user.role === 'Admin' ? '/admin' : '/my-events'
}

export function afterLoginPath(user: User, from?: string | null): string {
  if (from && from !== '/login' && from !== '/register') return from
  return homeFor(user)
}

/** הדף המוגן שממנו הגיעה המשתמשת (נשמר ב-state בזמן ההפניה להתחברות, ועובר בין התחברות להרשמה) */
export function fromState(state: unknown): string | null {
  return (state as { from?: string } | null)?.from ?? null
}
