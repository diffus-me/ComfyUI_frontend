import { fromPartial } from '@total-typescript/shoehorn'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { LGraph, LGraphNode } from '@/lib/litegraph/src/litegraph'
import type { WidgetEventOptions } from '@/lib/litegraph/src/widgets/BaseWidget'
import { toConcreteWidget } from '@/lib/litegraph/src/widgets/widgetMap'
import {
  configureDiffusModelSelectorWidget,
  getModelSelectorDisplayValue
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

const spec = {
  type: 'COMBO' as const,
  name: 'ckpt_name',
  model_selector: { model_types: ['checkpoints'] }
}

afterEach(() => {
  delete window.diffusApp
})

describe('Diffus model selector Canvas integration', () => {
  function createWidget() {
    const graph = new LGraph()
    const node = new LGraphNode('CheckpointLoaderSimple')
    node.serialize_widgets = true
    graph.add(node)
    const widget = node.addWidget(
      'combo',
      'ckpt_name',
      'original.safetensors',
      () => {},
      { values: ['original.safetensors'] }
    )
    configureDiffusModelSelectorWidget(node, widget, spec)
    const concreteWidget = toConcreteWidget(widget, node, false)
    if (!concreteWidget || concreteWidget.type !== 'combo') {
      throw new Error('Expected a combo widget')
    }
    return { node, widget: concreteWidget }
  }

  it('opens the bridge from the full Canvas control and applies the result', async () => {
    const openModelSelector = vi.fn(async () => result)
    window.diffusApp = {
      featurePermissions: {
        checkTierForComfyUI: vi.fn(),
        openUpgradeDialogByReason: vi.fn(),
        openComfyUIRewardBundleDialog: vi.fn(() => false)
      },
      openModelSelector
    }
    const { node, widget } = createWidget()
    node.onWidgetChanged = vi.fn()

    widget.onClick(
      fromPartial<WidgetEventOptions>({
        node,
        canvas: { graph_mouse: [0, 0] },
        e: {}
      })
    )
    await vi.waitFor(() => expect(widget.value).toEqual(result))

    expect(openModelSelector).toHaveBeenCalledOnce()
    expect(node.onWidgetChanged).toHaveBeenCalledWith(
      'ckpt_name',
      result,
      'original.safetensors',
      widget
    )
    expect(getModelSelectorDisplayValue(widget.value)).toBe('Selected Model')
  })

  it('opens the bridge for a local LoraLoader combo', async () => {
    const openModelSelector = vi.fn(async () => undefined)
    window.diffusApp = {
      featurePermissions: {
        checkTierForComfyUI: vi.fn(),
        openUpgradeDialogByReason: vi.fn(),
        openComfyUIRewardBundleDialog: vi.fn(() => false)
      },
      openModelSelector
    }
    const graph = new LGraph()
    const node = new LGraphNode('LoraLoader')
    graph.add(node)
    const widget = node.addWidget('combo', 'lora_name', 'None', () => {}, {
      values: ['None', 'model.safetensors']
    })
    configureDiffusModelSelectorWidget(node, widget, {
      type: 'COMBO',
      name: 'lora_name',
      model_selector: { model_types: ['loras', 'lycoris'] }
    })
    const concreteWidget = toConcreteWidget(widget, node, false)
    if (!concreteWidget || concreteWidget.type !== 'combo') {
      throw new Error('Expected a combo widget')
    }

    concreteWidget.onClick(
      fromPartial<WidgetEventOptions>({
        node,
        canvas: { graph_mouse: [0, 0] },
        e: {}
      })
    )

    await vi.waitFor(() =>
      expect(openModelSelector).toHaveBeenCalledWith({
        filter: { type: ['LORA', 'LYCORIS'] },
        lockedFilterKeys: ['type']
      })
    )
  })

  it('uses precise prompt values and filename-only workflow values', () => {
    const { node, widget } = createWidget()
    widget.value = result

    expect(widget.serializeValue?.(node, 0)).toBe(modelInfo)
    const serialized = node.serialize()

    expect(serialized.widgets_values).toEqual(['selected-model.safetensors'])
    expect(serialized.widgets_values_named).toEqual({
      ckpt_name: 'selected-model.safetensors'
    })
  })

  it('normalizes historical ModelInfo strings only when exporting workflow', () => {
    const { node, widget } = createWidget()
    widget.value = modelInfo

    expect(widget.serializeValue?.(node, 0)).toBe(modelInfo)
    expect(node.serialize().widgets_values).toEqual([
      'selected-model.safetensors'
    ])
  })

  it('does not open the Gallery for programmatic value changes', () => {
    const openModelSelector = vi.fn(async () => result)
    window.diffusApp = {
      featurePermissions: {
        checkTierForComfyUI: vi.fn(),
        openUpgradeDialogByReason: vi.fn(),
        openComfyUIRewardBundleDialog: vi.fn(() => false)
      },
      openModelSelector
    }
    const { widget } = createWidget()

    widget.value = result

    expect(openModelSelector).not.toHaveBeenCalled()
  })
})
