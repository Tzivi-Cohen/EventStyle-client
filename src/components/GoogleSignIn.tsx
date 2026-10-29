import { GoogleLogin, GoogleOAuthProvider, type CredentialResponse } from '@react-oauth/google'
import { useLayoutEffect, useRef, useState } from 'react'
import { env } from '../config/env'
import { useAuth } from '../hooks/useAuth'
import type { GoogleAuthResult } from '../types/user'
import { getErrorMessage } from '../utils/errorMessages'
import { ErrorMessage } from './ErrorMessage'
import { LoadingSpinner } from './LoadingSpinner'

const MIN_WIDTH = 200
const MAX_WIDTH = 400


export function GoogleSignIn({
  mode,
  onSignedIn,
}: {
  mode: 'signin' | 'signup'
  onSignedIn: (result: GoogleAuthResult) => void
}) {
  const { loginWithGoogle } = useAuth()
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const boxRef = useRef<HTMLDivElement>(null)
  const [width, setWidth] = useState(320)

  useLayoutEffect(() => {
    const measured = boxRef.current?.clientWidth
    if (measured) setWidth(Math.round(Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, measured))))
  }, [])

  if (!env.googleClientId) {
    return env.mode === 'production' ? null : (
      <p className="m-0 rounded-field border border-dashed border-line-strong bg-ivory px-4 py-3 text-center text-[0.875rem] text-ink-soft" role="note">
        ההתחברות עם Google אינה זמינה: הערך <code dir="ltr">VITE_GOOGLE_CLIENT_ID</code> חסר או לא תקין בקובץ ה-env.
      </p>
    )
  }

  async function handleSuccess({ credential }: CredentialResponse) {
    if (!credential) {
      setError('Google לא החזיר אישור התחברות. נסו שוב')
      return
    }
    setSubmitting(true)
    setError(null)
    try {
      onSignedIn(await loginWithGoogle(credential))
    } catch (e) {
      setError(getErrorMessage(e))
      setSubmitting(false)
    }
  }

  return (
    <GoogleOAuthProvider
      clientId={env.googleClientId}
      locale="he"
      onScriptLoadError={() => setError('לא ניתן לטעון את רכיב ההתחברות של Google. בדקו את החיבור לאינטרנט')}
    >
      <div className="mx-0 my-1 flex min-h-[44px] w-full justify-center overflow-hidden" ref={boxRef} aria-busy={submitting}>
        {submitting ? (
          <LoadingSpinner label="מתחבר עם Google..." />
        ) : (
          <GoogleLogin
            onSuccess={handleSuccess}
            onError={() => setError('ההתחברות עם Google בוטלה או נכשלה. נסו שוב')}
            text={mode === 'signup' ? 'signup_with' : 'signin_with'}
            theme="outline"
            size="large"
            shape="pill"
            logo_alignment="center"
            width={width}
          />
        )}
      </div>
      <ErrorMessage message={error} />
    </GoogleOAuthProvider>
  )
}
