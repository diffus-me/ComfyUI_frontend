import type { LGraphNode } from '@/lib/litegraph/src/LGraphNode'
import type { IBaseWidget } from '@/lib/litegraph/src/types/widgets'
import type { WidgetEventOptions } from '@/lib/litegraph/src/widgets/BaseWidget'
import { toConcreteWidget } from '@/lib/litegraph/src/widgets/widgetMap'
import { useWorkflowStore } from '@/platform/workflow/management/stores/workflowStore'
import type { InputSpec } from '@/schemas/nodeDef/nodeDefSchemaV2'
import {
  isDiffusModelSelectorAvailable,
  openDiffusModelSelector,
  showDiffusModelSelectorError
} from '@/scripts/diffusApp'
import type {
  DiffusModelSelectorOptions,
  DiffusModelSelectorResult
} from '@/scripts/diffusApp'
import type { WidgetValue } from '@/types/simplifiedWidget'

interface ModelInfoValue {
  extension: string
  model_type: string
  sha256: string
  stem: string
}

interface ModelSelectorValue {
  title?: string
  value: string
  filename: string
}

interface ModelSelectorComboWidget extends IBaseWidget<WidgetValue, 'combo'> {
  onClick(options: WidgetEventOptions): void
  serializeValue?: () => unknown
  setValue(value: WidgetValue, options: WidgetEventOptions): void
  type: 'combo'
  value: WidgetValue
}

const GALLERY_MODEL_TYPE_BY_COMFY_MODEL_TYPE: Record<string, string> = {
  checkpoints: 'CHECKPOINT',
  clip_vision: 'CLIP_VISION',
  controlnet: 'CONTROLNET',
  diffusion_models: 'CHECKPOINT',
  embeddings: 'EMBEDDING',
  loras: 'LORA',
  lycoris: 'LYCORIS',
  text_encoders: 'TEXT_ENCODER',
  vae: 'VAE'
}

const GALLERY_QUANTIZATION_BY_COMFY_QUANTIZATION: Record<string, string> = {
  NONE: 'UNQUANTIZED',
  GGUF: 'GGUF',
  SVDQUANT: 'SVDQUANT',
  COMFYUI: 'COMFY_QUANT',
  BITSANDBYTES: 'BNB'
}

type ModelSelectorOptionsResolution =
  | { kind: 'none' }
  | { kind: 'invalid'; error: string }
  | { kind: 'valid'; options: DiffusModelSelectorOptions }

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function unique(values: string[]): string[] {
  return [...new Set(values)]
}

function resolveOptionalFilter(
  metadata: Record<string, unknown>,
  metadataKey: string
): { value?: string[]; error?: string } {
  const rawValue = metadata[metadataKey]
  if (rawValue === undefined) return {}

  const values = typeof rawValue === 'string' ? [rawValue] : rawValue
  if (
    !Array.isArray(values) ||
    values.length === 0 ||
    values.some(
      (value) => typeof value !== 'string' || value.trim().length === 0
    )
  ) {
    return {
      error: `model_selector.${metadataKey} must be a non-empty string or array of strings.`
    }
  }

  return { value: unique(values) }
}

function isModelSelectorValue(value: unknown): value is ModelSelectorValue {
  return (
    isRecord(value) &&
    typeof value.value === 'string' &&
    value.value.length > 0 &&
    typeof value.filename === 'string' &&
    value.filename.length > 0 &&
    (value.title === undefined || typeof value.title === 'string')
  )
}

function isModelSelectorResult(
  value: unknown
): value is DiffusModelSelectorResult {
  return (
    isModelSelectorValue(value) &&
    typeof value.title === 'string' &&
    value.title.length > 0
  )
}

function parseModelInfo(value: unknown): ModelInfoValue | undefined {
  if (typeof value !== 'string' || !value.trimStart().startsWith('{')) return

  try {
    const parsed: unknown = JSON.parse(value)
    if (
      isRecord(parsed) &&
      typeof parsed.stem === 'string' &&
      parsed.stem.length > 0 &&
      typeof parsed.extension === 'string' &&
      parsed.extension.length > 0 &&
      typeof parsed.model_type === 'string' &&
      typeof parsed.sha256 === 'string'
    ) {
      return {
        extension: parsed.extension,
        model_type: parsed.model_type,
        sha256: parsed.sha256,
        stem: parsed.stem
      }
    }
  } catch {
    return
  }
}

export function isDiffusModelSelectorDeclared(
  spec: unknown
): spec is Record<string, unknown> & { model_selector: unknown } {
  return (
    isRecord(spec) &&
    Object.prototype.hasOwnProperty.call(spec, 'model_selector')
  )
}

