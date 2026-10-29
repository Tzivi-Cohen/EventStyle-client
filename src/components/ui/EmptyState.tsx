import type { ReactNode } from 'react'

export function EmptyState({ title, description, action }: { title: string; description?: ReactNode; action?: ReactNode }) {
  return (
    <div className="my-4 rounded-card border border-dashed border-line-strong bg-surface px-6 py-12 text-center">
      <span className="mb-2 block text-[2rem] text-gold" aria-hidden="true">
        ✦
      </span>
      <h3>{title}</h3>
      {description && <p className="muted">{description}</p>}
      {action}
    </div>
  )
}
