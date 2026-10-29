import { useForm, useWatch } from 'react-hook-form'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { fieldErrors } from '../../api/apiClient'
import { Alert } from '../../components/ui/Alert'
import { Field } from '../../components/ui/Field'
import { fieldProps } from '../../utils/fieldProps'
import { PageHeader } from '../../components/ui/PageHeader'
import { QueryState } from '../../components/ui/QueryState'
import { useAdminPackages } from '../../hooks/useAdmin'
import { useCreateEvent, useEvent, useUpdateEvent } from '../../hooks/useEvents'
import { useToast } from '../../hooks/useToast'
import { EVENT_TYPES, OPERATIONAL_EVENT_STATUSES, type EventStatus, type EventType } from '../../types/common'
import type { EventInput, EventItem } from '../../types/event'
import type { AdminPackage } from '../../types/package'
import { getErrorMessage } from '../../utils/errorMessages'
import { EVENT_STATUS_LABELS, EVENT_TYPE_LABELS, formatPrice, isRequestStatus } from '../../utils/format'
import { validateEmail, validateMoney } from '../../utils/validation'

type EventForm = {
  eventName: string
  clientName: string
  clientEmail: string
  eventType: EventType
  eventDate: string
  location: string
  packageId: string
  themeColor: string
  guestCount: number
  budget: number
  status: EventStatus
  coverImageUrl: string
  notes: string
}

const NO_FILTERS = {}
const textLength = (min: number, max: number) => (v: string) =>
  (v.trim().length >= min && v.trim().length <= max) || `${min}–${max} תווים`

export function AdminEventFormPage() {
  const params = useParams()
  const id = params.id ? Number(params.id) : null
  const eventQuery = useEvent(id ?? 0)
  const packagesQuery = useAdminPackages(NO_FILTERS)

  return (
    <>
      <p>
        <Link to={id ? `/admin/events/${id}` : '/admin/events'}>→ חזרה</Link>
      </p>
      <PageHeader eyebrow="ניהול אירועים" title={id ? 'עריכת אירוע' : 'אירוע חדש'} />
      <QueryState query={packagesQuery} loadingLabel="טוען חבילות...">
        {(packages) =>
          id ? (
            <QueryState query={eventQuery} loadingLabel="טוען את האירוע...">
              {(event) =>
                isRequestStatus(event.status) ? (
                  <Alert kind="info" title="זו בקשה של לקוחה">
                    יש לאשר או לדחות את הבקשה לפני עריכה. <Link to={`/admin/events/${event.id}`}>לבדיקת הבקשה</Link>
                  </Alert>
                ) : (
                  <EventFormBody packages={packages} event={event} />
                )
              }
            </QueryState>
          ) : (
            <EventFormBody packages={packages} />
          )
        }
      </QueryState>
    </>
  )
}

function toForm(event?: EventItem): EventForm {
  return {
    eventName: event?.eventName ?? '',
    clientName: event?.clientName ?? '',
    clientEmail: event?.clientEmail ?? '',
    eventType: event?.eventType ?? 'Birthday',
    eventDate: event?.eventDate ?? '',
    location: event?.location ?? '',
    packageId: event ? String(event.packageId) : '',
    themeColor: event?.themeColor ?? '',
    guestCount: event?.guestCount ?? 50,
    budget: event?.budget ?? 0,
    status: event?.status ?? 'New',
    coverImageUrl: event?.coverImageUrl ?? '',
    notes: event?.notes ?? '',
  }
}

