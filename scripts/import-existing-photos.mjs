import { createHash } from 'node:crypto'
import { cp, mkdir, readdir, readFile, stat, writeFile } from 'node:fs/promises'
import path from 'node:path'
import exifr from 'exifr'
import { formatDateParts, isSupportedPhoto, parseDateFromFilename, toIsoDate, toLocalIsoDateTime } from './photo-utils.mjs'

const root = path.resolve(import.meta.dirname, '..')
const sourceDirectory = path.resolve(root, process.env.PHOTO_IMPORT_SOURCE ?? '20260927')
const destinationDirectory = path.resolve(root, 'public/photos')
const reportDirectory = path.resolve(root, 'reports')
const importMetadataFile = path.resolve(root, 'photos.import-metadata.json')

async function getFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true })
  const files = await Promise.all(entries.map(async (entry) => {
    const filePath = path.join(directory, entry.name)
    if (entry.isDirectory()) return getFiles(filePath)
    return isSupportedPhoto(entry.name) ? [filePath] : []
  }))
  return files.flat()
}

async function getGitDate(filePath) {
  const { execFile } = await import('node:child_process')
  const { promisify } = await import('node:util')
  try {
    const { stdout } = await promisify(execFile)('git', ['log', '-1', '--format=%cI', '--', filePath], { cwd: root })
    const date = new Date(stdout.trim())
    return Number.isNaN(date.getTime()) ? null : date
  } catch {
    return null
  }
}

async function detectCaptureDate(filePath) {
  const filename = path.basename(filePath)
  try {
    const exif = await exifr.parse(filePath, ['DateTimeOriginal', 'CreateDate'])
    const date = exif?.DateTimeOriginal ?? exif?.CreateDate
    if (date instanceof Date && !Number.isNaN(date.getTime())) return { date, source: 'exif' }
  } catch {
    // Unsupported or metadata-free files continue to the deterministic fallbacks.
  }

  const fromFilename = parseDateFromFilename(filename)
  if (fromFilename) return fromFilename

  const gitDate = await getGitDate(filePath)
  if (gitDate) return { date: gitDate, source: 'git' }

  const fileStat = await stat(filePath)
  return { date: fileStat.mtime, source: 'modified-time' }
}

async function contentHash(filePath) {
  const content = await readFile(filePath)
  return createHash('sha256').update(content).digest('hex')
}

const sourceFiles = await getFiles(sourceDirectory)
if (sourceFiles.length === 0) {
  throw new Error(`没有在 ${sourceDirectory} 中找到受支持的图片文件。`)
}

const photos = await Promise.all(sourceFiles.map(async (filePath) => {
  const capture = await detectCaptureDate(filePath)
  return {
    filePath,
    filename: path.basename(filePath),
    capture,
    hash: await contentHash(filePath),
  }
}))

photos.sort((a, b) => a.capture.date.getTime() - b.capture.date.getTime() || a.filename.localeCompare(b.filename))

const sequenceByDate = new Map()
const imported = []
const importMetadata = {}
await mkdir(destinationDirectory, { recursive: true })
await mkdir(reportDirectory, { recursive: true })

for (const photo of photos) {
  const compactDate = formatDateParts(photo.capture.date)
  const nextSequence = (sequenceByDate.get(compactDate) ?? 0) + 1
  if (nextSequence > 999) throw new Error(`${toIsoDate(photo.capture.date)} 的照片数量超过 999 张。`)
  sequenceByDate.set(compactDate, nextSequence)

  const canonicalFilename = `${compactDate}${String(nextSequence).padStart(3, '0')}${path.extname(photo.filename).toLowerCase()}`
  const destination = path.join(destinationDirectory, canonicalFilename)
  let status = 'copied'

  try {
    const existingHash = await contentHash(destination)
    if (existingHash === photo.hash) {
      status = 'already-present'
    } else {
      throw new Error(`目标文件冲突：${canonicalFilename} 已存在但内容不同。`)
    }
  } catch (error) {
    if (error?.code === 'ENOENT') {
      await cp(photo.filePath, destination, { errorOnExist: true })
    } else {
      throw error
    }
  }

  imported.push({
    source: path.relative(root, photo.filePath).replaceAll('\\', '/'),
    destination: `public/photos/${canonicalFilename}`,
    capturedAt: toLocalIsoDateTime(photo.capture.date),
    date: toIsoDate(photo.capture.date),
    dateSource: photo.capture.source,
    sha256: photo.hash,
    status,
  })
  importMetadata[canonicalFilename] = {
    capturedAt: toLocalIsoDateTime(photo.capture.date),
    dateSource: photo.capture.source,
  }
}

await writeFile(
  path.join(reportDirectory, 'import-manifest.json'),
  `${JSON.stringify({ generatedAt: new Date().toISOString(), sourceDirectory: path.relative(root, sourceDirectory), photos: imported }, null, 2)}\n`,
)
await writeFile(importMetadataFile, `${JSON.stringify(importMetadata, null, 2)}\n`)

console.log(`已导入 ${imported.length} 张照片至 public/photos/。审计报告：reports/import-manifest.json`)
