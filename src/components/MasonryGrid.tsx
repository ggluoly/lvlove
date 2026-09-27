import type { Photo } from '../types/photo'
import { PhotoCard } from './PhotoCard'

interface MasonryGridProps {
  photos: Photo[]
  onOpen: (photo: Photo) => void
}

export function MasonryGrid({ photos, onOpen }: MasonryGridProps) {
  return (
    <div className="masonry-grid">
      {photos.map((photo, index) => <PhotoCard key={photo.id} photo={photo} position={index} priority={index < 4} onOpen={onOpen} />)}
    </div>
  )
}