function EventFormBody({ packages, event }: { packages: AdminPackage[]; event?: EventItem }) {
  const navigate = useNavigate()
  const toast = useToast()
  const create = useCreateEvent()
  const update = useUpdateEvent(event?.id ?? 0)
  const {
    register,
    handleSubmit,
    control,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<EventForm>({ defaultValues: toForm(event) })

  const eventType = useWatch({ control, name: 'eventType' })
  const allowed = packages.filter(
    (p) => (p.eventType === null || p.eventType === eventType) && (p.isActive || p.id === event?.packageId),
  )

  async function onSubmit(form: EventForm) {
    const data: EventInput = {
      eventName: form.eventName.trim(),
      clientName: form.clientName.trim(),
      clientEmail: form.clientEmail.trim().toLowerCase(),
      eventType: form.eventType,
      eventDate: form.eventDate,
      location: form.location.trim(),
      packageId: Number(form.packageId),
      themeColor: form.themeColor.trim(),
      guestCount: Number(form.guestCount),
      budget: Number(form.budget),
      status: form.status,
      coverImageUrl: form.coverImageUrl.trim() || null,
      notes: form.notes.trim() || null,
    }
    try {
      const saved = event ? await update.mutateAsync(data) : await create.mutateAsync(data)
      toast.success(event ? 'האירוע עודכן' : 'האירוע נוצר')
      if (!event && saved.userId === null) toast.show('האירוע יקושר ללקוחה אחרי שתירשם ותאמת את האימייל')
      navigate(`/admin/events/${saved.id}`, { replace: true })
    } catch (e) {
      const fields = fieldErrors(e)
      const names = Object.keys(fields).filter((k): k is keyof EventForm => k in data)
      names.forEach((name) => setError(name, { message: name === 'packageId' ? 'החבילה אינה מתאימה לסוג האירוע או שאינה פעילה' : 'הערך אינו תקין' }))
      if (names.length === 0) setError('root', { message: getErrorMessage(e) })
    }
  }

  const err = (name: keyof EventForm) => errors[name]?.message

  return (
    <form className="form card card-padded form-grid" onSubmit={handleSubmit(onSubmit)} noValidate>
      <Field id="ev-name" label="שם האירוע" error={err('eventName')} required>
        <input {...fieldProps('ev-name', err('eventName'))} {...register('eventName', { validate: textLength(2, 120) })} />
      </Field>
      <Field id="ev-type" label="סוג אירוע" required>
        <select id="ev-type" {...register('eventType')}>
          {EVENT_TYPES.map((t) => (
            <option key={t} value={t}>
              {EVENT_TYPE_LABELS[t]}
            </option>
          ))}
        </select>
      </Field>
      <Field id="ev-client" label="שם הלקוח" error={err('clientName')} required>
        <input {...fieldProps('ev-client', err('clientName'))} {...register('clientName', { validate: textLength(2, 100) })} />
      </Field>
      <Field id="ev-email" label="אימייל הלקוח" error={err('clientEmail')} hint="האירוע יקושר ללקוחה שנרשמה ואימתה את הכתובת הזו" required>
        <input {...fieldProps('ev-email', err('clientEmail'), true)} type="email" dir="ltr" {...register('clientEmail', { validate: validateEmail })} />
      </Field>
      <Field id="ev-date" label="תאריך" error={err('eventDate')} required>
        <input {...fieldProps('ev-date', err('eventDate'))} type="date" {...register('eventDate', { required: 'יש לבחור תאריך' })} />
      </Field>
      <Field id="ev-location" label="מיקום" error={err('location')} required>
        <input {...fieldProps('ev-location', err('location'))} {...register('location', { validate: textLength(2, 200) })} />
      </Field>
      <Field id="ev-package" label="חבילה" error={err('packageId')} hint="חבילות פעילות מסוג האירוע או כלליות" required>
        <select {...fieldProps('ev-package', err('packageId'), true)} {...register('packageId', { required: 'יש לבחור חבילה' })}>
          <option value="">בחירת חבילה</option>
          {allowed.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name} – {p.eventType ? EVENT_TYPE_LABELS[p.eventType] : 'כללית'} · {formatPrice(p.price)}
              {!p.isActive ? ' (בארכיון)' : ''}
            </option>
          ))}
        </select>
      </Field>
      <Field id="ev-color" label="צבע / סגנון" error={err('themeColor')} hint='למשל ‎#F4C2C2 או "ורוד עתיק"' required>
        <input {...fieldProps('ev-color', err('themeColor'), true)} {...register('themeColor', { validate: textLength(1, 30) })} />
      </Field>
      <Field id="ev-guests" label="מספר אורחים" error={err('guestCount')} required>
        <input
          {...fieldProps('ev-guests', err('guestCount'))}
          type="number"
          min={1}
          max={100000}
          {...register('guestCount', {
            valueAsNumber: true,
            validate: (v) => (Number.isInteger(v) && v >= 1 && v <= 100000) || 'מספר שלם בין 1 ל-100,000',
          })}
        />
      </Field>
      <Field id="ev-budget" label="תקציב משוער (₪)" error={err('budget')} required>
        <input {...fieldProps('ev-budget', err('budget'))} type="number" min={0} step="0.01" {...register('budget', { valueAsNumber: true, validate: validateMoney })} />
      </Field>
      <Field id="ev-status" label="סטטוס">
        <select id="ev-status" {...register('status')}>
          {OPERATIONAL_EVENT_STATUSES.map((s) => (
            <option key={s} value={s}>
              {EVENT_STATUS_LABELS[s]}
            </option>
          ))}
        </select>
      </Field>
      <Field id="ev-cover" label="קישור לתמונת שער (רשות)" error={err('coverImageUrl')} hint="כתובת http(s) קבועה">
        <input
          {...fieldProps('ev-cover', err('coverImageUrl'), true)}
          type="url"
          dir="ltr"
          {...register('coverImageUrl', {
            validate: (v) => !v.trim() || /^https?:\/\/\S+$/i.test(v.trim()) || 'כתובת http(s) תקינה',
          })}
        />
      </Field>
      <Field id="ev-notes" label="הערות פנימיות (לא מוצגות ללקוחה)" error={err('notes')}>
        <textarea {...fieldProps('ev-notes', err('notes'))} rows={4} maxLength={2000} {...register('notes', { maxLength: { value: 2000, message: 'עד 2000 תווים' } })} />
      </Field>

      {errors.root && <Alert kind="error">{errors.root.message}</Alert>}
      <div className="form-actions full">
        <button className="btn" type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'שומר...' : event ? 'שמירת שינויים' : 'יצירת האירוע'}
        </button>
        <Link to={event ? `/admin/events/${event.id}` : '/admin/events'} className="btn btn-ghost">
          ביטול
        </Link>
      </div>
    </form>
  )
}
