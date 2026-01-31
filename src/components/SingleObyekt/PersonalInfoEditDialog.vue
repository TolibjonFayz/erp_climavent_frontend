<template>
  <el-dialog v-model="dialogVisible" title="Shaxsiy ma'lumotlar" width="500">
    <div class="demo-input-with-icon">
      <div class="input-group">
        <span class="label">{{ $t('ism') }}</span>
        <div class="input-container">
          <el-input
            style="width: 320px"
            v-model="localForm.firstname"
            class="responsive-input"
            :placeholder="$t('ism')"
          />
        </div>
      </div>
      <div class="input-group">
        <span class="label">{{ $t('familiya') }}</span>
        <div class="input-container">
          <el-input
            style="width: 320px"
            v-model="localForm.lastname"
            class="responsive-input"
            :placeholder="$t('familiya')"
          />
        </div>
      </div>
      <div class="input-group">
        <span class="label">{{ $t('telefonRaqam') }}</span>
        <div class="input-container">
          <el-input
            style="width: 320px"
            v-model="localForm.phone_number"
            class="responsive-input"
            :placeholder="$t('telefonRaqam')"
          />
        </div>
      </div>
      <div class="input-group">
        <span class="label">{{ $t('email') }}</span>
        <div class="input-container">
          <el-input
            style="width: 320px"
            v-model="localForm.email"
            class="responsive-input"
            :placeholder="$t('email')"
          />
        </div>
      </div>
    </div>
    <template #footer>
      <div class="dialog-footer">
        <el-button @click="handleCancel">{{ $t('cancel') }}</el-button>
        <el-button :loading="loading" type="primary" @click="handleSave">
          {{ $t('save') }}
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'

interface Props {
  modelValue: boolean
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

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  save: [formData: any]
}>()

const dialogVisible = ref(props.modelValue)
const localForm = ref({
  firstname: props.userInfo?.firstname || '',
  lastname: props.userInfo?.lastname || '',
  phone_number: props.userInfo?.phone_number || '',
  email: props.userInfo?.email || '',
})

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

watch(dialogVisible, (newVal) => {
  emit('update:modelValue', newVal)
})

const handleCancel = () => {
  dialogVisible.value = false
}

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
