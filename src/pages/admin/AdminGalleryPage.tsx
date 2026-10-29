import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Alert } from '../../components/ui/Alert'
import { Badge } from '../../components/ui/Badges'
import { ConfirmDialog } from '../../components/ui/ConfirmDialog'
import { EmptyState } from '../../components/ui/EmptyState'
import { Field } from '../../components/ui/Field'
import { fieldProps } from '../../utils/fieldProps'
import { Modal } from '../../components/ui/Modal'
import { PageHeader } from '../../components/ui/PageHeader'
import { Pagination } from '../../components/ui/Pagination'
import { QueryState } from '../../components/ui/QueryState'
import { SafeImage } from '../../components/ui/SafeImage'
import { useAdminGallery, useDeleteGalleryItem, useUpdateGalleryItem, useUploadGalleryItem } from '../../hooks/useAdmin'
import { useToast } from '../../hooks/useToast'
import { EVENT_TYPES, type EventType } from '../../types/common'
import type { AdminGalleryItem, GalleryUpdate } from '../../types/gallery'
import { getErrorMessage } from '../../utils/errorMessages'
import { EVENT_TYPE_LABELS } from '../../utils/format'
import { filterClasses } from '../../styles/filterClasses'
import { ALLOWED_IMAGE_TYPES, MAX_FILE_SIZE_BYTES } from '../../utils/uploadReducer'

type Bool = '' | 'true' | 'false'

