<template>
  <!-- Menejer: ro'yxatdan tanlanadi, ro'yxatda bo'lmasa yozib kiritiladi -->
  <el-select
    :model-value="modelValue || ''"
    filterable
    allow-create
    default-first-option
    clearable
    :reserve-keyword="false"
    :loading="loading"
    :placeholder="$t('managerSelectPh')"
    style="width: 100%"
    @update:model-value="(v) => $emit('update:modelValue', String(v || '').trim())"
    @visible-change="(open) => open && load()"
  >
    <el-option v-for="m in options" :key="m" :label="m" :value="m" />
  </el-select>
</template>

<script>
import { ref } from 'vue'
import api from '@/api/otgruzka'

// Ro'yxat bir marta yuklanadi va barcha oynalar uchun umumiy
const cache = ref(null)
const loading = ref(false)
let pending = null
</script>

<script setup>
import { computed } from 'vue'

const props = defineProps({ modelValue: { type: String, default: '' } })
defineEmits(['update:modelValue'])

async function load() {
  if (cache.value || pending) return pending
  loading.value = true
  pending = api
    .managers()
    .then((list) => (cache.value = Array.isArray(list) ? list : []))
    .catch(() => (cache.value = []))
    .finally(() => {
      loading.value = false
      pending = null
    })
  return pending
}

// Tanlangan qiymat ro'yxatda bo'lmasa ham ko'rinsin
const options = computed(() => {
  const list = cache.value || []
  const v = (props.modelValue || '').trim()
  return v && !list.includes(v) ? [v, ...list] : list
})
</script>
