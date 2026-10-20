<template>
  <el-dialog
    :model-value="modelValue"
    :title="practice ? `${$t('skMoveTitle')} · ${$t('skPractice')}` : $t('skMoveTitle')"
    width="min(560px, 94vw)"
    class="sk-move"
    append-to-body
    @close="$emit('update:modelValue', false)"
  >
    <el-alert v-if="practice" type="warning" show-icon :closable="false" :title="$t('skPracticeBanner')" class="sk-move__alert" />

    <el-form ref="formRef" :model="form" :rules="rules" label-position="top" @submit.prevent>
      <el-form-item :label="$t('skMoveType')">
        <el-radio-group v-model="form.type" class="sk-move__types">
          <el-radio-button v-for="tp in TYPES" :key="tp" :value="tp">{{ $t(`skType_${tp}`) }}</el-radio-button>
        </el-radio-group>
        <div class="sk-move__hint">{{ $t(`skTypeHint_${form.type}`) }}</div>
      </el-form-item>

      <el-form-item :label="$t('skColName')" prop="item_id">
        <el-select
          v-model="form.item_id"
          filterable
          :filter-method="(q) => (itemQuery = q)"
          :placeholder="$t('skPickItem')"
          class="sk-move__item"
          @visible-change="(v) => v && (itemQuery = '')"
        >
          <el-option v-for="it in itemOptions" :key="it.id" :value="it.id" :label="`${it.code} · ${it.name}`">
            <span class="sk-move__opt">{{ it.name }}</span>
            <span class="sk-move__optq">{{ fmtQty(it.closing) }} {{ it.unit }}</span>
          </el-option>
        </el-select>
      </el-form-item>

      <div class="sk-move__row">
        <el-form-item :label="$t('skColQty')" prop="qty">
          <el-input-number v-model="form.qty" :min="form.type === 'adjust' ? -100000 : 0" :step="1" controls-position="right" />
        </el-form-item>
        <el-form-item :label="$t('skColDate')">
          <el-date-picker v-model="form.move_date" type="date" value-format="YYYY-MM-DD" format="DD.MM.YYYY" :clearable="false" />
        </el-form-item>
      </div>

      <div v-if="selected" class="sk-move__preview" :class="{ bad: after < 0 }">
        {{ $t('skBalance') }}: <b>{{ fmtQty(selected.closing) }}</b> → <b>{{ fmtQty(after) }}</b> {{ selected.unit }}
        <span v-if="after < 0"> · {{ $t('skNotEnough') }}</span>
      </div>

      <div class="sk-move__row">
        <el-form-item :label="$t('skColDogovor')">
          <el-input v-model="form.dogovor_number" :placeholder="$t('skDogovorPh')" />
        </el-form-item>
        <el-form-item :label="$t('skColDoc')">
          <el-input v-model="form.doc_number" :placeholder="$t('skDocPh')" />
        </el-form-item>
      </div>
      <el-form-item :label="form.type === 'in' ? $t('skFrom') : $t('skTo')">
        <el-input v-model="form.counterparty" :placeholder="$t('skCounterpartyPh')" />
      </el-form-item>
      <el-form-item :label="$t('skColComment')" :prop="form.type === 'adjust' ? 'comment' : ''">
        <el-input v-model="form.comment" type="textarea" :rows="2" />
      </el-form-item>
    </el-form>

    <template #footer>
      <el-button @click="$emit('update:modelValue', false)">{{ $t('skCancel') }}</el-button>
      <el-button type="primary" :loading="saving" @click="submit">
        {{ practice ? $t('skPracticeSave') : $t('skSave') }}
      </el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import { computed, reactive, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { ElMessage } from 'element-plus'
import { useSkladStore } from '@/stores/sklad'
import { fmtQty } from '@/utils/skladFormat'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  type: { type: String, default: 'out' },
  itemId: { type: Number, default: null },
  // true — hech narsa saqlanmaydi (Google Sheets rejimi yoki yo'riqnoma mashqi)
  practice: { type: Boolean, default: false },
})
const emit = defineEmits(['update:modelValue', 'practiced'])
const { t } = useI18n()
const store = useSkladStore()

