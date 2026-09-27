export type DateSource = 'exif' | 'filename' | 'export-timestamp' | 'git' | 'modified-time'

export interface PhotoSources {
  avif: string[]
  webp: string[]
}

export interface Photo {
  id: string
  source: string
  date: string
  capturedAt: string
  dateSource: DateSource
  year: number
  month: number
  day: number
  width: number
  height: number
  title: string
  location: string | null
  album: string
  tags: string[]
  placeholder: string
  sources: PhotoSources
  sha256: string
}

export interface PhotoManifest {
  generatedAt: string
  photos: Photo[]
}

export type SortOrder = 'newest' | 'oldest'
