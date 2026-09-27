import type { Photo } from '../types/photo'
import { formatMonth, fullDateFormatter, groupPhotosByYearAndMonth } from '../utils/photos'
import { assetUrl } from '../utils/url'
import { Reveal } from './Reveal'

interface TimelineProps {
  photos: Photo[]
  onOpen: (photo: Photo) => void
}

export function Timeline({ photos, onOpen }: TimelineProps) {
  const groups = groupPhotosByYearAndMonth(photos)
  return (
    <div className="timeline">
      {groups.map(({ year, months }, yearIndex) => (
        <Reveal className="timeline-year" key={year} delay={yearIndex * 60}>
          <div className="timeline-year__marker"><span>{year}</span><i /></div>
          <div className="timeline-year__content">
            {months.map(({ month, photos: monthPhotos }) => (
              <div className="timeline-month" key={`${year}-${month}`}>
                <div className="timeline-month__heading"><span>{formatMonth(month)}</span><small>{monthPhotos.length} frames</small></div>
                <div className="timeline-frames">
                  {monthPhotos.map((photo) => (
                    <button type="button" className="timeline-frame" key={photo.id} onClick={() => onOpen(photo)}>
                      <img src={assetUrl(photo.sources.webp[0] ?? photo.source)} alt="" loading="lazy" />
                      <span><strong>{photo.title}</strong><small>{fullDateFormatter.format(new Date(`${photo.date}T00:00:00`))}</small></span>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </Reveal>
      ))}
    </div>
  )
}
