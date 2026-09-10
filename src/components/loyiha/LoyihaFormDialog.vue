<template>
  <!-- Loyiha qo'shish/tahrirlash formasi — ro'yxat va detail sahifada bir xil ishlatiladi -->
  <el-dialog
    :model-value="modelValue"
    :title="editing ? $t('loyihaEditTitle') : $t('loyihaDialogTitle')"
    width="860px"
    class="loyiha-form-dialog"
    destroy-on-close
    @update:model-value="(v) => emit('update:modelValue', v)"
  >
    <el-form ref="formRef" :model="form" :rules="formRules" label-position="top">
      <!-- ── Asosiy ── -->
      <div class="form-block">
        <h4 class="block-title">{{ $t('loyihaSectionMain') }}</h4>
        <el-row :gutter="18">
          <el-col :span="12">
            <el-form-item :label="$t('loyihaStatusLabel')" prop="status">
              <el-radio-group v-model="form.status" class="status-picker">
                <el-radio-button
                  v-for="opt in statusOptions"
                  :key="opt.value"
                  :value="opt.value"
                >
                  {{ opt.icon }} {{ $t(opt.labelKey) }}
                </el-radio-button>
              </el-radio-group>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item :label="$t('loyihaSystemLabel')" prop="system_info">
              <el-input v-model="form.system_info" :placeholder="$t('loyihaSystemPlaceholder')" />
            </el-form-item>
          </el-col>

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
          <el-col :span="12">
            <el-form-item :label="$t('loyihaDifficultyLabel')" prop="difficulty">
              <div class="difficulty-picker">
                <el-slider v-model="form.difficulty" :min="1" :max="10" :step="1" show-stops />
                <span class="difficulty-badge" :class="difficultyClass(form.difficulty)">
                  {{ form.difficulty }}/10
                </span>
              </div>
            </el-form-item>
          </el-col>
        </el-row>
      </div>

      <!-- ── Mijoz ── -->
      <div class="form-block">
        <h4 class="block-title">{{ $t('loyihaSectionClient') }}</h4>
        <el-row :gutter="18">
          <el-col :span="8">
            <el-form-item :label="$t('loyihaPhoneLabel')" prop="contact_phone">
              <el-input v-model="form.contact_phone" maxlength="60" />
            </el-form-item>
          </el-col>
          <el-col :span="16">
            <el-form-item :label="$t('loyihaAddressLabel')" prop="contact_address">
              <el-input v-model="form.contact_address" maxlength="300" />
            </el-form-item>
          </el-col>
        </el-row>
      </div>

      <!-- ── KP ── -->
      <div class="form-block kp-block">
        <h4 class="block-title">{{ $t('loyihaSectionKp') }}</h4>
        <el-row :gutter="18">
          <el-col :span="8">
            <el-form-item :label="$t('loyihaKpNumberLabel')" prop="kp_number">
              <el-input v-model="form.kp_number" maxlength="100" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item :label="$t('loyihaKpSumLabel')" prop="kp_sum">
              <el-input-number
                v-model="form.kp_sum"
                :min="0"
                :precision="2"
                :controls="false"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item :label="$t('loyihaKpDateLabel')" prop="kp_date">
              <el-date-picker
                v-model="form.kp_date"
                type="date"
                format="YYYY-MM-DD"
                value-format="YYYY-MM-DD"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
        </el-row>
      </div>

      <!-- ── Dogovor ── -->
      <div class="form-block dogovor-block">
        <h4 class="block-title">{{ $t('loyihaSectionDogovor') }}</h4>
        <el-row :gutter="18">
          <el-col :span="8">
            <el-form-item :label="$t('loyihaDogovorNumberLabel')" prop="dogovor_number">
              <el-input v-model="form.dogovor_number" maxlength="100" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item :label="$t('loyihaDogovorSumLabel')" prop="dogovor_sum">
              <el-input-number
                v-model="form.dogovor_sum"
                :min="0"
                :precision="2"
                :controls="false"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item :label="$t('loyihaDogovorDateLabel')" prop="dogovor_date">
              <el-date-picker
                v-model="form.dogovor_date"
                type="date"
                format="YYYY-MM-DD"
                value-format="YYYY-MM-DD"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
        </el-row>
      </div>

      <!-- ── Izoh ── -->
      <div class="form-block">
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
      </div>
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
import { difficultyClass, LOYIHA_STATUS_OPTIONS } from '@/utils/loyihaFormat'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  // Tahrirlanayotgan loyiha; null bo'lsa — yangi qo'shish
  modelValueData: { type: Object, default: null },
})

