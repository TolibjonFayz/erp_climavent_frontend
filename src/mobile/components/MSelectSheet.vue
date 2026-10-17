<script setup>
import { computed, ref, watch } from 'vue'
import MSheet from './MSheet.vue'

// Ro'yxatdan bitta qiymat tanlash oynasi (qidiruv bilan).
// options: [{ value, label, sub?, avatar? }]
const props = defineProps({
  modelValue: { type: Boolean, default: false },
  title: { type: String, default: '' },
  options: { type: Array, default: () => [] },
  selected: { type: [String, Number, null], default: null },
  searchable: { type: Boolean, default: null },
})
const emit = defineEmits(['update:modelValue', 'select'])

const open = computed({
  get: () => props.modelValue,
  set: (v) => emit('update:modelValue', v),
})

const q = ref('')
watch(open, (v) => v && (q.value = ''))
const showSearch = computed(() => props.searchable ?? props.options.length > 8)

const list = computed(() => {
  const s = q.value.trim().toLowerCase()
  if (!s) return props.options
  return props.options.filter((o) =>
    `${o.label} ${o.sub || ''}`.toLowerCase().includes(s),
  )
})

function pick(o) {
  emit('select', o.value, o)
  open.value = false
}
</script>

<template>
  <MSheet v-model="open" :title="title" max-height="80%">
    <van-search
      v-if="showSearch"
      v-model="q"
      shape="round"
      :placeholder="$t('m.search')"
      class="ms-search"
    />
    <div class="ms-list">
      <button
        v-for="o in list"
        :key="String(o.value)"
        type="button"
        class="ms-item"
        :class="{ 'is-selected': o.value === selected }"
        @click="pick(o)"
      >
        <span v-if="o.avatar" class="m-avatar is-sm" :style="{ background: o.avatarColor }">
          {{ o.avatar }}
        </span>
        <span class="ms-item__text">
          <span class="ms-item__label">{{ o.label }}</span>
          <span v-if="o.sub" class="ms-item__sub">{{ o.sub }}</span>
        </span>
        <van-icon v-if="o.value === selected" name="success" class="ms-item__check" />
      </button>
      <p v-if="!list.length" class="ms-empty">{{ $t('m.nothingFound') }}</p>
    </div>
  </MSheet>
</template>

<style scoped>
.ms-search {
  padding: 0 12px 6px;
}

.ms-list {
  padding: 0 8px;
}

.ms-item {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 12px;
  min-height: 50px;
  padding: 8px 10px;
  border: 0;
  border-radius: 10px;
  background: none;
  text-align: left;
}

.ms-item:active {
  background: var(--m-line-soft);
}

.ms-item.is-selected {
  background: var(--m-primary-soft);
}

.ms-item__text {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
}

.ms-item__label {
  font-size: 15px;
  color: var(--m-ink);
}

.ms-item__sub {
  font-size: 12px;
  color: var(--m-muted);
}

.ms-item__check {
  color: var(--m-primary);
  font-size: 18px;
}

.ms-empty {
  padding: 24px;
  text-align: center;
  color: var(--m-muted);
}
</style>
