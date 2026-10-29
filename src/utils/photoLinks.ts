import type { EventPhoto } from '../types/photo'

/** מרווח ביטחון: מרעננים את הקישורים דקה לפני שהם פגים */
export const REFRESH_MARGIN_MS = 60_000
/** לא מרעננים בתדירות גבוהה מזו, גם אם קישור קרוב מאוד לתפוגה */
export const MIN_REFRESH_MS = 15_000

/** האם הקישור של התמונה כבר פג (או שאין קישור כלל) */
export function isLinkExpired(photo: Pick<EventPhoto, 'url' | 'urlExpiresAt'>, now = Date.now()): boolean {
  if (!photo.url) return true
  if (!photo.urlExpiresAt) return false // תמונה ציבורית ישנה – קישור קבוע
  return new Date(photo.urlExpiresAt).getTime() <= now
}

/**
 * כמה זמן לחכות עד שצריך לבקש קישורים חדשים לרשימה (לפי הקישור שפג ראשון).
 * false = אין קישורים זמניים (רק תמונות ציבוריות ישנות) – אין צורך ברענון.
 */
export function nextRefreshDelay(photos: Pick<EventPhoto, 'urlExpiresAt'>[] | undefined, now = Date.now()): number | false {
  const expiries = (photos ?? [])
    .map((p) => (p.urlExpiresAt ? new Date(p.urlExpiresAt).getTime() : NaN))
    .filter((t) => Number.isFinite(t))
  if (expiries.length === 0) return false
  return Math.max(Math.min(...expiries) - now - REFRESH_MARGIN_MS, MIN_REFRESH_MS)
}
