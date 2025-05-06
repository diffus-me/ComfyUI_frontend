<template>
  <Toast position="bottom-right" group="notifier">
    <template #message="slotProps">
      <div class="flex items-start flex-auto">
        <i class="pi pi-info-circle" />
        <span
          class="font-medium text-lg my-4"
          v-html="slotProps.message.detail"
        />
      </div>
    </template>
  </Toast>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue'
import { api } from '@/scripts/api'
import Toast from 'primevue/toast'
import { useToast } from 'primevue/usetoast'
import {openUpgradeDialogByReason, showComfyUIBundleDialog} from '@/scripts/diffusApp'
import { getStorageValue, setStorageValue } from '@/scripts/utils'

const toast = useToast()

const onPromptQueued = async (_: CustomEvent) => {
  toast.add({
    severity: 'info',
    summary: 'Updated',
    detail: 'prompt queued',
    life: 3000,
    group: 'notifier'
  })
}

const onPromptFinished = async ({ detail }: CustomEvent) => {
  const consumption = detail.subscription_consumption.credit_consumption
  const discount = detail.subscription_consumption.discount
  const charged = Math.ceil(consumption * (1 - discount))
  const message = `prompt finished, used time: <b>${detail.used_time.toFixed(2)}</b>s, credits consumption: <b><strike>${consumption}</strike> ${charged}<b>`
  toast.add({
    severity: 'info',
    summary: 'Updated',
    detail: message,
    life: 3000,
    group: 'notifier'
  })
}

const onInputCleared = async (_: CustomEvent) => {
  toast.add({
    severity: 'info',
    summary: 'Updated',
    detail: 'input folder cleared',
    life: 3000,
    group: 'notifier'
  })
}

function checkComfyUIBundle() {
  const bundlePromptStatusKey = 'Diffus.BundlePromptStatus'
  const bundlePromptStatus = getStorageValue(bundlePromptStatusKey)
  const now = new Date()
  if (bundlePromptStatus) {
    const lastPromptedAt = new Date(Date.parse(bundlePromptStatus))
    if (now.getMonth() === lastPromptedAt.getMonth() && now.getFullYear() === lastPromptedAt.getFullYear()) {
      return
    }
  }
  if (showComfyUIBundleDialog()){
    setStorageValue(bundlePromptStatusKey, now.toISOString())
  }
}

const onMonitorError = async ({ detail }: CustomEvent) => {
  openUpgradeDialogByReason(detail.message.reason)
}


const onSetupFinished = async (_: CustomEvent) => {
  window.parent.postMessage('setupFinished')
  checkComfyUIBundle()
}

onMounted(() => {
  api.addEventListener('promptQueued', onPromptQueued)
  api.addEventListener('finished', onPromptFinished)
  api.addEventListener('input_cleared', onInputCleared)
  api.addEventListener('monitor_error', onMonitorError)
  api.addEventListener('setupFinished', onSetupFinished)
})

onUnmounted(() => {
  api.removeEventListener('promptQueued', onPromptQueued)
  api.removeEventListener('finished', onPromptFinished)
  api.removeEventListener('input_cleared', onInputCleared)
  api.removeEventListener('monitor_error', onMonitorError)
  api.removeEventListener('setupFinished', onSetupFinished)
})
</script>
