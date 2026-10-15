import { z } from 'zod'

export const zCandidateModelInfo = z
  .object({
    id: z.number(),
    model_type: z.string(),
    base: z.string().nullable(),
    stem: z.string(),
    extension: z.string(),
    sha256: z.string(),
    config_sha256: z.string().nullable()
  })
  .passthrough()

export type CandidateModelInfo = z.infer<typeof zCandidateModelInfo>
export type CandidateModelReference = string | CandidateModelInfo

const candidateModelDirectories = [
  'checkpoints',
  'diffusion_models',
  'loras'
] as const

export type CandidateModelDirectory = (typeof candidateModelDirectories)[number]

export function isCandidateModelDirectory(
  value: unknown
): value is CandidateModelDirectory {
  return candidateModelDirectories.includes(value as CandidateModelDirectory)
}

export function resolveCandidateModelDirectory(
  spec: unknown
): CandidateModelDirectory | undefined {
  if (typeof spec !== 'object' || spec === null || Array.isArray(spec)) return
  const modelSelector = (spec as Record<string, unknown>).model_selector
  if (
    typeof modelSelector !== 'object' ||
    modelSelector === null ||
    Array.isArray(modelSelector)
  ) {
    return
  }

  const rawModelTypes = (modelSelector as Record<string, unknown>).model_types
  const modelTypes =
    typeof rawModelTypes === 'string' ? [rawModelTypes] : rawModelTypes
  return Array.isArray(modelTypes)
    ? modelTypes.find(isCandidateModelDirectory)
    : undefined
}

const zCandidateModel = z.object({
  filename: z.string(),
  model_type: z.enum(['checkpoints', 'diffusion_models', 'loras']),
  model_info: zCandidateModelInfo.optional()
})

export const zCandidateModelsResponse = z.array(zCandidateModel)
