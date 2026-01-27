<template>
  <div class="partner-card">
    <!-- <div class="card-header">
      <div class="partner-type-badge">
        <el-tag :type="tagType">{{ tagLabel }}</el-tag>
      </div>
    </div> -->

    <div class="card-body">
      <h3 class="partner-name">Ismi: {{ partner.fullname }}</h3>

      <div class="info-grid">
        <div class="info-item">
          <el-icon class="info-icon"><Phone /></el-icon>
          <div class="info-content">
            <span class="info-label">Telefon</span>
            <span class="info-value">{{ partner.phone_number }}</span>
          </div>
        </div>

        <div v-if="partner.additional_phone_number" class="info-item">
          <el-icon class="info-icon"><Phone /></el-icon>
          <div class="info-content">
            <span class="info-label">Qo'shimcha telefon</span>
            <span class="info-value">{{ partner.additional_phone_number }}</span>
          </div>
        </div>

        <div v-if="partner.republic" class="info-item">
          <el-icon class="info-icon"><Location /></el-icon>
          <div class="info-content">
            <span class="info-label">Respublika</span>
            <span class="info-value">{{ formatText(partner.republic) }}</span>
          </div>
        </div>

        <div v-if="partner.viloyat" class="info-item">
          <el-icon class="info-icon"><Location /></el-icon>
          <div class="info-content">
            <span class="info-label">Viloyat</span>
            <span class="info-value">{{ formatText(partner.viloyat) }}</span>
          </div>
        </div>

        <div v-if="partner.shahar_tuman" class="info-item">
          <el-icon class="info-icon"><Location /></el-icon>
          <div class="info-content">
            <span class="info-label">Shahar/Tuman</span>
            <span class="info-value">{{ formatText(partner.shahar_tuman) }}</span>
          </div>
        </div>

        <div class="info-item">
          <el-icon class="info-icon"><OfficeBuilding /></el-icon>
          <div class="info-content">
            <span class="info-label">Mijoz turi</span>
            <span class="info-value">{{ partner.mijozturi }}</span>
          </div>
        </div>

        <div v-if="partner.inn" class="info-item">
          <el-icon class="info-icon"><Document /></el-icon>
          <div class="info-content">
            <span class="info-label">INN</span>
            <span class="info-value">{{ partner.inn }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- <div class="card-footer">
      <el-popconfirm
        title="Rostdan ham o'chirmoqchimisiz?"
        confirm-button-text="Ha"
        cancel-button-text="Yo'q"
        @confirm="handleDelete"
      >
        <template #reference>
          <el-button type="danger" link :icon="Delete">O'chirish</el-button>
        </template>
      </el-popconfirm>
      <el-button type="primary" link :icon="Edit" @click="handleEdit">Tahrirlash</el-button>
    </div> -->
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { Phone, Location, OfficeBuilding, Document, Delete, Edit } from '@element-plus/icons-vue'

const props = defineProps({
  partner: {
    type: Object,
    required: true,
  },
})

const emit = defineEmits(['delete', 'edit'])

// Tag type va label ni partner_type asosida aniqlash
const tagType = computed(() => {
  const types = {
    doimiymijoz: 'success',
    montajnik: 'primary',
    quruvchi: 'warning',
    dokonchitadbirkor: 'info',
    proyektinstitut: '',
    boshqa: 'info',
  }
  return types[props.partner.partner_type] || ''
})

const tagLabel = computed(() => {
  const labels = {
    doimiymijoz: 'Doimiy mijoz',
    montajnik: 'Montajnik',
    quruvchi: 'Quruvchi',
    dokonchitadbirkor: "Do'konchi tadbirkor",
    proyektinstitut: 'Proyekt institut',
    boshqa: 'Boshqa',
  }
  return labels[props.partner.partner_type] || 'Boshqa'
})

// Matnni formatlash (pastki chiziqni bo'sh joyga almashtirish va bosh harfga o'tkazish)
const formatText = (text) => {
  if (!text) return ''
  return text.replace(/_/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase())
}

const handleDelete = () => {
  emit('delete', props.partner.id)
}

const handleEdit = () => {
  emit('edit', props.partner.id)
}
</script>

<style lang="scss" scoped>
.partner-card {
  background: #ffffff;
  border-radius: 16px;
  border: 1px solid #e5e7eb;
  overflow: hidden;
  transition: all 0.3s ease;

  &:hover {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    transform: translateY(-4px);
    border-color: #409eff;
  }
}

.card-header {
  padding: 20px 24px;
  background: linear-gradient(135deg, #f9fafb 0%, #f3f4f6 100%);
  display: flex;
  justify-content: center;
  align-items: center;
  border-bottom: 1px solid #e5e7eb;
}

.partner-type-badge {
  .el-tag {
    font-weight: 600;
    padding: 8px 16px;
    font-size: 13px;
  }
}

.card-body {
  padding: 24px;
}

.partner-name {
  font-size: 20px;
  font-weight: 600;
  color: #1f2937;
  margin: 0 0 20px 0;
}

.info-grid {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.info-item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 12px;
  background: #f9fafb;
  border-radius: 10px;
  border: 1px solid #e5e7eb;
  transition: all 0.2s ease;

  &:hover {
    background: #f3f4f6;
    border-color: #d1d5db;
  }
}

.info-icon {
  font-size: 20px;
  color: #409eff;
  margin-top: 2px;
  flex-shrink: 0;
}

.info-content {
  display: flex;
  flex-direction: column;
  gap: 4px;
  flex: 1;
}

.info-label {
  font-size: 12px;
  color: #6b7280;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.info-value {
  font-size: 14px;
  color: #1f2937;
  font-weight: 600;
}

.card-footer {
  padding: 16px 24px;
  background: #f9fafb;
  border-top: 1px solid #e5e7eb;
  display: flex;
  justify-content: space-between;
  align-items: center;

  .el-button {
    font-weight: 500;
  }
}

/* Responsive */
@media (max-width: 768px) {
  .card-footer {
    flex-direction: column;
    gap: 8px;

    .el-button {
      width: 100%;
    }
  }
}

@media (max-width: 480px) {
  .card-body {
    padding: 16px;
  }

  .partner-name {
    font-size: 18px;
  }
}
</style>
