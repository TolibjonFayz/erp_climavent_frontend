<template>
  <!-- Yangi karta: qo'lda yoki shartnoma PDF'idan avtomatik to'ldirib -->
  <el-dialog
    :model-value="modelValue"
    :title="$t('otNew')"
    width="min(820px, 96vw)"
    append-to-body
    class="ot-create"
    @update:model-value="$emit('update:modelValue', $event)"
    @closed="reset"
  >
    <el-upload
      drag
      :show-file-list="false"
      accept=".pdf,application/pdf"
      :before-upload="fillFromPdf"
      :disabled="pdfLoading"
      class="ot-pdf"
    >
      <div v-loading="pdfLoading" class="ot-pdf__zone">
        <el-icon class="ot-pdf__icon"><Document /></el-icon>
        <div class="ot-pdf__title">{{ $t('otPdfDrop') }}</div>
        <div class="ot-pdf__hint">{{ $t('otPdfHint') }}</div>
      </div>
    </el-upload>
    <el-alert
      v-if="pdfResult"
      :type="pdfResult.warnings.length ? 'warning' : 'success'"
      show-icon
      :closable="false"
      class="ot-pdf__result"
    >
      <template #title>{{ $t('otPdfFilled', { count: pdfResult.count, file: pdfResult.file }) }}</template>
      <ul v-if="pdfResult.warnings.length" class="ot-pdf__warn">
        <li v-for="w in pdfResult.warnings" :key="w">{{ w }}</li>
      </ul>
    </el-alert>

    <el-form label-position="top" class="ot-create__grid">
      <el-form-item :label="$t('otNumber')" required :class="mark('dogovor_number')">
        <el-input v-model="f.dogovor_number" maxlength="64" />
      </el-form-item>
      <el-form-item :label="$t('otDate')" :class="mark('dogovor_date')">
        <el-date-picker v-model="f.dogovor_date" type="date" value-format="YYYY-MM-DD" format="DD.MM.YYYY" style="width: 100%" />
      </el-form-item>
      <el-form-item :label="$t('otManager')">
        <ManagerSelect v-model="f.manager_name" />
      </el-form-item>
      <el-form-item :label="$t('otClient')" required class="is-wide2" :class="mark('client_name')">
        <el-input v-model="f.client_name" maxlength="255" />
      </el-form-item>
      <el-form-item :label="$t('otInn')" :class="mark('client_inn')">
        <el-input v-model="f.client_inn" maxlength="32" />
      </el-form-item>
      <el-form-item :label="$t('otContact')" :class="mark('client_contact')">
        <el-input v-model="f.client_contact" maxlength="255" />
      </el-form-item>
      <el-form-item :label="$t('otPhone')" :class="mark('client_phone')">
        <el-input v-model="f.client_phone" maxlength="255" />
      </el-form-item>
      <el-form-item :label="$t('otSum')" :class="mark('contract_sum')">
        <UiMoneyInput v-model="f.contract_sum" :min="0" style="width: 100%" />
      </el-form-item>
      <el-form-item :label="$t('otItems')" class="is-wide" :class="mark('items')">
        <OtItemsEditor v-model="f.items" />
      </el-form-item>
    </el-form>

    <template #footer>
      <span v-if="sumMismatch" class="ot-create__mismatch">{{ $t('otItemsSumMismatch', { total: fmtMoney(itemsTotal) }) }}</span>
      <el-button @click="$emit('update:modelValue', false)">{{ $t('otCancel') }}</el-button>
      <el-button type="primary" :disabled="!f.dogovor_number.trim() || !f.client_name.trim()" :loading="saving" @click="save">
        {{ $t('otSave') }}
      </el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import UiMoneyInput from '@/components/ui/UiMoneyInput.vue'
