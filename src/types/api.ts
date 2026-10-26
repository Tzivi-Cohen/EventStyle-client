// טיפוסים לפי ה-Swagger של השרת (components.schemas) – רק מה שנדרש לשלב ההתחברות

export type Role = 'Admin' | 'Client'

export type User = {
  id: number
  fullName: string
  email: string
  phone: string | null // null למשתמש Google שעוד לא הוסיף טלפון
  role: Role
  emailVerified: boolean
  googleLinked: boolean
  createdAt: string
}

/** תשובת POST /auth/google */
export type GoogleAuthResult = {
  token: string
  user: User
  isNewUser: boolean
}

/** תשובת GET /auth/me ו-PATCH /auth/me */
export type UserResponse = {
  user: User
}

/** גוף PATCH /auth/me – לפחות שדה אחד */
export type ProfileUpdate = {
  fullName?: string
  phone?: string
}

export type Package = {
  id: number
  name: string
  description: string
  price: number
  features: string[]
  imageUrl: string
}

export type Health = {
  status: 'ok' | 'error'
  database: 'ok' | 'unreachable'
  uptimeSeconds: number
  timestamp: string
}

export type ApiErrorBody = {
  error: {
    code: string
    message: string
    details?: unknown
  }
}
