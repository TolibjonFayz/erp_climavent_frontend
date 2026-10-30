<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { showFailToast, showSuccessToast } from 'vant'
import competitorsApi from '@/api/competitors'
import { usePartnersStore } from '@/stores/partners'
import { OUTCOMES, REASONS } from '@/components/competitors/competitorFormat'
import MPage from '../../components/MPage.vue'
import MDateField from '../../components/MDateField.vue'
import MSelectSheet from '../../components/MSelectSheet.vue'
import { currentUserId, useSession } from '../../session'
import { errorText, money, ymd } from '../../utils'
import { tapFeedback } from '../../native'

// Raqib bilan uchrashuv: yangi (query: competitor_id, partner_id) yoki tahrir (params.id)
const { t, locale } = useI18n()
const route = useRoute()
const router = useRouter()
const partnersStore = usePartnersStore()
const { isAdmin } = useSession()

const editId = computed(() => (route.params.id ? Number(route.params.id) : null))
const loading = ref(true)
const competitors = ref([])

const form = reactive({
  competitor_id: route.query.competitor_id ? Number(route.query.competitor_id) : null,
  encounter_date: ymd(new Date()),
  partner_id: route.query.partner_id ? Number(route.query.partner_id) : null,
  client_name: '',
  kp_number: '',
  their_price: '',
  our_price: '',
  outcome: 'pending',
  reason: null,
  note: '',
})
const errors = reactive({})

// Admin hamma mijozni, xodim — o'zinikini tanlaydi (backend ham shuni tekshiradi)
const partners = computed(() =>
  (isAdmin.value ? partnersStore.allPartners : partnersStore.allPartnersofUser) || [],
)

onMounted(async () => {
  try {
    const jobs = [competitorsApi.list().then((l) => (competitors.value = l || []))]
    if (!partners.value.length) {
      jobs.push(isAdmin.value ? partnersStore.getAllPartners() : partnersStore.getAllPartnersOfUser(currentUserId()))
    }
    if (editId.value) {
      jobs.push(
        competitorsApi.encounters().then((list) => {
          const e = (list || []).find((x) => x.id === editId.value)
          if (!e) throw new Error('not found')
          Object.assign(form, {
            competitor_id: e.competitor_id,
            encounter_date: String(e.encounter_date).slice(0, 10),
            partner_id: e.partner_id,
            client_name: e.client_name || '',
            kp_number: e.kp_number ?? '',
            their_price: e.their_price ?? '',
            our_price: e.our_price ?? '',
            outcome: e.outcome,
            reason: e.reason,
            note: e.note || '',
          })
        }),
      )
    }
    await Promise.all(jobs)
  } catch (e) {
    showFailToast(errorText(e, t, locale.value))
    if (editId.value) router.back()
  } finally {
    loading.value = false
  }
})

// ─── Tanlov oynalari ───
const competitorSheet = ref(false)
const partnerSheet = ref(false)
const competitorOptions = computed(() => competitors.value.map((c) => ({ value: c.id, label: c.name })))
const partnerOptions = computed(() => [
  { value: null, label: t('m.cmpNoPartner') },
  ...partners.value.map((p) => ({ value: p.id, label: p.fullname })),
])
const competitorName = computed(() => competitors.value.find((c) => c.id === form.competitor_id)?.name || '')
const partnerName = computed(() => partners.value.find((p) => p.id === form.partner_id)?.fullname || '')

function validate() {
  for (const k of Object.keys(errors)) delete errors[k]
  if (!form.competitor_id) errors.competitor_id = t('cmpCompetitorRequired')
  if (!form.encounter_date) errors.encounter_date = t('cmpDateRequired')
  if (!form.partner_id && !form.client_name.trim()) errors.client_name = t('cmpClientRequired')
  return !Object.keys(errors).length
}

const num = (v) => (v === '' || v === null || v === undefined ? null : Number(v))

