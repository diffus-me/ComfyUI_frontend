import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { ComfyWorkflow } from '@/scripts/workflows'
import { buildTree } from '@/utils/treeUtil'
import { api } from '@/scripts/api'

export interface OrderInfo {
  user_id: string
  name: string
  nickname: string
  picture: string
  email: string
  tier: string
}
export const useOrderInfoStore = defineStore('orderInfo', () => {
  const orderInfo = ref<OrderInfo | null>(null)

  const setOrderInfo = (info: OrderInfo) => {
    orderInfo.value = info
  }

  const userTier = computed(() => {
    return orderInfo.value?.tier
  })

  return {
    orderInfo,
    setOrderInfo,
    userTier
  }
})
