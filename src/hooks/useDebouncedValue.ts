import { useEffect, useState } from 'react'

/** ערך שמתעדכן רק אחרי הפסקה בהקלדה – מונע בקשת חיפוש לשרת על כל אות */
export function useDebouncedValue<T>(value: T, delayMs = 350): T {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delayMs)
    return () => clearTimeout(timer)
  }, [value, delayMs])
  return debounced
}
