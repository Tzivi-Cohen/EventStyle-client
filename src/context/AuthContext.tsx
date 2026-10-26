import { googleLogout } from '@react-oauth/google'
import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { ApiError, setUnauthorizedHandler } from '../api/apiClient'
import { authApi } from '../api/authApi'
import type { ProfileUpdate, User } from '../types/api'
import { getErrorMessage } from '../utils/errorMessages'
import { tokenStorage } from '../utils/tokenStorage'
import { AuthContext, type AuthContextValue, type AuthStatus } from './auth-context'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [status, setStatus] = useState<AuthStatus>(() => (tokenStorage.get() ? 'loading' : 'anonymous'))
  const [sessionError, setSessionError] = useState<string | null>(null)

  const clearSession = useCallback(() => {
    setUser(null)
    setStatus('anonymous')
  }, [])

  // 401 UNAUTHORIZED מכל בקשה → ה-apiClient כבר מחק את ה-Token, כאן מאפסים את המצב
  useEffect(() => {
    setUnauthorizedHandler(clearSession)
    return () => setUnauthorizedHandler(null)
  }, [clearSession])

  // ברענון הדף: אם יש Token שמור, מאמתים אותו מול השרת
  useEffect(() => {
    if (!tokenStorage.get()) return
    let cancelled = false
    authApi
      .me()
      .then(({ user: current }) => {
        if (cancelled) return
        setUser(current)
        setStatus('authenticated')
        setSessionError(null)
      })
      .catch((error: unknown) => {
        if (cancelled) return
        setUser(null)
        setStatus('anonymous')
        // ב-401 ה-Token כבר נמחק. בשגיאה אחרת (שרת כבוי) משאירים אותו לניסיון הבא
        if (!(error instanceof ApiError && error.status === 401)) {
          setSessionError(`לא ניתן היה לאמת את ההתחברות: ${getErrorMessage(error)}`)
        }
      })
    return () => {
      cancelled = true
    }
  }, [])

  const loginWithGoogle = useCallback(async (credential: string) => {
    const result = await authApi.google(credential)
    tokenStorage.set(result.token)
    setUser(result.user)
    setStatus('authenticated')
    setSessionError(null)
    return result
  }, [])

  const updateProfile = useCallback(async (data: ProfileUpdate) => {
    const { user: updated } = await authApi.updateMe(data)
    setUser(updated)
    return updated
  }, [])

  // אין Endpoint להתנתקות: מוחקים את ה-Token ומבטלים כניסה אוטומטית של Google
  const logout = useCallback(() => {
    tokenStorage.clear()
    googleLogout()
    setSessionError(null)
    clearSession()
  }, [clearSession])

  const value = useMemo<AuthContextValue>(
    () => ({ user, status, sessionError, loginWithGoogle, updateProfile, logout }),
    [user, status, sessionError, loginWithGoogle, updateProfile, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
