const FRONTMATTER_PATTERN = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/
const LETTER_FILENAME = /^(?<order>\d+)-(?<slug>.+)\.md$/i

export function parseLetterFilename(filename) {
  const match = filename.match(LETTER_FILENAME)
  if (!match?.groups?.order) return null
  return { order: Number(match.groups.order), slug: match.groups.slug }
}

function parseFrontmatterValue(raw) {
  const value = raw.trim()
  if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
    return value.slice(1, -1)
  }
  return value
}

export function parseFrontmatter(content) {
  const match = content.match(FRONTMATTER_PATTERN)
  if (!match) return { data: {}, body: content.trim() }

  const data = {}
  for (const line of match[1].split(/\r?\n/)) {
    if (!line.trim()) continue
    const separatorIndex = line.indexOf(':')
    if (separatorIndex === -1) continue
    const key = line.slice(0, separatorIndex).trim()
    const value = parseFrontmatterValue(line.slice(separatorIndex + 1))
    data[key] = value
  }

  return { data, body: match[2].trim() }
}

export function isValidIsoDate(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false
  const [year, month, day] = value.split('-').map(Number)
  const date = new Date(year, month - 1, day)
  return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day
}

export function splitParagraphs(body) {
  return body
    .split(/\r?\n\s*\r?\n/)
    .map((paragraph) => paragraph.replace(/\r?\n/g, ' ').trim())
    .filter(Boolean)
}

export function compareLettersByDateDescending(a, b) {
  return b.date.localeCompare(a.date) || b.order - a.order
}
