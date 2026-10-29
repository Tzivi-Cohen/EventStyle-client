import { useEffect, useId, useRef, type ReactNode } from 'react'

/**
 * חלון מודאלי נגיש: role=dialog, כותרת מקושרת, Escape לסגירה, מיקוד בפתיחה והחזרת המיקוד בסגירה.
 * לחיצה על הרקע סוגרת (אלא אם busy – למשל בזמן שליחה).
 */
export function Modal({
  title,
  onClose,
  children,
  busy = false,
  size = 'md',
}: {
  title: string
  onClose: () => void
  children: ReactNode
  busy?: boolean
  size?: 'md' | 'lg' | 'xl'
}) {
  const titleId = useId()
  const panelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null
    const first = panelRef.current?.querySelector<HTMLElement>('input, select, textarea, button:not(.modal-close)')
    ;(first ?? panelRef.current)?.focus()
    document.body.classList.add('modal-open')
    return () => {
      document.body.classList.remove('modal-open')
      previous?.focus?.()
    }
  }, [])

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape' && !busy) onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose, busy])

  return (
    <div className="modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && !busy && onClose()}>
      <div
        className={`modal modal-${size}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        ref={panelRef}
        tabIndex={-1}
      >
        <header className="modal-header">
          <h2 id={titleId}>{title}</h2>
          <button type="button" className="modal-close" onClick={onClose} disabled={busy} aria-label="סגירה">
            ×
          </button>
        </header>
        <div className="modal-body">{children}</div>
      </div>
    </div>
  )
}
