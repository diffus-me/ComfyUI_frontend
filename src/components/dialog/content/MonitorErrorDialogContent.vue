<template>
  <div class="flex flex-col gap-2 pt-8">
    <FloatLabel>
      <span v-html="promptMessage"></span>
    </FloatLabel>
    <Divider layout="horizontal" />
    <div class="flex justify-end gap-4">
      <Button @click="onConfirm">{{ confirmButtonText }}</Button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, defineProps } from 'vue'
import Button from 'primevue/button'
import FloatLabel from 'primevue/floatlabel'
import Divider from 'primevue/divider'
import { useDialogStore } from '@/stores/dialogStore'
import { useOrderInfoStore } from '@/stores/orderInfoStore'
import { useFeaturePermissionStore } from '@/stores/featurePermissionStore'

const AFFILIATE_PROGRAM =
  '<a href="/affiliate/everyone" target="_blank" style="text-wrap: nowrap">Affiliate Program</a>'
const DISCORD_SUPPORT =
  "Something error happened. Please join our <a href='https://discord.gg/e4UVBNuHyB'>Discord</a> for futher support."

const orderInfoStore = useOrderInfoStore()
const featurePermissionStore = useFeaturePermissionStore()

const props = defineProps({
  needUpgrade: {
    type: Boolean,
    required: true,
  },
  upgradeReason: {
    type: String,
    required: true,
  },
});

function _joinWords(words: string[], conjunction = 'and') {
  const names = words.map((item) => `"${item}"`)
  if (names.length == 1) {
    return names[0]
  }
  const last_name = names.pop()
  return `${names.join(', ')} ${conjunction} ${last_name}`
}

function makeNsfwContentMessage() {
  const ALLOWED_TIERS = ['Basic', 'Plus', 'Pro', 'Api']
  const allowed_tiers_message = _joinWords(ALLOWED_TIERS, 'or')

  let hint = ''
  if (orderInfoStore.userTier?.toLowerCase() === 'appsumo ltd tier 1') {
    hint = 'lift these restrictions'
  } else {
    hint = 'enable your private image storage'
  }

  return `Potential NSFW content was detected in the generated image, \
        upgrade to ${allowed_tiers_message} to ${hint}. \
        Or join our ${AFFILIATE_PROGRAM} \
        to earn cash or credits and use it to upgrade to a higher plan.`
}

function makeInsufficientCreditsMessage() {
  return `You have ran out of your credits, please purchase more or upgrade to a higher plan. Join our ${AFFILIATE_PROGRAM} to earn cash or credits.`
}

function makeInsufficientDailyCreditsMessage() {
  return 'Your daily credits limit for the trial has been exhausted. Subscribe now to unlock the daily restrictions.'
}

function makeReachConcurrencyLimitMessage() {
  const getUnit = (limit: number) => (limit === 1 ? 'task' : 'tasks')

  const tier = orderInfoStore.userTier
  const tierLimit = featurePermissionStore.limits.find((l) => l.tier === tier)
  const max_concurrent_tasks = tierLimit?.max_concurrent_tasks || 0

  const higher_limits = featurePermissionStore.upgradableLimits.filter(
    (item) => item?.max_concurrent_tasks && item.max_concurrent_tasks > max_concurrent_tasks
  )

  let result = `Your current plan allows only ${max_concurrent_tasks} concurrent ${getUnit(max_concurrent_tasks)}.`
  if (higher_limits.length > 0) {
    result += ' Upgrade to:'
    result += "<ul style='list-style: inside'>"
    for (let limit of higher_limits) {
      if(limit){
        result += `<li><b>${limit.tier}</b> to run up to ${limit.max_concurrent_tasks} \
                        ${getUnit(limit.max_concurrent_tasks)} simultaneously;</li>`
      }
    }
    result += '</ul>'
  }

  return result
}

const promptMessage = computed(() => {
  const needUpgrade = props.needUpgrade
  const upgradeReason = props.upgradeReason
  if (needUpgrade) {
    switch (upgradeReason) {
      case 'NSFW_CONTENT':
        return makeNsfwContentMessage()
      case 'INSUFFICIENT_CREDITS':
        return makeInsufficientCreditsMessage()
      case 'INSUFFICIENT_DAILY_CREDITS':
        return makeInsufficientDailyCreditsMessage()
      case 'REACH_CONCURRENCY_LIMIT':
        return makeReachConcurrencyLimitMessage()
      default:
        return DISCORD_SUPPORT
    }
  } else {
    return DISCORD_SUPPORT
  }
})

const confirmButtonText = computed(() => {
  const needUpgrade = props.needUpgrade
  const upgradeReason = props.upgradeReason
  if (needUpgrade) {
    switch (upgradeReason) {
      case 'NSFW_CONTENT':
        return 'Upgrade'
      case 'INSUFFICIENT_CREDITS':
        return 'Upgrade'
      case 'INSUFFICIENT_DAILY_CREDITS':
        return 'Subscribe Now'
      case 'REACH_CONCURRENCY_LIMIT':
        return 'Upgrade'
      default:
        return 'OK'
    }
  } else {
    return 'OK'
  }
})

function confirmUrl() {
  return orderInfoStore.pricingTableUrl
}

const onConfirm = () => {
  const needUpgrade = props.needUpgrade
  if (needUpgrade) {
    window.open(confirmUrl(), '_blank')
  }
  useDialogStore().closeDialog()
}
</script>

<style scoped></style>
