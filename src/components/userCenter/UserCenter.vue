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
import { useOrderInfoStore } from '@/stores/orderInfoStore'
import { useFeaturePermissionStore } from '@/stores/featurePermissionStore'
import {
  showMonitorErrorDialog,
  showComfyUIBundleDialog
} from '@/services/dialogService'
import { getStorageValue, setStorageValue } from '@/scripts/utils'

const toast = useToast()
const orderInfoStore = useOrderInfoStore()
const featurePermissionStore = useFeaturePermissionStore()

const fetchUserOrderInfo = () => {
  const url = '/api/order_info'
  fetch(url, {
    method: 'GET',
    credentials: 'include',
    cache: 'no-cache'
  })
    .then((response) => {
      if (response.ok) {
        return response.json()
      }
      throw new Error('Network response was not ok')
    })
    .then((orderInfo) => {
      orderInfoStore.setOrderInfo(orderInfo)
    })
    .catch((error) => {
      console.warn(error)
    })
}

const fetchFeaturePermission = () => {
  const url = '/api/config/feature_permissions'
  fetch(url, {
    method: 'GET',
    credentials: 'include',
    cache: 'no-cache'
  })
    .then((response) => {
      if (response.ok) {
        return response.json()
      }
      throw new Error('Network response was not ok')
    })
    .then((featurePermission) => {
      featurePermissionStore.setFeaturePermission(featurePermission)
    })
    .catch((error) => {
      console.warn(error)
    })
}

const redirectToUpgrade = () => {
  if (orderInfoStore.needUpgrade && orderInfoStore.missBundle) {
    window.location.href = orderInfoStore.pricingTableComfyUrl
  } else if (orderInfoStore.needUpgrade) {
    window.location.href = orderInfoStore.pricingTableUrl
  }
}

const onPromptQueued = async ({ detail }: CustomEvent) => {
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

const onInputCleared = async ({ detail }: CustomEvent) => {
  toast.add({
    severity: 'info',
    summary: 'Updated',
    detail: 'input folder cleared',
    life: 3000,
    group: 'notifier'
  })
}

const onMonitorError = async ({ detail }: CustomEvent) => {
  showMonitorErrorDialog(detail.message.reason, detail.message.need_upgrade)
}

function showComfyUIBundleDialogIfNeeded() {
  const bundlePromptStatusKey = 'Diffus.BundlePromptStatus'
  const bundlePromptStatus = getStorageValue(bundlePromptStatusKey)
  if (bundlePromptStatus) {
    const lastPromptedAt = new Date(Date.parse(bundlePromptStatus))
    if (new Date().getMonth() === lastPromptedAt.getMonth()) {
      return
    }
  }

  const now = new Date()
  setStorageValue(bundlePromptStatusKey, now.toISOString())

  showComfyUIBundleDialog()
}

function checkBundle() {
  const bundle = orderInfoStore.bundle
  if (bundle && bundle.source === 'reward') {
    showComfyUIBundleDialogIfNeeded()
  }
}

const onSetupFinished = async ({ detail }: CustomEvent) => {
  checkBundle()
  setTimeout(() => {
    const userTier = orderInfoStore.userTier
    const allowedTiers = featurePermissionStore.allowedTiers
    if (!allowedTiers.includes(userTier)) {
      redirectToUpgrade()
    }
  }, 10 * 1000)
}

onMounted(() => {
  api.addEventListener('promptQueued', onPromptQueued)
  api.addEventListener('finished', onPromptFinished)
  api.addEventListener('input_cleared', onInputCleared)
  api.addEventListener('monitor_error', onMonitorError)
  api.addEventListener('setupFinished', onSetupFinished)

  fetchFeaturePermission()
  fetchUserOrderInfo()
  setInterval(fetchUserOrderInfo, 30 * 1000)
})

onUnmounted(() => {
  api.removeEventListener('promptQueued', onPromptQueued)
  api.removeEventListener('finished', onPromptFinished)
  api.removeEventListener('input_cleared', onInputCleared)
  api.removeEventListener('monitor_error', onMonitorError)
  api.removeEventListener('setupFinished', onSetupFinished)
})
</script>
