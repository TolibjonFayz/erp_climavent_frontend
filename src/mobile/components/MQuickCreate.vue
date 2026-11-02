<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { showActionSheet } from '../actionSheet'
import { useSession } from '../session'
import { tapFeedback } from '../native'

// "+ Yangi": tabbar sahifalarida suzuvchi tugma — istalgan joydan mijoz, tashrif, KP, shartnoma,
// loyiha, uchrashuv yoki vazifa qo'shish (saytdagi QuickCreate bilan bir xil bandlar)
const { t } = useI18n()
const router = useRouter()
const { can, isAdmin } = useSession()

const ITEMS = [
  { key: 'customers', label: 'qcCustomer', hint: 'qcCustomerHint', to: { name: 'customer-new' } },
  { key: 'sites', label: 'qcSite', hint: 'qcSiteHint', to: { name: 'site-new' } },
  { key: 'kp', label: 'qcKp', hint: 'qcKpHint', to: { name: 'kp-new' } },
  { key: 'dogovor', label: 'qcDogovor', hint: 'qcDogovorHint', to: { name: 'dogovor-new' } },
  { key: 'loyiha', label: 'qcLoyiha', hint: 'qcLoyihaHint', to: { name: 'loyiha-new' } },
  { key: 'competitors', label: 'qcEncounter', hint: 'qcEncounterHint', to: { name: 'encounter-new' } },
  { key: 'tasks', label: 'qcTask', hint: 'qcTaskHint', admin: true, to: { name: 'tasks', query: { new: '1' } } },
]
const items = computed(() => ITEMS.filter((i) => can(i.key) && (!i.admin || isAdmin.value)))

function open() {
  tapFeedback()
  showActionSheet({
    title: t('qcTitle'),
    actions: items.value.map((i) => ({ name: t(i.label), subname: t(i.hint), key: i.key })),
    cancelText: t('cancel'),
  })
    .then((a) => router.push(ITEMS.find((i) => i.key === a.key).to))
    .catch(() => {})
}
</script>

<template>
  <button v-if="items.length" type="button" class="mqc" :aria-label="$t('qcTitle')" @click="open">
    <van-icon name="plus" />
  </button>
</template>

<style scoped>
.mqc {
  position: fixed;
  right: 16px;
  bottom: calc(66px + env(safe-area-inset-bottom));
  z-index: 50;
  display: grid;
  place-items: center;
  width: 54px;
  height: 54px;
  border: 0;
  border-radius: 18px;
  background: var(--m-primary);
  color: var(--m-on-solid);
  font-size: 24px;
  box-shadow: 0 10px 24px rgba(42, 120, 214, 0.35);
  transition: scale 0.12s ease;
}
.mqc:active {
  scale: 0.94;
}
</style>