const saving = ref(false)
async function save() {
  if (!validate()) {
    showFailToast(t('m.fillRequired'))
    return
  }
  const kp = String(form.kp_number ?? '').replace(/\D/g, '')
  const payload = {
    competitor_id: form.competitor_id,
    encounter_date: form.encounter_date,
    partner_id: form.partner_id || null,
    client_name: form.partner_id ? '' : form.client_name.trim(),
    kp_number: kp ? Number(kp) : null,
    their_price: num(form.their_price),
    our_price: num(form.our_price),
    outcome: form.outcome,
    // "Jarayonda"da sabab bo'lmaydi
    reason: form.outcome === 'pending' ? null : form.reason,
    note: form.note,
  }
  saving.value = true
  try {
    if (editId.value) await competitorsApi.updateEncounter(editId.value, payload)
    else await competitorsApi.createEncounter(payload)
    showSuccessToast(t('cmpSaved'))
    tapFeedback()
    router.back()
  } catch (e) {
    showFailToast({ message: errorText(e, t, locale.value), wordBreak: 'break-word' })
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <MPage :title="editId ? $t('cmpEncEditTitle') : $t('cmpEncAddTitle')" :back="{ name: 'competitors' }">
    <div v-if="loading" class="m-card" style="margin-top: 12px"><van-skeleton :row="6" /></div>
    <div v-else class="mf">
      <div class="m-section"><span class="m-section__title">{{ $t('cmpOutcome') }}</span></div>
      <div class="mf-seg">
        <button
          v-for="o in OUTCOMES"
          :key="o.value"
          type="button"
          :class="{ 'is-active': form.outcome === o.value }"
          @click="form.outcome = o.value"
        >
          {{ $t(o.labelKey) }}
        </button>
      </div>

      <template v-if="form.outcome !== 'pending'">
        <div class="m-section">
          <span class="m-section__title">{{ $t(form.outcome === 'won' ? 'cmpWhyWon' : 'cmpWhyLost') }}</span>
        </div>
        <div class="m-chips mf-chips">
          <button
            v-for="r in REASONS"
            :key="r"
            type="button"
            class="m-chip"
            :class="{ 'is-active': form.reason === r }"
            @click="form.reason = form.reason === r ? null : r"
          >
            {{ $t(`cmpReason_${r}`) }}
          </button>
        </div>
      </template>

      <div class="m-section"><span class="m-section__title">{{ $t('m.mainInfo') }}</span></div>
      <van-cell-group inset>
        <van-field
          :model-value="competitorName"
          :label="$t('cmpCompetitor')"
          label-align="top"
          readonly
          is-link
          :placeholder="$t('m.choose')"
          :error-message="errors.competitor_id"
          @click="competitorSheet = true"
        />
        <MDateField v-model="form.encounter_date" :label="$t('cmpDate')" :clearable="false" :error="errors.encounter_date" />
        <van-field
          :model-value="partnerName"
          :label="$t('cmpClient')"
          label-align="top"
          readonly
          is-link
          :placeholder="$t('cmpClientPick')"
          @click="partnerSheet = true"
        />
        <van-field
          v-if="!form.partner_id"
          v-model="form.client_name"
          :label="$t('cmpClientName')"
          label-align="top"
          :placeholder="$t('cmpClientNameHint')"
          :error-message="errors.client_name"
        />
        <van-field v-model="form.kp_number" :label="$t('cmpKpNumber')" label-align="top" type="digit" :placeholder="$t('m.optional')" />
      </van-cell-group>

      <div class="m-section"><span class="m-section__title">{{ $t('cmpPrices') }}</span></div>
      <van-cell-group inset>
        <van-field v-model="form.their_price" :label="$t('cmpTheirPrice')" label-align="top" type="number" placeholder="0">
          <template #extra>
            <span v-if="form.their_price !== ''" class="mf-hint m-num">{{ money(form.their_price, t) }}</span>
          </template>
        </van-field>
        <van-field v-model="form.our_price" :label="$t('cmpOurPrice')" label-align="top" type="number" placeholder="0">
          <template #extra>
            <span v-if="form.our_price !== ''" class="mf-hint m-num">{{ money(form.our_price, t) }}</span>
          </template>
        </van-field>
      </van-cell-group>

      <div class="m-section"><span class="m-section__title">{{ $t('cmpNote') }}</span></div>
      <van-cell-group inset>
        <van-field v-model="form.note" type="textarea" rows="3" autosize :placeholder="$t('m.optional')" />
      </van-cell-group>
    </div>

    <template #footer>
      <div class="m-footer">
        <van-button type="primary" block :loading="saving" :disabled="loading" @click="save">{{ $t('save') }}</van-button>
      </div>
    </template>

    <MSelectSheet
      v-model="competitorSheet"
      :title="$t('cmpCompetitor')"
      :options="competitorOptions"
      :selected="form.competitor_id"
      searchable
      @select="(v) => (form.competitor_id = v)"
    />
    <MSelectSheet
      v-model="partnerSheet"
      :title="$t('cmpClient')"
      :options="partnerOptions"
      :selected="form.partner_id"
      searchable
      @select="(v) => (form.partner_id = v)"
    />
  </MPage>
</template>

<style scoped>
.mf {
  padding-bottom: 16px;
}
.mf :deep(.van-field__label) {
  color: var(--m-muted);
  font-size: 13px;
}
.mf-seg {
  display: flex;
  margin: 0 12px;
  padding: 3px;
  border-radius: 12px;
  background: var(--m-line-soft);
}
.mf-seg button {
  flex: 1;
  border: 0;
  background: none;
  padding: 10px 4px;
  border-radius: 9px;
  font-size: 14px;
  font-weight: 500;
  color: var(--m-muted);
}
.mf-seg button.is-active {
  background: var(--m-surface);
  color: var(--m-ink);
  font-weight: 600;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
}
.mf-chips {
  flex-wrap: wrap;
  padding: 0 12px;
}
.mf-hint {
  align-self: flex-end;
  font-size: 12px;
  color: var(--m-muted);
  white-space: nowrap;
}
</style>