export function AdminGalleryPage() {
  const toast = useToast()
  const [category, setCategory] = useState<EventType | ''>('')
  const [published, setPublished] = useState<Bool>('')
  const [page, setPage] = useState(1)
  const query = useAdminGallery({
    page,
    limit: 12,
    ...(category && { category }),
    ...(published && { isPublished: published === 'true' }),
  })
  const update = useUpdateGalleryItem()
  const remove = useDeleteGalleryItem()
  const [uploading, setUploading] = useState(false)
  const [editing, setEditing] = useState<AdminGalleryItem | null>(null)
  const [deleting, setDeleting] = useState<AdminGalleryItem | null>(null)

  async function patch(item: AdminGalleryItem, data: GalleryUpdate, success: string) {
    try {
      await update.mutateAsync({ id: item.id, data })
      toast.success(success)
    } catch (e) {
      toast.error(getErrorMessage(e))
    }
  }

  async function onDelete() {
    if (!deleting) return
    try {
      await remove.mutateAsync(deleting.id)
      toast.success('הפריט נמחק מהגלריה')
    } catch (e) {
      toast.error(getErrorMessage(e))
    } finally {
      setDeleting(null)
    }
  }

  return (
    <>
      <PageHeader
        eyebrow="ניהול"
        title="גלריה"
        actions={
          <button type="button" className="btn" onClick={() => setUploading(true)}>
            + העלאת תמונה
          </button>
        }
      />
      <div className={filterClasses.bar}>
        <label className={filterClasses.field}>
          <span>סוג אירוע</span>
          <select
            value={category}
            onChange={(e) => {
              setCategory(e.target.value as EventType | '')
              setPage(1)
            }}
          >
            <option value="">הכול</option>
            {EVENT_TYPES.map((t) => (
              <option key={t} value={t}>
                {EVENT_TYPE_LABELS[t]}
              </option>
            ))}
          </select>
        </label>
        <label className={filterClasses.field}>
          <span>מצב</span>
          <select
            value={published}
            onChange={(e) => {
              setPublished(e.target.value as Bool)
              setPage(1)
            }}
          >
            <option value="">הכול</option>
            <option value="true">מפורסמים</option>
            <option value="false">מוסתרים</option>
          </select>
        </label>
      </div>

      <QueryState
        query={query}
        loadingLabel="טוען את הגלריה..."
        isEmpty={(result) => result.data.length === 0}
        empty={<EmptyState title="אין פריטים בגלריה" description="העלי תמונה ראשונה, או פרסמי תמונה של לקוחה שנתנה הסכמה." />}
      >
        {(result) => (
          <>
            <ul className="photo-grid">
              {result.data.map((item) => (
                <li key={item.id} className="photo-card card">
                  <div className="photo-thumb">
                    <SafeImage src={item.url} alt={item.title} />
                  </div>
                  <div className="photo-meta">
                    <strong>{item.title}</strong>
                    <p className="muted small">
                      {EVENT_TYPE_LABELS[item.category]} · סדר {item.sortOrder}
                    </p>
                    <div className="badges">
                      {item.isPublished ? <Badge tone="success">מפורסם</Badge> : <Badge tone="warning">מוסתר</Badge>}
                      {item.isFeatured && <Badge tone="gold">מובילה</Badge>}
                      {item.sourceEventPhotoId !== null && <Badge tone="muted">מתמונת לקוחה</Badge>}
                    </div>
                    <div className="photo-actions">
                      <button
                        type="button"
                        className="btn btn-outline btn-sm"
                        disabled={update.isPending}
                        onClick={() => void patch(item, { isPublished: !item.isPublished }, item.isPublished ? 'הפריט הוסתר' : 'הפריט פורסם')}
                      >
                        {item.isPublished ? 'הסתרה' : 'פרסום'}
                      </button>
                      <button
                        type="button"
                        className="btn btn-outline btn-sm"
                        disabled={update.isPending}
                        onClick={() => void patch(item, { isFeatured: !item.isFeatured }, item.isFeatured ? 'הסימון הוסר' : 'סומנה כמובילה')}
                      >
                        {item.isFeatured ? 'ביטול מובילה' : 'סימון מובילה'}
                      </button>
                      <button type="button" className="btn btn-ghost btn-sm" onClick={() => setEditing(item)}>
                        עריכה
                      </button>
                      <button type="button" className="btn btn-ghost btn-sm danger" onClick={() => setDeleting(item)}>
                        מחיקה
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
            <Pagination meta={result.pagination} onPageChange={setPage} />
          </>
        )}
      </QueryState>

      {uploading && <GalleryUploadDialog onClose={() => setUploading(false)} />}
      {editing && <GalleryEditDialog item={editing} onClose={() => setEditing(null)} />}
      {deleting && (
        <ConfirmDialog title="מחיקה מהגלריה" confirmLabel="מחיקה לצמיתות" danger busy={remove.isPending} onConfirm={() => void onDelete()} onCancel={() => setDeleting(null)}>
          <p>הפריט "{deleting.title}" והקובץ שלו יימחקו לצמיתות. להסתרה בלבד – השתמשי ב"הסתרה".</p>
          {deleting.sourceEventPhotoId !== null && <p>זהו עותק של תמונת לקוחה: התמונה המקורית של הלקוחה וההסכמה שלה לא ישתנו.</p>}
        </ConfirmDialog>
      )}
    </>
  )
}

type UploadForm = { image: FileList; title: string; category: EventType; isPublished: boolean; isFeatured: boolean; sortOrder: number }

function GalleryUploadDialog({ onClose }: { onClose: () => void }) {
  const toast = useToast()
  const upload = useUploadGalleryItem()
  const [progress, setProgress] = useState(0)
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<UploadForm>({ defaultValues: { title: '', category: 'Birthday', isPublished: true, isFeatured: false, sortOrder: 0 } })

  async function onSubmit(form: UploadForm) {
    try {
      await upload.mutateAsync({
        image: form.image[0],
        data: { title: form.title.trim(), category: form.category, isPublished: form.isPublished, isFeatured: form.isFeatured, sortOrder: Number(form.sortOrder) },
        onProgress: setProgress,
      })
      toast.success('התמונה נוספה לגלריה')
      onClose()
    } catch (e) {
      setProgress(0)
      setError('root', { message: getErrorMessage(e) })
    }
  }

  return (
    <Modal title="העלאת תמונה לגלריה" onClose={onClose} busy={isSubmitting}>
      <form className="form" onSubmit={handleSubmit(onSubmit)} noValidate>
        <Field id="g-image" label="קובץ תמונה" error={errors.image?.message} hint="JPEG, PNG או WEBP, עד 5MB" required>
          <input
            {...fieldProps('g-image', errors.image?.message, true)}
            type="file"
            accept={ALLOWED_IMAGE_TYPES.join(',')}
            {...register('image', {
              validate: (files) => {
                const file = files?.[0]
                if (!file) return 'יש לבחור תמונה'
                if (!(ALLOWED_IMAGE_TYPES as readonly string[]).includes(file.type)) return 'רק JPEG, PNG או WEBP'
                if (file.size > MAX_FILE_SIZE_BYTES) return 'הקובץ גדול מ-5MB'
                return true
              },
            })}
          />
        </Field>
        <Field id="g-title" label="כותרת" error={errors.title?.message} required>
          <input {...fieldProps('g-title', errors.title?.message)} {...register('title', { validate: (v) => (v.trim().length >= 2 && v.trim().length <= 120) || 'כותרת של 2–120 תווים' })} />
        </Field>
        <Field id="g-category" label="סוג אירוע">
          <select id="g-category" {...register('category')}>
            {EVENT_TYPES.map((t) => (
              <option key={t} value={t}>
                {EVENT_TYPE_LABELS[t]}
              </option>
            ))}
          </select>
        </Field>
        <Field id="g-order" label="סדר תצוגה" error={errors.sortOrder?.message}>
          <input {...fieldProps('g-order', errors.sortOrder?.message)} type="number" min={0} max={1000} {...register('sortOrder', { valueAsNumber: true, min: { value: 0, message: '0–1000' }, max: { value: 1000, message: '0–1000' } })} />
        </Field>
        <label className="checkbox">
          <input type="checkbox" {...register('isPublished')} /> לפרסם מיד
        </label>
        <label className="checkbox">
          <input type="checkbox" {...register('isFeatured')} /> תמונה מובילה
        </label>
        {isSubmitting && (
          <div className="progress" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={progress} aria-label="התקדמות ההעלאה">
            <span style={{ width: `${progress}%` }} />
          </div>
        )}
        {errors.root && <Alert kind="error">{errors.root.message}</Alert>}
        <div className="form-actions">
          <button className="btn" type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'מעלה...' : 'העלאה'}
          </button>
          <button className="btn btn-ghost" type="button" onClick={onClose} disabled={isSubmitting}>
            ביטול
          </button>
        </div>
      </form>
    </Modal>
  )
}

type EditForm = { title: string; category: EventType; sortOrder: number }

function GalleryEditDialog({ item, onClose }: { item: AdminGalleryItem; onClose: () => void }) {
  const toast = useToast()
  const update = useUpdateGalleryItem()
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<EditForm>({ defaultValues: { title: item.title, category: item.category, sortOrder: item.sortOrder } })

  async function onSubmit(form: EditForm) {
    try {
      await update.mutateAsync({ id: item.id, data: { title: form.title.trim(), category: form.category, sortOrder: Number(form.sortOrder) } })
      toast.success('הפרטים עודכנו')
      onClose()
    } catch (e) {
      setError('root', { message: getErrorMessage(e) })
    }
  }

  return (
    <Modal title="עריכת פריט בגלריה" onClose={onClose} busy={isSubmitting}>
      <form className="form" onSubmit={handleSubmit(onSubmit)} noValidate>
        <Field id="ge-title" label="כותרת" error={errors.title?.message} required>
          <input {...fieldProps('ge-title', errors.title?.message)} {...register('title', { validate: (v) => (v.trim().length >= 2 && v.trim().length <= 120) || 'כותרת של 2–120 תווים' })} />
        </Field>
        <Field id="ge-category" label="סוג אירוע">
          <select id="ge-category" {...register('category')}>
            {EVENT_TYPES.map((t) => (
              <option key={t} value={t}>
                {EVENT_TYPE_LABELS[t]}
              </option>
            ))}
          </select>
        </Field>
        <Field id="ge-order" label="סדר תצוגה" error={errors.sortOrder?.message}>
          <input {...fieldProps('ge-order', errors.sortOrder?.message)} type="number" min={0} max={1000} {...register('sortOrder', { valueAsNumber: true, min: { value: 0, message: '0–1000' }, max: { value: 1000, message: '0–1000' } })} />
        </Field>
        {errors.root && <Alert kind="error">{errors.root.message}</Alert>}
        <div className="form-actions">
          <button className="btn" type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'שומר...' : 'שמירה'}
          </button>
          <button className="btn btn-ghost" type="button" onClick={onClose} disabled={isSubmitting}>
            ביטול
          </button>
        </div>
      </form>
    </Modal>
  )
}
