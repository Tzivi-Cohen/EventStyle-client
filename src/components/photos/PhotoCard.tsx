import { useState } from 'react'
import { isAdminPhoto, type EventPhoto } from '../../types/photo'
import { formatDateTime } from '../../utils/format'
import { Badge } from '../ui/Badges'

export type PhotoViewerMode = 'owner' | 'admin'

export function PhotoCard({
  photo,
  consentChecked = photo.publishConsent,
  mode,
  onOpen,
  onRefreshLink,
  onToggleConsent,
  onDelete,
  onPublish,
  busy,
}: {
  photo: EventPhoto
  consentChecked?: boolean
  mode: PhotoViewerMode
  onOpen: () => void
  onRefreshLink: (photo: EventPhoto) => Promise<unknown>
  onToggleConsent?: (photo: EventPhoto) => void
  onDelete?: (photo: EventPhoto) => void
  onPublish?: (photo: EventPhoto) => void
  busy?: boolean
}) {
  const [failedUrl, setFailedUrl] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)
  const showImage = photo.url !== null && failedUrl !== photo.url

  async function refresh() {
    setRefreshing(true)
    try {
      await onRefreshLink(photo)
    } catch {
    } finally {
      setRefreshing(false)
    }
  }

  function onImageError() {
    setFailedUrl(photo.url)
    void refresh()
  }

  const admin = mode === 'admin' && isAdminPhoto(photo) ? photo : null
  const label = `תמונה מ-${formatDateTime(photo.createdAt)}`

  return (
    <li className="photo-card card">
      {showImage ? (
        <button type="button" className="photo-thumb" onClick={onOpen} aria-label={`הגדלת ${label}`}>
          <img src={photo.url!} alt={label} loading="lazy" decoding="async" onError={onImageError} />
        </button>
      ) : (
        <div className="photo-thumb image-placeholder" role="img" aria-label={`${label} – לא זמינה כרגע`}>
          <span className="image-placeholder-text">{refreshing ? 'טוען קישור חדש...' : 'התמונה לא זמינה כרגע'}</span>
          {!refreshing && (
            <button type="button" className="btn btn-outline btn-sm" onClick={() => void refresh()}>
              טעינה מחדש
            </button>
          )}
        </div>
      )}

      <div className="photo-meta">
        <div className="badges">
          {photo.isPrivate ? <Badge tone="muted">פרטית</Badge> : <Badge tone="muted">ציבורית (ישנה)</Badge>}
          {photo.uploadedByMe && <Badge>העלית</Badge>}
          {photo.publishedInGallery && <Badge tone="success">בגלריה</Badge>}
          {admin?.galleryItemId && !photo.publishedInGallery && <Badge tone="warning">עותק מוסתר בגלריה</Badge>}
          {mode === 'admin' && (photo.publishConsent ? <Badge tone="gold">יש הסכמה</Badge> : <Badge tone="neutral">אין הסכמה</Badge>)}
        </div>

        {mode === 'owner' && onToggleConsent && (
          <label className="switch">
            <input type="checkbox" checked={consentChecked} disabled={busy} onChange={() => onToggleConsent(photo)} />
            <span>מסכימה לפרסום בגלריה</span>
          </label>
        )}

        <div className="photo-actions">
          {admin && onPublish && photo.publishConsent && admin.galleryItemId === null && (
            <button type="button" className="btn btn-sm" onClick={() => onPublish(photo)} disabled={busy}>
              פרסום בגלריה
            </button>
          )}
          {photo.canDelete && onDelete && (
            <button type="button" className="btn btn-ghost btn-sm danger" onClick={() => onDelete(photo)} disabled={busy}>
              מחיקה
            </button>
          )}
        </div>
      </div>
    </li>
  )
}
