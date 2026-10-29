import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { galleryApi } from '../api/galleryApi'
import { packagesApi } from '../api/packagesApi'
import { queryKeys } from '../api/queryClient'
import type { AdminGalleryFilters, GalleryUpdate, GalleryUploadInput } from '../types/gallery'
import type { AdminPackageFilters, PackageInput } from '../types/package'

export function useAdminPackages(filters: AdminPackageFilters) {
  return useQuery({ queryKey: queryKeys.adminPackages(filters), queryFn: () => packagesApi.adminList(filters) })
}

/** שינוי בחבילה מרענן גם את המחירון הציבורי (כל המפתחות מתחילים ב-'packages') */
function useInvalidatePackages() {
  const queryClient = useQueryClient()
  return () => queryClient.invalidateQueries({ queryKey: ['packages'] })
}

export function useSavePackage() {
  const invalidate = useInvalidatePackages()
  return useMutation({
    mutationFn: ({ id, data }: { id?: number; data: PackageInput }) =>
      id ? packagesApi.update(id, data) : packagesApi.create(data),
    onSuccess: invalidate,
  })
}

export function useArchivePackage() {
  const invalidate = useInvalidatePackages()
  return useMutation({ mutationFn: (id: number) => packagesApi.archive(id), onSuccess: invalidate })
}

export function useAdminGallery(filters: AdminGalleryFilters) {
  return useQuery({
    queryKey: queryKeys.adminGallery(filters),
    queryFn: () => galleryApi.adminList(filters),
    placeholderData: keepPreviousData,
  })
}

function useInvalidateGallery() {
  const queryClient = useQueryClient()
  return () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: ['gallery'] }),
      queryClient.invalidateQueries({ queryKey: ['photos'] }),
    ])
}

export function useUploadGalleryItem() {
  const invalidate = useInvalidateGallery()
  return useMutation({
    mutationFn: ({ image, data, onProgress }: { image: File; data: GalleryUploadInput; onProgress?: (p: number) => void }) =>
      galleryApi.upload(image, data, { onProgress }),
    onSuccess: invalidate,
  })
}

export function useUpdateGalleryItem() {
  const invalidate = useInvalidateGallery()
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: GalleryUpdate }) => galleryApi.update(id, data),
    onSuccess: invalidate,
  })
}

export function useDeleteGalleryItem() {
  const invalidate = useInvalidateGallery()
  return useMutation({ mutationFn: (id: number) => galleryApi.remove(id), onSuccess: invalidate })
}
