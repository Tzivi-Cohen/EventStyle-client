import { useForm, useWatch } from 'react-hook-form'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { fieldErrors } from '../../api/apiClient'
import { LoadingSpinner } from '../../components/LoadingSpinner'
import { Alert } from '../../components/ui/Alert'
import { Field } from '../../components/ui/Field'
import { PageHeader } from '../../components/ui/PageHeader'
import { QueryState } from '../../components/ui/QueryState'
import { useCreateRequest, useEvent, useUpdateRequest } from '../../hooks/useEvents'
import { usePackages } from '../../hooks/usePublicData'
import { useToast } from '../../hooks/useToast'
import { EVENT_TYPES, type EventType } from '../../types/common'
import type { EventItem, EventRequestInput } from '../../types/event'
import { getErrorMessage } from '../../utils/errorMessages'
import { fieldProps } from '../../utils/fieldProps'
import { EVENT_TYPE_LABELS, formatPrice } from '../../utils/format'
import { validateMoney } from '../../utils/validation'

type RequestForm = {
  eventName: string
  eventType: EventType
  eventDate: string
  location: string
  packageId: string
  themeColor: string
  guestCount: number
  budget: number
  description: string
  clientNotes: string
}

const textLength = (min: number, max: number, label = 'תווים') => (v: string) =>
  (v.trim().length >= min && v.trim().length <= max) || `${min}–${max} ${label}`

function today() {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
}

function toForm(event?: EventItem): RequestForm {
  return {
    eventName: event?.eventName ?? '',
    eventType: event?.eventType ?? 'Birthday',
    eventDate: event?.eventDate ?? '',
    location: event?.location ?? '',
    packageId: event ? String(event.packageId) : '',
    themeColor: event?.themeColor ?? '',
    guestCount: event?.guestCount ?? 50,
    budget: event?.budget ?? NaN,
    description: event?.description ?? '',
    clientNotes: event?.clientNotes ?? '',
  }
}

function toInput(form: RequestForm): EventRequestInput {
  return {
    eventName: form.eventName.trim(),
    eventType: form.eventType,
    eventDate: form.eventDate,
    location: form.location.trim(),
    packageId: Number(form.packageId),
    themeColor: form.themeColor.trim(),
    guestCount: Number(form.guestCount),
    budget: Number(form.budget),
    description: form.description.trim(),
    clientNotes: form.clientNotes.trim() || null,
  }
}

export function EventRequestFormPage() {
  const params = useParams()
  const id = params.id ? Number(params.id) : null
  const eventQuery = useEvent(id ?? 0)

  return (
    <main className="page container">
      <p>
        <Link to={id ? `/my-events/${id}` : '/my-events'}>→ חזרה</Link>
      </p>
      <PageHeader
        eyebrow="האזור האישי"
        title={id ? 'עריכת בקשה' : 'בקשה חדשה לעיצוב אירוע'}
        description={id ? 'אפשר לערוך את הבקשה כל עוד היא ממתינה לאישור.' : 'ספרי לנו על האירוע. הסטודיו יבדוק את הבקשה ויעדכן אותך באזור האישי.'}
      />
      {id ? (
        <QueryState query={eventQuery} loadingLabel="טוען את הבקשה...">
          {(event) =>
            event.status === 'Pending' ? (
              <RequestFormBody event={event} />
            ) : (
              <Alert kind="info" title="הבקשה נעולה לעריכה">
                הבקשה כבר {event.status === 'Rejected' ? 'נדחתה' : 'אושרה'}, ולכן אי אפשר לערוך אותה.{' '}
                <Link to={`/my-events/${event.id}`}>לפרטי הבקשה</Link>
              </Alert>
            )
          }
        </QueryState>
      ) : (
        <RequestFormBody />
      )}
    </main>
  )
}

