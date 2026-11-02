<script setup>
import { useI18n } from 'vue-i18n'
import { appendPhrase } from '@/utils/phrases'

// Tez iboralar: izoh maydoni ostida — bosilsa ibora matn oxiriga qo'shiladi (sayt bilan bir xil qoida)
const props = defineProps({
  modelValue: { type: String, default: '' },
  phrases: { type: Array, required: true },
  maxlength: { type: Number, default: 0 },
})
const emit = defineEmits(['update:modelValue'])
const { t } = useI18n()

const used = (key) => String(props.modelValue || '').includes(t(key))
function add(key) {
  const next = appendPhrase(props.modelValue, t(key), props.maxlength)
  if (next !== props.modelValue) emit('update:modelValue', next)
}
</script>

<template>
  <div class="mqp">
    <button
      v-for="key in phrases"
      :key="key"
      type="button"
      class="mqp-chip"
      :class="{ 'is-used': used(key) }"
      @click="add(key)"
    >
      + {{ $t(key) }}
    </button>
  </div>
</template>

<style scoped>
.mqp {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  padding: 0 16px 12px;
}
.mqp-chip {
  padding: 5px 10px;
  border: 1px solid var(--m-line);
  border-radius: 999px;
  background: var(--m-line-soft);
  color: var(--m-ink);
  font: inherit;
  font-size: 13px;
}
.mqp-chip:active {
  background: var(--m-primary-soft);
  border-color: var(--m-primary);
}
.mqp-chip.is-used {
  opacity: 0.45;
}
</style>
