import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { fieldErrors } from '../../api/apiClient'
import { Alert } from '../../components/ui/Alert'
import { Badge } from '../../components/ui/Badges'
import { ConfirmDialog } from '../../components/ui/ConfirmDialog'
import { EmptyState } from '../../components/ui/EmptyState'
import { Field } from '../../components/ui/Field'
import { fieldProps } from '../../utils/fieldProps'
import { Modal } from '../../components/ui/Modal'
import { PageHeader } from '../../components/ui/PageHeader'
import { QueryState } from '../../components/ui/QueryState'
import { useAdminPackages, useArchivePackage, useSavePackage } from '../../hooks/useAdmin'
import { useToast } from '../../hooks/useToast'
import { EVENT_TYPES, type EventType } from '../../types/common'
import type { AdminPackage, AdminPackageFilters, PackageInput } from '../../types/package'
import { getErrorMessage } from '../../utils/errorMessages'
import { EVENT_TYPE_LABELS, formatPrice } from '../../utils/format'
import { filterClasses } from '../../styles/filterClasses'
import { validateHttpsUrl, validateMoney } from '../../utils/validation'

type TypeFilter = '' | EventType | 'general'
type ActiveFilter = '' | 'true' | 'false'

export function AdminPackagesPage() {
  const toast = useToast()
  const [type, setType] = useState<TypeFilter>('')
  const [active, setActive] = useState<ActiveFilter>('')
  const filters: AdminPackageFilters = { ...(type && { eventType: type }), ...(active && { isActive: active === 'true' }) }
  const query = useAdminPackages(filters)
  const save = useSavePackage()
  const archive = useArchivePackage()
  const [editing, setEditing] = useState<AdminPackage | 'new' | null>(null)
  const [archiving, setArchiving] = useState<AdminPackage | null>(null)

  async function onArchive() {
    if (!archiving) return
    try {
      await archive.mutateAsync(archiving.id)
      toast.success('החבילה הועברה לארכיון')
    } catch (e) {
      toast.error(getErrorMessage(e))
    } finally {
      setArchiving(null)
    }
  }

  async function onRestore(pkg: AdminPackage) {
    try {
      await save.mutateAsync({ id: pkg.id, data: { ...toInput(pkg), isActive: true } })
      toast.success('החבילה הוחזרה מהארכיון')
    } catch (e) {
      toast.error(getErrorMessage(e))
    }
  }

  return (
    <>
      <PageHeader
        eyebrow="ניהול"
        title="חבילות ומחירון"
        description="שינוי מחיר לא משנה הזמנות קיימות. הסרת חבילה היא העברה לארכיון בלבד."
        actions={
          <button type="button" className="btn" onClick={() => setEditing('new')}>
            + חבילה חדשה
          </button>
        }
      />
      <div className={filterClasses.bar}>
        <label className={filterClasses.field}>
          <span>סוג אירוע</span>
          <select value={type} onChange={(e) => setType(e.target.value as TypeFilter)}>
            <option value="">הכול</option>
            <option value="general">חבילות כלליות</option>
            {EVENT_TYPES.map((t) => (
              <option key={t} value={t}>
                {EVENT_TYPE_LABELS[t]}
              </option>
            ))}
          </select>
        </label>
        <label className={filterClasses.field}>
          <span>מצב</span>
          <select value={active} onChange={(e) => setActive(e.target.value as ActiveFilter)}>
            <option value="">הכול</option>
            <option value="true">פעילות</option>
            <option value="false">בארכיון</option>
          </select>
        </label>
      </div>

      <QueryState query={query} loadingLabel="טוען חבילות..." isEmpty={(list) => list.length === 0} empty={<EmptyState title="אין חבילות שמתאימות לסינון" />}>
        {(list) => (
          <div className="table-wrap">
            <table className="table">
              <caption className="sr-only">רשימת החבילות</caption>
              <thead>
                <tr>
                  <th scope="col">שם</th>
                  <th scope="col">סוג</th>
                  <th scope="col">מחיר</th>
                  <th scope="col">סדר</th>
                  <th scope="col">הזמנות</th>
                  <th scope="col">מצב</th>
                  <th scope="col">
                    <span className="sr-only">פעולות</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {list.map((pkg) => (
                  <tr key={pkg.id}>
                    <td data-label="שם">{pkg.name}</td>
                    <td data-label="סוג">{pkg.eventType ? EVENT_TYPE_LABELS[pkg.eventType] : 'כללית'}</td>
                    <td data-label="מחיר">{formatPrice(pkg.price)}</td>
                    <td data-label="סדר">{pkg.sortOrder}</td>
                    <td data-label="הזמנות">{pkg.eventCount ?? 0}</td>
                    <td data-label="מצב">{pkg.isActive ? <Badge tone="success">פעילה</Badge> : <Badge tone="muted">בארכיון</Badge>}</td>
                    <td className="row-actions">
                      <button type="button" className="btn btn-ghost btn-sm" onClick={() => setEditing(pkg)}>
                        עריכה
                      </button>
                      {pkg.isActive ? (
                        <button type="button" className="btn btn-ghost btn-sm danger" onClick={() => setArchiving(pkg)}>
                          לארכיון
                        </button>
                      ) : (
                        <button type="button" className="btn btn-ghost btn-sm" onClick={() => void onRestore(pkg)} disabled={save.isPending}>
                          החזרה
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </QueryState>

      {editing && <PackageDialog pkg={editing === 'new' ? null : editing} onClose={() => setEditing(null)} />}
      {archiving && (
        <ConfirmDialog title="העברה לארכיון" confirmLabel="העברה לארכיון" busy={archive.isPending} onConfirm={() => void onArchive()} onCancel={() => setArchiving(null)}>
          <p>
            החבילה "{archiving.name}" תוסתר מהמחירון הציבורי ולא תהיה זמינה להזמנות חדשות. הזמנות קיימות ({archiving.eventCount ?? 0}) לא ישתנו. אפשר להחזיר אותה בכל עת.
          </p>
        </ConfirmDialog>
      )}
    </>
  )
}

function toInput(pkg: AdminPackage): PackageInput {
  return {
    name: pkg.name,
    description: pkg.description,
    price: pkg.price,
    features: pkg.features,
    imageUrl: pkg.imageUrl,
    eventType: pkg.eventType,
    isActive: pkg.isActive,
    sortOrder: pkg.sortOrder,
  }
}

type PackageForm = { name: string; description: string; price: number; features: string; imageUrl: string; eventType: EventType | 'general'; isActive: boolean; sortOrder: number }

function PackageDialog({ pkg, onClose }: { pkg: AdminPackage | null; onClose: () => void }) {
  const toast = useToast()
  const save = useSavePackage()
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<PackageForm>({
    defaultValues: {
      name: pkg?.name ?? '',
      description: pkg?.description ?? '',
      price: pkg?.price ?? 0,
      features: pkg?.features.join('\n') ?? '',
      imageUrl: pkg?.imageUrl ?? '',
      eventType: pkg?.eventType ?? 'general',
      isActive: pkg?.isActive ?? true,
      sortOrder: pkg?.sortOrder ?? 0,
    },
  })

  async function onSubmit(form: PackageForm) {
    const data: PackageInput = {
      name: form.name.trim(),
      description: form.description.trim(),
      price: Number(form.price),
      features: form.features.split('\n').map((f) => f.trim()).filter(Boolean),
      imageUrl: form.imageUrl.trim(),
      eventType: form.eventType === 'general' ? null : form.eventType,
      isActive: form.isActive,
      sortOrder: Number(form.sortOrder),
    }
    try {
      await save.mutateAsync({ id: pkg?.id, data })
      toast.success(pkg ? 'החבילה עודכנה' : 'החבילה נוצרה')
      onClose()
    } catch (e) {
      const fields = Object.keys(fieldErrors(e)).map((f) => f.split('.')[0]).filter((f): f is keyof PackageForm => f in form)
      fields.forEach((name) => setError(name, { message: 'הערך אינו תקין' }))
      setError('root', { message: getErrorMessage(e) })
    }
  }

  const err = (name: keyof PackageForm) => errors[name]?.message

  return (
    <Modal title={pkg ? 'עריכת חבילה' : 'חבילה חדשה'} onClose={onClose} busy={isSubmitting} size="lg">
      <form className="form form-grid" onSubmit={handleSubmit(onSubmit)} noValidate>
        <Field id="p-name" label="שם" error={err('name')} required>
          <input {...fieldProps('p-name', err('name'))} {...register('name', { validate: (v) => (v.trim().length >= 2 && v.trim().length <= 50) || '2–50 תווים' })} />
        </Field>
        <Field id="p-type" label="סוג אירוע">
          <select id="p-type" {...register('eventType')}>
            <option value="general">כללית (לכל סוגי האירועים)</option>
            {EVENT_TYPES.map((t) => (
              <option key={t} value={t}>
                {EVENT_TYPE_LABELS[t]}
              </option>
            ))}
          </select>
        </Field>
        <Field id="p-price" label="מחיר (₪)" error={err('price')} required>
          <input {...fieldProps('p-price', err('price'))} type="number" min={0} step="0.01" {...register('price', { valueAsNumber: true, validate: validateMoney })} />
        </Field>
        <Field id="p-order" label="סדר תצוגה" error={err('sortOrder')}>
          <input {...fieldProps('p-order', err('sortOrder'))} type="number" min={0} max={1000} {...register('sortOrder', { valueAsNumber: true, min: { value: 0, message: '0–1000' }, max: { value: 1000, message: '0–1000' } })} />
        </Field>
        <Field id="p-desc" label="תיאור" error={err('description')} required>
          <textarea {...fieldProps('p-desc', err('description'))} rows={3} {...register('description', { validate: (v) => (v.trim().length >= 2 && v.trim().length <= 500) || '2–500 תווים' })} />
        </Field>
        <Field id="p-features" label="מה כלול (שורה לכל פריט)" error={err('features')} hint="1–20 פריטים, עד 100 תווים לפריט" required>
          <textarea
            {...fieldProps('p-features', err('features'), true)}
            rows={4}
            {...register('features', {
              validate: (v) => {
                const items = v.split('\n').map((f) => f.trim()).filter(Boolean)
                if (items.length < 1 || items.length > 20) return 'בין 1 ל-20 פריטים'
                return items.every((f) => f.length <= 100) || 'כל פריט עד 100 תווים'
              },
            })}
          />
        </Field>
        <Field id="p-image" label="קישור לתמונה" error={err('imageUrl')} hint="כתובת https" required>
          <input {...fieldProps('p-image', err('imageUrl'), true)} type="url" dir="ltr" {...register('imageUrl', { validate: validateHttpsUrl })} />
        </Field>
        <label className="checkbox">
          <input type="checkbox" {...register('isActive')} /> פעילה (מוצגת במחירון)
        </label>
        {errors.root && <Alert kind="error">{errors.root.message}</Alert>}
        <div className="form-actions full">
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
