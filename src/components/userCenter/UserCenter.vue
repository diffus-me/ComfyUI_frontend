<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue'
import { useI18n } from 'vue-i18n'

import type {
  FinishedWsMessage,
  MonitorErrorWsMessage
} from '@/platform/remote/comfyui/execution/types'
import { useToastStore } from '@/platform/updates/common/toastStore'
import { api } from '@/scripts/api'
import {
  openUpgradeDialogByReason,
  showComfyUIBundleDialog
} from '@/scripts/diffusApp'
import { getStorageValue, setStorageValue } from '@/scripts/utils'

const { t } = useI18n()
const toastStore = useToastStore()

function addInfoToast(detail: string) {
  toastStore.add({
    severity: 'info',
    summary: t('g.updated'),
    detail,
    life: 3000
  })
}

const onPromptQueued = () => {
  addInfoToast(t('toastMessages.diffusPromptQueued'))
}

const onPromptFinished = ({ detail }: CustomEvent<FinishedWsMessage>) => {
  const { subscription_consumption: subscriptionConsumption } = detail
  let message = t('toastMessages.diffusPromptFinished', {
    seconds: detail.used_time.toFixed(2)
  })
  if (subscriptionConsumption?.credit_consumption != null) {
    const consumption = subscriptionConsumption.credit_consumption
    const discount = subscriptionConsumption.discount ?? 0
    const charged = Math.ceil(consumption * (1 - discount))
    message = t('toastMessages.diffusPromptFinishedWithCredits', {
      seconds: detail.used_time.toFixed(2),
      consumption,
      charged
    })
  }
  addInfoToast(message)
}

const onInputCleared = () => {
  addInfoToast(t('toastMessages.diffusInputFolderCleared'))
}

function checkComfyUIBundle() {
  const bundlePromptStatusKey = 'Diffus.BundlePromptStatus'
  const bundlePromptStatus = getStorageValue(bundlePromptStatusKey)
  const now = new Date()
  if (bundlePromptStatus) {
    const lastPromptedAt = new Date(Date.parse(bundlePromptStatus))
    if (
      now.getMonth() === lastPromptedAt.getMonth() &&
      now.getFullYear() === lastPromptedAt.getFullYear()
    ) {
      return
    }
  }
  if (showComfyUIBundleDialog()) {
    setStorageValue(bundlePromptStatusKey, now.toISOString())
  }
}

const onMonitorError = ({ detail }: CustomEvent<MonitorErrorWsMessage>) => {
  if (detail.message.reason) {
    openUpgradeDialogByReason(detail.message.reason)
  }
}

const onSetupFinished = () => {
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
