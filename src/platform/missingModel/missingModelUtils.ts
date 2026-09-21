export function normalizeModelPath(path: string): string {
  return path.replace(/\\/g, '/')
}

export function getModelFilename(path: string): string {
  const normalizedPath = normalizeModelPath(path)
  return normalizedPath.slice(normalizedPath.lastIndexOf('/') + 1)
}
