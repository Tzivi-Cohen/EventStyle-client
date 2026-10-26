import { GoogleLogin, GoogleOAuthProvider, type CredentialResponse } from '@react-oauth/google'
import { useState } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { ErrorMessage } from '../components/ErrorMessage'
import { LoadingSpinner } from '../components/LoadingSpinner'
import { useAuth } from '../hooks/useAuth'
import { getErrorMessage } from '../utils/errorMessages'

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID

export function LoginPage() {
  const { status, loginWithGoogle } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const from = (location.state as { from?: string } | null)?.from ?? '/'

  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (status === 'loading') return <LoadingSpinner label="בודק התחברות..." />
  if (status === 'authenticated' && !submitting) return <Navigate to={from} replace />

  async function handleSuccess({ credential }: CredentialResponse) {
    if (!credential) {
      setError('Google לא החזיר אישור התחברות. נסו שוב')
      return
    }
    setSubmitting(true)
    setError(null)
    try {
      const { user, isNewUser } = await loginWithGoogle(credential)
      // משתמש חדש מ-Google נוצר בלי טלפון – מציעים להשלים בפרופיל
      if (isNewUser && !user.phone) navigate('/account', { replace: true, state: { welcome: true } })
      else navigate(from, { replace: true })
    } catch (e) {
      setError(getErrorMessage(e))
      setSubmitting(false)
    }
  }

  return (
    <main className="page">
      <section className="auth-card">
        <h1>התחברות באמצעות Google</h1>
        <p className="muted">
          ההתחברות וההרשמה מתבצעות עם חשבון Google. בכניסה הראשונה ייפתח עבורך חשבון לקוח.
        </p>

        {!GOOGLE_CLIENT_ID ? (
          <ErrorMessage message="התחברות עם Google לא הוגדרה באפליקציה (חסר VITE_GOOGLE_CLIENT_ID)" />
        ) : (
          <GoogleOAuthProvider
            clientId={GOOGLE_CLIENT_ID}
            locale="he"
            onScriptLoadError={() => setError('לא ניתן לטעון את רכיב ההתחברות של Google. בדקו את החיבור לאינטרנט')}
          >
            <div className="google-button" aria-busy={submitting}>
              {submitting ? (
                <LoadingSpinner label="מתחבר..." />
              ) : (
                <GoogleLogin
                  onSuccess={handleSuccess}
                  onError={() => setError('ההתחברות עם Google בוטלה או נכשלה. נסו שוב')}
                  text="signin_with"
                  shape="pill"
                  width={280}
                />
              )}
            </div>
          </GoogleOAuthProvider>
        )}

        <ErrorMessage message={error} />
      </section>
    </main>
  )
}