import { computed, reactive, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { ElMessage } from 'element-plus'
import { Document } from '@element-plus/icons-vue'
import api from '@/api/otgruzka'
import { fmtMoney, otError } from '@/utils/otgruzkaFormat'
import { readDogovorPdf } from '@/utils/dogovorPdfImport'
import ManagerSelect from '@/components/ui/ManagerSelect.vue'
import OtItemsEditor from './OtItemsEditor.vue'

defineProps({ modelValue: Boolean })
const emit = defineEmits(['update:modelValue', 'created'])
const { t } = useI18n()
const saving = ref(false)
const blank = () => ({
  dogovor_number: '',
  client_name: '',
  dogovor_date: null,
  manager_name: '',
  client_inn: '',
  client_contact: '',
  client_phone: '',
  contract_sum: 0,
  items: [],
})
const f = reactive(blank())

const itemsTotal = computed(() => f.items.reduce((s, it) => s + (Number(it.qty) || 0) * (Number(it.price) || 0), 0))
const sumMismatch = computed(() => f.items.length > 0 && f.contract_sum > 0 && Math.abs(itemsTotal.value - f.contract_sum) > 1)
// Summa kiritilmagan yoki avval mahsulotlardan hisoblangan bo'lsa — mahsulotlar bilan birga yangilanadi
watch(itemsTotal, (now, before) => {
  if (!f.contract_sum || Math.abs(f.contract_sum - before) < 1) f.contract_sum = Math.round(now * 100) / 100
})

// ─── PDF'dan to'ldirish (Dogovorlar bo'limidagi o'quvchi) ───
const pdfLoading = ref(false)
const pdfResult = ref(null)
const filled = ref(new Set())
const mark = (key) => ({ 'is-filled': filled.value.has(key) })
// PDF maydoni → karta maydoni
const PDF_MAP = {
  dogovor_number: 'dogovor_number',
  dogovor_date: 'dogovor_date',
  client_name: 'client_name',
  client_inn: 'client_inn',
  client_phone: 'client_phone',
  contact_name: 'client_contact',
  dogovor_sum: 'contract_sum',
  items: 'items',
}

async function fillFromPdf(file) {
  pdfLoading.value = true
  try {
    const data = await readDogovorPdf(file)
    const keys = Object.keys(PDF_MAP).filter((k) => data[k] != null && !(Array.isArray(data[k]) && !data[k].length))
    if (!keys.length) {
      ElMessage.warning(t('otPdfNothing'))
      return false
    }
    const manager = f.manager_name
    Object.assign(f, blank(), { manager_name: manager })
    for (const k of keys) {
      const to = PDF_MAP[k]
      if (k === 'items') f.items = data.items.map((i) => ({ name: i.name, unit: i.unit || 'шт', qty: Number(i.qty) || 0, price: Number(i.price) || 0 }))
      else if (k === 'dogovor_number') f.dogovor_number = String(data[k])
      else f[to] = data[k]
    }
    filled.value = new Set(keys.map((k) => PDF_MAP[k]))

    const warnings = []
    if (!f.dogovor_number || !f.client_name) warnings.push(t('otPdfMissingMain'))
    // Shu raqamli karta otgruzkada bormi
    const list = f.dogovor_number ? await api.list().catch(() => []) : []
    if (list.some((o) => String(o.dogovor_number) === String(f.dogovor_number))) warnings.push(t('otPdfDuplicate', { n: f.dogovor_number }))
    pdfResult.value = { count: keys.length, file: file.name, warnings }
  } catch (e) {
    ElMessage.error(e?.message === 'NO_TEXT' ? t('otPdfNoText') : t('otPdfError'))
  } finally {
    pdfLoading.value = false
  }
  return false // faylni serverga yuklamaymiz — faqat o'qiymiz
}

function reset() {
  Object.assign(f, blank())
  pdfResult.value = null
  filled.value = new Set()
}

const text = (v) => (String(v || '').trim() ? String(v).trim() : null)
async function save() {
  saving.value = true
  try {
    const items = f.items
      .filter((i) => String(i.name || '').trim())
      .map((i) => ({ name: i.name.trim(), unit: text(i.unit), qty: Number(i.qty) || 0, price: Number(i.price) || 0 }))
    const d = await api.create({
      dogovor_number: f.dogovor_number.trim(),
      client_name: f.client_name.trim(),
      dogovor_date: f.dogovor_date || null,
      manager_name: text(f.manager_name),
      client_inn: text(f.client_inn),
      client_contact: text(f.client_contact),
      client_phone: text(f.client_phone),
      contract_sum: f.contract_sum || 0,
      ...(items.length ? { items } : {}),
    })
    emit('update:modelValue', false)
    emit('created', d)
  } catch (e) {
    ElMessage.error(otError(e))
  } finally {
    saving.value = false
  }
}
</script>

<style scoped>
.ot-pdf {
  margin-bottom: 12px;
}
.ot-pdf :deep(.el-upload-dragger) {
  padding: 14px;
}
.ot-pdf__zone {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}
.ot-pdf__icon {
  font-size: 28px;
  color: var(--ui-link);
}
.ot-pdf__title {
  font-weight: 600;
  color: var(--ui-ink);
}
.ot-pdf__hint {
  font-size: 12px;
  color: var(--ui-muted);
}
.ot-pdf__result {
  margin-bottom: 12px;
}
.ot-pdf__warn {
  margin: 4px 0 0 16px;
}
.ot-create__grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0 14px;
}
.ot-create__grid .is-wide {
  grid-column: 1 / -1;
}
.ot-create__grid .is-wide2 {
  grid-column: span 2;
}
/* PDF'dan to'ldirilgan maydonlar — tekshirib chiqish uchun belgilangan */
.ot-create__grid .is-filled :deep(.el-input__wrapper),
.ot-create__grid .is-filled :deep(.el-textarea__inner) {
  background: var(--ui-warn-soft) !important;
}
.ot-create__mismatch {
  margin-right: 12px;
  font-size: 13px;
  color: var(--ui-warn-ink);
}
@media (max-width: 720px) {
  .ot-create__grid {
    grid-template-columns: 1fr;
  }
  .ot-create__grid .is-wide2 {
    grid-column: auto;
  }
}
</style>
