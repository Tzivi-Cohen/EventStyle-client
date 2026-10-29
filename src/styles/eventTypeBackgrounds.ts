import type { EventType } from '../types/common'

/** רקע דקורטיבי לפי סוג האירוע – בכרטיסי האירועים ובכרטיסי סוגי האירועים בדף הבית */
export const eventTypeBackground: Record<EventType, string> = {
  Birthday: 'bg-[linear-gradient(135deg,#f8e1e4,#f6eedd)]',
  BatMitzvah: 'bg-[linear-gradient(135deg,#ece4f6,#f6eedd)]',
  Brit: 'bg-[linear-gradient(135deg,#e3eef6,#f3ede2)]',
  Corporate: 'bg-[linear-gradient(135deg,#dfe4ee,#f3ede2)]',
  Private: 'bg-[linear-gradient(135deg,#e5f0e8,#f6eedd)]',
}
