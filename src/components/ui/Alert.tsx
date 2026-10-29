import type { ReactNode } from 'react'

type AlertKind = 'error' | 'success' | 'warning' | 'info'

/** הודעה בתוך העמוד. שגיאות מוקראות מיד (role=alert) */
export function Alert({ kind = 'info', children, title }: { kind?: AlertKind; children: ReactNode; title?: string }) {
  return (
    <div className={`alert alert-${kind}`} role={kind === 'error' ? 'alert' : 'status'}>
      {title && <strong className="alert-title">{title}</strong>}
      <div>{children}</div>
    </div>
  )
}
