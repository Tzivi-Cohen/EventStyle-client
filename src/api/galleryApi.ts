import type { Paginated } from '../types/common'
import type {
  AdminGalleryFilters,
  AdminGalleryItem,
  GalleryFilters,
  GalleryItem,
  GallerySummaryItem,
  GalleryUpdate,
  GalleryUploadInput,
} from '../types/gallery'
import { apiClient, type UploadOptions } from './apiClient'

export const galleryApi = {
  list: (filters: GalleryFilters = {}) => apiClient.get<Paginated<GalleryItem>>('/gallery', filters),
  summary: () => apiClient.get<GallerySummaryItem[]>('/gallery/summary'),
  adminList: (filters: AdminGalleryFilters = {}) => apiClient.get<Paginated<AdminGalleryItem>>('/admin/gallery', filters),
  /** multipart: קובץ אחד בשדה image, ושדות טקסט (בוליאנים ומספרים נשלחים כמחרוזות) */
  upload: (image: File, data: GalleryUploadInput, options?: UploadOptions) => {
    const form = new FormData()
    form.append('image', image)
    form.append('title', data.title)
    form.append('category', data.category)
    if (data.isPublished !== undefined) form.append('isPublished', String(data.isPublished))
    if (data.isFeatured !== undefined) form.append('isFeatured', String(data.isFeatured))
    if (data.sortOrder !== undefined) form.append('sortOrder', String(data.sortOrder))
    return apiClient.upload<AdminGalleryItem>('/gallery', form, options)
  },
  update: (id: number, data: GalleryUpdate) => apiClient.patch<AdminGalleryItem>(`/gallery/${id}`, data),
  remove: (id: number) => apiClient.delete(`/gallery/${id}`),
}
