<template>
  <el-dialog
    :model-value="modelValue"
    :title="competitor ? $t('cmpEditTitle') : $t('cmpAddTitle')"
    width="560px"
    destroy-on-close
    @update:model-value="(v) => emit('update:modelValue', v)"
    @open="fill"
  >
    <el-form ref="formRef" :model="form" :rules="rules" label-position="top" @submit.prevent="submit">
      <el-row :gutter="12">
        <el-col :span="24">
          <el-form-item :label="$t('cmpName')" prop="name">
            <el-input v-model="form.name" maxlength="160" />
          </el-form-item>
        </el-col>
        <el-col :span="24">
          <el-form-item :label="$t('cmpBrands')">
            <el-input v-model="form.brands" :placeholder="$t('cmpBrandsHint')" maxlength="300" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item :label="$t('cmpWebsite')">
            <el-input v-model="form.website" placeholder="example.uz" maxlength="200" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item :label="$t('telefon')">
            <el-input v-model="form.phone" placeholder="+998..." maxlength="64" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item :label="$t('cmpStrengths')">
            <el-input v-model="form.strengths" type="textarea" :rows="3" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item :label="$t('cmpWeaknesses')">
            <el-input v-model="form.weaknesses" type="textarea" :rows="3" />
          </el-form-item>
        </el-col>
        <el-col :span="24">
          <el-form-item :label="$t('cmpNote')">
            <el-input v-model="form.note" type="textarea" :rows="2" />
          </el-form-item>
        </el-col>
      </el-row>
    </el-form>
    <template #footer>
      <el-button @click="emit('update:modelValue', false)">{{ $t('cancel') }}</el-button>
      <el-button type="primary" :loading="loading" @click="submit">{{ $t('save') }}</el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import { reactive, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { ElMessage } from 'element-plus'
import competitorsApi from '@/api/competitors'
import { errorText } from '@/utils/errorText'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  // Tahrirlashda — mavjud raqib, qo'shishda — null
  competitor: { type: Object, default: null },
})
const emit = defineEmits(['update:modelValue', 'saved'])

const { t } = useI18n()
const formRef = ref(null)
const loading = ref(false)
const FIELDS = ['name', 'brands', 'website', 'phone', 'strengths', 'weaknesses', 'note']
const form = reactive(Object.fromEntries(FIELDS.map((f) => [f, ''])))
const rules = { name: [{ required: true, message: t('cmpNameRequired'), trigger: 'blur' }] }

function fill() {
  for (const f of FIELDS) form[f] = props.competitor?.[f] || ''
}

async function submit() {
  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid) return
  loading.value = true
  try {
    const saved = props.competitor
      ? await competitorsApi.update(props.competitor.id, { ...form })
      : await competitorsApi.create({ ...form })
    ElMessage.success(t('cmpSaved'))
    emit('update:modelValue', false)
    emit('saved', saved)
  } catch (err) {
    ElMessage.error(errorText(err, t('xatolikYuzBerdi')))
  } finally {
    loading.value = false
  }
}
</script>