function RequestFormBody({ event }: { event?: EventItem }) {
  const navigate = useNavigate()
  const toast = useToast()
  const create = useCreateRequest()
  const update = useUpdateRequest(event?.id ?? 0)
  const {
    register,
    handleSubmit,
    control,
    setError,
    formState: { errors, isSubmitting, dirtyFields },
  } = useForm<RequestForm>({ defaultValues: toForm(event) })

  const eventType = useWatch({ control, name: 'eventType' })
  const packagesQuery = usePackages(eventType)
  const packages = packagesQuery.data ?? []
  const keepCurrent = event?.package && event.eventType === eventType && !packages.some((p) => p.id === event.packageId)

  async function onSubmit(form: RequestForm) {
    const input = toInput(form)
    try {
      if (event) {
        const changed = Object.fromEntries(
          Object.entries(input).filter(([name]) => dirtyFields[name as keyof RequestForm]),
        ) as Partial<EventRequestInput>
        if (Object.keys(changed).length === 0) {
          toast.show('לא בוצעו שינויים')
          return
        }
        await update.mutateAsync(changed)
        toast.success('הבקשה עודכנה')
        navigate(`/my-events/${event.id}`, { replace: true })
      } else {
        const saved = await create.mutateAsync(input)
        toast.success('הבקשה נשלחה! נעדכן אותך כאן אחרי שהסטודיו יבדוק אותה')
        navigate(`/my-events/${saved.id}`, { replace: true })
      }
    } catch (e) {
      const fields = fieldErrors(e)
      const names = Object.keys(fields).filter((k): k is keyof RequestForm => k in input)
      names.forEach((name) =>
        setError(name, {
          message:
            name === 'packageId'
              ? 'החבילה אינה מתאימה לסוג האירוע או שאינה פעילה'
              : name === 'eventDate'
                ? 'התאריך לא יכול להיות בעבר'
                : 'הערך אינו תקין',
        }),
      )
      if (names.length === 0) setError('root', { message: getErrorMessage(e) })
    }
  }

  const err = (name: keyof RequestForm) => errors[name]?.message

  return (
    <form className="form card card-padded form-grid request-form" onSubmit={handleSubmit(onSubmit)} noValidate>
      <h2 className="form-section-title full">פרטי האירוע</h2>
      <Field id="rq-name" label="שם האירוע" error={err('eventName')} required>
        <input {...fieldProps('rq-name', err('eventName'))} placeholder="למשל: בת המצווה של שירה" {...register('eventName', { validate: textLength(2, 120) })} />
      </Field>
      <Field id="rq-type" label="סוג האירוע" required>
        <select id="rq-type" {...register('eventType')}>
          {EVENT_TYPES.map((t) => (
            <option key={t} value={t}>
              {EVENT_TYPE_LABELS[t]}
            </option>
          ))}
        </select>
      </Field>
      <Field id="rq-date" label="תאריך" error={err('eventDate')} required>
        <input
          {...fieldProps('rq-date', err('eventDate'))}
          type="date"
          min={event ? undefined : today()}
          {...register('eventDate', {
            required: 'יש לבחור תאריך',
            validate: (v) => v === event?.eventDate || v >= today() || 'התאריך לא יכול להיות בעבר',
          })}
        />
      </Field>
      <Field id="rq-location" label="מיקום" error={err('location')} required>
        <input {...fieldProps('rq-location', err('location'))} placeholder="שם האולם או הכתובת" {...register('location', { validate: textLength(2, 200) })} />
      </Field>
      <Field id="rq-guests" label="מספר אורחים" error={err('guestCount')} required>
        <input
          {...fieldProps('rq-guests', err('guestCount'))}
          type="number"
          min={1}
          max={100000}
          inputMode="numeric"
          {...register('guestCount', {
            valueAsNumber: true,
            validate: (v) => (Number.isInteger(v) && v >= 1 && v <= 100000) || 'מספר שלם בין 1 ל-100,000',
          })}
        />
      </Field>
      <Field id="rq-budget" label="תקציב משוער (₪)" error={err('budget')} required>
        <input
          {...fieldProps('rq-budget', err('budget'))}
          type="number"
          min={0}
          step="0.01"
          inputMode="decimal"
          placeholder="למשל 8000"
          {...register('budget', { valueAsNumber: true, validate: validateMoney })}
        />
      </Field>

      <h2 className="form-section-title full">עיצוב</h2>
      <Field id="rq-package" label="חבילה" error={err('packageId')} hint="חבילות מהמחירון לסוג האירוע שבחרת, וחבילות כלליות" required>
        {packagesQuery.isPending ? (
          <LoadingSpinner label="טוען חבילות..." />
        ) : packagesQuery.isError ? (
          <Alert kind="error">לא ניתן לטעון את החבילות. נסי לרענן את הדף.</Alert>
        ) : (
          <select {...fieldProps('rq-package', err('packageId'), true)} {...register('packageId', { required: 'יש לבחור חבילה' })}>
            <option value="">בחירת חבילה</option>
            {keepCurrent && event?.package && <option value={event.package.id}>{event.package.name} (הבחירה הנוכחית)</option>}
            {packages.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} – {p.eventType ? EVENT_TYPE_LABELS[p.eventType] : 'כללית'} · {formatPrice(p.price)}
              </option>
            ))}
          </select>
        )}
      </Field>
      <Field id="rq-color" label="צבע / סגנון מרכזי" error={err('themeColor')} hint='למשל "ורוד עתיק וזהב"' required>
        <input {...fieldProps('rq-color', err('themeColor'), true)} {...register('themeColor', { validate: textLength(1, 30) })} />
      </Field>
      <Field id="rq-description" label="קונספט העיצוב" error={err('description')} hint="מה האווירה, הצבעים והסגנון שתרצי? (10–2000 תווים)" required>
        <textarea
          {...fieldProps('rq-description', err('description'), true)}
          rows={5}
          maxLength={2000}
          {...register('description', { validate: textLength(10, 2000) })}
        />
      </Field>
      <Field id="rq-notes" label="הערות מיוחדות (רשות)" error={err('clientNotes')}>
        <textarea
          {...fieldProps('rq-notes', err('clientNotes'))}
          rows={3}
          maxLength={1000}
          placeholder="שעות כניסה לאולם, אלרגיות, בקשות מיוחדות..."
          {...register('clientNotes', { maxLength: { value: 1000, message: 'עד 1000 תווים' } })}
        />
      </Field>

      {errors.root && <Alert kind="error">{errors.root.message}</Alert>}
      <div className="form-actions full">
        <button className="btn" type="submit" disabled={isSubmitting}>
          {isSubmitting ? (event ? 'שומר...' : 'שולח...') : event ? 'שמירת שינויים' : 'שליחת הבקשה'}
        </button>
        <Link to={event ? `/my-events/${event.id}` : '/my-events'} className="btn btn-ghost">
          ביטול
        </Link>
      </div>
    </form>
  )
}
