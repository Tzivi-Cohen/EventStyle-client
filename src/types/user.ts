export type Role = 'Admin' | 'Client'

export type User = {
  id: number
  fullName: string
  /** תמיד באותיות קטנות. לקריאה בלבד */
  email: string
  /** null למשתמש Google שעוד לא הוסיף טלפון */
  phone: string | null
  /** null כשלא הוגדרה כתובת. נוספת רק בעריכת הפרופיל */
  address: string | null
  role: Role
  /** הבעלות על הכתובת הוכחה (Google עם Gmail / Workspace). לא חוסם דבר – אין אימות בקוד */
  emailVerified: boolean
  googleLinked: boolean
  createdAt: string
}

export type AuthResult = {
  token: string
  user: User
}

/** תשובת POST /auth/register – מחוברים מיד, בלי קוד אימות */
export type RegisterResult = AuthResult & {
  message: string
}

export type GoogleAuthResult = AuthResult & {
  isNewUser: boolean
}

export type UserResponse = {
  user: User
}

export type RegisterInput = {
  fullName: string
  email: string
  phone: string
  password: string
}

export type LoginInput = {
  email: string
  password: string
}

/** גוף PATCH /auth/me – לפחות שדה אחד. address=null מוחק את הכתובת */
export type ProfileUpdate = {
  fullName?: string
  phone?: string
  address?: string | null
}
