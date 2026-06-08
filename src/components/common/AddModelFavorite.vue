<!-- A file download button with a label and a size hint -->
<template>
  <div class="flex flex-row items-center justify-between gap-2 w-full">
    <div>
      <div>
        <span :title="hint">{{ label }}</span>
      </div>
      <Message
        v-if="props.error"
        severity="error"
        icon="pi pi-exclamation-triangle"
        size="small"
        variant="outlined"
        class="my-2 h-min max-w-xs px-1"
        :title="props.error"
        :pt="{
          text: { class: 'overflow-hidden text-ellipsis' }
        }"
      >
        <div v-if="showAddFavorite">
          {{ $t('missingModelsDialog.addModelToFavoritesPrompt') }}
        </div>
        <div v-else>
          {{ $t('missingModelsDialog.contactSupportPrompt') }}
        </div>
      </Message>
    </div>
    <div class="flex flex-row items-center gap-2">
      <div>
        <Button
          :label="$t('missingModelsDialog.copyModelName')"
          size="small"
          outlined
          :disabled="!props.label"
          @click="copyModelName"
        />
      </div>
      <div v-if="showAddFavorite">
        <Button
          :label="$t('missingModelsDialog.goToModelGallery')"
          size="small"
          outlined
          @click="goToModelGallery"
        />
      </div>
      <div v-else>
        <Button
          :label="$t('missingModelsDialog.contactSupport')"
          size="small"
          outlined
          @click="contactSupport"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import Button from 'primevue/button'
import Message from 'primevue/message'
import { computed } from 'vue'

import { useCopyToClipboard } from '@/composables/useCopyToClipboard'

const props = defineProps<{
  url: string
  hint?: string
  label?: string
  error?: string
}>()

const { copyToClipboard } = useCopyToClipboard()
const label = computed(() => props.label || props.url.split('/').pop())
const hint = computed(() => props.hint || props.url)
const modelName = computed(() => props.label?.split('/').pop()?.trim() || '')
const modelCategory = computed(() => props.label?.split('/')[0]?.trim() || '')

const showAddFavorite = computed(() => {
  return ['checkpoints', 'loras'].includes(modelCategory.value?.toLowerCase())
})

const copyModelName = async () => {
  if (!modelName.value) return
  await copyToClipboard(modelName.value)
}

const goToModelGallery = () => {
  const url = '/app/gallery/models'
  try {
    const target = window.top ?? window.parent
    target.location.assign(url)
  } catch {
    window.location.assign(url)
  }
}

const contactSupport = () => {
  const link = document.createElement('a')
  link.href = 'https://discord.gg/wz2UsQDtEM'
  link.style.display = 'none'
  link.target = '_blank'
  link.rel = 'noopener noreferrer'
  link.click()
}
</script>
