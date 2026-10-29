import { useForm } from 'react-hook-form'
import { useLocation } from 'react-router-dom'
import { fieldErrors } from '../api/apiClient'
import { Alert } from '../components/ui/Alert'
import { Badge } from '../components/ui/Badges'
import { Field } from '../components/ui/Field'
import { fieldProps } from '../utils/fieldProps'
import { PageHeader } from '../components/ui/PageHeader'
import { useAuth } from '../hooks/useAuth'
import { useToast } from '../hooks/useToast'
import type { ProfileUpdate } from '../types/user'
import { getErrorMessage } from '../utils/errorMessages'
import { formatDate, ROLE_LABELS } from '../utils/format'
import { ADDRESS_MAX_LENGTH, validateFullName, validatePhone } from '../utils/validation'

type ProfileForm = { fullName: string; phone: string; address: string }

export function AccountPage() {
  const { user, updateProfile } = useAuth()
  const location = useLocation()
  const toast = useToast()
  const welcome = (location.state as { welcome?: boolean } | null)?.welcome === true

  const {
    register,
    handleSubmit,
    setError,
    reset,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<ProfileForm>({
    values: { fullName: user?.fullName ?? '', phone: user?.phone ?? '', address: user?.address ?? '' },
  })

  if (!user) return null

  async function onSubmit(form: ProfileForm) {
    const update: ProfileUpdate = {}
    if (form.fullName.trim() !== user!.fullName) update.fullName = form.fullName.trim()
    if (form.phone.trim() && form.phone.trim() !== (user!.phone ?? '')) update.phone = form.phone.trim()
    const address = form.address.trim()
    if (address !== (user!.address ?? '')) update.address = address || null
    if (Object.keys(update).length === 0) {
      toast.show('אין שינויים לשמירה')
      return
    }
    try {
      const updated = await updateProfile(update)
      reset({ fullName: updated.fullName, phone: updated.phone ?? '', address: updated.address ?? '' })
      toast.success('הפרטים נשמרו')
    } catch (e) {
      const fields = fieldErrors(e)
      const known = (['fullName', 'phone', 'address'] as const).filter((name) => fields[name])
      known.forEach((name) => setError(name, { message: 'הערך אינו תקין' }))
      if (known.length === 0) setError('root', { message: getErrorMessage(e) })
    }
  }

  return (
    <main className="page container narrow">
      <PageHeader eyebrow="החשבון שלי" title={welcome ? `ברוכה הבאה, ${user.fullName}!` : 'הפרטים שלי'} />

      {welcome && !user.phone && <Alert kind="info">כדי שנוכל ליצור איתך קשר לגבי האירוע, הוסיפי מספר טלפון.</Alert>}

      <div className="card card-padded">
        <dl className="details">
          <dt>אימייל</dt>
          <dd dir="ltr">{user.email}</dd>
          <dt>סוג חשבון</dt>
          <dd>{ROLE_LABELS[user.role]}</dd>
          <dt>חשבון נפתח</dt>
          <dd>{formatDate(user.createdAt)}</dd>
        </dl>
        {user.googleLinked && <Badge tone="gold">מחובר עם Google</Badge>}

        <form className="form" onSubmit={handleSubmit(onSubmit)} noValidate>
          <h2>עריכת פרטים</h2>
          <Field id="profile-name" label="שם מלא" error={errors.fullName?.message} required>
            <input {...fieldProps('profile-name', errors.fullName?.message)} autoComplete="name" {...register('fullName', { validate: validateFullName })} />
          </Field>
          <Field id="profile-phone" label="טלפון" error={errors.phone?.message} required={user.phone !== null}>
            <input
              {...fieldProps('profile-phone', errors.phone?.message)}
              type="tel"
              dir="ltr"
              autoComplete="tel"
              {...register('phone', {
                validate: (v) => (!v.trim() ? (user.phone === null ? true : 'יש להזין מספר טלפון') : validatePhone(v)),
              })}
            />
          </Field>
          <Field
            id="profile-address"
            label="כתובת (רשות)"
            error={errors.address?.message}
            hint={`עד ${ADDRESS_MAX_LENGTH} תווים. השארת השדה ריק מוחקת את הכתובת`}
          >
            <input
              {...fieldProps('profile-address', errors.address?.message, true)}
              autoComplete="street-address"
              maxLength={ADDRESS_MAX_LENGTH}
              {...register('address', { maxLength: { value: ADDRESS_MAX_LENGTH, message: `עד ${ADDRESS_MAX_LENGTH} תווים` } })}
            />
          </Field>
          {errors.root && <Alert kind="error">{errors.root.message}</Alert>}
          <button className="btn" type="submit" disabled={isSubmitting || !isDirty}>
            {isSubmitting ? 'שומר...' : 'שמירת שינויים'}
          </button>
        </form>
        <p className="muted small">שינוי אימייל או סיסמה אינו אפשרי דרך האתר.</p>
      </div>
    </main>
  )
}
