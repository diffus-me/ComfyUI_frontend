import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { ComfyWorkflow } from '@/scripts/workflows'
import { buildTree } from '@/utils/treeUtil'
import { api } from '@/scripts/api'

export interface Feature {
  name: string
  allowed_tiers: string[]
}

export interface FeaturePermission {
  features: Feature[]
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
        ?.allowed_tiers
    })

    return {
      featurePermission,
      setFeaturePermission,
      allowedTiers
    }
  }
)
