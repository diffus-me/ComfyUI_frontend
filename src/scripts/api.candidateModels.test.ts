import { describe, expect, it, vi } from 'vitest'

import { api } from '@/scripts/api'

describe('api.getCandidateModels', () => {
  it('returns validated candidates for the requested model references', async () => {
    const signal = new AbortController().signal
    const modelInfo = {
      id: 42,
      model_type: 'checkpoint',
      base: 'FLUX1',
      stem: 'diffusion',
      extension: 'safetensors',
      sha256: 'a'.repeat(64),
      config_sha256: null
    }
    vi.spyOn(api, 'fetchApi').mockResolvedValue(
      Response.json([
        {
          filename: 'models/checkpoint.safetensors',
          model_type: 'checkpoints'
        },
        {
          filename: 'diffusion.safetensors',
          model_type: 'diffusion_models',
          model_info: modelInfo
        }
      ])
    )

    await expect(
      api.getCandidateModels(
        {
          checkpoints: ['models/checkpoint.safetensors'],
          diffusion_models: [modelInfo],
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
        },
        {
          filename: 'diffusion.safetensors',
          model_type: 'diffusion_models',
          model_info: modelInfo
        }
      ]
    })
    expect(api.fetchApi).toHaveBeenCalledWith('/v1/candidate-models', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        checkpoints: ['models/checkpoint.safetensors'],
        diffusion_models: [modelInfo],
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
      api.getCandidateModels({
        checkpoints: [],
        diffusion_models: [],
        loras: []
      })
    ).resolves.toEqual({ ok: false, status: 503 })
  })

  it('rejects a malformed successful response', async () => {
    vi.spyOn(api, 'fetchApi').mockResolvedValue(
      Response.json([{ filename: 'model.safetensors', model_type: 'vae' }])
    )

    await expect(
      api.getCandidateModels({
        checkpoints: [],
        diffusion_models: [],
        loras: []
      })
    ).rejects.toMatchObject({ name: 'ZodError' })
  })
})
