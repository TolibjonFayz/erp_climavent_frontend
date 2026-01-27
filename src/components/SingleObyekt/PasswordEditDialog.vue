<template>
  <el-dialog v-model="dialogVisible" title="Maxfiy so'zni o'zgartirish" width="500">
    <div class="demo-input-with-icon">
      <div class="input-group">
        <span class="label">Maxfiy so'z</span>
        <div class="input-container">
          <el-input
            v-model="localForm.password"
            type="password"
            placeholder="Maxfiy so'z kiriting"
            show-password
          />
        </div>
      </div>

      <div class="input-group">
        <span class="label">Maxfiy so'zni tasdiqlang</span>
        <div class="input-container">
          <el-input
            v-model="localForm.confirmPassword"
            type="password"
            placeholder="Maxfiy so'zni tasdiqlang"
            show-password
          />
        </div>
      </div>

      <el-alert
        v-if="errorMessage"
        :title="errorMessage"
        type="error"
        show-icon
        :closable="false"
      />
    </div>

    <template #footer>
      <div class="dialog-footer">
        <el-button @click="handleCancel">Bekor qilish</el-button>
        <el-button :loading="loading" type="primary" @click="handleSave"> Saqlash </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'

interface Props {
  modelValue: boolean
  loading?: boolean
}

interface Emits {
  (e: 'update:modelValue', value: boolean): void
  (e: 'save', formData: { password: string }): void
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
})

const emit = defineEmits<Emits>()

const localForm = ref({
  password: '',
  confirmPassword: '',
})

const errorMessage = ref('')

const dialogVisible = ref(props.modelValue)

// v-model uchun sync
watch(
  () => props.modelValue,
  (newVal) => {
    dialogVisible.value = newVal
  },
)

watch(dialogVisible, (newVal) => {
  emit('update:modelValue', newVal)
})

const handleCancel = () => {
  localForm.value = {
    password: '',
    confirmPassword: '',
  }
  errorMessage.value = ''
  dialogVisible.value = false
}

const handleSave = () => {
  // Validatsiya
  if (!localForm.value.password) {
    errorMessage.value = "Maxfiy so'z kiritilmagan!"
    return
  }

  if (localForm.value.password !== localForm.value.confirmPassword) {
    errorMessage.value = "Maxfiy so'z va tasdiqlash bir xil emas!"
    return
  }

  // Xatolik yo'q bo'lsa
  errorMessage.value = ''

  // Parent komponentga yuborish
  emit('save', {
    password: localForm.value.password,
  })

  // Formani tozalash
  localForm.value = {
    password: '',
    confirmPassword: '',
  }
}
</script>

<style scoped>
.demo-input-with-icon {
  width: 100%;
  box-sizing: border-box;
}

.input-group {
  margin-bottom: 20px;
  width: 100%;
}

.input-group:last-child {
  margin-bottom: 16px;
}

.label {
  display: block;
  margin-bottom: 8px;
  font-weight: 500;
  color: var(--el-text-color-primary);
  font-size: 14px;
}

.input-container {
  width: 100%;
  box-sizing: border-box;
}

.el-input {
  width: 100%;
  box-sizing: border-box;
}

.el-alert {
  margin-top: 16px;
  box-sizing: border-box;
}

/* Tablet - 1024px */
@media (max-width: 1024px) {
  .input-group {
    margin-bottom: 18px;
  }

  .label {
    margin-bottom: 7px;
    font-size: 13px;
  }
}

/* iPad and Tablets - 768px to 1023px */
@media (max-width: 1023px) {
  .input-group {
    margin-bottom: 16px;
  }

  .label {
    margin-bottom: 6px;
    font-size: 13px;
  }
}

/* Mobile Landscape - 640px to 767px */
@media (max-width: 767px) and (min-width: 641px) {
  .input-group {
    margin-bottom: 16px;
  }

  .label {
    margin-bottom: 6px;
    font-size: 12px;
  }
}

/* Mobile - 480px to 640px */
@media (max-width: 640px) {
  .demo-input-with-icon {
    padding: 0;
  }

  .input-group {
    margin-bottom: 14px;
  }

  .input-group:last-child {
    margin-bottom: 12px;
  }

  .label {
    margin-bottom: 5px;
    font-size: 12px;
    font-weight: 600;
  }

  .el-alert {
    margin-top: 12px;
  }
}

/* Small Mobile - 380px to 479px */
@media (max-width: 479px) {
  .input-group {
    margin-bottom: 12px;
  }

  .input-group:last-child {
    margin-bottom: 10px;
  }

  .label {
    margin-bottom: 4px;
    font-size: 11px;
  }

  .el-alert {
    margin-top: 10px;
  }
}

/* Very Small Mobile - 320px to 379px */
@media (max-width: 379px) {
  .input-group {
    margin-bottom: 10px;
  }

  .input-group:last-child {
    margin-bottom: 8px;
  }

  .label {
    margin-bottom: 3px;
    font-size: 10px;
  }

  .el-alert {
    margin-top: 8px;
  }
}
</style>
