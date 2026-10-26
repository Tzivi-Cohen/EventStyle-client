import type { GoogleAuthResult, ProfileUpdate, UserResponse } from '../types/api'
import { apiClient } from './apiClient'

export const authApi = {
  /** credential של Google Identity Services נשלח כמו שהוא, בשדה idToken בלבד */
  google: (idToken: string) => apiClient.post<GoogleAuthResult>('/auth/google', { idToken }),
  me: () => apiClient.get<UserResponse>('/auth/me'),
  updateMe: (data: ProfileUpdate) => apiClient.patch<UserResponse>('/auth/me', data),
}
