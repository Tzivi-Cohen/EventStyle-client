import type { Health, Package } from '../types/api'
import { apiClient } from './apiClient'

export const packagesApi = {
  list: () => apiClient.get<Package[]>('/packages'),
}

export const systemApi = {
  health: () => apiClient.get<Health>('/health'),
}
