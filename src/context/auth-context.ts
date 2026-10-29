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

export type AuthStatus = 'loading' | 'authenticated' | 'anonymous'

export type AuthContextValue = {
  user: User | null
  token: string | null
  status: AuthStatus
  sessionError: string | null
  sessionExpired: boolean
  signedOut: boolean
  login: (data: LoginInput) => Promise<AuthResult>
  register: (data: RegisterInput) => Promise<RegisterResult>
  loginWithGoogle: (credential: string) => Promise<GoogleAuthResult>
  updateProfile: (data: ProfileUpdate) => Promise<User>
  logout: () => void
}

export const AuthContext = createContext<AuthContextValue | null>(null)
