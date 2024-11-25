<template>
  <div class="flex flex-col gap-2 pt-8">
    <FloatLabel>
      <span v-html="message"></span>
    </FloatLabel>
    <Divider layout="horizontal" />
    <div class="flex justify-end gap-4">
      <Button @click="onConfirm">{{ confirmButtionTitle }}</Button>
    </div>
  </div>
</template>

<script setup lang="ts">
import Button from 'primevue/button'
import FloatLabel from 'primevue/floatlabel'
import Divider from 'primevue/divider'
import { useDialogStore } from '@/stores/dialogStore'
import { useOrderInfoStore } from '@/stores/orderInfoStore'
import { useFeaturePermissionStore } from '@/stores/featurePermissionStore'
import { computed } from 'vue'

const orderInfoStore = useOrderInfoStore()

const onConfirm = () => {
  let pricingTableUrl = orderInfoStore.pricingTableUrl
  if (orderInfoStore.needUpgrade) {
    pricingTableUrl = orderInfoStore.pricingTableUrl
  } else if (orderInfoStore.missBundle) {
    pricingTableUrl = orderInfoStore.pricingTableAddOnUrl
  }

  window.open(pricingTableUrl, '_blank')
  useDialogStore().closeDialog()
}

const confirmButtionTitle = computed(() => {
  if (orderInfoStore.needUpgrade && orderInfoStore.missBundle) {
    return 'Upgrade Now'
  } else if (orderInfoStore.needUpgrade) {
    return 'Upgrade Now'
  } else if (orderInfoStore.missBundle) {
    return 'Subscribe Now'
  }
  return 'OK'
})

const message = computed(() => {
  const userTier = orderInfoStore.userTier
  const featurePermissionStore = useFeaturePermissionStore()
  const allowedTiers = featurePermissionStore.allowedTiers

  const allowedTiersMessage = allowedTiers.join(', ')
  if (orderInfoStore.needUpgrade && orderInfoStore.missBundle) {
    return `ComfyUI is not available in the current plan <b>${userTier}</b>. Please upgrade to ${allowedTiersMessage} <b>AND</b> subscribe ComfyUI Bundle to use it.`
  } else if (orderInfoStore.needUpgrade) {
    return `ComfyUI is not available in the current plan <b>${userTier}</b>. Please upgrade to ${allowedTiersMessage} to use it.`
  } else if (orderInfoStore.missBundle) {
    return `You need subscribe <b>ComfyUI Bundle</b> to use ComfyUI.`
  }
  return "Something error happened. Please join our <a href='https://discord.gg/e4UVBNuHyB'>Discord</a> for futher support."
})

const onCancel = () => {
  useDialogStore().closeDialog()
}
</script>

<style scoped></style>
