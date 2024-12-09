<template>
  <Dialog
    v-model:visible="dialogStore.isGalleryVisible"
    modal
    closable
    closeOnEscape
    dismissableMask
    :pt="{
      root: 'border-none',
      mask: {
        style: 'backdrop-filter: blur(2px)'
      }
    }"
  >
    <template #container="{}">
      <KeepAlive>
        <div class="gallery-iframe">
          <iframe
            ref="iframe"
            id="gallery-iframe"
            :src="galleryUrl"
            width="100%"
            height="100%"
          />
        </div>
      </KeepAlive>
    </template>
  </Dialog>
</template>

<script setup lang="ts">
import { useDialogStore } from '@/stores/dialogStore'
import Dialog from 'primevue/dialog'
import { computed } from 'vue'
const dialogStore = useDialogStore()

const galleryUrl = computed(() => {
  if (dialogStore.galleryDrawer && dialogStore.galleryDrawer === 'images') {
    return '/app/gallery?drawer=images'
  } else {
    return '/app/gallery'
  }
})
</script>

<style lang="css" scoped>
.gallery-iframe {
  border-radius: 8px !important;
  overflow: auto;
  width: 80vw; /* 80% of the viewport width */
  height: 80vh; /* 80% of the viewport height */
  border: 1px solid black;
  position: relative;
  margin: auto; /* Center the container */
  display: flex;
  justify-content: center;
  align-items: center;
}
</style>
