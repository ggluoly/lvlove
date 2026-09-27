import path from 'node:path'

const STANDARD_NAME = /^(?<date>\d{8})(?<sequence>\d{3})\.(?<extension>jpe?g|png|webp|avif)$/i
const CAMERA_NAME = /(?:^|[_-])IMG[_-]?(?<date>\d{8})[_-]?(?<time>\d{6})(?:[_-]\d+)?\.(?:jpe?g|png|webp|avif)$/i
const EXPORT_NAME = /^mmexport(?<timestamp>\d{13})\.(?:jpe?g|png|webp|avif)$/i

export const SUPPORTED_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.webp', '.avif'])

export function isSupportedPhoto(filename) {
  return SUPPORTED_EXTENSIONS.has(path.extname(filename).toLowerCase())
}

export function formatDateParts(date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}${month}${day}`
}

export function parseDateFromFilename(filename) {
  const standard = filename.match(STANDARD_NAME)
  if (standard?.groups?.date) {
    return dateFromCompactDate(standard.groups.date, 'filename')
  }

  const camera = filename.match(CAMERA_NAME)
  if (camera?.groups?.date && camera.groups.time) {
    const parsed = dateFromCompactDate(camera.groups.date, 'filename')
    if (!parsed) return null
    const [hours, minutes, seconds] = [
      camera.groups.time.slice(0, 2),
      camera.groups.time.slice(2, 4),
      camera.groups.time.slice(4, 6),
    ].map(Number)
    parsed.date.setHours(hours, minutes, seconds, 0)
    return parsed
  }

  const exported = filename.match(EXPORT_NAME)
  if (exported?.groups?.timestamp) {
    const date = new Date(Number(exported.groups.timestamp))
    return Number.isNaN(date.getTime()) ? null : { date, source: 'export-timestamp' }
  }

  return null
}

export function parseStandardFilename(filename) {
  const match = filename.match(STANDARD_NAME)
  if (!match?.groups?.date || !match.groups.sequence) return null
  const parsed = dateFromCompactDate(match.groups.date, 'filename')
  if (!parsed) return null
  return { ...parsed, sequence: Number(match.groups.sequence), extension: match.groups.extension.toLowerCase() }
}

export function dateFromCompactDate(value, source = 'filename') {
  if (!/^\d{8}$/.test(value)) return null
  const year = Number(value.slice(0, 4))
  const month = Number(value.slice(4, 6))
  const day = Number(value.slice(6, 8))
  const date = new Date(year, month - 1, day)
  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) return null
  return { date, source }
}

export function toIsoDate(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

export function toLocalIsoDateTime(date) {
  const offset = -date.getTimezoneOffset()
  const sign = offset >= 0 ? '+' : '-'
  const offsetHours = String(Math.floor(Math.abs(offset) / 60)).padStart(2, '0')
  const offsetMinutes = String(Math.abs(offset) % 60).padStart(2, '0')
  return `${toIsoDate(date)}T${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}:${String(date.getSeconds()).padStart(2, '0')}${sign}${offsetHours}:${offsetMinutes}`
}

export function compareByCapturedAtDescending(a, b) {
  return b.capturedAt.localeCompare(a.capturedAt) || b.id.localeCompare(a.id)
}
