import type { ReactNode } from 'react'
import { getErrorMessage } from '../../utils/errorMessages'
import { LoadingSpinner } from '../LoadingSpinner'
import { EmptyState } from './EmptyState'

type QueryLike<T> = {
  data: T | undefined
  isPending: boolean
  isError: boolean
  error: unknown
  refetch: () => unknown
}

export function QueryState<T>({
  query,
  isEmpty,
  loadingLabel = 'טוען...',
  empty,
  children,
}: {
  query: QueryLike<T>
  isEmpty?: (data: T) => boolean
  loadingLabel?: string
  empty?: ReactNode
  children: (data: T) => ReactNode
}) {
  if (query.isPending) return <LoadingSpinner label={loadingLabel} />
  if (query.isError) {
    return (
      <div className="alert alert-error" role="alert">
        <p>{getErrorMessage(query.error)}</p>
        <button type="button" className="btn btn-outline btn-sm" onClick={() => query.refetch()}>
          נסו שוב
        </button>
      </div>
    )
  }
  const data = query.data as T
  if (isEmpty?.(data)) return <>{empty ?? <EmptyState title="עדיין אין מידע להצגה" />}</>
  return <>{children(data)}</>
}
