import type { Photo, SortOrder } from '../types/photo'

export const monthFormatter = new Intl.DateTimeFormat('zh-CN', { month: 'long' })
export const fullDateFormatter = new Intl.DateTimeFormat('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' })

export function sortPhotos(photos: Photo[], order: SortOrder) {
  return [...photos].sort((left, right) => {
    const compared = left.capturedAt.localeCompare(right.capturedAt) || left.id.localeCompare(right.id)
    return order === 'newest' ? -compared : compared
  })
}

export function groupPhotosByYearAndMonth(photos: Photo[]) {
  const years = new Map<number, Map<number, Photo[]>>()
  for (const photo of photos) {
    const months = years.get(photo.year) ?? new Map<number, Photo[]>()
    months.set(photo.month, [...(months.get(photo.month) ?? []), photo])
    years.set(photo.year, months)
  }
  return [...years.entries()].map(([year, months]) => ({
    year,
    months: [...months.entries()].map(([month, entries]) => ({ month, photos: entries })),
  }))
}

export function formatMonth(month: number) {
  return monthFormatter.format(new Date(2000, month - 1, 1))
}

export function searchablePhotoText(photo: Photo) {
  return [photo.id, photo.title, photo.date, photo.location, photo.album, ...photo.tags].filter(Boolean).join(' ').toLocaleLowerCase('zh-CN')
}

export function mergePhotoMetadata<T extends Photo>(photo: T, metadata: Partial<Pick<Photo, 'title' | 'location' | 'album' | 'tags'>>) {
  return {
    ...photo,
    title: metadata.title?.trim() || photo.title,
    location: metadata.location?.trim() || photo.location,
    album: metadata.album?.trim() || photo.album,
    tags: metadata.tags?.filter((tag) => tag.trim()).map((tag) => tag.trim()) ?? photo.tags,
  }
}
