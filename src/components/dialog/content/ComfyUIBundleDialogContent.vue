<template>
  <div class="flex flex-col gap-2 pt-8">
    <FloatLabel>
      <span v-html="promptMessage"></span>
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

const promptMessage = ref(
  'Thank you for your continued support! As a valued loyal user, you’ve been gifted a ComfyUI Bundle for free.<br>Enjoy ComfyUI without any additional charge.'
)

const onConfirm = () => {
  useDialogStore().closeDialog()
}
</script>

<style scoped></style>
