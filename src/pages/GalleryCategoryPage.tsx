import { Link, useParams, useSearchParams } from 'react-router-dom'
import { GalleryGrid } from '../components/GalleryGrid'
import { EmptyState } from '../components/ui/EmptyState'
import { PageHeader } from '../components/ui/PageHeader'
import { Pagination } from '../components/ui/Pagination'
import { QueryState } from '../components/ui/QueryState'
import { useGallery } from '../hooks/usePublicData'
import { EVENT_TYPES, type EventType } from '../types/common'
import { EVENT_TYPE_LABELS } from '../utils/format'
import { NotFoundPage } from './NotFoundPage'

const PAGE_SIZE = 12

export function GalleryCategoryPage() {
  const { category } = useParams()
  const [params, setParams] = useSearchParams()
  const page = Math.max(1, Number(params.get('page')) || 1)
  const valid = (EVENT_TYPES as readonly string[]).includes(category ?? '')
  const query = useGallery({ category: category as EventType, page, limit: PAGE_SIZE })

  if (!valid) return <NotFoundPage />
  const label = EVENT_TYPE_LABELS[category as EventType]

  return (
    <main className="page container">
      <PageHeader
        eyebrow="גלריה"
        title={label}
        actions={
          <Link to={`/packages?type=${category}`} className="btn btn-outline">
            חבילות ל{label}
          </Link>
        }
      />
      <p>
        <Link to="/gallery">→ כל הגלריות</Link>
      </p>
      <QueryState
        query={query}
        loadingLabel="טוען תמונות..."
        isEmpty={(result) => result.data.length === 0}
        empty={<EmptyState title="עדיין אין תמונות בגלריה הזו" description="בקרוב יתווספו עבודות חדשות." />}
      >
        {(result) => (
          <>
            <GalleryGrid items={result.data} />
            <Pagination meta={result.pagination} onPageChange={(next) => setParams({ page: String(next) })} />
          </>
        )}
      </QueryState>
    </main>
  )
}