export function resolveModelSelectorOptions(
  spec: unknown
): ModelSelectorOptionsResolution {
  if (!isDiffusModelSelectorDeclared(spec)) return { kind: 'none' }

  const metadata = spec.model_selector
  if (!isRecord(metadata)) {
    return {
      kind: 'invalid',
      error:
        'model_selector.model_types must be a non-empty string or array of strings.'
    }
  }

  const resolvedModelTypes = resolveOptionalFilter(metadata, 'model_types')
  if (!resolvedModelTypes.value) {
    return {
      kind: 'invalid',
      error:
        resolvedModelTypes.error ??
        'model_selector.model_types must be a non-empty string or array of strings.'
    }
  }
  const modelTypes = resolvedModelTypes.value

  const unknownType = modelTypes.find(
    (modelType) => !GALLERY_MODEL_TYPE_BY_COMFY_MODEL_TYPE[modelType]
  )
  if (unknownType) {
    return {
      kind: 'invalid',
      error: `Unknown ComfyUI model type: ${unknownType}`
    }
  }

  const filter: DiffusModelSelectorOptions['filter'] = {
    type: unique(
      modelTypes.map(
        (modelType) => GALLERY_MODEL_TYPE_BY_COMFY_MODEL_TYPE[modelType]
      )
    )
  }

  for (const [metadataKey, filterKey] of [
    ['model_base', 'base'],
    ['precision', 'precision']
  ] as const) {
    const resolved = resolveOptionalFilter(metadata, metadataKey)
    if (resolved.error) return { kind: 'invalid', error: resolved.error }
    if (resolved.value) filter[filterKey] = resolved.value
  }

  const resolvedQuantizations = resolveOptionalFilter(metadata, 'quantization')
  if (resolvedQuantizations.error) {
    return { kind: 'invalid', error: resolvedQuantizations.error }
  }
  if (resolvedQuantizations.value) {
    const unknownQuantization = resolvedQuantizations.value.find(
      (quantization) =>
        !GALLERY_QUANTIZATION_BY_COMFY_QUANTIZATION[quantization]
    )
    if (unknownQuantization) {
      return {
        kind: 'invalid',
        error: `Unknown ComfyUI quantization: ${unknownQuantization}`
      }
    }
    filter.quantization = unique(
      resolvedQuantizations.value.map(
        (quantization) =>
          GALLERY_QUANTIZATION_BY_COMFY_QUANTIZATION[quantization]
      )
    )
  }

  return {
    kind: 'valid',
    options: {
      filter,
      lockedFilterKeys: ['type']
    }
  }
}

export function isDiffusModelSelectorActive(spec?: unknown): boolean {
  return Boolean(
    spec &&
    isDiffusModelSelectorDeclared(spec) &&
    isDiffusModelSelectorAvailable()
  )
}

function reportSelectorError(error: unknown): void {
  console.error('Failed to use Diffus model selector', error)
  showDiffusModelSelectorError('Failed to open model Gallery')
}

export async function requestDiffusModelSelection(
  spec: unknown
): Promise<DiffusModelSelectorResult | undefined> {
  try {
    const resolution = resolveModelSelectorOptions(spec)
    if (resolution.kind === 'invalid') {
      reportSelectorError(resolution.error)
      return
    }
    if (resolution.kind === 'none' || !isDiffusModelSelectorAvailable()) return

    const result = await openDiffusModelSelector(resolution.options)
    if (result === undefined) return
    if (!isModelSelectorResult(result)) {
      reportSelectorError('Diffus model selector returned an invalid result.')
      return
    }
    return result
  } catch (error) {
    reportSelectorError(error)
  }
}

export function getModelSelectorDisplayValue(value: unknown): string {
  if (isModelSelectorValue(value)) return value.title || value.filename

  const modelInfo = parseModelInfo(value)
  if (modelInfo) return `${modelInfo.stem}.${modelInfo.extension}`

  return typeof value === 'string' ? value : String(value ?? '')
}

export function getModelSelectorPromptValue(value: unknown): unknown {
  return isModelSelectorValue(value) ? value.value : value
}

export function getModelSelectorWorkflowValue(value: unknown): string {
  if (isModelSelectorValue(value)) return value.filename

  const modelInfo = parseModelInfo(value)
  if (modelInfo) return `${modelInfo.stem}.${modelInfo.extension}`

  return typeof value === 'string' ? value : String(value ?? '')
}

function installWorkflowSerialization(
  node: LGraphNode,
  widget: ModelSelectorComboWidget
): void {
  const previousOnSerialize = node.onSerialize
  node.onSerialize = function (serialized) {
    previousOnSerialize?.call(this, serialized)

    const workflowValue = getModelSelectorWorkflowValue(widget.value)
    if (serialized.widgets_values_named) {
      serialized.widgets_values_named[widget.name] = workflowValue
    }

    const serializedIndex = (node.widgets ?? [])
      .filter((candidate) => candidate.serialize !== false)
      .indexOf(widget)
    if (serializedIndex >= 0 && serialized.widgets_values) {
      serialized.widgets_values[serializedIndex] = workflowValue
    }
  }
}

export function configureDiffusModelSelectorWidget(
  node: LGraphNode,
  widget: IBaseWidget,
  spec: InputSpec
): void {
  if (!isDiffusModelSelectorDeclared(spec)) return

  const concreteWidget = toConcreteWidget(widget, node, false)
  if (!concreteWidget || concreteWidget.type !== 'combo') return

  const modelWidget = concreteWidget as unknown as ModelSelectorComboWidget
  const standardOnClick = modelWidget.onClick.bind(modelWidget)

  modelWidget.options.getOptionLabel = (value) =>
    getModelSelectorDisplayValue(value)
  modelWidget.serializeValue = () =>
    getModelSelectorPromptValue(modelWidget.value)
  installWorkflowSerialization(node, modelWidget)

  modelWidget.onClick = (options) => {
    if (!isDiffusModelSelectorActive(spec)) {
      standardOnClick(options)
      return
    }

    void requestDiffusModelSelection(spec).then((result) => {
      if (!result) return
      modelWidget.setValue(result, options)
      useWorkflowStore().activeWorkflow?.changeTracker.captureCanvasState()
    })
  }
}
