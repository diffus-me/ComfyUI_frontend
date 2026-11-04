import { fromPartial } from '@total-typescript/shoehorn'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { LGraph, LGraphNode, LiteGraph } from '@/lib/litegraph/src/litegraph'
import { createTestSubgraph } from '@/lib/litegraph/src/subgraph/__fixtures__/subgraphHelpers'
import type { WidgetEventOptions } from '@/lib/litegraph/src/widgets/BaseWidget'
import { ComboWidget } from '@/lib/litegraph/src/widgets/ComboWidget'
import { toConcreteWidget } from '@/lib/litegraph/src/widgets/widgetMap'
import type { ComfyNodeDef as ComfyNodeDefV1 } from '@/schemas/nodeDefSchema'
import { app } from '@/scripts/app'
import {
  configureDiffusModelSelectorWidget,
  getModelSelectorDisplayValue
} from '@/scripts/diffusModelSelector'
import { useLitegraphService } from '@/services/litegraphService'

vi.mock(import('@/scripts/app'))

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
  Reflect.deleteProperty(app, 'rootGraph')
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

describe('Diffus model selector promoted widget integration', () => {
  it('opens the Gallery from the promoted root graph widget', async () => {
    const sourceNodeName = 'TestLoadDiffusionModel'
    const sourceNodeDef: ComfyNodeDefV1 = {
      name: sourceNodeName,
      display_name: 'Test Load Diffusion Model',
      category: 'testing',
      python_module: 'nodes',
      description: '',
      input: {
        required: {
          unet_name: [
            ['original.safetensors'],
            {
              model_selector: { model_types: 'diffusion_models' }
            }
          ]
        }
      },
      output: ['MODEL'],
      output_name: ['MODEL'],
      output_node: false
    }
    await useLitegraphService().registerNodeDef(sourceNodeName, sourceNodeDef)

    const rootGraph = new LGraph()
    Reflect.set(app, 'rootGraph', rootGraph)
    const subgraph = createTestSubgraph({ rootGraph })
    const sourceNode = LiteGraph.createNode(sourceNodeName)
    if (!sourceNode) throw new Error('Failed to create source node')
    subgraph.add(sourceNode)

    const sourceWidget = sourceNode.widgets?.find(
      (widget) => widget.name === 'unet_name'
    )
    if (!sourceWidget) throw new Error('Missing source widget')
    const sourceInput = sourceNode.getSlotFromWidget(sourceWidget)
    if (!sourceInput) throw new Error('Missing source input')
    const subgraphInput = subgraph.addInput('unet_name', 'COMBO')
    if (!subgraphInput.connect(sourceInput, sourceNode)) {
      throw new Error('Failed to promote source widget')
    }

    useLitegraphService().registerSubgraphNodeDef(
      {
        name: subgraph.id,
        display_name: subgraph.name,
        category: 'subgraph',
        python_module: 'nodes',
        description: '',
        input: { required: {} },
        output: [],
        output_name: [],
        output_node: false
      },
      subgraph,
      {
        id: -1,
        type: subgraph.id,
        pos: [0, 0],
        size: [200, 100],
        inputs: [],
        outputs: [],
        properties: {},
        flags: {},
        mode: 0,
        order: 0
      }
    )

    const hostNode = LiteGraph.createNode(subgraph.id)
    if (!hostNode) throw new Error('Failed to create subgraph node')
    rootGraph.add(hostNode)

    const openModelSelector = vi.fn(async () => undefined)
    window.diffusApp = {
      featurePermissions: {
        checkTierForComfyUI: vi.fn(),
        openUpgradeDialogByReason: vi.fn(),
        openComfyUIRewardBundleDialog: vi.fn(() => false)
      },
      openModelSelector
    }

    const promotedWidget = hostNode.widgets?.find(
      (widget) => widget.name === 'unet_name'
    )
    expect(promotedWidget).toBeInstanceOf(ComboWidget)
    if (!(promotedWidget instanceof ComboWidget)) return

    promotedWidget.onClick(
      fromPartial<WidgetEventOptions>({
        node: hostNode,
        canvas: { graph_mouse: [0, 0] },
        e: {}
      })
    )

    await vi.waitFor(() =>
      expect(openModelSelector).toHaveBeenCalledWith({
        filter: { type: ['CHECKPOINT'] },
        lockedFilterKeys: ['type']
      })
    )
  })
})
