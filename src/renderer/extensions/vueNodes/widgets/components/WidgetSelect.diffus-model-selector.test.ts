import { getActivePinia } from 'pinia'
import { render, screen } from '@testing-library/vue'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { createI18n } from 'vue-i18n'

import WidgetSelect from '@/renderer/extensions/vueNodes/widgets/components/WidgetSelect.vue'
import WidgetDiffusModelSelector from '@/renderer/extensions/vueNodes/widgets/components/WidgetDiffusModelSelector.vue'
import { createMockWidget } from '@/renderer/extensions/vueNodes/widgets/components/widgetTestUtils'

const i18n = createI18n({
  legacy: false,
  locale: 'en',
  messages: { en: {} }
})

const stubs = {
  WidgetDiffusModelSelector: {
    template: '<div data-testid="diffus-model-selector" />'
  },
  WidgetSelectDefault: {
    template: '<div data-testid="default-selector" />'
  },
  WidgetSelectDropdown: {
    template: '<div data-testid="dropdown-selector" />'
  },
  WidgetWithControl: {
    template: '<div data-testid="controlled-selector" />'
  }
}

afterEach(() => {
  delete window.diffusApp
})

describe('WidgetSelect Diffus model selector routing', () => {
  const renderWidget = () =>
    render(WidgetSelect, {
      props: {
        widget: createMockWidget<string | undefined>({
          name: 'ckpt_name',
          type: 'combo',
          value: 'current.safetensors',
          spec: {
            type: 'COMBO',
            name: 'ckpt_name',
            model_selector: { model_types: ['checkpoints'] }
          }
        }),
        modelValue: 'current.safetensors'
      },
      global: {
        plugins: [getActivePinia()!, i18n],
        stubs
      }
    })

  it('routes declared selectors to the shared Diffus widget', () => {
    window.diffusApp = {
      featurePermissions: {
        checkTierForComfyUI: vi.fn(),
        openUpgradeDialogByReason: vi.fn(),
        openComfyUIRewardBundleDialog: vi.fn(() => false)
      },
      openModelSelector: vi.fn(async () => undefined)
    }

    renderWidget()

    expect(screen.getByTestId('diffus-model-selector')).toBeInTheDocument()
    expect(screen.queryByTestId('default-selector')).not.toBeInTheDocument()
  })

  it('keeps the standard combo when the bridge is unavailable', () => {
    renderWidget()

    expect(screen.getByTestId('default-selector')).toBeInTheDocument()
    expect(
      screen.queryByTestId('diffus-model-selector')
    ).not.toBeInTheDocument()
  })

  it('displays the selected Gallery title', () => {
    render(WidgetDiffusModelSelector, {
      props: {
        widget: createMockWidget<string | undefined>({
          name: 'ckpt_name',
          type: 'combo',
          value: 'current.safetensors',
          spec: {
            type: 'COMBO',
            name: 'ckpt_name',
            model_selector: { model_types: ['checkpoints'] }
          }
        }),
        modelValue: {
          title: 'Selected Model',
          value: 'serialized-model-info',
          filename: 'selected-model.safetensors'
        }
      },
      global: {
        plugins: [getActivePinia()!, i18n]
      }
    })

    expect(screen.getByRole('button')).toHaveTextContent('Selected Model')
  })
})
