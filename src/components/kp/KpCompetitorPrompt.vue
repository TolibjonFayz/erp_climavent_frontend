<template>
  <!-- KP "Yopilgan" bo'lganda: "Raqib bormidi?" — ha bo'lsa uchrashuv oynasi tayyor ma'lumot bilan ochiladi -->
  <el-dialog
    :model-value="stage === 'ask'"
    :title="$t('kpCmpAskTitle')"
    width="440px"
    append-to-body
    @update:model-value="(v) => !v && stage === 'ask' && close()"
  >
    <p class="kcp-text">
      {{ $t('kpCmpAskText', { n: kp?.client_name || (kp?.kp_number ? '№' + kp.kp_number : '') }) }}
    </p>
    <template #footer>
      <el-button @click="close">{{ $t('kpCmpNone') }}</el-button>
      <el-button type="primary" @click="openEncounter">{{ $t('kpCmpYes') }}</el-button>
    </template>
  </el-dialog>

  <EncounterDialog
    :model-value="stage === 'encounter'"
    @update:model-value="(v) => !v && stage === 'encounter' && close()"
    :competitors="competitors"
    :preset="preset"
    @saved="close"
  />
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import competitorsApi from '@/api/competitors'
import EncounterDialog from '@/components/competitors/EncounterDialog.vue'

// kp — yopilgan KP ({ kp_number, client_name, kp_sum, closed_date, dogovor_next }); null — yopiq
const props = defineProps({ kp: { type: Object, default: null } })
const emit = defineEmits(['done'])

// null | 'ask' | 'encounter' — bitta holat: yopilish animatsiyasi keyingi oynani yopib qo'ymasin
const stage = ref(null)
const competitors = ref([])

// Shu KP bo'yicha uchrashuv allaqachon kiritilgan bo'lsa — qayta so'ramaymiz
watch(
  () => props.kp,
  async (kp) => {
    if (!kp) {
      stage.value = null
      return
    }
    try {
      const num = Number(kp.kp_number)
      if (num) {
        const list = (await competitorsApi.encounters()) || []
        if (list.some((e) => Number(e.kp_number) === num)) return emit('done')
      }
    } catch {
      // Tekshira olmasak ham so'raymiz — bu faqat qulaylik
    }
    if (props.kp === kp) stage.value = 'ask'
  },
)

const preset = computed(() => {
  const kp = props.kp || {}
  return {
    kp_number: kp.kp_number ?? '',
    client_name: kp.client_name || '',
    our_price: kp.kp_sum != null && kp.kp_sum !== '' ? Number(kp.kp_sum) : null,
    encounter_date: kp.closed_date || new Date().toISOString().slice(0, 10),
    // Shartnoma raqami yozilgan bo'lsa — bitim bizda; aks holda xodim o'zi tanlaydi
    outcome: kp.dogovor_next ? 'won' : 'pending',
  }
})

async function openEncounter() {
  stage.value = 'encounter'
  try {
    competitors.value = (await competitorsApi.list()) || []
  } catch {
    competitors.value = []
  }
}

function close() {
  if (!stage.value) return
  stage.value = null
  emit('done')
}
</script>

<style scoped>
.kcp-text {
  margin: 0;
  line-height: 1.5;
  color: var(--ui-ink-2);
}
</style>
