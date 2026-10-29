import { useForm } from 'react-hook-form'
import { usePublishPhoto } from '../../hooks/usePhotos'
import { useToast } from '../../hooks/useToast'
import { EVENT_TYPES, type EventType } from '../../types/common'
import { getErrorMessage } from '../../utils/errorMessages'
import { EVENT_TYPE_LABELS } from '../../utils/format'
import { Alert } from '../ui/Alert'
import { Field } from '../ui/Field'
import { fieldProps } from '../../utils/fieldProps'
import { Modal } from '../ui/Modal'

type PublishForm = { title: string; category: EventType; isPublished: boolean; isFeatured: boolean; sortOrder: number }

export function PublishDialog({
  eventId,
  photoId,
  defaultCategory,
  onClose,
}: {
  eventId: number
  photoId: number
  defaultCategory: EventType
  onClose: () => void
}) {
  const toast = useToast()
  const publish = usePublishPhoto(eventId)
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<PublishForm>({ defaultValues: { title: '', category: defaultCategory, isPublished: true, isFeatured: false, sortOrder: 0 } })

  async function onSubmit(form: PublishForm) {
    try {
      await publish.mutateAsync({
        photoId,
        data: { title: form.title.trim(), category: form.category, isPublished: form.isPublished, isFeatured: form.isFeatured, sortOrder: Number(form.sortOrder) },
      })
      toast.success(form.isPublished ? 'התמונה פורסמה בגלריה' : 'העותק נוצר בגלריה כמוסתר')
      onClose()
    } catch (e) {
      setError('root', { message: getErrorMessage(e) })
    }
  }

  return (
    <Modal title="פרסום בגלריה" onClose={onClose} busy={isSubmitting}>
      <p className="muted">יווצר עותק ציבורי נפרד של התמונה. התמונה המקורית של הלקוחה נשארת פרטית.</p>
      <form className="form" onSubmit={handleSubmit(onSubmit)} noValidate>
        <Field id="publish-title" label="כותרת" error={errors.title?.message} required>
          <input
            {...fieldProps('publish-title', errors.title?.message)}
            {...register('title', {
              validate: (v) => (v.trim().length >= 2 && v.trim().length <= 120) || 'כותרת של 2–120 תווים',
            })}
          />
        </Field>
        <Field id="publish-category" label="גלריה (סוג אירוע)">
          <select id="publish-category" {...register('category')}>
            {EVENT_TYPES.map((type) => (
              <option key={type} value={type}>
                {EVENT_TYPE_LABELS[type]}
              </option>
            ))}
          </select>
        </Field>
        <Field id="publish-order" label="סדר תצוגה" error={errors.sortOrder?.message}>
          <input
            {...fieldProps('publish-order', errors.sortOrder?.message)}
            type="number"
            min={0}
            max={1000}
            {...register('sortOrder', { valueAsNumber: true, min: { value: 0, message: '0–1000' }, max: { value: 1000, message: '0–1000' } })}
          />
        </Field>
        <label className="checkbox">
          <input type="checkbox" {...register('isPublished')} /> להציג מיד בגלריה הציבורית
        </label>
        <label className="checkbox">
          <input type="checkbox" {...register('isFeatured')} /> תמונה מובילה
        </label>
        {errors.root && <Alert kind="error">{errors.root.message}</Alert>}
        <div className="form-actions">
          <button className="btn" type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'מפרסם...' : 'פרסום'}
          </button>
          <button className="btn btn-ghost" type="button" onClick={onClose} disabled={isSubmitting}>
            ביטול
          </button>
        </div>
      </form>
    </Modal>
  )
}
