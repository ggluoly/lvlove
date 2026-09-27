import { createHash } from 'node:crypto'
import { execFile } from 'node:child_process'
import { mkdir, readdir, readFile, rm, stat, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { promisify } from 'node:util'
import exifr from 'exifr'
import sharp from 'sharp'
import { compareByCapturedAtDescending, isSupportedPhoto, parseStandardFilename, toIsoDate, toLocalIsoDateTime } from './photo-utils.mjs'

const root = path.resolve(import.meta.dirname, '..')
const photosDirectory = path.join(root, 'public/photos')
const assetsDirectory = path.join(root, 'public/photo-assets')
const outputFile = path.join(root, 'public/photos.json')
const metadataFile = path.join(root, 'photos.metadata.json')
const importMetadataFile = path.join(root, 'photos.import-metadata.json')

async function readMetadata() {
  try {
    const parsed = JSON.parse(await readFile(metadataFile, 'utf8'))
    if (!parsed || Array.isArray(parsed) || typeof parsed !== 'object') throw new Error('根节点必须是对象。')
    return parsed
  } catch (error) {
    if (error?.code === 'ENOENT') return {}
    throw new Error(`无法读取 photos.metadata.json：${error.message}`)
  }
}

async function readImportMetadata() {
  try {
    const parsed = JSON.parse(await readFile(importMetadataFile, 'utf8'))
    if (!parsed || Array.isArray(parsed) || typeof parsed !== 'object') throw new Error('根节点必须是对象。')
    return parsed
  } catch (error) {
    if (error?.code === 'ENOENT') return {}
    throw new Error(`无法读取 photos.import-metadata.json：${error.message}`)
  }
}

async function getGitDate(filePath) {
  try {
    const { stdout } = await promisify(execFile)('git', ['log', '-1', '--format=%cI', '--', filePath], { cwd: root })
    const date = new Date(stdout.trim())
    return Number.isNaN(date.getTime()) ? null : date
  } catch {
    return null
  }
}

async function detectCapturedAt(filePath, filename, imported) {
  try {
    const exif = await exifr.parse(filePath, ['DateTimeOriginal', 'CreateDate'])
    const date = exif?.DateTimeOriginal ?? exif?.CreateDate
    if (date instanceof Date && !Number.isNaN(date.getTime())) return { date, source: 'exif' }
  } catch {
    // Metadata is optional. The canonical filename is the primary non-EXIF source.
  }

  if (typeof imported?.capturedAt === 'string' && typeof imported.dateSource === 'string') {
    const date = new Date(imported.capturedAt)
    if (!Number.isNaN(date.getTime())) return { date, source: imported.dateSource }
  }

  const canonical = parseStandardFilename(filename)
  if (canonical) return { date: canonical.date, source: 'filename' }

  const gitDate = await getGitDate(filePath)
  if (gitDate) return { date: gitDate, source: 'git' }
  const fileStat = await stat(filePath)
  return { date: fileStat.mtime, source: 'modified-time' }
}

async function writeDerivative(inputFile, outputFile, width, format) {
  try {
    await stat(outputFile)
    return
  } catch (error) {
    if (error?.code !== 'ENOENT') throw error
  }

  const transformer = sharp(inputFile).rotate().resize({ width, withoutEnlargement: true })
  if (format === 'avif') {
    await transformer.avif({ quality: 58, effort: 4 }).toFile(outputFile)
  } else {
    await transformer.webp({ quality: 78 }).toFile(outputFile)
  }
}

async function outputPhotoAssets(inputFile, id, sourceHash) {
  const assetDirectory = path.join(assetsDirectory, id)
  const sourceHashFile = path.join(assetDirectory, '.source-hash')
  try {
    const previousHash = (await readFile(sourceHashFile, 'utf8')).trim()
    if (previousHash !== sourceHash) await rm(assetDirectory, { recursive: true, force: true })
  } catch (error) {
    if (error?.code !== 'ENOENT') throw error
  }
  await mkdir(assetDirectory, { recursive: true })
  const placeholder = path.join(assetDirectory, 'placeholder.webp')
  await writeDerivative(inputFile, placeholder, 32, 'webp')

  const sources = { avif: [], webp: [] }
  for (const width of [480, 960, 1440]) {
    for (const format of ['avif', 'webp']) {
      const filename = `${width}.${format}`
      await writeDerivative(inputFile, path.join(assetDirectory, filename), width, format)
      sources[format].push(`photo-assets/${id}/${filename}`)
    }
  }
  await writeFile(sourceHashFile, `${sourceHash}\n`)
  return { placeholder: `photo-assets/${id}/placeholder.webp`, sources }
}

function safeMetadata(value, filename) {
  if (!value || Array.isArray(value) || typeof value !== 'object') {
    return { title: path.parse(filename).name, location: null, album: '未分类', tags: [] }
  }
  const tags = Array.isArray(value.tags) ? value.tags.filter((tag) => typeof tag === 'string' && tag.trim()).map((tag) => tag.trim()) : []
  return {
    title: typeof value.title === 'string' && value.title.trim() ? value.title.trim() : path.parse(filename).name,
    location: typeof value.location === 'string' && value.location.trim() ? value.location.trim() : null,
    album: typeof value.album === 'string' && value.album.trim() ? value.album.trim() : '未分类',
    tags,
  }
}

const entries = await readdir(photosDirectory, { withFileTypes: true })
const files = entries.filter((entry) => entry.isFile() && isSupportedPhoto(entry.name)).map((entry) => entry.name).sort()
const metadata = await readMetadata()
const importMetadata = await readImportMetadata()
const knownNames = new Set(files)
const unusedMetadata = Object.keys(metadata).filter((filename) => !knownNames.has(filename))
for (const filename of unusedMetadata) console.warn(`警告：photos.metadata.json 中的 ${filename} 没有对应照片。`)

await mkdir(assetsDirectory, { recursive: true })
const photos = []

for (const filename of files) {
  const parsed = parseStandardFilename(filename)
  if (!parsed) throw new Error(`非法照片文件名：${filename}。请使用 YYYYMMDDNNN.ext 格式。`)
  const filePath = path.join(photosDirectory, filename)
  const captured = await detectCapturedAt(filePath, filename, importMetadata[filename])
  const image = sharp(filePath).rotate()
  const imageMetadata = await image.metadata()
  if (!imageMetadata.width || !imageMetadata.height) throw new Error(`无法读取图片尺寸：${filename}`)

  const id = path.parse(filename).name
  const sourceHash = createHash('sha256').update(await readFile(filePath)).digest('hex')
  const assets = await outputPhotoAssets(filePath, id, sourceHash)
  const supplemental = safeMetadata(metadata[filename], filename)
  const capturedAt = toLocalIsoDateTime(captured.date)

  photos.push({
    id,
    source: `photos/${filename}`,
    date: toIsoDate(captured.date),
    capturedAt,
    dateSource: captured.source,
    year: captured.date.getFullYear(),
    month: captured.date.getMonth() + 1,
    day: captured.date.getDate(),
    width: imageMetadata.width,
    height: imageMetadata.height,
    title: supplemental.title,
    location: supplemental.location,
    album: supplemental.album,
    tags: supplemental.tags,
    placeholder: assets.placeholder,
    sources: assets.sources,
    sha256: sourceHash,
  })
}

photos.sort(compareByCapturedAtDescending)
await writeFile(outputFile, `${JSON.stringify({ generatedAt: new Date().toISOString(), photos }, null, 2)}\n`)

const activeAssetIds = new Set(photos.map((photo) => photo.id))
const generatedDirectories = await readdir(assetsDirectory, { withFileTypes: true })
await Promise.all(generatedDirectories
  .filter((entry) => entry.isDirectory() && !activeAssetIds.has(entry.name))
  .map((entry) => rm(path.join(assetsDirectory, entry.name), { recursive: true, force: true })))

console.log(`已生成 ${photos.length} 张照片的数据和派生资源。`)
