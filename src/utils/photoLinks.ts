import type { EventPhoto } from '../types/photo'

export const REFRESH_MARGIN_MS = 60_000
export const MIN_REFRESH_MS = 15_000

export function isLinkExpired(photo: Pick<EventPhoto, 'url' | 'urlExpiresAt'>, now = Date.now()): boolean {
  if (!photo.url) return true
  if (!photo.urlExpiresAt) return false
  return new Date(photo.urlExpiresAt).getTime() <= now
}

export function nextRefreshDelay(photos: Pick<EventPhoto, 'urlExpiresAt'>[] | undefined, now = Date.now()): number | false {
  const expiries = (photos ?? [])
    .map((p) => (p.urlExpiresAt ? new Date(p.urlExpiresAt).getTime() : NaN))
    .filter((t) => Number.isFinite(t))
  if (expiries.length === 0) return false
  return Math.max(Math.min(...expiries) - now - REFRESH_MARGIN_MS, MIN_REFRESH_MS)
}
