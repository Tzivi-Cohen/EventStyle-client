import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useLocation } from 'react-router-dom'
import { fieldErrors } from '../api/apiClient'
import { ErrorMessage } from '../components/ErrorMessage'
import { useAuth } from '../hooks/useAuth'
import { getErrorMessage } from '../utils/errorMessages'

// אותו כלל כמו ב-phoneSchema של השרת
const PHONE_PATTERN = /^\+?[0-9][0-9\s-]{6,18}$/

type PhoneForm = { phone: string }

const ROLE_LABELS = { Admin: 'מנהלת', Client: 'לקוח' } as const

export function AccountPage() {
  const { user, updateProfile } = useAuth()
  const location = useLocation()
  const welcome = (location.state as { welcome?: boolean } | null)?.welcome === true

  const [formError, setFormError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<PhoneForm>({ defaultValues: { phone: '' } })

  // ProtectedRoute מבטיח משתמש מחובר
  if (!user) return null

  async function onSubmit({ phone }: PhoneForm) {
    setFormError(null)
    try {
      await updateProfile({ phone: phone.trim() })
      setSaved(true)
    } catch (e) {
      const fields = fieldErrors(e)
      if (fields.phone) setError('phone', { message: 'מספר הטלפון אינו תקין' })
      else setFormError(getErrorMessage(e))
    }
  }

  return (
    <main className="page">
      <section className="auth-card">
        <h1>{welcome ? `ברוכים הבאים, ${user.fullName}!` : 'החשבון שלי'}</h1>

        <dl className="details">
          <dt>שם</dt>
          <dd>{user.fullName}</dd>
          <dt>אימייל</dt>
          <dd dir="ltr">{user.email}</dd>
          <dt>טלפון</dt>
          <dd dir="ltr">{user.phone ?? '—'}</dd>
          <dt>סוג חשבון</dt>
          <dd>{ROLE_LABELS[user.role]}</dd>
        </dl>
        {user.googleLinked && <span className="tag">מחובר עם Google</span>}

        {!user.emailVerified && (
          <p className="status warning" role="status">
            כתובת האימייל של החשבון עדיין לא מאומתת. עד לאימות, אירועים שנרשמו על כתובת זו לא יקושרו לחשבון.
            לבירור יש לפנות לסטודיו.
          </p>
        )}

        {user.phone === null && !saved && (
          <form className="form" onSubmit={handleSubmit(onSubmit)} noValidate>
            <h2>השלמת פרופיל</h2>
            <p className="muted">כדי שנוכל ליצור איתך קשר לגבי האירוע, הוסיפו מספר טלפון.</p>
            <label htmlFor="phone">טלפון</label>
            <input
              id="phone"
              type="tel"
              dir="ltr"
              autoComplete="tel"
              aria-invalid={errors.phone ? 'true' : 'false'}
              {...register('phone', {
                required: 'יש להזין מספר טלפון',
                validate: (v) => PHONE_PATTERN.test(v.trim()) || 'מספר טלפון לא תקין (7–19 ספרות, אפשר + בהתחלה)',
              })}
            />
            {errors.phone && (
              <p className="field-error" role="alert">
                {errors.phone.message}
              </p>
            )}
            <button className="btn" type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'שומר...' : 'שמירה'}
            </button>
            <ErrorMessage message={formError} />
          </form>
        )}
        {saved && <p className="status ok">הטלפון נשמר</p>}
      </section>
    </main>
  )
}
