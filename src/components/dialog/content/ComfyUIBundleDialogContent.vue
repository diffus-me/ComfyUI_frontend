<template>
  <div class="flex flex-col gap-2 pt-8">
    <FloatLabel>
      {{ message }}
    </FloatLabel>
    <Divider layout="horizontal" />
    <div class="flex justify-end gap-4">
      <Button @click="onConfirm">OK</Button>
    </div>
  </div>
</template>

<script setup lang="ts">
import Button from 'primevue/button'
import FloatLabel from 'primevue/floatlabel'
import { ref } from 'vue'
import { useDialogStore } from '@/stores/dialogStore'

const message = ref('You Have a Reward ComfyUI Bundle')

const onConfirm = () => {
  useDialogStore().closeDialog()
}
</script>

<style scoped></style>
