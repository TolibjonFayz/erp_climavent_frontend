<script setup>
import { computed, ref } from 'vue'
import MDateSheet from './MDateSheet.vue'
import { formatDate } from '@/utils/format'

// Forma uchun sana maydoni. v-model — 'YYYY-MM-DD' satr (saytdagi value-format bilan bir xil) yoki ''.
const props = defineProps({
  modelValue: { type: String, default: '' },
  label: { type: String, default: '' },
  placeholder: { type: String, default: '' },
  clearable: { type: Boolean, default: true },
  error: { type: String, default: '' },
  minDate: { type: Date, default: undefined },
  maxDate: { type: Date, default: undefined },
})
const emit = defineEmits(['update:modelValue'])

const open = ref(false)
const pad = (n) => String(n).padStart(2, '0')
const asDate = computed(() => {
  if (!props.modelValue) return null
  const [y, m, d] = String(props.modelValue).slice(0, 10).split('-').map(Number)
  return y ? new Date(y, m - 1, d) : null
})
// Hujjat sanasi aniq ko'rinsin: 18.10.2026
const display = computed(() => (asDate.value ? formatDate(asDate.value) : ''))

function onConfirm(d) {
  emit('update:modelValue', `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`)
}
</script>

<template>
  <van-field
    :model-value="display"
    :label="label"
    label-align="top"
    readonly
    is-link
    :placeholder="placeholder || $t('m.choose')"
    :error-message="error"
    @click="open = true"
  >
    <template v-if="clearable && modelValue" #right-icon>
      <van-icon name="clear" class="mdf-clear" @click.stop="emit('update:modelValue', '')" />
    </template>
  </van-field>
  <MDateSheet
    v-model="open"
    :value="asDate"
    :title="label"
    :min-date="minDate"
    :max-date="maxDate"
    @confirm="onConfirm"
  />
</template>

<style scoped>
.mdf-clear {
  color: var(--m-faint);
  font-size: 18px;
}
</style>
