import { readdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import {
  compareLettersByDateDescending,
  isValidIsoDate,
  parseFrontmatter,
  parseLetterFilename,
} from './letter-utils.mjs'

const root = path.resolve(import.meta.dirname, '..')
const lettersDirectory = path.join(root, 'letters')
const outputFile = path.join(root, 'public/letters.json')

async function readLetterFiles() {
  try {
    const entries = await readdir(lettersDirectory, { withFileTypes: true })
    return entries
      .filter((entry) => entry.isFile() && entry.name.toLowerCase().endsWith('.md'))
      .map((entry) => entry.name)
      .sort()
  } catch (error) {
    if (error?.code === 'ENOENT') return []
    throw error
  }
}

const filenames = await readLetterFiles()
const letters = []
const seenIds = new Set()

for (const filename of filenames) {
  const parsedName = parseLetterFilename(filename)
  if (!parsedName) {
    throw new Error(`非法信件文件名：${filename}。请使用 "NNN-标题关键词.md" 格式，例如 001-想对你说的第一句话.md`)
  }

  const filePath = path.join(lettersDirectory, filename)
  const raw = await readFile(filePath, 'utf8')
  const { data, body } = parseFrontmatter(raw)

  if (!data.title || typeof data.title !== 'string' || !data.title.trim()) {
    throw new Error(`信件缺少标题（title）：${filename}`)
  }
  if (!isValidIsoDate(data.date)) {
    throw new Error(`信件日期无效或缺失（date，需为 YYYY-MM-DD 格式）：${filename}`)
  }

  if (!body.trim()) {
    throw new Error(`信件正文为空：${filename}`)
  }

  const id = String(parsedName.order).padStart(3, '0')
  if (seenIds.has(id)) {
    throw new Error(`信件顺序号重复：${filename}（编号 ${id}）`)
  }
  seenIds.add(id)

  letters.push({
    id,
    order: parsedName.order,
    title: data.title.trim(),
    date: data.date,
    signature: typeof data.signature === 'string' && data.signature.trim() ? data.signature.trim() : '林',
    content: body,
  })
}

letters.sort(compareLettersByDateDescending)

await writeFile(outputFile, `${JSON.stringify({ generatedAt: new Date().toISOString(), letters }, null, 2)}\n`)

console.log(`已生成 ${letters.length} 封信件的数据。`)
