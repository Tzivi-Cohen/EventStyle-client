import { useState } from 'react'
import { useDeletePhoto, useEventPhotos, useRefreshPhotoLink, useSetConsent } from '../../hooks/usePhotos'
import { useToast } from '../../hooks/useToast'
import type { EventType } from '../../types/common'
import type { EventPhoto } from '../../types/photo'
import { getErrorMessage } from '../../utils/errorMessages'
import { formatDateTime } from '../../utils/format'
import { ConfirmDialog } from '../ui/ConfirmDialog'
import { EmptyState } from '../ui/EmptyState'
import { Lightbox } from '../ui/Lightbox'
import { QueryState } from '../ui/QueryState'
import { PhotoCard, type PhotoViewerMode } from './PhotoCard'
import { PhotoUploader } from './PhotoUploader'
import { PublishDialog } from './PublishDialog'

type Pending = { kind: 'delete' | 'revoke'; photo: EventPhoto } | null

export function EventPhotosPanel({ eventId, eventType, mode }: { eventId: number; eventType: EventType; mode: PhotoViewerMode }) {
  const toast = useToast()
  const query = useEventPhotos(eventId)
  const refreshLink = useRefreshPhotoLink(eventId)
  const remove = useDeletePhoto(eventId)
  const consent = useSetConsent(eventId)
  const [openIndex, setOpenIndex] = useState<number | null>(null)
  const [pending, setPending] = useState<Pending>(null)
  const [publishing, setPublishing] = useState<EventPhoto | null>(null)
  const [consentDraft, setConsentDraft] = useState<Record<number, boolean>>({})
  const photos = query.data ?? []

  async function setConsent(photo: EventPhoto, publishConsent: boolean) {
    setConsentDraft((draft) => ({ ...draft, [photo.id]: publishConsent }))
    try {
      await consent.mutateAsync({ photoId: photo.id, publishConsent })
      toast.success(publishConsent ? 'ההסכמה לפרסום נשמרה. הפרסום עצמו נעשה בידי הסטודיו' : 'ההסכמה בוטלה')
      setPending(null)
    } catch (e) {
      toast.error(getErrorMessage(e))
    } finally {
      setConsentDraft(({ [photo.id]: _done, ...rest }) => rest)
    }
  }

  function onToggleConsent(photo: EventPhoto) {
    if (photo.publishConsent && photo.publishedInGallery) setPending({ kind: 'revoke', photo })
    else void setConsent(photo, !photo.publishConsent)
  }

  async function confirmDelete(photo: EventPhoto) {
    try {
      await remove.mutateAsync(photo.id)
      toast.success('התמונה נמחקה')
      setPending(null)
      setOpenIndex(null)
    } catch (e) {
      toast.error(getErrorMessage(e))
      setPending(null)
    }
  }

  return (
    <section className="section" aria-labelledby={`photos-${eventId}`}>
      <div className="section-head">
        <h2 id={`photos-${eventId}`} className="section-title">
          תמונות האירוע
        </h2>
        {query.data && <span className="muted">{photos.length} / 50</span>}
      </div>

      {query.data && <PhotoUploader eventId={eventId} currentCount={photos.length} />}

      <QueryState
        query={query}
        loadingLabel="טוען תמונות..."
        isEmpty={(list) => list.length === 0}
        empty={<EmptyState title="עדיין אין תמונות לאירוע" description="תמונות שיועלו יופיעו כאן. הן פרטיות ונגישות רק לך ולסטודיו." />}
      >
        {(list) => (
          <ul className="photo-grid">
            {list.map((photo, index) => (
              <PhotoCard
                key={photo.id}
                photo={photo}
                consentChecked={consentDraft[photo.id] ?? photo.publishConsent}
                mode={mode}
                busy={consent.isPending || remove.isPending}
                onOpen={() => setOpenIndex(index)}
                onRefreshLink={refreshLink}
                onToggleConsent={mode === 'owner' ? onToggleConsent : undefined}
                onDelete={(p) => setPending({ kind: 'delete', photo: p })}
                onPublish={mode === 'admin' ? setPublishing : undefined}
              />
            ))}
          </ul>
        )}
      </QueryState>

      {openIndex !== null && (
        <Lightbox
          items={photos.map((p) => ({ url: p.url, title: `תמונה מ-${formatDateTime(p.createdAt)}` }))}
          index={openIndex}
          onIndexChange={setOpenIndex}
          onClose={() => setOpenIndex(null)}
        />
      )}

      {pending?.kind === 'delete' && (
        <ConfirmDialog
          title="מחיקת תמונה"
          confirmLabel="מחיקה"
          danger
          busy={remove.isPending}
          onConfirm={() => void confirmDelete(pending.photo)}
          onCancel={() => setPending(null)}
        >
          <p>התמונה תימחק לצמיתות.</p>
          {pending.photo.publishedInGallery && <p>התמונה מפורסמת בגלריה – גם העותק בגלריה יוסר.</p>}
        </ConfirmDialog>
      )}
      {pending?.kind === 'revoke' && (
        <ConfirmDialog
          title="ביטול ההסכמה לפרסום"
          confirmLabel="ביטול ההסכמה"
          busy={consent.isPending}
          onConfirm={() => void setConsent(pending.photo, false)}
          onCancel={() => setPending(null)}
        >
          <p>התמונה מפורסמת כרגע בגלריה. ביטול ההסכמה יסיר אותה מהגלריה הציבורית.</p>
        </ConfirmDialog>
      )}
      {publishing && <PublishDialog eventId={eventId} photoId={publishing.id} defaultCategory={eventType} onClose={() => setPublishing(null)} />}
    </section>
  )
}
