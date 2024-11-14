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
import { useOrderInfoStore } from '@/stores/orderInfo'
import { useFeaturePermissionStore } from '@/stores/featurePerssionStore'
import { computed } from 'vue'

const SUBSCRIPTION_URL = '/pricing_table'

const onConfirm = () => {
  window.open(SUBSCRIPTION_URL, '_blank')
  useDialogStore().closeDialog()
}

const message = computed(() => {
  const userStore = useOrderInfoStore()
  const userTier = userStore.userTier
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
