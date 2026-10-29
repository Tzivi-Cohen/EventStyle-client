import { googleLogout } from '@react-oauth/google'
import { useQueryClient } from '@tanstack/react-query'
import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { ApiError, setUnauthorizedHandler } from '../api/apiClient'
import { authApi } from '../api/authApi'
import type { AuthResult, LoginInput, ProfileUpdate, RegisterInput, User } from '../types/user'
import { getErrorMessage } from '../utils/errorMessages'
import { tokenStorage } from '../utils/tokenStorage'
import { AuthContext, type AuthContextValue, type AuthStatus } from './auth-context'

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient()
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(() => tokenStorage.get())
  const [status, setStatus] = useState<AuthStatus>(() => (tokenStorage.get() ? 'loading' : 'anonymous'))
  const [sessionError, setSessionError] = useState<string | null>(null)
  const [sessionExpired, setSessionExpired] = useState(false)
  const [signedOut, setSignedOut] = useState(false)

  /**
   * איפוס מלא של המצב: המשתמשת, ה-Token, וכל ה-Cache של השרת –
   * כולל קישורי הצפייה הזמניים לתמונות הפרטיות, כך שהם לא נשארים זמינים לחשבון הבא.
   */
  const clearSession = useCallback(() => {
    tokenStorage.clear()
    setToken(null)
    setUser(null)
    setStatus('anonymous')
    queryClient.clear()
  }, [queryClient])

  // 401 UNAUTHORIZED מכל בקשה → ה-Token פג או המשתמשת נמחקה
  useEffect(() => {
    setUnauthorizedHandler(() => {
      setSessionExpired(true)
      clearSession()
    })
    return () => setUnauthorizedHandler(null)
  }, [clearSession])

  // ברענון הדף: אם יש Token שמור, מאמתים אותו מול השרת (GET /auth/me)
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

  /** שמירת התחברות חדשה. אם זו משתמשת אחרת – ה-Cache של הקודמת נמחק */
  const startSession = useCallback(
    (result: AuthResult) => {
      if (user && user.id !== result.user.id) queryClient.clear()
      tokenStorage.set(result.token)
      setToken(result.token)
      setUser(result.user)
      setStatus('authenticated')
      setSessionError(null)
      setSessionExpired(false)
      setSignedOut(false)
    },
    [queryClient, user],
  )

  const login = useCallback(
    async (data: LoginInput) => {
      const result = await authApi.login(data)
      startSession(result)
      return result
    },
    [startSession],
  )

  const register = useCallback(
    async (data: RegisterInput) => {
      const result = await authApi.register(data)
      startSession(result)
      return result
    },
    [startSession],
  )

  const loginWithGoogle = useCallback(
    async (credential: string) => {
      const result = await authApi.google(credential)
      startSession(result)
      return result
    },
    [startSession],
  )

  const updateProfile = useCallback(async (data: ProfileUpdate) => {
    const { user: updated } = await authApi.updateMe(data)
    setUser(updated)
    return updated
  }, [])

  // אין Endpoint להתנתקות: מוחקים את ה-Token, ה-Cache, ומבטלים כניסה אוטומטית של Google
  const logout = useCallback(() => {
    googleLogout()
    setSessionError(null)
    setSessionExpired(false)
    setSignedOut(true)
    clearSession()
  }, [clearSession])

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      token,
      status,
      sessionError,
      sessionExpired,
      signedOut,
      login,
      register,
      loginWithGoogle,
      updateProfile,
      logout,
    }),
    [user, token, status, sessionError, sessionExpired, signedOut, login, register, loginWithGoogle, updateProfile, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
