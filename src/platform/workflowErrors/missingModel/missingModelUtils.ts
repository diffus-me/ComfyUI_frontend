import type { CandidateModelInfo } from './candidateModelsSchema'
import { zCandidateModelInfo } from './candidateModelsSchema'

export function normalizeModelPath(path: string): string {
  return path.replace(/\\/g, '/')
}

export function getModelFilename(path: string): string {
  const normalizedPath = normalizeModelPath(path)
  return normalizedPath.slice(normalizedPath.lastIndexOf('/') + 1)
}

export interface ModelWidgetReference {
  name: string
  modelInfo?: CandidateModelInfo
}

function parseCandidateModelInfo(
  value: unknown
): CandidateModelInfo | undefined {
  let parsed = value
  if (typeof value === 'string') {
    if (!value.trimStart().startsWith('{')) return
    try {
      parsed = JSON.parse(value)
    } catch {
      return
    }
  }

  const result = zCandidateModelInfo.safeParse(parsed)
  return result.success ? result.data : undefined
}

export function getModelWidgetReference(
  value: unknown
): ModelWidgetReference | undefined {
  const selectorValue =
    typeof value === 'object' && value !== null && !Array.isArray(value)
      ? (value as Record<string, unknown>).value
      : undefined
  const modelInfo =
    parseCandidateModelInfo(selectorValue) ?? parseCandidateModelInfo(value)
  if (modelInfo) {
    return {
      name: `${modelInfo.stem}.${modelInfo.extension}`,
      modelInfo
    }
  }

  return typeof value === 'string' ? { name: value } : undefined
}

export function modelWidgetReferenceKey(
  reference: ModelWidgetReference
): string {
  return reference.modelInfo
    ? `sha256:${reference.modelInfo.sha256.toLowerCase()}`
    : `filename:${normalizeModelPath(reference.name)}`
}
