<template>
  <el-dialog
    :model-value="modelValue"
    :title="$t('cuTitle')"
    width="520px"
    destroy-on-close
    @update:model-value="(v) => emit('update:modelValue', v)"
    @open="fillForm"
  >
    <p v-if="cameraNo" class="cu-hint">{{ $t('cuCameraHint', { n: Number(cameraNo) }) }}</p>
    <el-form
      ref="formRef"
      :model="form"
      :rules="rules"
      label-position="top"
      @submit.prevent="submit"
    >
      <el-row :gutter="12">
        <el-col :span="12">
          <el-form-item :label="$t('cuFirstname')" prop="firstname">
            <el-input v-model="form.firstname" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item :label="$t('cuLastname')" prop="lastname">
            <el-input v-model="form.lastname" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item :label="$t('cuUsername')" prop="username">
            <el-input v-model="form.username" autocomplete="off" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item :label="$t('cuPassword')" prop="password">
            <el-input
              v-model="form.password"
              type="password"
              show-password
              autocomplete="new-password"
            />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item :label="$t('cuPhone')" prop="phone_number">
            <el-input v-model="form.phone_number" placeholder="+998..." />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item :label="$t('cuEmail')" prop="email">
            <el-input v-model="form.email" />
          </el-form-item>
        </el-col>
        <el-col :span="24">
          <el-checkbox v-model="form.is_admin">{{ $t('cuMakeAdmin') }}</el-checkbox>
        </el-col>
      </el-row>
    </el-form>
    <template #footer>
      <el-button @click="emit('update:modelValue', false)">{{ $t('cuCancel') }}</el-button>
      <el-button type="primary" :loading="loading" @click="submit">{{ $t('cuSubmit') }}</el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import { reactive, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { ElMessage } from 'element-plus'
import { useUsersStore } from '@/stores/user'
import { useAuditLog } from '@/composables/useAuditLog'
import { errorText } from '@/utils/errorText'

// Admin yangi xodim qo'shadi. `prefill` — masalan kamera terminalidagi ism
const props = defineProps({
  modelValue: { type: Boolean, default: false },
  prefill: { type: Object, default: () => ({}) },
  cameraNo: { type: String, default: '' },
})
const emit = defineEmits(['update:modelValue', 'created'])

const { t } = useI18n()
const usersStore = useUsersStore()
const { addAuditLog } = useAuditLog()

const formRef = ref(null)
const loading = ref(false)
const emptyForm = () => ({
  firstname: '',
  lastname: '',
  username: '',
  password: '',
  phone_number: '',
  email: '',
  is_admin: false,
})
const form = reactive(emptyForm())

const required = (key) => ({ required: true, message: t(key), trigger: 'blur' })
const rules = {
  firstname: [required('cuReqFirstname')],
  lastname: [required('cuReqLastname')],
  username: [
    required('cuReqUsername'),
    { pattern: /^\S+$/, message: t('cuNoSpaces'), trigger: 'blur' },
  ],
  password: [required('cuReqPassword'), { min: 6, message: t('cuMinPassword'), trigger: 'blur' }],
  email: [{ type: 'email', message: t('cuBadEmail'), trigger: 'blur' }],
}

function fillForm() {
  Object.assign(form, emptyForm(), props.prefill)
}

async function submit() {
  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid) return
  loading.value = true
  try {
    const { is_admin, ...payload } = form
    payload.username = payload.username.trim()
    // Bazada profile_image majburiy — sidebar 'profile.jpg'ni standart avatar deb biladi
    payload.profile_image = 'profile.jpg'
    const user = await usersStore.createUser(payload)
    if (is_admin && user?.id) {
      await usersStore.updateUser(user.id, { is_admin: true })
      user.is_admin = true
    }
    addAuditLog({
      action: 'create',
      message: `"${payload.firstname} ${payload.lastname}" (@${payload.username}) — yangi foydalanuvchi qo'shildi${is_admin ? ' (admin)' : ''}`,
      type: 'success',
      target_id: user?.id,
    })
    ElMessage.success(`✅ ${t('cuDone', { u: payload.username })}`)
    emit('update:modelValue', false)
    emit('created', user)
  } catch (err) {
    ElMessage.error(errorText(err, t('cuFailed')))
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.cu-hint {
  margin-bottom: 14px;
  font-size: 13px;
  line-height: 1.5;
  color: var(--ui-muted);
}
</style>
