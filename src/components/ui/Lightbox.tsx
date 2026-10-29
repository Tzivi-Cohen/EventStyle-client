import { useEffect } from 'react'
import { Modal } from './Modal'

export type LightboxItem = { url: string | null; title: string; subtitle?: string }

export function Lightbox({
  items,
  index,
  onIndexChange,
  onClose,
}: {
  items: LightboxItem[]
  index: number
  onIndexChange: (index: number) => void
  onClose: () => void
}) {
  const item = items[index]
  const hasPrev = index > 0
  const hasNext = index < items.length - 1

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === 'ArrowRight' && hasPrev) onIndexChange(index - 1)
      if (event.key === 'ArrowLeft' && hasNext) onIndexChange(index + 1)
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [index, hasPrev, hasNext, onIndexChange])

  if (!item) return null
  return (
    <Modal title={item.title} onClose={onClose} size="xl">
      <figure className="lightbox">
        {item.url ? <img src={item.url} alt={item.title} /> : <p className="muted">התמונה אינה זמינה כרגע</p>}
        {item.subtitle && <figcaption>{item.subtitle}</figcaption>}
      </figure>
      <div className="lightbox-nav">
        <button type="button" className="btn btn-outline btn-sm" onClick={() => onIndexChange(index - 1)} disabled={!hasPrev}>
          → הקודמת
        </button>
        <span className="muted">
          {index + 1} / {items.length}
        </span>
        <button type="button" className="btn btn-outline btn-sm" onClick={() => onIndexChange(index + 1)} disabled={!hasNext}>
          הבאה ←
        </button>
      </div>
    </Modal>
  )
}
