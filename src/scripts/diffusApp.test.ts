import { afterEach, describe, expect, it, vi } from 'vitest'

import {
  checkTierForPrompt,
  exposeComfyUIAppToHost,
  isDiffusAppAvailable,
  openUpgradeDialogByReason,
  showComfyUIBundleDialog
} from '@/scripts/diffusApp'

afterEach(() => {
  delete window.diffusApp
  delete window.comfyUIApp
})

describe('diffus app bridge', () => {
  it('leaves standalone ComfyUI behavior unchanged when no host is present', () => {
    expect(isDiffusAppAvailable()).toBe(false)
    expect(() => checkTierForPrompt()).not.toThrow()
    expect(() =>
      openUpgradeDialogByReason('INSUFFICIENT_CREDITS')
    ).not.toThrow()
    expect(showComfyUIBundleDialog()).toBe(false)
  })

  it('delegates feature permission actions to the Diffus host', () => {
    const checkTierForComfyUI = vi.fn()
    const openUpgradeDialog = vi.fn()
    const openBundleDialog = vi.fn(() => true)
    window.diffusApp = {
      featurePermissions: {
        checkTierForComfyUI,
        openUpgradeDialogByReason: openUpgradeDialog,
        openComfyUIRewardBundleDialog: openBundleDialog
      }
    }

    checkTierForPrompt()
    openUpgradeDialogByReason('INSUFFICIENT_CREDITS')

    expect(isDiffusAppAvailable()).toBe(true)
    expect(checkTierForComfyUI).toHaveBeenCalledOnce()
    expect(openUpgradeDialog).toHaveBeenCalledWith('INSUFFICIENT_CREDITS')
    expect(showComfyUIBundleDialog()).toBe(true)
  })

  it('exposes the workflow loader expected by diffus-app', () => {
    const bridge = { loadGraphData: vi.fn() }

    exposeComfyUIAppToHost(bridge)

    expect(window.comfyUIApp).toBe(bridge)
  })
})
