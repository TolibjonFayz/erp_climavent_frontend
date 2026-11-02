<script setup>
import { reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { showFailToast, showSuccessToast } from 'vant'
import { usePartnersStore } from '@/stores/partners'
import { locationPayload } from '@/constants/locations'
import { LEGAL_TYPE_VALUES } from '@/utils/partners'
import MPage from '../../components/MPage.vue'
import MLocationFields from '../../components/MLocationFields.vue'
import MLegalTypeField from '../../components/MLegalTypeField.vue'
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

// ─── Saqlash (payload saytdagi buildPartnerPayload bilan bir xil) ───
const saving = ref(false)
async function onSubmit() {
  saving.value = true
  try {
    await partnersStore.createPartner({
      ...locationPayload(form),
      mijozturi: LEGAL_TYPE_VALUES[form.mijozturi] || form.mijozturi,
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
        <MLegalTypeField v-model="form.mijozturi" required />
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
        <MLocationFields :form="form" required />
      </van-cell-group>
    </van-form>

    <template #footer>
      <div class="m-footer">
        <van-button type="primary" block :loading="saving" @click="submit">
          {{ $t('save') }}
        </van-button>
      </div>
    </template>

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
</style>
