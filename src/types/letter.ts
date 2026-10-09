export interface Letter {
  id: string
  order: number
  title: string
  date: string
  signature: string | null
  content: string
}

export interface LetterManifest {
  generatedAt: string
  letters: Letter[]
}
