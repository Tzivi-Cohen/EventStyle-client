export type Role = 'Admin' | 'Client'

export type User = {
  id: number
  fullName: string
  email: string
  phone: string | null
  address: string | null
  role: Role
  emailVerified: boolean
  googleLinked: boolean
  createdAt: string
}

export type AuthResult = {
  token: string
  user: User
}

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

export type ProfileUpdate = {
  fullName?: string
  phone?: string
  address?: string | null
}
