import { useState } from 'react'
import { Link } from 'react-router-dom'
import { PublishDialog } from '../../components/photos/PublishDialog'
import { Badge } from '../../components/ui/Badges'
import { EmptyState } from '../../components/ui/EmptyState'
import { PageHeader } from '../../components/ui/PageHeader'
import { Pagination } from '../../components/ui/Pagination'
import { QueryState } from '../../components/ui/QueryState'
import { SafeImage } from '../../components/ui/SafeImage'
import { useAdminPhotos } from '../../hooks/usePhotos'
import type { AdminEventPhotoListItem, AdminPhotoFilters } from '../../types/photo'
import { tabClass, tabListClass } from '../../styles/tabClasses'
import { EVENT_TYPE_LABELS, formatDateTime } from '../../utils/format'

const VIEWS: { key: string; label: string; filters: AdminPhotoFilters }[] = [
  { key: 'pending', label: 'ממתינות לפרסום', filters: { publishConsent: true, inGallery: false } },
  { key: 'gallery', label: 'בגלריה', filters: { inGallery: true } },
  { key: 'all', label: 'כל התמונות', filters: {} },
]

/**
 * תמונות אירועים למנהלת (GET /admin/event-photos). ברירת המחדל: תמונות שקיבלו הסכמה וממתינות לפרסום.
 * המנהלת מפרסמת – אבל לא יכולה לתת הסכמה בשם הלקוחה (השרת חוסם).
 */
export function AdminPhotosPage() {
  const [view, setView] = useState(VIEWS[0])
  const [page, setPage] = useState(1)
  const query = useAdminPhotos({ ...view.filters, page, limit: 12 })
  const [publishing, setPublishing] = useState<AdminEventPhotoListItem | null>(null)

  return (
    <>
      <PageHeader
        eyebrow="ניהול"
        title="תמונות לפרסום"
        description="תמונות של לקוחות שנתנו הסכמה לפרסום. הפרסום יוצר עותק ציבורי נפרד בגלריה."
      />
      <div className={tabListClass} role="tablist" aria-label="סינון תמונות">
        {VIEWS.map((v) => (
          <button
            key={v.key}
            type="button"
            role="tab"
            aria-selected={view.key === v.key}
            className={tabClass(view.key === v.key)}
            onClick={() => {
              setView(v)
              setPage(1)
            }}
          >
            {v.label}
          </button>
        ))}
      </div>

      <QueryState
        query={query}
        loadingLabel="טוען תמונות..."
        isEmpty={(result) => result.data.length === 0}
        empty={<EmptyState title={view.key === 'pending' ? 'אין תמונות שממתינות לפרסום' : 'אין תמונות להצגה'} />}
      >
        {(result) => (
          <>
            <ul className="photo-grid">
              {result.data.map((photo) => (
                <li key={photo.id} className="photo-card card">
                  <div className="photo-thumb">
                    <SafeImage src={photo.url} alt={`תמונה מהאירוע ${photo.event.eventName}`} />
                  </div>
                  <div className="photo-meta">
                    <p>
                      <Link to={`/admin/events/${photo.event.id}`}>{photo.event.eventName}</Link>
                    </p>
                    <p className="muted small">
                      {photo.event.clientName} · {EVENT_TYPE_LABELS[photo.event.eventType]} · {formatDateTime(photo.createdAt)}
                    </p>
                    <div className="badges">
                      {photo.publishConsent ? <Badge tone="gold">יש הסכמה</Badge> : <Badge>אין הסכמה</Badge>}
                      {photo.publishedInGallery && <Badge tone="success">בגלריה</Badge>}
                      {photo.galleryItemId !== null && !photo.publishedInGallery && <Badge tone="warning">עותק מוסתר</Badge>}
                    </div>
                    {photo.publishConsent && photo.galleryItemId === null && (
                      <button type="button" className="btn btn-sm" onClick={() => setPublishing(photo)}>
                        פרסום בגלריה
                      </button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
            <Pagination meta={result.pagination} onPageChange={setPage} />
          </>
        )}
      </QueryState>

      {publishing && (
        <PublishDialog
          eventId={publishing.event.id}
          photoId={publishing.id}
          defaultCategory={publishing.event.eventType}
          onClose={() => setPublishing(null)}
        />
      )}
    </>
  )
}
