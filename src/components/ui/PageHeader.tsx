import type { ReactNode } from 'react'

export function PageHeader({ eyebrow, title, description, actions }: { eyebrow?: string; title: string; description?: ReactNode; actions?: ReactNode }) {
  return (
    <header className="mb-7 flex flex-wrap items-end justify-between gap-6">
      <div>
        {eyebrow && <p className="eyebrow">{eyebrow}</p>}
        <h1 className="m-0">{title}</h1>
        {description && <p className="mx-0 mt-2 mb-0 max-w-[62ch] text-ink-soft">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-[0.6rem]">{actions}</div>}
    </header>
  )
}
