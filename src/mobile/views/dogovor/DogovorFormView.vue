<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { showFailToast, showSuccessToast, showToast } from 'vant'
import dogovorApi from '@/api/dogovor'
import { useDogovorStore } from '@/stores/dogovor'
import MPage from '../../components/MPage.vue'
import MDateField from '../../components/MDateField.vue'
import { useSession } from '../../session'
import { DOGOVOR_STATUSES } from '../../docRules'
import { errorText, money, numOrUndef, textOrUndef } from '../../utils'
import { tapFeedback } from '../../native'

const { t, locale } = useI18n()
const route = useRoute()
const router = useRouter()
const store = useDogovorStore()
const { isAdmin } = useSession()

const editId = computed(() => (route.params.id ? Number(route.params.id) : null))
const loading = ref(!!editId.value)
const pad = (n) => String(n).padStart(2, '0')
const today = () => {
  const d = new Date()
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

const TEXT_FIELDS = [
  'client_name',
  'client_inn',
  'client_phone',
  'manager_name',
  'client_address',
  'contact_name',
  'contact_position',
  'client_bank',
  'client_account',
  'client_mfo',
  'client_vat_code',
  'comment',
  'admin_comment',
]
const NUM_FIELDS = ['dogovor_number', 'dogovor_sum', 'initial_payment', 'prepayment_percent', 'production_days']

const form = reactive({
  dogovor_date: today(),
  payment_date: '',
  dogovor_status: 'Open',
  items: [],
  ...Object.fromEntries(TEXT_FIELDS.map((k) => [k, ''])),
  ...Object.fromEntries(NUM_FIELDS.map((k) => [k, ''])),
})
const errors = reactive({})

onMounted(async () => {
  if (!editId.value) return
  try {
    let row = (store.allDogovors || []).find((d) => d.id === editId.value)
    const res = await dogovorApi.getOne(editId.value).catch(() => null)
    if (res) row = res?.data || res
    if (!row) throw new Error('not found')
    for (const k of TEXT_FIELDS) form[k] = row[k] || ''
    for (const k of NUM_FIELDS) form[k] = row[k] ?? ''
    form.dogovor_status = row.dogovor_status || 'Open'
    form.dogovor_date = row.dogovor_date ? String(row.dogovor_date).slice(0, 10) : ''
    form.payment_date = row.payment_date ? String(row.payment_date).slice(0, 10) : ''
    form.items = Array.isArray(row.items) ? row.items.map((i) => ({ ...i })) : []
  } catch (e) {
    showFailToast(errorText(e, t, locale.value))
    router.back()
  } finally {
    loading.value = false
  }
})

// ─── Spetsifikatsiya ───
const subtotal = computed(() =>
  form.items.reduce((acc, i) => acc + (Number(i.qty) || 0) * (Number(i.price) || 0), 0),
)
const total = computed(() => subtotal.value * 1.12)
const addItem = () => form.items.push({ name: '', unit: 'шт', qty: 1, price: 0 })
const removeItem = (i) => form.items.splice(i, 1)
function applyTotal() {
  form.dogovor_sum = Math.round(total.value * 100) / 100
  showToast(t('dogovorItemsTotalApplied'))
}

function validate() {
  for (const k of Object.keys(errors)) delete errors[k]
  if (!form.dogovor_date) errors.dogovor_date = t('dogovorValidationDate')
  if (!String(form.client_name).trim()) errors.client_name = t('dogovorValidationClient')
  if (form.dogovor_sum === '' || form.dogovor_sum === null) errors.dogovor_sum = t('dogovorValidationSum')
  return !Object.keys(errors).length
}

const saving = ref(false)
async function save() {
  if (!validate()) {
    showFailToast(t('m.fillRequired'))
    return
  }
  // Saytdagi Dogovor.vue handleSubmit bilan bir xil payload
  const payload = {
    dogovor_number: numOrUndef(form.dogovor_number),
    dogovor_date: form.dogovor_date,
    client_name: form.client_name.trim(),
    dogovor_sum: Number(form.dogovor_sum) || 0,
    dogovor_status: form.dogovor_status,
    client_inn: textOrUndef(form.client_inn),
    payment_date: textOrUndef(form.payment_date),
    initial_payment: numOrUndef(form.initial_payment),
    prepayment_percent: numOrUndef(form.prepayment_percent),
    client_phone: textOrUndef(form.client_phone),
    manager_name: textOrUndef(form.manager_name),
    client_address: textOrUndef(form.client_address),
    contact_name: textOrUndef(form.contact_name),
    contact_position: textOrUndef(form.contact_position),
    client_bank: textOrUndef(form.client_bank),
    client_account: textOrUndef(form.client_account),
    client_mfo: textOrUndef(form.client_mfo),
    client_vat_code: textOrUndef(form.client_vat_code),
    items: form.items
      .filter((i) => i.name && String(i.name).trim())
      .map((i) => ({
        name: String(i.name).trim(),
        unit: i.unit ? String(i.unit).trim() : undefined,
        qty: Number(i.qty) || 0,
        price: Number(i.price) || 0,
      })),
    production_days: numOrUndef(form.production_days),
    comment: textOrUndef(form.comment),
  }
  if (isAdmin.value) payload.admin_comment = textOrUndef(form.admin_comment)

  saving.value = true
  try {
    if (editId.value) {
      await store.updateDogovor(editId.value, payload)
      showSuccessToast(t('dogovorMessageUpdated'))
    } else {
      await store.createDogovor(payload)
      showSuccessToast(t('dogovorMessageSaved'))
    }
    tapFeedback()
    store.getAllDogovors().catch(() => {})
    router.back()
  } catch (e) {
    showFailToast({ message: errorText(e, t, locale.value), wordBreak: 'break-word' })
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <MPage :title="editId ? $t('m.editDogovor') : $t('dogovorDialogTitle')" :back="{ name: 'dogovor' }">
    <div v-if="loading" class="m-card" style="margin-top: 12px"><van-skeleton :row="8" /></div>
    <div v-else class="mf">
      <div class="m-section"><span class="m-section__title">{{ $t('dogovorStatusLabel') }}</span></div>
      <div class="mf-seg">
        <button
          v-for="s in DOGOVOR_STATUSES"
          :key="s.value"
          type="button"
          :class="{ 'is-active': form.dogovor_status === s.value }"
          @click="form.dogovor_status = s.value"
        >
          {{ $t(s.labelKey) }}
        </button>
      </div>

      <div class="m-section"><span class="m-section__title">{{ $t('dogovorSectionMain') }}</span></div>
      <van-cell-group inset>
        <van-field v-model="form.dogovor_number" :label="$t('dogovorNumberLabel')" label-align="top" type="digit" :placeholder="$t('m.optional')" />
        <MDateField v-model="form.dogovor_date" :label="$t('dogovorDateLabel')" :clearable="false" :error="errors.dogovor_date" />
        <van-field v-model="form.client_name" :label="$t('dogovorClientLabel')" label-align="top" :error-message="errors.client_name" :placeholder="$t('kiriting')" />
        <van-field v-model="form.client_phone" :label="$t('dogovorPhoneLabel')" label-align="top" type="tel" />
        <van-field v-model="form.manager_name" :label="$t('dogovorManagerLabel')" label-align="top" />
        <van-field v-model="form.dogovor_sum" :label="$t('dogovorSumLabel')" label-align="top" type="number" :error-message="errors.dogovor_sum" placeholder="0">
          <template #extra>
            <span v-if="form.dogovor_sum !== ''" class="mf-hint m-num">{{ money(form.dogovor_sum, t) }}</span>
          </template>
        </van-field>
        <MDateField v-model="form.payment_date" :label="$t('dogovorPaymentDateLabel')" />
        <van-field v-model="form.initial_payment" :label="$t('dogovorInitialPaymentLabel')" label-align="top" type="number" />
        <van-field v-model="form.prepayment_percent" :label="$t('dogovorPrepaymentLabel')" label-align="top" type="number" />
        <van-field v-model="form.production_days" :label="$t('dogovorProductionDaysLabel')" label-align="top" type="digit" />
      </van-cell-group>

      <div class="m-section"><span class="m-section__title">{{ $t('dogovorSectionRequisites') }}</span></div>
      <van-cell-group inset>
        <van-field v-model="form.client_inn" :label="$t('dogovorInnLabel')" label-align="top" type="digit" />
        <van-field v-model="form.contact_name" :label="$t('dogovorContactNameLabel')" label-align="top" />
        <van-field v-model="form.contact_position" :label="$t('dogovorContactPositionLabel')" label-align="top" />
        <van-field v-model="form.client_address" :label="$t('dogovorAddressLabel')" label-align="top" type="textarea" rows="1" autosize />
        <van-field v-model="form.client_bank" :label="$t('dogovorBankLabel')" label-align="top" />
        <van-field v-model="form.client_account" :label="$t('dogovorAccountLabel')" label-align="top" type="digit" />
        <van-field v-model="form.client_mfo" :label="$t('dogovorMfoLabel')" label-align="top" type="digit" />
        <van-field v-model="form.client_vat_code" :label="$t('dogovorVatCodeLabel')" label-align="top" />
      </van-cell-group>

      <div class="m-section">
        <span class="m-section__title">{{ $t('dogovorSectionItems') }}</span>
        <button type="button" class="m-section__action" @click="addItem">+ {{ $t('dogovorAddItem') }}</button>
      </div>
      <p v-if="!form.items.length" class="mf-empty">{{ $t('dogovorNoItems') }}</p>
      <div v-for="(it, i) in form.items" :key="i" class="m-card mf-item">
        <div class="mf-item__head">
          <b>{{ i + 1 }}</b>
          <button type="button" class="mf-item__del" @click="removeItem(i)"><van-icon name="delete-o" /></button>
        </div>
        <van-field v-model="it.name" :placeholder="$t('dogovorItemName')" class="mf-in" type="textarea" rows="1" autosize />
        <div class="mf-item__row">
          <van-field v-model="it.qty" :placeholder="$t('dogovorItemQty')" type="number" class="mf-in" />
          <van-field v-model="it.unit" :placeholder="$t('dogovorItemUnit')" class="mf-in is-unit" />
          <van-field v-model="it.price" :placeholder="$t('dogovorItemPrice')" type="number" class="mf-in is-price" />
        </div>
        <p class="mf-item__sum m-num">{{ money((Number(it.qty) || 0) * (Number(it.price) || 0), t) }}</p>
      </div>
      <div v-if="form.items.length" class="m-card mf-totals">
        <p><span>{{ $t('dogovorItemsSubtotal') }}</span><b class="m-num">{{ money(subtotal, t) }}</b></p>
        <p><span>{{ $t('dogovorVat') }}</span><b class="m-num">{{ money(subtotal * 0.12, t) }}</b></p>
        <p class="is-grand"><span>{{ $t('dogovorItemsTotal') }}</span><b class="m-num">{{ money(total, t) }}</b></p>
        <van-button size="small" plain type="primary" block @click="applyTotal">{{ $t('dogovorApplyItemsTotal') }}</van-button>
      </div>

      <div class="m-section"><span class="m-section__title">{{ $t('dogovorSectionNotes') }}</span></div>
      <van-cell-group inset>
        <van-field v-model="form.comment" :label="$t('dogovorCommentLabel')" label-align="top" type="textarea" rows="2" autosize />
        <van-field v-if="isAdmin" v-model="form.admin_comment" :label="$t('dogovorAdminCommentLabel')" label-align="top" type="textarea" rows="2" autosize />
      </van-cell-group>
    </div>

    <template #footer>
      <div class="m-footer">
        <van-button type="primary" block :loading="saving" :disabled="loading" @click="save">{{ $t('save') }}</van-button>
      </div>
    </template>
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
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 3px;
  margin: 0 12px;
  padding: 3px;
  border-radius: 12px;
  background: var(--m-line-soft);
}

.mf-seg button {
  border: 0;
  background: none;
  padding: 9px 4px;
  border-radius: 9px;
  font-size: 13px;
  font-weight: 500;
  color: var(--m-muted);
}

.mf-seg button.is-active {
  background: var(--m-surface);
  color: var(--m-ink);
  font-weight: 600;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
}

.mf-hint {
  align-self: flex-end;
  font-size: 12px;
  color: var(--m-muted);
  white-space: nowrap;
}

.mf-empty {
  padding: 0 16px;
  font-size: 13px;
  color: var(--m-muted);
}

.mf-item__head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 6px;
  color: var(--m-muted);
}

.mf-item__del {
  border: 0;
  background: none;
  color: var(--m-bad);
  font-size: 18px;
}

.mf-in {
  padding: 8px 10px;
  border: 1px solid var(--m-line);
  border-radius: 10px;
  background: var(--m-surface-2);
}

.mf-in::after {
  display: none;
}

.mf-item__row {
  display: flex;
  gap: 6px;
  margin-top: 6px;
}

.mf-item__row .mf-in {
  flex: 1;
}

.mf-item__row .mf-in.is-unit {
  flex: 0 0 64px;
}

.mf-item__row .mf-in.is-price {
  flex: 1.6;
}

.mf-item__sum {
  margin-top: 6px;
  text-align: right;
  font-size: 13px;
  font-weight: 600;
}

.mf-totals p {
  display: flex;
  justify-content: space-between;
  padding: 3px 0;
  font-size: 14px;
  color: var(--m-ink-2);
}

.mf-totals p.is-grand {
  font-size: 15px;
  color: var(--m-ink);
  margin-bottom: 10px;
}
</style>
