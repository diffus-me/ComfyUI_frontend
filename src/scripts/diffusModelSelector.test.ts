import { afterEach, describe, expect, it, vi } from 'vitest'

import {
  getModelSelectorDisplayValue,
  getModelSelectorPromptValue,
  getModelSelectorWorkflowValue,
  isDiffusModelSelectorActive,
  requestDiffusModelSelection,
  resolveModelSelectorOptions
} from '@/scripts/diffusModelSelector'

const modelInfo = JSON.stringify({
  id: 7,
  model_type: 'checkpoint',
  base: 'SDXL',
  stem: 'selected-model',
  extension: 'safetensors',
  sha256: 'abc123',
  config_sha256: null
})

const result = {
  title: 'Selected Model',
  value: modelInfo,
  filename: 'selected-model.safetensors'
}

const legacyResult = {
  value: modelInfo,
  filename: 'selected-model.safetensors'
}

const checkpointSpec = {
  model_selector: { model_types: ['checkpoints'] }
}

afterEach(() => {
  delete window.diffusApp
})

describe('diffus model selector adapter', () => {
  it('maps valid metadata to locked Gallery filters', () => {
    expect(resolveModelSelectorOptions(checkpointSpec)).toEqual({
      kind: 'valid',
      options: {
        filter: { type: ['CHECKPOINT'] },
        lockedFilterKeys: ['type']
      }
    })
  })

  it('maps multiple canonical ComfyUI model types to Gallery', () => {
    expect(
      resolveModelSelectorOptions({
        model_selector: { model_types: ['loras', 'lycoris'] }
      })
    ).toEqual({
      kind: 'valid',
      options: {
        filter: { type: ['LORA', 'LYCORIS'] },
        lockedFilterKeys: ['type']
      }
    })
  })

  it('maps the built-in diffusion model type to Gallery checkpoints', () => {
    expect(
      resolveModelSelectorOptions({
        model_selector: { model_types: 'diffusion_models' }
      })
    ).toEqual({
      kind: 'valid',
      options: {
        filter: { type: ['CHECKPOINT'] },
        lockedFilterKeys: ['type']
      }
    })
  })

  it('deduplicates checkpoint Gallery types', () => {
    expect(
      resolveModelSelectorOptions({
        model_selector: {
          model_types: ['checkpoints', 'diffusion_models']
        }
      })
    ).toEqual({
      kind: 'valid',
      options: {
        filter: { type: ['CHECKPOINT'] },
        lockedFilterKeys: ['type']
      }
    })
  })

  it('maps model base, quantization, and precision filters', () => {
    expect(
      resolveModelSelectorOptions({
        model_selector: {
          model_types: ['checkpoints'],
          model_base: 'FLUX1',
          quantization: 'GGUF',
          precision: 'Q8'
        }
      })
    ).toEqual({
      kind: 'valid',
      options: {
        filter: {
          type: ['CHECKPOINT'],
          base: ['FLUX1'],
          quantization: ['GGUF'],
          precision: ['Q8']
        },
        lockedFilterKeys: ['type']
      }
    })
  })

  it('passes an explicitly declared GGUF filter without knowing its folder', () => {
    expect(
      resolveModelSelectorOptions({
        model_selector: {
          model_types: ['checkpoints'],
          model_base: ['FLUX1'],
          quantization: ['GGUF'],
          precision: ['Q8']
        }
      })
    ).toEqual({
      kind: 'valid',
      options: {
        filter: {
          type: ['CHECKPOINT'],
          quantization: ['GGUF'],
          base: ['FLUX1'],
          precision: ['Q8']
        },
        lockedFilterKeys: ['type']
      }
    })
  })

  it('maps SVDQuant with all precisions supported by a Nunchaku loader', () => {
    expect(
      resolveModelSelectorOptions({
        model_selector: {
          model_types: ['checkpoints'],
          model_base: 'FLUX1',
          quantization: 'SVDQUANT',
          precision: ['INT4', 'NVFP4']
        }
      })
    ).toEqual({
      kind: 'valid',
      options: {
        filter: {
          type: ['CHECKPOINT'],
          base: ['FLUX1'],
          quantization: ['SVDQUANT'],
          precision: ['INT4', 'NVFP4']
        },
        lockedFilterKeys: ['type']
      }
    })
  })

  it.for([
    ['NONE', 'UNQUANTIZED'],
    ['COMFYUI', 'COMFY_QUANT'],
    ['BITSANDBYTES', 'BNB']
  ] as const)(
    'maps the ComfyUI %s quantization name to Gallery %s',
    ([quantization, galleryQuantization]) => {
      expect(
        resolveModelSelectorOptions({
          model_selector: {
            model_types: 'diffusion_models',
            quantization
          }
        })
      ).toEqual({
        kind: 'valid',
        options: {
          filter: {
            type: ['CHECKPOINT'],
            quantization: [galleryQuantization]
          },
          lockedFilterKeys: ['type']
        }
      })
    }
  )

  it('maps every model base supported by a loader', () => {
    expect(
      resolveModelSelectorOptions({
        model_selector: {
          model_types: ['checkpoints'],
          model_base: ['ZIMAGE', 'ZIMAGE_TURBO'],
          quantization: 'SVDQUANT'
        }
      })
    ).toEqual({
      kind: 'valid',
      options: {
        filter: {
          type: ['CHECKPOINT'],
          base: ['ZIMAGE', 'ZIMAGE_TURBO'],
          quantization: ['SVDQUANT']
        },
        lockedFilterKeys: ['type']
      }
    })
  })

  it.for([
    [{ model_selector: {} }, 'model_types'],
    [{ model_selector: { model_types: '' } }, 'model_types'],
    [{ model_selector: { model_types: [] } }, 'model_types'],
    [
      { model_selector: { model_types: ['checkpoints', 'unknown'] } },
      'unknown'
    ],
    [
      {
        model_selector: {
          model_types: ['checkpoints'],
          quantization: []
        }
      },
      'quantization'
    ],
    [
      {
        model_selector: {
          model_types: ['checkpoints'],
          quantization: 'UNKNOWN'
        }
      },
      'UNKNOWN'
    ]
  ] as const)('rejects invalid declared metadata', ([spec, message]) => {
    expect(resolveModelSelectorOptions(spec)).toEqual({
      kind: 'invalid',
      error: expect.stringContaining(message)
    })
  })

  it.for([
    ['plain filename', 'plain.safetensors', 'plain.safetensors'],
    ['serialized ModelInfo', modelInfo, 'selected-model.safetensors'],
    ['structured result', result, 'Selected Model'],
    ['legacy structured result', legacyResult, 'selected-model.safetensors']
  ] as const)(
    'derives the display value for a %s',
    ([_name, value, expected]) => {
      expect(getModelSelectorDisplayValue(value)).toBe(expected)
    }
  )

  it.for([
    ['plain filename', 'plain.safetensors', 'plain.safetensors'],
    ['serialized ModelInfo', modelInfo, modelInfo],
    ['structured result', result, modelInfo],
    ['legacy structured result', legacyResult, modelInfo]
  ] as const)(
    'derives the prompt value for a %s',
    ([_name, value, expected]) => {
      expect(getModelSelectorPromptValue(value)).toBe(expected)
    }
  )

  it.for([
    ['plain filename', 'plain.safetensors', 'plain.safetensors'],
    ['serialized ModelInfo', modelInfo, 'selected-model.safetensors'],
    ['structured result', result, 'selected-model.safetensors'],
    ['legacy structured result', legacyResult, 'selected-model.safetensors']
  ] as const)(
    'exports a string workflow value for a %s',
    ([_name, value, expected]) => {
      const workflowValue = getModelSelectorWorkflowValue(value)
      expect(workflowValue).toBe(expected)
      expect(typeof workflowValue).toBe('string')
    }
  )

  it('uses the bridge only when the selector capability is available', async () => {
    const openModelSelector = vi.fn(async () => result)
    window.diffusApp = {
      featurePermissions: {
        checkTierForComfyUI: vi.fn(),
        openUpgradeDialogByReason: vi.fn(),
        openComfyUIRewardBundleDialog: vi.fn(() => false)
      },
      openModelSelector
    }

    expect(isDiffusModelSelectorActive(checkpointSpec)).toBe(true)
    await expect(requestDiffusModelSelection(checkpointSpec)).resolves.toEqual(
      result
    )
    expect(openModelSelector).toHaveBeenCalledWith({
      filter: { type: ['CHECKPOINT'] },
      lockedFilterKeys: ['type']
    })

    delete window.diffusApp.openModelSelector
    expect(isDiffusModelSelectorActive(checkpointSpec)).toBe(false)
  })

  it('calls the bridge with diffus-app model filters', async () => {
    const openModelSelector = vi.fn(async () => result)
    window.diffusApp = {
      featurePermissions: {
        checkTierForComfyUI: vi.fn(),
        openUpgradeDialogByReason: vi.fn(),
        openComfyUIRewardBundleDialog: vi.fn(() => false)
      },
      openModelSelector
    }

    await requestDiffusModelSelection({
      model_selector: {
        model_types: ['diffusion_models'],
        model_base: ['ZIMAGE', 'ZIMAGE_TURBO'],
        quantization: 'NONE',
        precision: ['FP16', 'BF16']
      }
    })

    expect(openModelSelector).toHaveBeenCalledWith({
      filter: {
        type: ['CHECKPOINT'],
        base: ['ZIMAGE', 'ZIMAGE_TURBO'],
        quantization: ['UNQUANTIZED'],
        precision: ['FP16', 'BF16']
      },
      lockedFilterKeys: ['type']
    })
  })

  it('rejects a bridge result without a title', async () => {
    const error = vi.fn()
    Reflect.set(window, 'diffusApp', {
      featurePermissions: {
        checkTierForComfyUI: vi.fn(),
        openUpgradeDialogByReason: vi.fn(),
        openComfyUIRewardBundleDialog: vi.fn(() => false)
      },
      openModelSelector: vi.fn(async () => legacyResult),
      toast: { error }
    })

    await expect(requestDiffusModelSelection(checkpointSpec)).resolves.toBe(
      undefined
    )
    expect(error).toHaveBeenCalledOnce()
  })

  it('blocks invalid metadata instead of opening the standard selector', async () => {
    const error = vi.fn()
    const openModelSelector = vi.fn(async () => result)
    window.diffusApp = {
      featurePermissions: {
        checkTierForComfyUI: vi.fn(),
        openUpgradeDialogByReason: vi.fn(),
        openComfyUIRewardBundleDialog: vi.fn(() => false)
      },
      openModelSelector,
      toast: { error }
    }

    await expect(
      requestDiffusModelSelection({
        model_selector: { model_types: ['UNKNOWN'] }
      })
    ).resolves.toBeUndefined()
    expect(openModelSelector).not.toHaveBeenCalled()
    expect(error).toHaveBeenCalledOnce()
  })
})
