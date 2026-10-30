<template>
  <el-dialog
    :model-value="modelValue"
    :title="encounter ? $t('cmpEncEditTitle') : $t('cmpEncAddTitle')"
    width="600px"
    destroy-on-close
    @update:model-value="(v) => emit('update:modelValue', v)"
    @open="fill"
  >
    <el-form ref="formRef" :model="form" :rules="rules" label-position="top" @submit.prevent="submit">
      <el-row :gutter="12">
        <el-col :span="14">
          <el-form-item :label="$t('cmpCompetitor')" prop="competitor_id">
            <el-select v-model="form.competitor_id" filterable style="width: 100%">
              <el-option v-for="c in competitors" :key="c.id" :label="c.name" :value="c.id" />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="10">
          <el-form-item :label="$t('cmpDate')" prop="encounter_date">
            <el-date-picker
              v-model="form.encounter_date"
              type="date"
              value-format="YYYY-MM-DD"
              format="DD.MM.YYYY"
              style="width: 100%"
            />
          </el-form-item>
        </el-col>
        <el-col :span="14">
          <el-form-item :label="$t('cmpClient')">
            <el-select
              v-model="form.partner_id"
              filterable
              clearable
              :placeholder="$t('cmpClientPick')"
              :loading="partnersLoading"
              style="width: 100%"
            >
              <el-option v-for="p in partners" :key="p.id" :label="p.fullname" :value="p.id" />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="10">
          <el-form-item :label="$t('cmpKpNumber')">
            <el-input v-model="form.kp_number" inputmode="numeric" placeholder="13203" />
          </el-form-item>
        </el-col>
        <el-col v-if="!form.partner_id" :span="24">
          <el-form-item :label="$t('cmpClientName')" prop="client_name">
            <el-input v-model="form.client_name" :placeholder="$t('cmpClientNameHint')" maxlength="200" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item :label="$t('cmpTheirPrice')">
            <el-input-number v-model="form.their_price" :min="0" :controls="false" style="width: 100%" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item :label="$t('cmpOurPrice')">
            <el-input-number v-model="form.our_price" :min="0" :controls="false" style="width: 100%" />
          </el-form-item>
        </el-col>
        <el-col :span="24">
          <el-form-item :label="$t('cmpOutcome')" prop="outcome">
            <el-radio-group v-model="form.outcome">
              <el-radio-button v-for="o in OUTCOMES" :key="o.value" :value="o.value">
                {{ $t(o.labelKey) }}
              </el-radio-button>
            </el-radio-group>
          </el-form-item>
        </el-col>
        <el-col v-if="form.outcome !== 'pending'" :span="24">
          <el-form-item :label="$t(form.outcome === 'won' ? 'cmpWhyWon' : 'cmpWhyLost')">
            <el-radio-group v-model="form.reason">
              <el-radio-button v-for="r in REASONS" :key="r" :value="r">
                {{ $t(`cmpReason_${r}`) }}
              </el-radio-button>
            </el-radio-group>
          </el-form-item>
        </el-col>
        <el-col :span="24">
          <el-form-item :label="$t('cmpNote')">
            <el-input v-model="form.note" type="textarea" :rows="2" />
          </el-form-item>
        </el-col>
      </el-row>
    </el-form>
    <template #footer>
      <el-button @click="emit('update:modelValue', false)">{{ $t('cancel') }}</el-button>
      <el-button type="primary" :loading="loading" @click="submit">{{ $t('save') }}</el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import { computed, reactive, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { ElMessage } from 'element-plus'
import competitorsApi from '@/api/competitors'
import { usePartnersStore } from '@/stores/partners'
import { useUsersStore } from '@/stores/user'
import { errorText } from '@/utils/errorText'
import { OUTCOMES, REASONS } from './competitorFormat'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  competitors: { type: Array, default: () => [] },
  // Tahrirlashda — mavjud uchrashuv
  encounter: { type: Object, default: null },
  // Yangi uchrashuv uchun oldindan to'ldirish (masalan mijoz kartasidan partner_id)
  preset: { type: Object, default: () => ({}) },
})
const emit = defineEmits(['update:modelValue', 'saved'])

const { t } = useI18n()
const partnersStore = usePartnersStore()
const usersStore = useUsersStore()
const formRef = ref(null)
const loading = ref(false)
const partnersLoading = ref(false)

const today = () => new Date().toISOString().slice(0, 10)
const empty = () => ({
  competitor_id: null,
  encounter_date: today(),
  partner_id: null,
  client_name: '',
  kp_number: '',
  their_price: null,
  our_price: null,
  outcome: 'pending',
  reason: null,
  note: '',
})
const form = reactive(empty())

const required = (key) => ({ required: true, message: t(key), trigger: 'change' })
const rules = {
  competitor_id: [required('cmpCompetitorRequired')],
  encounter_date: [required('cmpDateRequired')],
  outcome: [required('cmpOutcomeRequired')],
  client_name: [
    {
      validator: (_r, v, cb) => (form.partner_id || v?.trim() ? cb() : cb(new Error(t('cmpClientRequired')))),
      trigger: 'blur',
    },
  ],
}

// Admin hamma mijozni, xodim — o'zinikini tanlaydi (backend ham shuni tekshiradi)
const isAdmin = computed(() => !!usersStore.currentUser?.is_admin)
const partners = computed(() =>
  (isAdmin.value ? partnersStore.allPartners : partnersStore.allPartnersofUser) || [],
)

async function loadPartners() {
  if (partners.value.length) return
  partnersLoading.value = true
  try {
    if (isAdmin.value) await partnersStore.getAllPartners()
    else await partnersStore.getAllPartnersOfUser(Number(localStorage.getItem('userid')))
  } finally {
    partnersLoading.value = false
  }
}

function fill() {
  const e = props.encounter
  Object.assign(
    form,
    empty(),
    e
      ? {
          ...e,
          kp_number: e.kp_number ?? '',
          client_name: e.client_name || '',
          note: e.note || '',
          their_price: e.their_price != null ? Number(e.their_price) : null,
          our_price: e.our_price != null ? Number(e.our_price) : null,
        }
      : props.preset,
  )
  loadPartners()
}

async function submit() {
  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid) return
  loading.value = true
  const kp = String(form.kp_number ?? '').replace(/\D/g, '')
  const payload = {
    competitor_id: form.competitor_id,
    encounter_date: form.encounter_date,
    partner_id: form.partner_id || null,
    client_name: form.partner_id ? '' : form.client_name,
    kp_number: kp ? Number(kp) : null,
    their_price: form.their_price,
    our_price: form.our_price,
    outcome: form.outcome,
    // "Jarayonda"da sabab bo'lmaydi
    reason: form.outcome === 'pending' ? null : form.reason,
    note: form.note,
  }
  try {
    const saved = props.encounter
      ? await competitorsApi.updateEncounter(props.encounter.id, payload)
      : await competitorsApi.createEncounter(payload)
    ElMessage.success(t('cmpSaved'))
    emit('update:modelValue', false)
    emit('saved', saved)
  } catch (err) {
    ElMessage.error(errorText(err, t('xatolikYuzBerdi')))
  } finally {
    loading.value = false
  }
}
</script>
