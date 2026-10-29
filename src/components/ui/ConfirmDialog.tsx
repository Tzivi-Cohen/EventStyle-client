import type { ReactNode } from 'react'
import { Modal } from './Modal'

export function ConfirmDialog({
  title,
  children,
  confirmLabel = 'אישור',
  danger = false,
  busy = false,
  onConfirm,
  onCancel,
}: {
  title: string
  children: ReactNode
  confirmLabel?: string
  danger?: boolean
  busy?: boolean
  onConfirm: () => void
  onCancel: () => void
}) {
  return (
    <Modal title={title} onClose={onCancel} busy={busy}>
      <div className="confirm-text">{children}</div>
      <div className="form-actions">
        <button type="button" className={`btn ${danger ? 'btn-danger' : ''}`} onClick={onConfirm} disabled={busy}>
          {busy ? 'מבצע...' : confirmLabel}
        </button>
        <button type="button" className="btn btn-ghost" onClick={onCancel} disabled={busy}>
          ביטול
        </button>
      </div>
    </Modal>
  )
}
