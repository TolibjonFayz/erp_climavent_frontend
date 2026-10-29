<template>
  <el-dialog
    :model-value="modelValue"
    :title="$t('skNewItem')"
    width="min(480px, 94vw)"
    append-to-body
    @close="$emit('update:modelValue', false)"
  >
    <el-form ref="formRef" :model="form" :rules="rules" label-position="top" @submit.prevent>
      <el-form-item :label="$t('skColName')" prop="name">
        <el-input v-model="form.name" />
      </el-form-item>
      <el-form-item :label="$t('skColGroup')">
        <el-select v-model="form.group_name" filterable allow-create clearable class="sk-full">
          <el-option v-for="g in groups" :key="g" :value="g" :label="g" />
        </el-select>
      </el-form-item>
      <div class="sk-row">
        <el-form-item :label="$t('skColUnit')">
          <el-select v-model="form.unit" filterable allow-create default-first-option class="sk-full">
            <el-option v-for="u in UNIT_CODES" :key="u" :value="u" :label="unitLabel(u)" />
          </el-select>
        </el-form-item>
        <el-form-item :label="$t('skMinQty')">
          <el-input-number v-model="form.min_qty" :min="0" controls-position="right" />
        </el-form-item>
      </div>
      <div class="sk-row">
        <el-form-item :label="$t('skSapCode')">
          <el-input v-model="form.sap_code" />
        </el-form-item>
        <el-form-item :label="$t('skSapName')">
          <el-input v-model="form.sap_name" />
        </el-form-item>
      </div>
    </el-form>
    <template #footer>
      <el-button @click="$emit('update:modelValue', false)">{{ $t('skCancel') }}</el-button>
      <el-button type="primary" :loading="saving" @click="submit">{{ $t('skSave') }}</el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import { reactive, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { ElMessage } from 'element-plus'
import { useSkladStore } from '@/stores/sklad'
import { UNIT_CODES, apiError, unitLabel } from '@/utils/skladFormat'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  groups: { type: Array, default: () => [] },
})
const emit = defineEmits(['update:modelValue'])
const { t } = useI18n()
const store = useSkladStore()
const formRef = ref(null)
const saving = ref(false)
const form = reactive({ name: '', group_name: '', unit: 'dona', min_qty: undefined, sap_code: '', sap_name: '' })
const rules = { name: [{ required: true, message: () => t('skNameRequired'), trigger: 'blur' }] }

watch(
  () => props.modelValue,
  (open) =>
    open && Object.assign(form, { name: '', group_name: '', unit: 'dona', min_qty: undefined, sap_code: '', sap_name: '' }),
)

async function submit() {
  if (!(await formRef.value?.validate().catch(() => false))) return
  saving.value = true
  try {
    await store.createItem({
      name: form.name.trim(),
      group_name: form.group_name || undefined,
      unit: form.unit || undefined,
      min_qty: form.min_qty ?? undefined,
      sap_code: form.sap_code || undefined,
      sap_name: form.sap_name || undefined,
    })
    ElMessage.success(t('skSaved'))
    emit('update:modelValue', false)
  } catch (e) {
    ElMessage.error(apiError(e))
  } finally {
    saving.value = false
  }
}
</script>

<style scoped>
.sk-full {
  width: 100%;
}
.sk-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}
</style>