const TYPES = ['in', 'out', 'reserve', 'release', 'adjust']
const SIGN = { in: 1, out: -1, reserve: -1, release: 1, adjust: 1 }
const today = () => {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

const formRef = ref(null)
const saving = ref(false)
const itemQuery = ref('')
const form = reactive({
  type: 'out',
  item_id: null,
  qty: 1,
  move_date: today(),
  dogovor_number: '',
  doc_number: '',
  counterparty: '',
  comment: '',
})

watch(
  () => props.modelValue,
  (open) => {
    if (!open) return
    Object.assign(form, {
      type: props.type,
      item_id: props.itemId,
      qty: 1,
      move_date: today(),
      dogovor_number: '',
      doc_number: '',
      counterparty: '',
      comment: '',
    })
    formRef.value?.clearValidate()
  },
)

// Katta ro'yxat: qidiruv bo'yicha 60 tagacha variant
const itemOptions = computed(() => {
  const q = itemQuery.value.toLowerCase().trim()
  const list = q
    ? store.items.filter((it) => `${it.code} ${it.name}`.toLowerCase().includes(q))
    : store.items
  const out = list.slice(0, 60)
  if (form.item_id && !out.some((i) => i.id === form.item_id)) {
    const sel = store.items.find((i) => i.id === form.item_id)
    if (sel) out.unshift(sel)
  }
  return out
})

const selected = computed(() => store.items.find((i) => i.id === form.item_id) || null)
const after = computed(() => (selected.value ? selected.value.closing + SIGN[form.type] * (Number(form.qty) || 0) : 0))

const rules = computed(() => ({
  item_id: [{ required: true, message: t('skPickItem'), trigger: 'change' }],
  qty: [
    {
      validator: (_r, v, cb) => (!v ? cb(new Error(t('skQtyRequired'))) : cb()),
      trigger: 'change',
    },
  ],
  comment: [{ required: true, message: t('skAdjustReason'), trigger: 'blur' }],
}))

async function submit() {
  const ok = await formRef.value?.validate().catch(() => false)
  if (!ok) return
  if (props.practice) {
    ElMessage.success({ message: t('skPracticeDone'), duration: 4000 })
    emit('practiced')
    emit('update:modelValue', false)
    return
  }
  saving.value = true
  try {
    await store.createMovement({
      ...form,
      qty: Number(form.qty),
      dogovor_number: form.dogovor_number || undefined,
      doc_number: form.doc_number || undefined,
      counterparty: form.counterparty || undefined,
      comment: form.comment || undefined,
    })
    ElMessage.success(t('skSaved'))
    emit('update:modelValue', false)
  } catch (e) {
    ElMessage.error(e?.response?.data?.message || t('skError'))
  } finally {
    saving.value = false
  }
}
</script>

<style scoped lang="scss">
.sk-move__alert {
  margin-bottom: 14px;
}
.sk-move__types {
  flex-wrap: wrap;
}
.sk-move__hint {
  width: 100%;
  margin-top: 4px;
  font-size: 12px;
  line-height: 1.4;
  color: var(--ui-muted);
}
.sk-move__item {
  width: 100%;
}
.sk-move__opt {
  display: inline-block;
  max-width: 380px;
  overflow: hidden;
  text-overflow: ellipsis;
  vertical-align: middle;
}
.sk-move__optq {
  float: right;
  font-size: 12px;
  color: var(--ui-muted);
}
.sk-move__row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}
.sk-move__preview {
  margin: -4px 0 14px;
  padding: 8px 12px;
  border-radius: 8px;
  background: var(--ui-link-soft);
  font-size: 13px;
  b {
    font-variant-numeric: tabular-nums;
    color: var(--ui-ink);
  }
  &.bad {
    background: var(--ui-bad-soft);
    color: var(--ui-bad);
  }
}
@media (max-width: 600px) {
  .sk-move__row {
    grid-template-columns: 1fr;
  }
}
</style>
