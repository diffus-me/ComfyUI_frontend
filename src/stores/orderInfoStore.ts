import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { useFeaturePermissionStore } from './featurePermissionStore'

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

  const bundle = computed(() => {
    return orderInfo.value?.bundles?.find((b) => b.name === 'ComfyUI')
  })

  const needUpgrade = computed(() => {
    const featurePermissionStore = useFeaturePermissionStore()
    const allowedTiers = featurePermissionStore.allowedTiers
    return (
      !userTier.value || !allowedTiers || !allowedTiers.includes(userTier.value)
    )
  })

  const missBundle = computed(() => {
    return (
      !userTier.value ||
      (!['Plus', 'Pro', 'Api'].includes(userTier.value) && !bundle.value)
    )
  })

  const pricingTableUrl = '/app/pricing-table'
  const pricingTableAddOnUrl = '/app/pricing-table/addons/'

  return {
    orderInfo,
    setOrderInfo,
    userTier,
    bundle,
    needUpgrade,
    missBundle,
    pricingTableUrl,
    pricingTableAddOnUrl
  }
})
