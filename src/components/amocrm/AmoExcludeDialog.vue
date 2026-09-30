<template>
  <!-- Raqamni "Mijoz emas" deb belgilash -->
  <el-dialog
    v-model="open"
    :title="$t('amoExcludeTitle')"
    width="440px"
    append-to-body
    destroy-on-close
    @open="reset"
  >
    <p class="ex-note">{{ $t('amoExcludeNote') }}</p>
    <el-form label-position="top" @submit.prevent="save">
      <el-form-item :label="$t('amoColPhone')" required>
        <el-input v-model="form.phone" :disabled="Boolean(phone)" placeholder="+998 90 123 45 67" />
      </el-form-item>
      <el-form-item v-if="contactName" :label="$t('amoColContact')">
        <span>{{ contactName }}</span>
      </el-form-item>
      <el-form-item :label="$t('amoExcludeReason')" required>
        <el-radio-group v-model="form.reason">
          <el-radio v-for="r in reasons" :key="r" :value="r">{{
            $t(`amoExcludeReason_${r}`)
          }}</el-radio>
        </el-radio-group>
      </el-form-item>
      <el-form-item :label="$t('amoExcludeComment')">
        <el-input
          v-model="form.note"
          maxlength="255"
          show-word-limit
          :placeholder="$t('amoExcludeCommentPh')"
        />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="open = false">{{ $t('amoCancel') }}</el-button>
      <el-button type="primary" :loading="saving" :disabled="!canSave" @click="save">
        {{ $t('amoExcludeSave') }}
      </el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import { computed, reactive, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { ElMessage } from 'element-plus'
import { useAmocrmStore } from '@/stores/amocrm'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  // Ro'yxatdan kelsa — raqam oldindan to'ldiriladi va o'zgartirilmaydi
  phone: { type: String, default: '' },
  contactName: { type: String, default: '' },
})
const emit = defineEmits(['update:modelValue', 'saved'])

const { t } = useI18n()
const amoStore = useAmocrmStore()

const reasons = ['colleague', 'acquaintance', 'supplier', 'other']
const open = computed({
  get: () => props.modelValue,
  set: (v) => emit('update:modelValue', v),
})
const form = reactive({ phone: '', reason: 'colleague', note: '' })
const saving = ref(false)

// Qisqa (ichki) raqamlar avtomatik chiqariladi — kamida 7 ta raqam
const canSave = computed(() => form.phone.replace(/[^0-9]/g, '').length >= 7 && form.reason)

function reset() {
  form.phone = props.phone || ''
  form.reason = 'colleague'
  form.note = ''
}

async function save() {
  if (!canSave.value) return
  saving.value = true
  try {
    await amoStore.excludePhone({
      phone: form.phone,
      reason: form.reason,
      note: form.note || undefined,
    })
    ElMessage.success(t('amoExcludeDone'))
    open.value = false
    emit('saved')
  } catch (err) {
    const msg = err?.response?.data?.message
    ElMessage.error(Array.isArray(msg) ? msg.join(', ') : msg || err?.message)
  } finally {
    saving.value = false
  }
}
</script>

<style scoped>
.ex-note {
  margin: 0 0 14px;
  font-size: 13px;
  color: #4b5563;
  line-height: 1.5;
}
</style>
