import type { EventType, Health } from '../types/common'
import type { AdminPackage, AdminPackageFilters, Package, PackageInput } from '../types/package'
import { apiClient } from './apiClient'

export const packagesApi = {
  /** המחירון הציבורי: חבילות פעילות. עם eventType – חבילות הסוג ואחריהן הכלליות */
  list: (eventType?: EventType) => apiClient.get<Package[]>('/packages', { eventType }),
  adminList: (filters: AdminPackageFilters = {}) => apiClient.get<AdminPackage[]>('/admin/packages', filters),
  create: (data: PackageInput) => apiClient.post<AdminPackage>('/packages', data),
  update: (id: number, data: PackageInput) => apiClient.put<AdminPackage>(`/packages/${id}`, data),
  /** העברה לארכיון בלבד – ללא מחיקה פיזית. החזרה: update עם isActive=true */
  archive: (id: number) => apiClient.delete(`/packages/${id}`),
}

export const systemApi = {
  health: () => apiClient.get<Health>('/health'),
}
