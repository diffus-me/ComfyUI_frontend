import { z } from 'zod'

const zCandidateModel = z.object({
  filename: z.string(),
  model_type: z.enum(['checkpoints', 'loras'])
})

export const zCandidateModelsResponse = z.array(zCandidateModel)
