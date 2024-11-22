<template>
  <div class="flex flex-col gap-2 pt-8">
    <FloatLabel>
      {{ message }}
    </FloatLabel>
    <Divider layout="horizontal" />
    <div class="flex justify-end gap-4">
      <Button @click="onConfirm">Upgrade Now</Button>
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
  window.open(orderInfoStore.pricingTableUrl, '_blank')
  useDialogStore().closeDialog()
}

const message = computed(() => {
  const userTier = orderInfoStore.userTier
  const featurePermissionStore = useFeaturePermissionStore()
  const allowedTiers = featurePermissionStore.allowedTiers
  const allowedTiersMessage = allowedTiers.join(', ')
  return `ComfyUI is not available in the current plan ${userTier}. Please upgrade to ${allowedTiersMessage} to use it.`
})

const onCancel = () => {
  useDialogStore().closeDialog()
}
</script>

<style scoped></style>
