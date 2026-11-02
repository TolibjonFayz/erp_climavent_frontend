<template>
  <!-- Tez iboralar: izoh maydoni ostida — bosilsa ibora matn oxiriga qo'shiladi -->
  <div class="qp" role="group" :aria-label="$t('qpTitle')">
    <button
      v-for="key in phrases"
      :key="key"
      type="button"
      class="qp-chip"
      :class="{ 'is-used': used(key) }"
      @click="add(key)"
    >
      <span class="qp-chip__plus">+</span>{{ $t(key) }}
    </button>
  </div>
</template>

<script setup>
import { useI18n } from 'vue-i18n'

const props = defineProps({
  modelValue: { type: String, default: '' },
  // Tarjima kalitlari (locales: qp*)
  phrases: { type: Array, required: true },
  maxlength: { type: Number, default: 0 },
})
const emit = defineEmits(['update:modelValue'])
const { t } = useI18n()

const used = (key) => String(props.modelValue || '').includes(t(key))

function add(key) {
  const phrase = t(key)
  const text = String(props.modelValue || '').trimEnd()
  if (text.includes(phrase)) return
  // Oldingi gap tugamagan bo'lsa nuqta qo'yamiz
  const next = !text ? phrase : /[.!?:;\n]$/.test(text) ? `${text} ${phrase}` : `${text}. ${phrase}`
  if (props.maxlength && next.length > props.maxlength) return
  emit('update:modelValue', next)
}
</script>

<style scoped>
.qp {
  width: 100%;
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 8px;
}
.qp-chip {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 3px 10px;
  border: 1px solid var(--ui-line);
  border-radius: 999px;
  background: var(--ui-surface-2);
  color: var(--ui-ink-2);
  font: inherit;
  font-size: 12.5px;
  line-height: 20px;
  cursor: pointer;
}
.qp-chip:hover {
  border-color: var(--ui-link-line);
  color: var(--ui-link);
  background: var(--ui-link-soft);
}
.qp-chip__plus {
  font-weight: 700;
  color: var(--ui-muted);
}
.qp-chip:hover .qp-chip__plus {
  color: inherit;
}
/* Matnda allaqachon bor ibora — xira, qayta qo'shilmaydi */
.qp-chip.is-used {
  opacity: 0.45;
  cursor: default;
}
</style>
