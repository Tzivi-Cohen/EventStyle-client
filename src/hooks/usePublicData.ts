import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { galleryApi } from '../api/galleryApi'
import { packagesApi } from '../api/packagesApi'
import { queryKeys } from '../api/queryClient'
import type { EventType } from '../types/common'
import type { GalleryFilters } from '../types/gallery'

export function usePackages(eventType?: EventType) {
  return useQuery({
    queryKey: queryKeys.packages(eventType),
    queryFn: () => packagesApi.list(eventType),
  })
}

/** הגלריה הציבורית – רק פריטים מפורסמים. בעמוד חדש הנתונים הקודמים נשארים עד שהחדשים מגיעים */
export function useGallery(filters: GalleryFilters) {
  return useQuery({
    queryKey: queryKeys.gallery(filters),
    queryFn: () => galleryApi.list(filters),
    placeholderData: keepPreviousData,
  })
}

export function useGallerySummary() {
  return useQuery({
    queryKey: queryKeys.gallerySummary(),
    queryFn: galleryApi.summary,
  })
}