const emit = defineEmits(['update:modelValue', 'saved'])

const { t } = useI18n()
const loyihaStore = useLoyihaStore()
const formRef = ref(null)

const statusOptions = LOYIHA_STATUS_OPTIONS
const editing = computed(() => !!props.modelValueData?.id)

// Loyiha id formada so'ralmaydi — backend avtomatik beradi
const initialForm = () => ({
  status: 'in_progress',
  manager_name: '',
  other_source: '',
  system_info: '',
  area: null,
  difficulty: 5,
  contact_phone: '',
  contact_address: '',
  kp_number: '',
  kp_sum: null,
  kp_date: '',
  dogovor_number: '',
  dogovor_sum: null,
  dogovor_date: '',
  comment: '',
})

const form = reactive(initialForm())

// Oyna har ochilganda formani to'ldiramiz/tozalaymiz
watch(
  () => [props.modelValue, props.modelValueData],
  ([visible]) => {
    if (!visible) return
    Object.assign(form, initialForm())
    const d = props.modelValueData
    if (!d) return
    Object.assign(form, {
      status: d.status || 'in_progress',
      manager_name: d.manager_name || '',
      other_source: d.other_source || '',
      system_info: d.system_info || '',
      area: d.area ?? null,
      difficulty: d.difficulty || 5,
      contact_phone: d.contact_phone || '',
      contact_address: d.contact_address || '',
      kp_number: d.kp_number || '',
      kp_sum: d.kp_sum ?? null,
      kp_date: d.kp_date ? String(d.kp_date).slice(0, 10) : '',
      dogovor_number: d.dogovor_number || '',
      dogovor_sum: d.dogovor_sum ?? null,
      dogovor_date: d.dogovor_date ? String(d.dogovor_date).slice(0, 10) : '',
      comment: d.comment || '',
    })
  },
  { immediate: true },
)

const formRules = {}

const handleSubmit = async () => {
  if (!formRef.value) return
  try {
    await formRef.value.validate()
  } catch {
    return
  }

  const text = (value) => (value && String(value).trim() ? String(value).trim() : undefined)
  const payload = {
    status: form.status,
    manager_name: text(form.manager_name),
    other_source: text(form.other_source),
    system_info: text(form.system_info),
    area: form.area ?? undefined,
    difficulty: form.difficulty || undefined,
    contact_phone: text(form.contact_phone),
    contact_address: text(form.contact_address),
    kp_number: text(form.kp_number),
    kp_sum: form.kp_sum ?? undefined,
    kp_date: text(form.kp_date),
    dogovor_number: text(form.dogovor_number),
    dogovor_sum: form.dogovor_sum ?? undefined,
    dogovor_date: text(form.dogovor_date),
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
.form-block {
  padding: 16px 18px 4px;
  border: 1px solid #eef0f4;
  border-radius: 14px;
  margin-bottom: 16px;
  background: #fcfdff;

  &.kp-block {
    background: #f7fbff;
    border-color: #dbeafe;
  }

  &.dogovor-block {
    background: #fbfaf5;
    border-color: #f0e6d2;
  }
}

.block-title {
  margin: 0 0 12px;
  font-size: 12px;
  font-weight: 700;
  color: #6b7280;
  text-transform: uppercase;
  letter-spacing: 0.07em;
}

.status-picker {
  width: 100%;

  :deep(.el-radio-button) {
    flex: 1;
  }

  :deep(.el-radio-button__inner) {
    width: 100%;
  }
}

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
