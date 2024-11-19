import { defineStore } from 'pinia'
import { computed, ref } from 'vue'

export interface BundleInfo {
  name: string
  source: string
}

export interface OrderInfo {
  user_id: string
  name: string
  nickname: string
  picture: string
  email: string
  tier: string
  bundles: BundleInfo[]
}
export const useOrderInfoStore = defineStore('orderInfo', () => {
  const orderInfo = ref<OrderInfo | null>(null)

  const setOrderInfo = (info: OrderInfo) => {
    orderInfo.value = info
  }

  const userTier = computed(() => {
    return orderInfo.value?.tier
  })

  const comfyUIBundle = computed(() => {
    return orderInfo.value?.bundles.find((b) => b.name === 'ComfyUI')
  })

  return {
    orderInfo,
    setOrderInfo,
    userTier,
    comfyUIBundle
  }
})
