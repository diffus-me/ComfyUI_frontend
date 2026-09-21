import { describe, expect, it, vi } from 'vitest'

import { api } from '@/scripts/api'

describe('api.getCandidateModels', () => {
  it('returns validated candidates for the requested model paths', async () => {
    const signal = new AbortController().signal
    vi.spyOn(api, 'fetchApi').mockResolvedValue(
      Response.json([
        {
          filename: 'models/checkpoint.safetensors',
          model_type: 'checkpoints'
        }
      ])
    )

    await expect(
      api.getCandidateModels(
        {
          checkpoints: ['models/checkpoint.safetensors'],
          loras: []
        },
        { signal }
      )
    ).resolves.toEqual({
      ok: true,
      models: [
        {
          filename: 'models/checkpoint.safetensors',
          model_type: 'checkpoints'
        }
      ]
    })
    expect(api.fetchApi).toHaveBeenCalledWith('/v1/candidate-models', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        checkpoints: ['models/checkpoint.safetensors'],
        loras: []
      }),
      signal
    })
  })

  it('returns an explicit failure for an unsuccessful response', async () => {
    vi.spyOn(api, 'fetchApi').mockResolvedValue(
      Response.json({}, { status: 503 })
    )

    await expect(
      api.getCandidateModels({ checkpoints: [], loras: [] })
    ).resolves.toEqual({ ok: false, status: 503 })
  })

  it('rejects a malformed successful response', async () => {
    vi.spyOn(api, 'fetchApi').mockResolvedValue(
      Response.json([{ filename: 'model.safetensors', model_type: 'vae' }])
    )

    await expect(
      api.getCandidateModels({ checkpoints: [], loras: [] })
    ).rejects.toMatchObject({ name: 'ZodError' })
  })
})
