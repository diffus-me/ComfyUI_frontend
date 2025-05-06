import { defineStore } from 'pinia'
import { computed, ref } from 'vue'

const _upgradableTiers = ['Basic', 'Plus', 'Pro', 'Api']

export interface Feature {
  name: string
  allowed_tiers: string[]
}

export interface Limit {
  tier: string
  max_sampling_steps: number
  max_controlnet_units: number
  max_concurrent_tasks: number
}

export interface FeaturePermission {
  features: Feature[]
  limits: Limit[]
}

export const useFeaturePermissionStore = defineStore(
  'featurePermission',
  () => {
    const featurePermission = ref<FeaturePermission | null>(null)

    const setFeaturePermission = (perm: FeaturePermission) => {
      featurePermission.value = perm
    }

    const allowedTiers = computed(() => {
      return featurePermission.value?.features.find((f) => f.name === 'ComfyUI')
        ?.allowed_tiers || []
    })

    const limits = computed(() => {
      return featurePermission.value?.limits || []
    })

    const upgradableLimits = computed(() => {
      return _upgradableTiers.map((tier) =>
        featurePermission.value?.limits.find((l) => l.tier === tier)
      )
    })

    return {
      featurePermission,
      setFeaturePermission,
      allowedTiers,
      limits,
      upgradableLimits
    }
  }
)
