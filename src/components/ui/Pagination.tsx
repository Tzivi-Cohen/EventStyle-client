import type { PaginationMeta } from '../../types/common'

export function Pagination({ meta, onPageChange }: { meta: PaginationMeta; onPageChange: (page: number) => void }) {
  if (meta.totalPages <= 1) return null
  return (
    <nav className="pagination" aria-label="מעבר בין עמודים">
      <button type="button" className="btn btn-outline btn-sm" onClick={() => onPageChange(meta.page - 1)} disabled={meta.page <= 1}>
        הקודם
      </button>
      <span aria-live="polite">
        עמוד {meta.page} מתוך {meta.totalPages} <span className="muted">({meta.totalItems} פריטים)</span>
      </span>
      <button
        type="button"
        className="btn btn-outline btn-sm"
        onClick={() => onPageChange(meta.page + 1)}
        disabled={meta.page >= meta.totalPages}
      >
        הבא
      </button>
    </nav>
  )
}
