import { createContext } from 'react'
import type {
  AuthResult,
  GoogleAuthResult,
  LoginInput,
  ProfileUpdate,
  RegisterInput,
  RegisterResult,
  User,
} from '../types/user'

/** loading = בודקים Token שמור מול GET /auth/me. עד שהבדיקה מסתיימת לא מבצעים הפניות */
export type AuthStatus = 'loading' | 'authenticated' | 'anonymous'

/**
 * המידע הגלובלי היחיד באפליקציה: המשתמשת המחוברת, ה-Token ופעולות ההתחברות.
 * נתונים מהשרת (אירועים, חבילות, תמונות) לא נשמרים כאן – הם מנוהלים ב-TanStack Query.
 */
export type AuthContextValue = {
  user: User | null
  token: string | null
  status: AuthStatus
  /** שגיאה בבדיקת ה-Token בטעינה (למשל השרת כבוי). לא נמחק Token במקרה כזה */
  sessionError: string | null
  /** true אחרי ניתוק אוטומטי בגלל Token שפג תוקפו – מוצגת הודעה במסך ההתחברות */
  sessionExpired: boolean
  /** true אחרי התנתקות יזומה – נתיב מוגן מפנה לדף הבית ולא למסך ההתחברות */
  signedOut: boolean
  login: (data: LoginInput) => Promise<AuthResult>
  register: (data: RegisterInput) => Promise<RegisterResult>
  loginWithGoogle: (credential: string) => Promise<GoogleAuthResult>
  updateProfile: (data: ProfileUpdate) => Promise<User>
  logout: () => void
}

export const AuthContext = createContext<AuthContextValue | null>(null)
