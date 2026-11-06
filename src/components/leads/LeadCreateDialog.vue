<template>
  <el-dialog :model-value="modelValue" :title="$t('ldNew')" width="min(440px, 94vw)" @close="close">
    <el-form label-position="top" @submit.prevent="submit">
      <el-form-item :label="$t('ldName')">
        <el-input v-model="form.name" maxlength="200" />
      </el-form-item>
      <el-form-item :label="$t('ldColPhone')">
        <el-input v-model="form.phone" maxlength="40" placeholder="+998 90 123 45 67" />
      </el-form-item>
      <el-form-item :label="$t('ldEmail')">
        <el-input v-model="form.email" maxlength="200" />
      </el-form-item>
      <el-form-item :label="$t('ldNote')">
        <el-input v-model="form.note" type="textarea" :rows="3" maxlength="4000" />
      </el-form-item>
      <el-alert v-if="error" type="error" show-icon :closable="false" :title="error" />
    </el-form>
    <template #footer>
      <el-button @click="close">{{ $t('ldCancel') }}</el-button>
      <el-button type="primary" :loading="saving" :disabled="!valid" @click="submit">{{ $t('ldCreate') }}</el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import { computed, reactive, ref } from 'vue'
import api from '@/api/leads'

defineProps({ modelValue: { type: Boolean, default: false } })
const emit = defineEmits(['update:modelValue', 'created'])

const blank = () => ({ name: '', phone: '', email: '', note: '' })
const form = reactive(blank())
const saving = ref(false)
const error = ref('')
const valid = computed(() => !!(form.name.trim() || form.phone.trim() || form.email.trim()))

function close() {
  emit('update:modelValue', false)
  Object.assign(form, blank())
  error.value = ''
}

async function submit() {
  if (!valid.value || saving.value) return
  saving.value = true
  error.value = ''
  try {
    const payload = {}
    for (const k of Object.keys(form)) if (form[k].trim()) payload[k] = form[k].trim()
    const lead = await api.create(payload)
    emit('created', lead)
    close()
  } catch (e) {
    const m = e?.response?.data?.message
    error.value = Array.isArray(m) ? m.join('; ') : m || 'Error'
  } finally {
    saving.value = false
  }
}
</script>
