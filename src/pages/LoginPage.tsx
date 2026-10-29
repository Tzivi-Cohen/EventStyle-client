import { useForm } from 'react-hook-form'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { GoogleSignIn } from '../components/GoogleSignIn'
import { LoadingSpinner } from '../components/LoadingSpinner'
import { Alert } from '../components/ui/Alert'
import { Field } from '../components/ui/Field'
import { fieldProps } from '../utils/fieldProps'
import { useAuth } from '../hooks/useAuth'
import { useToast } from '../hooks/useToast'
import type { GoogleAuthResult, LoginInput } from '../types/user'
import { afterLoginPath, fromState } from '../utils/authRedirect'
import { authClasses } from '../styles/authClasses'
import { getErrorMessage } from '../utils/errorMessages'
import { validateEmail } from '../utils/validation'

export function LoginPage() {
  const { status, user, login, sessionExpired } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const toast = useToast()
  const from = fromState(location.state)

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({ defaultValues: { email: '', password: '' } })

  if (status === 'loading') return <LoadingSpinner label="בודק התחברות..." />
  if (status === 'authenticated' && user && !isSubmitting) return <Navigate to={afterLoginPath(user, from)} replace />

  async function onSubmit(data: LoginInput) {
    try {
      const result = await login({ email: data.email.trim(), password: data.password })
      toast.success(`שלום, ${result.user.fullName}`)
      navigate(afterLoginPath(result.user, from), { replace: true })
    } catch (e) {
      setError('root', { message: getErrorMessage(e) })
    }
  }

  function onGoogleSignedIn({ user: signedIn, isNewUser }: GoogleAuthResult) {
    toast.success(isNewUser ? `ברוכה הבאה, ${signedIn.fullName}!` : `שלום, ${signedIn.fullName}`)
    navigate(afterLoginPath(signedIn, from), { replace: true })
  }

  return (
    <main className={authClasses.page}>
      <section className={authClasses.card} aria-labelledby="login-title">
        <header className={authClasses.header}>
          <p className={authClasses.eyebrow}>EventStyle</p>
          <h1 id="login-title" className={authClasses.title}>התחברות</h1>
          <p className={authClasses.lead}>ברוכים השבים! בחרו איך להתחבר</p>
        </header>

        {sessionExpired && <Alert kind="warning">פג תוקף ההתחברות. יש להתחבר מחדש.</Alert>}

        <div className={authClasses.option} role="group" aria-label="התחברות באמצעות Google">
          <GoogleSignIn mode="signin" onSignedIn={onGoogleSignedIn} />
        </div>

        <p className={authClasses.divider}>
          <span>או עם אימייל וסיסמה</span>
        </p>

        <form className={`form ${authClasses.option}`} onSubmit={handleSubmit(onSubmit)} noValidate>
          <Field id="login-email" label="אימייל" error={errors.email?.message} required>
            <input
              {...fieldProps('login-email', errors.email?.message)}
              type="email"
              dir="ltr"
              autoComplete="email"
              {...register('email', { validate: validateEmail })}
            />
          </Field>
          <Field id="login-password" label="סיסמה" error={errors.password?.message} required>
            <input
              {...fieldProps('login-password', errors.password?.message)}
              type="password"
              dir="ltr"
              autoComplete="current-password"
              {...register('password', { required: 'יש להזין סיסמה' })}
            />
          </Field>
          {errors.root && <Alert kind="error">{errors.root.message}</Alert>}
          <button className="btn btn-block" type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'מתחבר...' : 'התחברות'}
          </button>
        </form>

        <p className={authClasses.note}>נרשמת עם Google? התחברי עם כפתור Google – אין צורך בסיסמה.</p>

        <footer className={authClasses.switch}>
          אין לך חשבון?{' '}
          <Link to="/register" className={authClasses.switchLink} state={from ? { from } : undefined}>
            להרשמה
          </Link>
        </footer>
      </section>
    </main>
  )
}
