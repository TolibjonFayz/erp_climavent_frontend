<template>
  <!-- ERP asosiy rejimda yangi karta -->
  <el-dialog :model-value="modelValue" :title="$t('otNew')" width="460px" append-to-body @update:model-value="$emit('update:modelValue', $event)">
    <el-form label-position="top">
      <el-form-item :label="$t('otNumber')" required><el-input v-model="f.dogovor_number" maxlength="64" /></el-form-item>
      <el-form-item :label="$t('otClient')" required><el-input v-model="f.client_name" maxlength="255" /></el-form-item>
      <el-form-item :label="$t('otDate')">
        <el-date-picker v-model="f.dogovor_date" type="date" value-format="YYYY-MM-DD" format="DD.MM.YYYY" style="width: 100%" />
      </el-form-item>
      <el-form-item :label="$t('otManager')"><el-input v-model="f.manager_name" maxlength="255" /></el-form-item>
      <el-form-item :label="$t('otSum')">
        <el-input-number v-model="f.contract_sum" :min="0" :controls="false" style="width: 100%" />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="$emit('update:modelValue', false)">{{ $t('otCancel') }}</el-button>
      <el-button type="primary" :disabled="!f.dogovor_number.trim() || !f.client_name.trim()" :loading="saving" @click="save">
        {{ $t('otSave') }}
      </el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import { reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import api from '@/api/otgruzka'
import { otError } from '@/utils/otgruzkaFormat'

defineProps({ modelValue: Boolean })
const emit = defineEmits(['update:modelValue', 'created'])
const saving = ref(false)
const blank = () => ({ dogovor_number: '', client_name: '', dogovor_date: null, manager_name: '', contract_sum: 0 })
const f = reactive(blank())

async function save() {
  saving.value = true
  try {
    const d = await api.create({
      dogovor_number: f.dogovor_number.trim(),
      client_name: f.client_name.trim(),
      dogovor_date: f.dogovor_date || null,
      manager_name: f.manager_name.trim() || null,
      contract_sum: f.contract_sum || 0,
    })
    Object.assign(f, blank())
    emit('update:modelValue', false)
    emit('created', d)
  } catch (e) {
    ElMessage.error(otError(e))
  } finally {
    saving.value = false
  }
}
</script>
