import { getActivePinia } from 'pinia'
import { cleanup, render } from '@testing-library/vue'
import { afterEach, describe, expect, it, vi } from 'vitest'

import UserCenter from '@/components/userCenter/UserCenter.vue'
import { i18n } from '@/i18n'
import { useToastStore } from '@/platform/updates/common/toastStore'
import { api } from '@/scripts/api'

const storage = vi.hoisted(() => new Map<string, string>())

vi.mock(import('@/scripts/utils'), () => ({
  getStorageValue: (key: string) => storage.get(key) ?? null,
  setStorageValue: (key: string, value: string) => storage.set(key, value)
}))

function renderUserCenter() {
  return render(UserCenter, {
    global: { plugins: [getActivePinia()!, i18n] }
  })
}

afterEach(() => {
  cleanup()
  storage.clear()
  delete window.diffusApp
})

describe('UserCenter', () => {
  it('turns Diffus execution events into plain global toast messages', () => {
    renderUserCenter()
    const toastStore = useToastStore()

    api.dispatchCustomEvent('promptQueued', {
      number: 0,
      batchCount: 1
    })
    api.dispatchCustomEvent('finished', {
      node: null,
      prompt_id: 'prompt-1',
      used_time: 1.236,
      subscription_consumption: {
        credit_consumption: 10,
        discount: 0.2
      }
    })
    api.dispatchCustomEvent('input_cleared', {
      node: null,
      user_id: 'user-1'
    })

    expect(toastStore.messagesToAdd.map(({ detail }) => detail)).toEqual([
      'Prompt queued',
      'Prompt finished in 1.24s; credits consumed: 10, charged: 8',
      'Input folder cleared'
    ])
    expect(toastStore.messagesToAdd).not.toContainEqual(
      expect.objectContaining({ group: 'notifier' })
    )
  })

  it('opens the Diffus upgrade dialog only for upgrade monitor errors', () => {
    const openUpgradeDialogByReason = vi.fn()
    window.diffusApp = {
      featurePermissions: {
        checkTierForComfyUI: vi.fn(),
        openUpgradeDialogByReason,
        openComfyUIRewardBundleDialog: vi.fn(() => false)
      }
    }
    renderUserCenter()

    api.dispatchCustomEvent('monitor_error', {
      node: null,
      prompt_id: 'prompt-1',
      used_time: 1,
      message: { need_upgrade: false, reason: 'IGNORED' }
    })
    api.dispatchCustomEvent('monitor_error', {
      node: null,
      prompt_id: 'prompt-2',
      used_time: 2,
      message: {
        need_upgrade: true,
        reason: 'INSUFFICIENT_CREDITS'
      }
    })

    expect(openUpgradeDialogByReason).toHaveBeenCalledOnce()
    expect(openUpgradeDialogByReason).toHaveBeenCalledWith(
      'INSUFFICIENT_CREDITS'
    )
  })

  it('removes API listeners when unmounted', () => {
    const view = renderUserCenter()
    const toastStore = useToastStore()
    view.unmount()

    api.dispatchCustomEvent('promptQueued', {
      number: 0,
      batchCount: 1
    })

    expect(toastStore.messagesToAdd).toEqual([])
  })
})
