<script setup>
import { computed, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { showFailToast, showSuccessToast } from 'vant'
import { usePartnersStore } from '@/stores/partners'
import { createLocationData, createRepublicOptions } from '@/constants/locations'
import MPage from '../../components/MPage.vue'
import MSelectSheet from '../../components/MSelectSheet.vue'
import { PARTNER_GROUPS } from './groups'
import { errorText } from '../../utils'
import { tapFeedback } from '../../native'

const { t, locale } = useI18n()
const route = useRoute()
const router = useRouter()
const partnersStore = usePartnersStore()

const groupValues = PARTNER_GROUPS.map((g) => g.value)
const form = reactive({
  partner_type: groupValues.includes(route.query.group) ? route.query.group : 'doimiymijoz',
  fullname: '',
  mijozturi: '',
  inn: '',
  phone_number: '',
  additional_phone_number: '',
  republic: 'ozbekiston',
  otherrepublic: '',
  viloyat: '',
  otherviloyat: '',
  shahar_tuman: '',
  other_shahar_tuman: '',
})

// ─── Manzil (saytdagi CustomerForm bilan bir xil kaskad) ───
const LOCATION_DATA = createLocationData(t)
const republicOptions = createRepublicOptions(t)
const BOSHQA = 'boshqa'

const republics = computed(() =>
  republicOptions.map((r) => ({ value: r.key === 'boshqa' ? BOSHQA : r.key, label: r.label })),
)
const viloyatlar = computed(() => {
  if (!form.republic) return []
  const list = form.republic === BOSHQA ? [] : LOCATION_DATA[form.republic] || []
  return [...list.map((v) => ({ value: v.value, label: v.label })), { value: BOSHQA, label: t('Boshqa') }]
})
const tumanlar = computed(() => {
  if (!form.viloyat || form.viloyat === BOSHQA || form.republic === BOSHQA) {
    return [{ value: BOSHQA, label: t('Boshqa') }]
  }
  const found = (LOCATION_DATA[form.republic] || []).find((v) => v.value === form.viloyat)
  if (!found) return [{ value: BOSHQA, label: t('Boshqa') }]
  return found.tumanlar.map((item) => ({
    label: item.label,
    value: item.value === t('Boshqa') ? BOSHQA : item.value,
  }))
})

const labelOf = (list, value) => list.find((o) => o.value === value)?.label || ''

const picker = ref(null) // 'republic' | 'viloyat' | 'tuman'
const pickerOpen = computed({
  get: () => !!picker.value,
  set: (v) => !v && (picker.value = null),
})
const pickerConfig = computed(() => {
  if (picker.value === 'republic')
    return { title: t('respublika'), options: republics.value, selected: form.republic }
  if (picker.value === 'viloyat')
    return { title: t('viloyat'), options: viloyatlar.value, selected: form.viloyat }
  return { title: t('shaharTuman'), options: tumanlar.value, selected: form.shahar_tuman }
})

function onPick(value) {
  if (picker.value === 'republic' && value !== form.republic) {
    form.republic = value
    form.otherrepublic = ''
    form.viloyat = ''
    form.otherviloyat = ''
    form.shahar_tuman = ''
    form.other_shahar_tuman = ''
  } else if (picker.value === 'viloyat' && value !== form.viloyat) {
    form.viloyat = value
    form.otherviloyat = ''
    form.shahar_tuman = ''
    form.other_shahar_tuman = ''
  } else if (picker.value === 'tuman') {
    form.shahar_tuman = value
    if (value !== BOSHQA) form.other_shahar_tuman = ''
  }
}

// ─── Saqlash (payload saytdagi buildPartnerPayload bilan bir xil) ───
const getRepublicValue = (key) => {
  if (!key || key === BOSHQA) return null
  return republicOptions.find((r) => r.key === key)?.value || key
}
const LEGAL_LABELS = computed(() => ({ yuridik: t('yuridikShaxs'), jismoniy: t('jismoniyShaxs') }))

const saving = ref(false)
async function onSubmit() {
  saving.value = true
  try {
    await partnersStore.createPartner({
      republic: form.republic === BOSHQA ? form.otherrepublic : getRepublicValue(form.republic),
      viloyat: form.viloyat === BOSHQA ? form.otherviloyat : form.viloyat,
      shahar_tuman: form.shahar_tuman === BOSHQA ? form.other_shahar_tuman : form.shahar_tuman,
      mijozturi: LEGAL_LABELS.value[form.mijozturi] || form.mijozturi,
      inn: form.mijozturi === 'yuridik' ? form.inn : '',
      phone_number: form.phone_number.trim(),
      additional_phone_number: form.additional_phone_number.trim(),
      fullname: form.fullname.trim(),
      partner_type: form.partner_type,
      user_id: Number(localStorage.getItem('userid')),
    })
    tapFeedback()
    showSuccessToast(t('m.customerSaved'))
    partnersStore.getAllPartnersOfUser(Number(localStorage.getItem('userid'))).catch(() => {})
    router.back()
  } catch (e) {
    showFailToast(errorText(e, t, locale.value))
  } finally {
    saving.value = false
  }
}

const required = (msg) => [{ required: true, message: msg }]
const formRef = ref(null)
const submit = () => formRef.value?.submit()
</script>

<template>
  <MPage :title="$t('m.newCustomer')" :back="{ name: 'customers' }">
    <van-form ref="formRef" class="cf" scroll-to-error @submit="onSubmit">
      <div class="m-section"><span class="m-section__title">{{ $t('guruh') }}</span></div>
      <div class="m-chips is-wrap">
        <button
          v-for="g in PARTNER_GROUPS"
          :key="g.value"
          type="button"
          class="m-chip"
          :class="{ 'is-active': form.partner_type === g.value }"
          @click="form.partner_type = g.value"
        >
          {{ $t(g.labelKey) }}
        </button>
      </div>

      <div class="m-section"><span class="m-section__title">{{ $t('m.mainInfo') }}</span></div>
      <van-cell-group inset>
        <van-field
          v-model="form.fullname"
          name="fullname"
          :label="$t('ismFamiliya')"
          label-align="top"
          :placeholder="$t('kiriting')"
          :rules="required($t('m.reqFullname'))"
        />
        <van-field
          :model-value="form.mijozturi"
          name="mijozturi"
          :label="$t('mijozTuri')"
          label-align="top"
          :rules="required($t('m.reqClientType'))"
        >
          <template #input>
            <div class="cf-segment">
              <button
                v-for="opt in ['jismoniy', 'yuridik']"
                :key="opt"
                type="button"
                :class="{ 'is-active': form.mijozturi === opt }"
                @click="form.mijozturi = opt"
              >
                {{ opt === 'yuridik' ? $t('yuridikShaxs') : $t('jismoniyShaxs') }}
              </button>
            </div>
          </template>
        </van-field>
        <van-field
          v-if="form.mijozturi === 'yuridik'"
          v-model="form.inn"
          name="inn"
          :label="$t('inn')"
          label-align="top"
          inputmode="numeric"
          :placeholder="$t('kiriting')"
        />
      </van-cell-group>

      <div class="m-section"><span class="m-section__title">{{ $t('m.contacts') }}</span></div>
      <van-cell-group inset>
        <van-field
          v-model="form.phone_number"
          name="phone"
          type="tel"
          :label="$t('telefon')"
          label-align="top"
          placeholder="+998 90 123 45 67"
          :rules="required($t('m.reqPhone'))"
        />
        <van-field
          v-model="form.additional_phone_number"
          name="phone2"
          type="tel"
          :label="$t('form_qoshimchaTelefon')"
          label-align="top"
          placeholder="+998 90 123 45 67"
        />
      </van-cell-group>

      <div class="m-section"><span class="m-section__title">{{ $t('m.address') }}</span></div>
      <van-cell-group inset>
        <van-field
          :model-value="labelOf(republics, form.republic)"
          name="republic"
          :label="$t('respublika')"
          label-align="top"
          readonly
          is-link
          :placeholder="$t('m.choose')"
          :rules="required($t('m.reqRepublic'))"
          @click="picker = 'republic'"
        />
        <van-field
          v-if="form.republic === 'boshqa'"
          v-model="form.otherrepublic"
          name="otherrepublic"
          :label="$t('m.republicName')"
          label-align="top"
          :rules="required($t('m.reqRepublic'))"
        />
        <van-field
          :model-value="labelOf(viloyatlar, form.viloyat)"
          name="viloyat"
          :label="$t('viloyat')"
          label-align="top"
          readonly
          is-link
          :disabled="!form.republic"
          :placeholder="$t('m.choose')"
          :rules="required($t('m.reqRegion'))"
          @click="form.republic && (picker = 'viloyat')"
        />
        <van-field
          v-if="form.viloyat === 'boshqa'"
          v-model="form.otherviloyat"
          name="otherviloyat"
          :label="$t('m.regionName')"
          label-align="top"
          :rules="required($t('m.reqRegion'))"
        />
        <van-field
          :model-value="labelOf(tumanlar, form.shahar_tuman)"
          name="tuman"
          :label="$t('shaharTuman')"
          label-align="top"
          readonly
          is-link
          :disabled="!form.viloyat"
          :placeholder="$t('m.choose')"
          :rules="required($t('m.reqDistrict'))"
          @click="form.viloyat && (picker = 'tuman')"
        />
        <van-field
          v-if="form.shahar_tuman === 'boshqa'"
          v-model="form.other_shahar_tuman"
          name="othertuman"
          :label="$t('m.districtName')"
          label-align="top"
          :rules="required($t('m.reqDistrict'))"
        />
      </van-cell-group>
    </van-form>

    <template #footer>
      <div class="m-footer">
        <van-button type="primary" block :loading="saving" @click="submit">
          {{ $t('save') }}
        </van-button>
      </div>
    </template>

    <MSelectSheet
      v-model="pickerOpen"
      :title="pickerConfig.title"
      :options="pickerConfig.options"
      :selected="pickerConfig.selected"
      @select="onPick"
    />
  </MPage>
</template>

<style scoped>
.cf {
  padding-bottom: 16px;
}

.m-chips.is-wrap {
  flex-wrap: wrap;
}

.cf :deep(.van-field__label) {
  color: var(--m-muted);
  font-size: 13px;
}

.cf-segment {
  display: flex;
  width: 100%;
  padding: 3px;
  border-radius: 10px;
  background: var(--m-line-soft);
}

.cf-segment button {
  flex: 1;
  border: 0;
  background: none;
  padding: 9px 6px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  color: var(--m-muted);
}

.cf-segment button.is-active {
  background: var(--m-surface);
  color: var(--m-ink);
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
}
</style>
