import { OPERATIONAL_EVENT_STATUSES, type EventStatus } from '../../types/common'
import { EVENT_STATUS_LABELS } from '../../utils/format'

const badgeBase = 'inline-flex items-center rounded-[999px] border px-[0.65rem] py-[0.1rem] text-[0.78rem] font-semibold whitespace-nowrap'

const goldColors = 'border-[#e7d3a6] bg-gold-tint text-gold-deep'
const successColors = 'border-[#c5e3cf] bg-success-tint text-success'

const toneColors = {
  neutral: 'border-line-strong bg-ivory text-ink',
  gold: goldColors,
  success: successColors,
  warning: 'border-[#eedcae] bg-warning-tint text-warning',
  muted: 'border-line-strong bg-ivory text-ink-soft',
}

const statusColors: Record<EventStatus, string> = {
  New: 'border-[#cfdcee] bg-info-tint text-[#24426b]',
  Planning: goldColors,
  Preparing: goldColors,
  Ready: successColors,
  Completed: successColors,
  Pending: 'border-[#dcd0f0] bg-[#f1ecfa] text-[#4f3a7a]',
  Rejected: 'border-[#f0c9c9] bg-danger-tint text-danger',
}

export function StatusBadge({ status, className = '' }: { status: EventStatus; className?: string }) {
  return <span className={`${badgeBase} ${statusColors[status]} ${className}`}>{EVENT_STATUS_LABELS[status]}</span>
}

export function Badge({ children, tone = 'neutral' }: { children: string; tone?: keyof typeof toneColors }) {
  return <span className={`${badgeBase} ${toneColors[tone]}`}>{children}</span>
}

export function StatusProgress({ status }: { status: EventStatus }) {
  const current = (OPERATIONAL_EVENT_STATUSES as readonly EventStatus[]).indexOf(status)
  return (
    <ol className="status-progress" aria-label={`סטטוס ההכנות: ${EVENT_STATUS_LABELS[status]}`}>
      {OPERATIONAL_EVENT_STATUSES.map((step, index) => (
        <li
          key={step}
          className={index < current ? 'done' : index === current ? 'current' : ''}
          aria-current={index === current ? 'step' : undefined}
        >
          <span className="status-dot" aria-hidden="true" />
          <span>{EVENT_STATUS_LABELS[step]}</span>
        </li>
      ))}
    </ol>
  )
}
