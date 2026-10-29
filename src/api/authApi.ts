import type {
  AuthResult,
  GoogleAuthResult,
  LoginInput,
  ProfileUpdate,
  RegisterInput,
  RegisterResult,
  UserResponse,
} from '../types/user'
import { apiClient } from './apiClient'

export const authApi = {
  register: (data: RegisterInput) => apiClient.post<RegisterResult>('/auth/register', data),
  login: (data: LoginInput) => apiClient.post<AuthResult>('/auth/login', data),
  google: (idToken: string) => apiClient.post<GoogleAuthResult>('/auth/google', { idToken }),
  me: () => apiClient.get<UserResponse>('/auth/me'),
  updateMe: (data: ProfileUpdate) => apiClient.patch<UserResponse>('/auth/me', data),
}
