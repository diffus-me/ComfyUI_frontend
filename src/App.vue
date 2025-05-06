<template>
  <router-view />
  <ProgressSpinner
    v-if="isLoading"
    class="absolute inset-0 flex justify-center items-center h-[unset]"
  />
  <GlobalDialog />
  <BlockUI full-screen :blocked="isLoading" />
</template>

<script setup lang="ts">
import { useEventListener } from '@vueuse/core'
import BlockUI from 'primevue/blockui'
import ProgressSpinner from 'primevue/progressspinner'
import { computed, onMounted } from 'vue'

import GlobalDialog from '@/components/dialog/GlobalDialog.vue'
import config from '@/config'
import { useWorkspaceStore } from '@/stores/workspaceStore'

import { electronAPI, isElectron } from './utils/envUtil'

import { api } from '@/scripts/api'
import { app, ComfyApp } from '@/scripts/app'

const workspaceStore = useWorkspaceStore()
const isLoading = computed<boolean>(() => workspaceStore.spinner)
// const handleKey = (e: KeyboardEvent) => {
//   workspaceStore.shiftDown = e.shiftKey
// }

const handleMessage = (message: any) => {
  const { cmd, workflow } = JSON.parse(message.data)
  if (cmd === 'runImage') {
    api.dispatchCustomEvent('runWorkflowReceived', workflow)
  } else {
    console.warn(`unhandled event ${cmd}`)
  }
}

app.api.addEventListener('setupFinished', () => {
  window.comfyUIApp = app
})

// useEventListener(window, 'keydown', handleKey)
// useEventListener(window, 'keyup', handleKey)
useEventListener(window, 'message', handleMessage)

const showContextMenu = (event: MouseEvent) => {
  const { target } = event
  switch (true) {
    case target instanceof HTMLTextAreaElement:
    case target instanceof HTMLInputElement && target.type === 'text':
      // TODO: Context input menu explicitly for text input
      electronAPI()?.showContextMenu({ type: 'text' })
      return
  }
}

onMounted(() => {
  // @ts-expect-error fixme ts strict error
  window['__COMFYUI_FRONTEND_VERSION__'] = config.app_version
  console.log('ComfyUI Front-end version:', config.app_version)

  if (isElectron()) {
    document.addEventListener('contextmenu', showContextMenu)
  }
})

declare global {
  interface Window {
    comfyUIApp?: ComfyApp
  }
}
</script>
