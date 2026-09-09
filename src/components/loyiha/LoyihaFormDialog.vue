<template>
  <!-- Loyiha qo'shish/tahrirlash formasi — ro'yxat va detail sahifada bir xil ishlatiladi -->
  <el-dialog
    :model-value="modelValue"
    :title="editing ? $t('loyihaEditTitle') : $t('loyihaDialogTitle')"
    width="820px"
    class="loyiha-form-dialog"
    destroy-on-close
    @update:model-value="(v) => emit('update:modelValue', v)"
  >
    <el-form ref="formRef" :model="form" :rules="formRules" label-position="top">
      <el-row :gutter="18">
        <el-col :span="12">
          <el-form-item :label="$t('loyihaManagerLabel')" prop="manager_name">
            <el-input
              v-model="form.manager_name"
              :placeholder="$t('loyihaManagerPlaceholder')"
              maxlength="200"
            />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item :label="$t('loyihaOtherLabel')" prop="other_source">
            <el-input
              v-model="form.other_source"
              :placeholder="$t('loyihaOtherPlaceholder')"
              maxlength="200"
            />
          </el-form-item>
        </el-col>

        <el-col :span="12">
          <el-form-item :label="$t('loyihaSystemLabel')" prop="system_info">
            <el-input v-model="form.system_info" :placeholder="$t('loyihaSystemPlaceholder')" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item :label="$t('loyihaAreaLabel')" prop="area">
            <el-input-number
              v-model="form.area"
              :min="0"
              :precision="2"
              :controls="false"
              style="width: 100%"
            />
          </el-form-item>
        </el-col>

        <el-col :span="24">
          <el-form-item :label="$t('loyihaDifficultyLabel')" prop="difficulty">
            <div class="difficulty-picker">
              <el-slider v-model="form.difficulty" :min="1" :max="10" :step="1" show-stops />
              <span class="difficulty-badge" :class="difficultyClass(form.difficulty)">
                {{ form.difficulty }}/10
              </span>
            </div>
          </el-form-item>
        </el-col>

        <el-col :span="8">
          <el-form-item :label="$t('loyihaPhoneLabel')" prop="contact_phone">
            <el-input v-model="form.contact_phone" maxlength="60" />
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item :label="$t('loyihaEmailLabel')" prop="contact_email">
            <el-input v-model="form.contact_email" maxlength="120" />
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item :label="$t('loyihaAddressLabel')" prop="contact_address">
            <el-input v-model="form.contact_address" maxlength="300" />
          </el-form-item>
        </el-col>

        <el-col :span="24">
          <el-form-item :label="$t('loyihaCommentLabel')" prop="comment">
            <el-input
              v-model="form.comment"
              type="textarea"
              :rows="4"
              maxlength="2000"
              show-word-limit
              :placeholder="$t('loyihaCommentPlaceholder')"
            />
          </el-form-item>
        </el-col>
      </el-row>
    </el-form>

    <template #footer>
      <el-button @click="emit('update:modelValue', false)">{{ $t('cancel') }}</el-button>
      <el-button type="primary" :loading="loyihaStore.isLoading" @click="handleSubmit">
        {{ $t('save') }}
      </el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import { computed, reactive, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { ElMessage } from 'element-plus'
import { useLoyihaStore } from '@/stores/loyiha'
import { difficultyClass } from '@/utils/loyihaFormat'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  // Tahrirlanayotgan loyiha; null bo'lsa — yangi qo'shish
  modelValueData: { type: Object, default: null },
})

const emit = defineEmits(['update:modelValue', 'saved'])

const { t } = useI18n()
const loyihaStore = useLoyihaStore()
const formRef = ref(null)

const editing = computed(() => !!props.modelValueData?.id)

// Tartib raqami formada so'ralmaydi — backend avtomatik beradi
const initialForm = () => ({
  manager_name: '',
  other_source: '',
  system_info: '',
  area: null,
  difficulty: 5,
  contact_phone: '',
  contact_email: '',
  contact_address: '',
  comment: '',
})

const form = reactive(initialForm())

// Oyna har ochilganda formani to'ldiramiz/tozalaymiz
watch(
  () => [props.modelValue, props.modelValueData],
  ([visible]) => {
    if (!visible) return
    Object.assign(form, initialForm())
    if (props.modelValueData) {
      Object.assign(form, {
        manager_name: props.modelValueData.manager_name || '',
        other_source: props.modelValueData.other_source || '',
        system_info: props.modelValueData.system_info || '',
        area: props.modelValueData.area ?? null,
        difficulty: props.modelValueData.difficulty || 5,
        contact_phone: props.modelValueData.contact_phone || '',
        contact_email: props.modelValueData.contact_email || '',
        contact_address: props.modelValueData.contact_address || '',
        comment: props.modelValueData.comment || '',
      })
    }
  },
  { immediate: true },
)

const formRules = {
  contact_email: [{ type: 'email', message: () => t('loyihaValidationEmail'), trigger: 'blur' }],
}

const handleSubmit = async () => {
  if (!formRef.value) return
  try {
    await formRef.value.validate()
  } catch {
    return
  }

  const text = (value) => (value && String(value).trim() ? String(value).trim() : undefined)
  const payload = {
    manager_name: text(form.manager_name),
    other_source: text(form.other_source),
    system_info: text(form.system_info),
    area: form.area ?? undefined,
    difficulty: form.difficulty || undefined,
    contact_phone: text(form.contact_phone),
    contact_email: text(form.contact_email),
    contact_address: text(form.contact_address),
    comment: text(form.comment),
  }

  try {
    if (editing.value) {
      await loyihaStore.updateLoyiha(props.modelValueData.id, payload)
      ElMessage.success(t('loyihaMessageUpdated'))
    } else {
      await loyihaStore.createLoyiha(payload)
      ElMessage.success(t('loyihaMessageSaved'))
    }
    emit('update:modelValue', false)
    emit('saved')
  } catch (error) {
    ElMessage.error(error?.response?.data?.message || t('loyihaMessageSaveError'))
  }
}
</script>

<style lang="scss" scoped>
.difficulty-picker {
  display: flex;
  align-items: center;
  gap: 16px;
  width: 100%;

  :deep(.el-slider) {
    flex: 1;
  }
}

.difficulty-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 60px;
  padding: 5px 12px;
  border-radius: 999px;
  font-size: 13px;
  font-weight: 700;
  color: #fff;
  flex-shrink: 0;

  &.diff-low {
    background: #10b981;
  }
  &.diff-mid {
    background: #e6a23c;
  }
  &.diff-high {
    background: #f56c6c;
  }
}
</style>
