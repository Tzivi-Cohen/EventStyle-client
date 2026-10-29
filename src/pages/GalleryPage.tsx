import { Link } from 'react-router-dom'
import { EmptyState } from '../components/ui/EmptyState'
import { PageHeader } from '../components/ui/PageHeader'
import { QueryState } from '../components/ui/QueryState'
import { SafeImage } from '../components/ui/SafeImage'
import { useGallerySummary } from '../hooks/usePublicData'
import { EVENT_TYPE_LABELS } from '../utils/format'

export function GalleryPage() {
  const query = useGallerySummary()
  return (
    <main className="page container">
      <PageHeader eyebrow="גלריה" title="עבודות הסטודיו" description="בחרו סוג אירוע כדי לראות עיצובים שיצרנו." />
      <QueryState
        query={query}
        loadingLabel="טוען את הגלריות..."
        isEmpty={(rows) => rows.every((row) => row.count === 0)}
        empty={<EmptyState title="הגלריה מתעדכנת" description="עדיין לא פורסמו תמונות. בקרוב יתווספו עבודות חדשות." />}
      >
        {(rows) => (
          <div className="card-grid">
            {rows.map((row) => (
              <Link key={row.category} to={`/gallery/${row.category}`} className="card">
                <SafeImage src={row.cover?.url ?? null} alt={EVENT_TYPE_LABELS[row.category]} className="card-image" />
                <div className="card-body">
                  <h2 className="mb-[0.2rem]">{EVENT_TYPE_LABELS[row.category]}</h2>
                  <p className="muted">{row.count === 0 ? 'עדיין אין תמונות' : `${row.count} תמונות`}</p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </QueryState>
    </main>
  )
}
