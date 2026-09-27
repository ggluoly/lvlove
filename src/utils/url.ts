export function assetUrl(relativePath: string) {
  return `${import.meta.env.BASE_URL}${relativePath.replace(/^\//, '')}`
}
