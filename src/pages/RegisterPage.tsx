import { useForm } from 'react-hook-form'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { fieldErrors } from '../api/apiClient'
import { GoogleSignIn } from '../components/GoogleSignIn'
import { LoadingSpinner } from '../components/LoadingSpinner'
import { Alert } from '../components/ui/Alert'
import { Field } from '../components/ui/Field'
import { fieldProps } from '../utils/fieldProps'
import { useAuth } from '../hooks/useAuth'
import { useToast } from '../hooks/useToast'
import type { GoogleAuthResult, RegisterInput } from '../types/user'
import { afterLoginPath, fromState } from '../utils/authRedirect'
import { authClasses } from '../styles/authClasses'
import { getErrorMessage } from '../utils/errorMessages'
import { validateEmail, validateFullName, validatePassword, validatePhone } from '../utils/validation'

type RegisterForm = RegisterInput & { confirmPassword: string }

export function RegisterPage() {
  const { status, user, register: registerUser } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const toast = useToast()
  const from = fromState(location.state)
  const {
    register,
    handleSubmit,
    setError,
    getValues,
    formState: { errors, isSubmitting },
  } = useForm<RegisterForm>({ defaultValues: { fullName: '', email: '', phone: '', password: '', confirmPassword: '' } })

  if (status === 'loading') return <LoadingSpinner label="בודק התחברות..." />
  if (status === 'authenticated' && user && !isSubmitting) return <Navigate to={afterLoginPath(user, from)} replace />

  async function onSubmit({ confirmPassword: _confirm, ...data }: RegisterForm) {
    try {
      const { user: created } = await registerUser({
        ...data,
        fullName: data.fullName.trim(),
        email: data.email.trim(),
        phone: data.phone.trim(),
      })
      toast.success(`ההרשמה הושלמה – ברוכה הבאה, ${created.fullName}!`)
      navigate(afterLoginPath(created, from), { replace: true })
    } catch (e) {
      const fields = fieldErrors(e)
      const known = (['fullName', 'email', 'phone', 'password'] as const).filter((name) => fields[name])
      known.forEach((name) => setError(name, { message: 'הערך אינו תקין' }))
      if (known.length === 0) setError('root', { message: getErrorMessage(e) })
    }
  }

  function onGoogleSignedIn({ user: signedIn, isNewUser }: GoogleAuthResult) {
    // חשבון שכבר היה מקושר ל-Google – זו פשוט התחברות, לא נוצר חשבון כפול
    toast.success(isNewUser ? `ברוכה הבאה, ${signedIn.fullName}!` : `כבר יש לך חשבון – התחברת בהצלחה, ${signedIn.fullName}`)
    navigate(afterLoginPath(signedIn, from), { replace: true })
  }

  return (
    <main className={authClasses.page}>
      <section className={authClasses.card} aria-labelledby="register-title">
        <header className={authClasses.header}>
          <p className={authClasses.eyebrow}>EventStyle</p>
          <h1 id="register-title" className={authClasses.title}>הרשמה</h1>
          <p className={authClasses.lead}>החשבון מאפשר לעקוב אחרי האירוע שלכם. הירשמו עם אותה כתובת אימייל שמסרתם לסטודיו.</p>
        </header>

        <div className={authClasses.option} role="group" aria-label="הרשמה באמצעות Google">
          <GoogleSignIn mode="signup" onSignedIn={onGoogleSignedIn} />
        </div>

        <p className={authClasses.divider}>
          <span>או עם אימייל וסיסמה</span>
        </p>

        <form className={`form ${authClasses.option}`} onSubmit={handleSubmit(onSubmit)} noValidate>
          <Field id="reg-name" label="שם מלא" error={errors.fullName?.message} required>
            <input {...fieldProps('reg-name', errors.fullName?.message)} autoComplete="name" {...register('fullName', { validate: validateFullName })} />
          </Field>
          <Field id="reg-email" label="אימייל" error={errors.email?.message} required>
            <input
              {...fieldProps('reg-email', errors.email?.message)}
              type="email"
              dir="ltr"
              autoComplete="email"
              {...register('email', { validate: validateEmail })}
            />
          </Field>
          <Field id="reg-phone" label="טלפון" error={errors.phone?.message} required>
            <input
              {...fieldProps('reg-phone', errors.phone?.message)}
              type="tel"
              dir="ltr"
              autoComplete="tel"
              {...register('phone', { validate: validatePhone })}
            />
          </Field>
          <Field id="reg-password" label="סיסמה" error={errors.password?.message} hint="לפחות 8 תווים, אות באנגלית וספרה" required>
            <input
              {...fieldProps('reg-password', errors.password?.message, true)}
              type="password"
              dir="ltr"
              autoComplete="new-password"
              {...register('password', { validate: validatePassword })}
            />
          </Field>
          <Field id="reg-confirm" label="אימות סיסמה" error={errors.confirmPassword?.message} required>
            <input
              {...fieldProps('reg-confirm', errors.confirmPassword?.message)}
              type="password"
              dir="ltr"
              autoComplete="new-password"
              {...register('confirmPassword', { validate: (v) => v === getValues('password') || 'הסיסמאות אינן תואמות' })}
            />
          </Field>
          {errors.root && <Alert kind="error">{errors.root.message}</Alert>}
          <button className="btn btn-block" type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'נרשם...' : 'הרשמה'}
          </button>
        </form>

        <p className={authClasses.note}>בהרשמה עם Google אין צורך ליצור סיסמה.</p>

        <footer className={authClasses.switch}>
          כבר יש לך חשבון?{' '}
          <Link to="/login" className={authClasses.switchLink} state={from ? { from } : undefined}>
            להתחברות
          </Link>
        </footer>
      </section>
    </main>
  )
}
