<template>
  <!-- Summa kiritish: yozayotganda "1 234 567" ko'rinishida guruhlanadi, v-model — oddiy son -->
  <el-input
    :model-value="text"
    :placeholder="placeholder"
    :disabled="disabled"
    :size="size"
    :clearable="clearable"
    inputmode="decimal"
    class="ui-money"
    @update:model-value="onInput"
    @blur="onBlur"
  >
    <template v-if="suffix" #suffix>{{ suffix }}</template>
  </el-input>
</template>

<script setup>
import { ref, watch } from 'vue'

const props = defineProps({
  modelValue: { type: Number, default: null },
  min: { type: Number, default: undefined },
  max: { type: Number, default: undefined },
  // Kasr xonalari (so'm uchun odatda 0, kerak bo'lsa 2)
  precision: { type: Number, default: 2 },
  placeholder: { type: String, default: '' },
  disabled: Boolean,
  clearable: Boolean,
  size: { type: String, default: undefined },
  suffix: { type: String, default: '' },
})
const emit = defineEmits(['update:modelValue', 'change'])

// Raqam guruhlari orasida oddiy probel (ko'chirib olinganda ham to'g'ri o'qiladi)
const group = (intPart) => intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ' ')

/** 1234567.5 → "1 234 567,5" */
function format(n) {
  if (n === null || n === undefined || n === '' || !Number.isFinite(Number(n))) return ''
  const num = Number(n)
  const [i, d] = String(Math.abs(num)).split('.')
  return `${num < 0 ? '-' : ''}${group(i)}${d ? `,${d.slice(0, props.precision)}` : ''}`
}

/**
 * Yozilgan matnni tozalash: faqat raqam, bitta kasr belgisi va boshida minus.
 * Yozish davomida "1 234," kabi chala qiymat ham saqlanadi (kursor sakramasin).
 */
function clean(raw) {
  let s = String(raw ?? '').replace(/[^\d.,-]/g, '')
  const neg = s.startsWith('-') && (props.min === undefined || props.min < 0)
  s = s.replace(/-/g, '').replace(/\./g, ',')
  const [i = '', ...rest] = s.split(',')
  const intPart = i.replace(/^0+(?=\d)/, '')
  const hasDec = rest.length > 0 && props.precision > 0
  const dec = hasDec ? rest.join('').slice(0, props.precision) : ''
  return { neg, intPart, hasDec, dec }
}

const text = ref(format(props.modelValue))

watch(
  () => props.modelValue,
  (v) => {
    // Tashqaridan o'zgarganda (forma tozalandi va h.k.) ko'rinish yangilanadi
    if (toNumber(text.value) !== (v ?? null)) text.value = format(v)
  },
)

function toNumber(str) {
  const { neg, intPart, dec } = clean(str)
  if (!intPart && !dec) return null
  const n = Number(`${neg ? '-' : ''}${intPart || '0'}${dec ? `.${dec}` : ''}`)
  return Number.isFinite(n) ? n : null
}

function onInput(raw) {
  const { neg, intPart, hasDec, dec } = clean(raw)
  text.value = intPart || hasDec || neg ? `${neg ? '-' : ''}${group(intPart || (hasDec ? '0' : ''))}${hasDec ? `,${dec}` : ''}` : ''
  emit('update:modelValue', toNumber(text.value))
}

// Fokusdan chiqqanda chegaralar qo'llanadi va ko'rinish tekislanadi
function onBlur() {
  let n = toNumber(text.value)
  if (n !== null) {
    if (props.min !== undefined && n < props.min) n = props.min
    if (props.max !== undefined && n > props.max) n = props.max
  }
  text.value = format(n)
  emit('update:modelValue', n)
  emit('change', n)
}
</script>

<style scoped>
.ui-money :deep(input) {
  font-variant-numeric: tabular-nums;
}
</style>
