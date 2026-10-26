import { createContext } from 'react'
import type { GoogleAuthResult, ProfileUpdate, User } from '../types/api'

/** loading = בודקים Token שמור מול GET /auth/me. עד שהבדיקה מסתיימת לא מבצעים הפניות */
export type AuthStatus = 'loading' | 'authenticated' | 'anonymous'

export type AuthContextValue = {
  user: User | null
  status: AuthStatus
  /** שגיאה בבדיקת ה-Token בטעינה (למשל השרת כבוי). לא נמחק Token במקרה כזה */
  sessionError: string | null
  loginWithGoogle: (credential: string) => Promise<GoogleAuthResult>
  updateProfile: (data: ProfileUpdate) => Promise<User>
  logout: () => void
}

export const AuthContext = createContext<AuthContextValue | null>(null)
