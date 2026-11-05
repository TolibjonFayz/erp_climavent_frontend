<template>
  <!-- ERP asosiy rejimda kartani to'liq tahrirlash -->
  <el-dialog :model-value="modelValue" :title="$t('otEditTitle')" width="560px" append-to-body @update:model-value="$emit('update:modelValue', $event)" @open="reset">
    <el-form label-position="top" class="ot-edit">
      <div class="ot-edit__grid">
        <el-form-item :label="$t('otNumber')"><el-input v-model="f.dogovor_number" maxlength="64" /></el-form-item>
        <el-form-item :label="$t('otDate')">
          <el-date-picker v-model="f.dogovor_date" type="date" value-format="YYYY-MM-DD" format="DD.MM.YYYY" style="width: 100%" />
        </el-form-item>
        <el-form-item :label="$t('otClient')" class="is-wide"><el-input v-model="f.client_name" maxlength="255" /></el-form-item>
        <el-form-item :label="$t('otInn')"><el-input v-model="f.client_inn" maxlength="32" /></el-form-item>
        <el-form-item :label="$t('otManager')"><ManagerSelect v-model="f.manager_name" /></el-form-item>
        <el-form-item :label="$t('otContact')"><el-input v-model="f.client_contact" maxlength="255" /></el-form-item>
        <el-form-item :label="$t('otPhone')"><el-input v-model="f.client_phone" maxlength="255" /></el-form-item>
        <el-form-item :label="$t('otSum')">
          <el-input-number v-model="f.contract_sum" :min="0" :controls="false" style="width: 100%" />
        </el-form-item>
        <el-form-item :label="$t('otInvoice')"><el-input v-model="f.invoice_numbers" maxlength="255" /></el-form-item>
        <el-form-item :label="`${$t('otColReady')}: ${f.ready}%`">
          <el-slider v-model="f.ready" :step="5" />
        </el-form-item>
        <el-form-item :label="`${$t('otColShipped')}: ${f.shipped}%`">
          <el-slider v-model="f.shipped" :step="5" />
        </el-form-item>
        <el-form-item :label="$t('otSgp')">
          <el-date-picker v-model="f.sgp_date" type="date" value-format="YYYY-MM-DD" format="DD.MM.YYYY" style="width: 100%" />
        </el-form-item>
        <template v-if="official">
          <el-form-item :label="`Didox · ${$t('otDidoxContract')}`">
            <el-segmented v-model="f.didox_contract" :options="flagOptions" />
          </el-form-item>
          <el-form-item :label="`Didox · ${$t('otDidoxPoa')}`">
            <el-segmented v-model="f.didox_poa" :options="flagOptions" />
          </el-form-item>
        </template>
        <el-form-item :label="$t('otFinal')">
          <el-select v-model="f.final_status" style="width: 100%">
            <el-option :label="$t('otFinalNone')" value="" />
            <el-option v-for="s in FINAL_STAGES" :key="s" :label="$t(`otStage_${s}`)" :value="s" />
          </el-select>
        </el-form-item>
        <el-form-item v-if="f.final_status" :label="$t('otFinalReason')" class="is-wide">
          <el-input v-model="f.final_reason" type="textarea" :autosize="{ minRows: 2 }" maxlength="2000" />
        </el-form-item>
      </div>
    </el-form>
    <template #footer>
      <el-button @click="$emit('update:modelValue', false)">{{ $t('otCancel') }}</el-button>
      <el-button type="primary" :loading="saving" @click="save">{{ $t('otSave') }}</el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import { computed, reactive, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { ElMessage } from 'element-plus'
import api from '@/api/otgruzka'
import { FINAL_STAGES, otError } from '@/utils/otgruzkaFormat'
import ManagerSelect from '@/components/ui/ManagerSelect.vue'

const props = defineProps({
  modelValue: Boolean,
  order: { type: Object, required: true },
})
const emit = defineEmits(['update:modelValue', 'saved'])
const { t } = useI18n()
const saving = ref(false)
const f = reactive({})
// Segmented null qiymatni tanlolmaydi — "kerak emas" uchun 'na' kaliti
const flagOptions = computed(() => [
  { label: t('otYes'), value: 'yes' },
  { label: t('otNo'), value: 'no' },
  { label: t('otNa'), value: 'na' },
])
const official = computed(() => /^(3\d{4}|\d{1,3})$/.test(String(f.dogovor_number || '').trim()))
const toFlag = (v) => (v === true ? 'yes' : v === false ? 'no' : 'na')
const fromFlag = (v) => (v === 'yes' ? true : v === 'no' ? false : null)

function reset() {
  const o = props.order
  Object.assign(f, {
    dogovor_number: o.dogovor_number || '',
    dogovor_date: o.dogovor_date || null,
    client_name: o.client_name || '',
    client_inn: o.client_inn || '',
    manager_name: o.manager_name || '',
    client_contact: o.client_contact || '',
    client_phone: o.client_phone || '',
    contract_sum: o.contract_sum || 0,
    invoice_numbers: o.invoice_numbers || '',
    ready: Math.round((o.ready_pct || 0) * 100),
    shipped: Math.round((o.shipped_pct || 0) * 100),
    sgp_date: o.sgp_date || null,
    didox_contract: toFlag(o.didox_contract),
    didox_poa: toFlag(o.didox_poa),
    final_status: o.final_status || '',
    final_reason: o.final_reason || '',
  })
}

async function save() {
  saving.value = true
  try {
    const d = await api.update(props.order.id, {
      dogovor_number: f.dogovor_number.trim(),
      dogovor_date: f.dogovor_date || null,
      client_name: f.client_name.trim(),
      client_inn: f.client_inn.trim() || null,
      manager_name: (f.manager_name || '').trim() || null,
      client_contact: f.client_contact.trim() || null,
      client_phone: f.client_phone.trim() || null,
      contract_sum: f.contract_sum || 0,
      invoice_numbers: f.invoice_numbers.trim() || null,
      ready_pct: f.ready / 100,
      shipped_pct: f.shipped / 100,
      sgp_date: f.sgp_date || null,
      didox_contract: fromFlag(f.didox_contract),
      didox_poa: fromFlag(f.didox_poa),
      final_status: f.final_status || null,
      final_reason: f.final_status ? f.final_reason.trim() || null : null,
    })
    emit('saved', d)
    emit('update:modelValue', false)
    ElMessage.success(t('otSaved'))
  } catch (e) {
    ElMessage.error(otError(e))
  } finally {
    saving.value = false
  }
}
</script>

<style scoped>
.ot-edit__grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0 16px;
}
.ot-edit__grid .is-wide {
  grid-column: 1 / -1;
}
@media (max-width: 560px) {
  .ot-edit__grid {
    grid-template-columns: 1fr;
  }
}
</style>
