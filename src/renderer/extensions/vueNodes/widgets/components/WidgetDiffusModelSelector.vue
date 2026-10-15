<template>
  <WidgetLayoutField :widget>
    <button
      type="button"
      :aria-label="widget.label || widget.name"
      :class="
        cn(
          WidgetInputBaseClass,
          'flex w-full min-w-0 cursor-pointer items-center overflow-hidden border-none px-2 text-left hover:bg-component-node-widget-background-hovered',
          useWidgetHeight()
        )
      "
      @click="openSelector"
    >
      <span class="min-w-[4ch] flex-1 truncate text-xs">
        {{ displayValue || '\u00a0' }}
      </span>
      <i
        class="icon-[lucide--images] size-4 shrink-0 bg-muted-foreground"
        aria-hidden="true"
      />
    </button>
  </WidgetLayoutField>
</template>

<script setup lang="ts">
import { computed } from 'vue'

import { useWorkflowStore } from '@/platform/workflow/management/stores/workflowStore'
import {
  getModelSelectorDisplayValue,
  requestDiffusModelSelection
} from '@/scripts/diffusModelSelector'
import type { SimplifiedWidget, WidgetValue } from '@/types/simplifiedWidget'
import { useWidgetHeight } from '@/types/widgetTypes'
import { cn } from '@comfyorg/tailwind-utils'

import { WidgetInputBaseClass } from './layout'
import WidgetLayoutField from './layout/WidgetLayoutField.vue'

const { widget } = defineProps<{
  widget: SimplifiedWidget<string | undefined>
}>()

const modelValue = defineModel<WidgetValue>()
const displayValue = computed(() =>
  getModelSelectorDisplayValue(modelValue.value)
)

async function openSelector() {
  if (!widget.spec) return

  const result = await requestDiffusModelSelection(widget.spec)
  if (!result) return

  modelValue.value = result
  useWorkflowStore().activeWorkflow?.changeTracker.captureCanvasState()
}
</script>
