<template>
  <el-dialog v-model="dialogVisible" title="Shaxsiy ma'lumotlar" width="500">
    <div class="demo-input-with-icon">
      <div class="input-group">
        <span class="label">Ism</span>
        <div class="input-container">
          <el-input
            style="width: 320px"
            v-model="localForm.firstname"
            class="responsive-input"
            placeholder="Ism"
          />
        </div>
      </div>
      <div class="input-group">
        <span class="label">Familiya</span>
        <div class="input-container">
          <el-input
            style="width: 320px"
            v-model="localForm.lastname"
            class="responsive-input"
            placeholder="Familiya"
          />
        </div>
      </div>
      <div class="input-group">
        <span class="label">Telefon raqam</span>
        <div class="input-container">
          <el-input
            style="width: 320px"
            v-model="localForm.phone_number"
            class="responsive-input"
            placeholder="Telefon raqam"
          />
        </div>
      </div>
      <div class="input-group">
        <span class="label">Email</span>
        <div class="input-container">
          <el-input
            style="width: 320px"
            v-model="localForm.email"
            class="responsive-input"
            placeholder="Email"
          />
        </div>
      </div>
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

// Props - Ota komponentdan keladigan ma'lumotlar
interface Props {
  modelValue: boolean // Dialog ochiq/yopiq holati
  userInfo?: {
    firstname?: string
    lastname?: string
    phone_number?: string
    email?: string
  }
  loading?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: false,
  loading: false,
  userInfo: () => ({}),
})

// Emits - Ota komponentga signal yuborish
const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  save: [formData: any]
}>()

// Local state
const dialogVisible = ref(props.modelValue)
const localForm = ref({
  firstname: props.userInfo?.firstname || '',
  lastname: props.userInfo?.lastname || '',
  phone_number: props.userInfo?.phone_number || '',
  email: props.userInfo?.email || '',
})

// Props o'zgarganda local state'ni yangilash
watch(
  () => props.modelValue,
  (newVal) => {
    dialogVisible.value = newVal
  },
)

watch(
  () => props.userInfo,
  (newVal) => {
    if (newVal) {
      localForm.value = {
        firstname: newVal.firstname || '',
        lastname: newVal.lastname || '',
        phone_number: newVal.phone_number || '',
        email: newVal.email || '',
      }
    }
  },
  { deep: true },
)

// Dialog yopilganda ota komponentga signal yuborish
watch(dialogVisible, (newVal) => {
  emit('update:modelValue', newVal)
})

// Bekor qilish tugmasi
const handleCancel = () => {
  dialogVisible.value = false
}

// Saqlash tugmasi
const handleSave = () => {
  emit('save', localForm.value)
}
</script>

<style scoped>
.demo-input-with-icon {
  width: 100%;
  box-sizing: border-box;
}

.input-group {
  margin-bottom: 1.5rem;
}

.input-group:last-child {
  margin-bottom: 0;
}

.label {
  display: block;
  margin-bottom: 0.75rem;
  color: var(--el-text-color-regular);
  font-weight: 500;
  font-size: 14px;
}

.input-container {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
  width: 100%;
}

.responsive-input {
  width: 240px;
  box-sizing: border-box;
}

/* Tablet - 1024px */
@media (max-width: 1024px) {
  .input-group {
    margin-bottom: 1.25rem;
  }

  .label {
    margin-bottom: 0.6rem;
    font-size: 13px;
  }

  .responsive-input {
    width: 100%;
    min-width: 0;
  }
}

/* iPad and Tablets - 768px to 1023px */
@media (max-width: 1023px) {
  .input-container {
    flex-direction: column;
    gap: 0.8rem;
  }

  .responsive-input {
    width: 100%;
    min-width: 0;
  }
}

/* Mobile Landscape - 640px to 767px */
@media (max-width: 767px) and (min-width: 641px) {
  .input-group {
    margin-bottom: 1.2rem;
  }

  .label {
    margin-bottom: 0.6rem;
    font-size: 13px;
  }

  .input-container {
    flex-direction: column;
    gap: 0.8rem;
  }

  .responsive-input {
    width: 100%;
  }
}

/* Mobile - 480px to 640px */
@media (max-width: 640px) {
  .demo-input-with-icon {
    width: 100%;
    padding: 0;
  }

  .input-group {
    margin-bottom: 1rem;
  }

  .label {
    margin-bottom: 0.5rem;
    font-size: 12px;
    font-weight: 600;
  }

  .input-container {
    flex-direction: column;
    gap: 0.6rem;
  }

  .responsive-input {
    width: 100%;
    min-width: 0;
  }
}

/* Small Mobile - 380px to 479px */
@media (max-width: 479px) {
  .input-group {
    margin-bottom: 0.9rem;
  }

  .label {
    margin-bottom: 0.4rem;
    font-size: 11px;
  }

  .input-container {
    gap: 0.5rem;
  }
}

/* Very Small Mobile - 320px to 379px */
@media (max-width: 379px) {
  .input-group {
    margin-bottom: 0.8rem;
  }

  .label {
    margin-bottom: 0.3rem;
    font-size: 10px;
  }

  .input-container {
    gap: 0.4rem;
  }
}
</style>
