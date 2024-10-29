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
  <teleport to="body">
    <Button
      class="comfy-user-center button-icon"
      type="button"
      :icon="userAvatar"
      @click="toggleMenu"
      aria-haspopup="true"
      v-show="userAvatar"
      aria-controls="comfy-user-center-menu"
    >
      <img :src="userAvatar" />
    </Button>
    <Menu ref="menu" id="comfy-user-center-menu" :model="items" :popup="true">
      <template #start>
        <div>
          <ul class="list-none p-0 m-0 flex flex-col">
            <li
              class="flex items-center gap-2 px-2 py-3 hover:bg-emphasis cursor-pointer rounded-border"
            >
              <img :src="userAvatar" class="button-icon" />
              <div>
                <span class="font-medium" v-show="userName != userEmail">
                  {{ userName }}
                </span>
                <div class="text-sm text-surface-500 dark:text-surface-400">
                  {{ userEmail }}
                </div>
              </div>
            </li>
          </ul>
          <Divider />
        </div>
      </template>
      <template #item="{ item, props }">
        <a v-ripple class="flex align-items-center" v-bind="props.action">
          <span :class="item.icon" />
          <span class="ml-2">{{ item.label }}</span>
          <Badge v-if="item.badge" class="ml-auto" :value="item.badge" />
          <span
            v-if="item.shortcut"
            class="ml-auto border-1 surface-border border-round surface-100 text-xs p-1"
            >{{ item.shortcut }}</span
          >
        </a>
      </template>
    </Menu>
    <div v-if="menuVisible" class="overlay" @click="menuVisible = false"></div>
  </teleport>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import Button from 'primevue/button'
import Menu from 'primevue/menu'
import Divider from 'primevue/divider'
import { api } from '@/scripts/api'
import { ComfyDialog } from '@/scripts/ui'
import Toast from 'primevue/toast'
import { useToast } from 'primevue/usetoast'

const dialog = new ComfyDialog()
const toast = useToast()
const menu = ref()

const userAvatar = ref('')
const userName = ref('')
const userEmail = ref('')
const menuVisible = ref(false)

const toggleMenu = (event) => {
  menuVisible.value = !menuVisible.value
  menu.value.toggle(event)
}

const getAvatar = (url: string, name: string, callback: CallableFunction) => {
  const img = new Image()
  img.onerror = () => {
    const imgSrc = `https://ui-avatars.com/api/?name=${name}&background=random&format=svg`
    callback(imgSrc)
  }
  img.onload = () => {
    callback(url)
  }
  img.src = url
}

const updateUserInfo = () => {
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
      userEmail.value = orderInfo.email
      userName.value = orderInfo.name
      getAvatar(orderInfo.picture, orderInfo.name, (url: string) => {
        userAvatar.value = url
      })
    })
    .catch((error) => {
      console.warn(error)
    })
}

const redirectToUserCenter = () => {
  window.location.href = '/user'
}

const redirectToWebui = () => {
  window.open('/?&__theme=dark', '_self')
}

const cancelSubscription = () => {
  window.location.href = '/user#/billing?cancel_subscription=true'
}

const logout = () => {
  document.cookie = 'auth-session=;'
  window.location.href = '/api/logout'
}

const items = ref([
  {
    label: 'User Center',
    icon: 'pi pi-user',
    command: redirectToUserCenter
  },
  {
    label: 'WebUi',
    icon: 'pi pi-image',
    action: redirectToWebui
  },
  {
    label: 'Cancel Subscription',
    icon: 'pi pi-ban',
    command: cancelSubscription
  },
  {
    label: 'logout',
    icon: 'pi pi-sign-out',
    command: logout
  }
])

const onPromptQueued = async ({ detail }: CustomEvent) => {
  console.log('user center: onPromptQueued', detail)
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
  dialog.show(detail.message)
}

onMounted(() => {
  api.addEventListener('promptQueued', onPromptQueued)
  api.addEventListener('finished', onPromptFinished)
  api.addEventListener('input_cleared', onInputCleared)
  api.addEventListener('monitor_error', onMonitorError)
  updateUserInfo()
})

onUnmounted(() => {
  api.removeEventListener('promptQueued', onPromptQueued)
  api.removeEventListener('finished', onPromptFinished)
  api.removeEventListener('input_cleared', onInputCleared)
  api.removeEventListener('monitor_error', onMonitorError)
})
</script>

<style scoped>
.comfy-user-center {
  position: absolute;
  top: 60px;
  right: 60px;
}

.overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  z-index: 1000; /* Ensure it's above other elements */
}
.p-menu-item-link {
  cursor: pointer;
  display: flex;
  align-items: center;
  text-decoration: none;
  overflow: hidden;
  position: relative;
  color: inherit;
  padding: 12px;
  gap: 20px;
  user-select: none;
  outline: 0 none;
}
.button-icon {
  width: 50px; /* Adjust size as needed */
  height: 50px;
  margin-right: 8px; /* Space between image and text */
  vertical-align: middle;
  border-radius: 50%;
}
.p-divider {
  margin: 2px 0; /* Adjust spacing as needed */
}
</style>
