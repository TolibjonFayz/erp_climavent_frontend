<template>
  <div class="partners-table-container">
    <!-- Table Header -->
    <div class="partner-table-header">
      <div class="header-cell cell-index">
        <span class="header-text">#</span>
      </div>

      <div class="header-cell cell-group">
        <el-icon><Folder /></el-icon>
        <span class="header-text">{{ $t('guruh') }}</span>
      </div>

      <div class="header-cell cell-name">
        <el-icon><User /></el-icon>
        <span class="header-text">{{ $t('ism') }} </span>
      </div>

      <div class="header-cell cell-phone">
        <el-icon><Phone /></el-icon>
        <span class="header-text">{{ $t('telefon') }}</span>
      </div>

      <div class="header-cell cell-phone-extra">
        <el-icon><Phone /></el-icon>
        <span class="header-text">{{ $t('qoshimcha') }}</span>
      </div>

      <div class="header-cell cell-republic">
        <el-icon><Location /></el-icon>
        <span class="header-text">{{ $t('respublika') }}</span>
      </div>

      <div class="header-cell cell-region">
        <el-icon><Location /></el-icon>
        <span class="header-text">{{ $t('viloyat') }}</span>
      </div>

      <div class="header-cell cell-district">
        <el-icon><Location /></el-icon>
        <span class="header-text">{{ $t('tuman') }}</span>
      </div>

      <div class="header-cell cell-type">
        <el-icon><OfficeBuilding /></el-icon>
        <span class="header-text">{{ $t('turi') }}</span>
      </div>

      <div class="header-cell cell-inn">
        <el-icon><Document /></el-icon>
        <span class="header-text">{{ $t('inn') }}</span>
      </div>
    </div>

    <!-- Table Body -->
    <div class="table-body">
      <div v-for="(partner, index) in partners" :key="partner.id" class="partner-table-row">
        <div class="table-cell cell-index">
          <span class="index-number">{{ index + 1 }}</span>
        </div>

        <div class="table-cell cell-group">
          <el-tag type="info" size="small">{{ formatPartnerType(partner.partner_type) }}</el-tag>
        </div>

        <div class="table-cell cell-name">
          <span class="cell-value">{{ partner.fullname }}</span>
        </div>

        <div class="table-cell cell-phone">
          <span class="cell-value">{{ partner.phone_number }}</span>
        </div>

        <div class="table-cell cell-phone-extra">
          <span class="cell-value">{{ partner.additional_phone_number || '-' }}</span>
        </div>

        <div class="table-cell cell-republic">
          <span class="cell-value">{{ formatText(partner.republic) || '-' }}</span>
        </div>

        <div class="table-cell cell-region">
          <span class="cell-value">{{ formatText(partner.viloyat) || '-' }}</span>
        </div>

        <div class="table-cell cell-district">
          <span class="cell-value">{{ formatText(partner.shahar_tuman) || '-' }}</span>
        </div>

        <div class="table-cell cell-type">
          <el-tag :type="getTypeTag(partner.mijozturi)" size="small">
            {{ partner.mijozturi }}
          </el-tag>
        </div>

        <div class="table-cell cell-inn">
          <span class="cell-value">{{ partner.inn || '-' }}</span>
        </div>
      </div>
    </div>

    <!-- Empty State -->
    <div v-if="!partners || partners.length === 0" class="empty-state">
      <el-icon class="empty-icon"><Document /></el-icon>
      <p class="empty-text">{{ $t('hozirchamijozlaryoq') }}</p>
    </div>
  </div>
</template>

<script setup>
import { User, Phone, Location, OfficeBuilding, Document, Folder } from '@element-plus/icons-vue'

const props = defineProps({
  partners: {
    type: Array,
    default: () => [],
  },
})

const formatText = (text) => {
  if (!text) return ''
  return text.replace(/_/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase())
}

const formatPartnerType = (type) => {
  const types = {
    doimiymijoz: 'Doimiy mijoz',
    montajnik: 'Montajnik',
    quruvchi: 'Quruvchi',
    dokonchitadbirkor: "Do'konchi tadbirkor",
    proyektinstitut: 'Proyekt institut',
    tenderfirmalar: 'Tender firmasi',
    uks: 'UKS tashkiloti',
    boshqa: 'Boshqa',
  }
  return types[type] || type
}

const getTypeTag = (type) => {
  return type === 'Yuridik shaxs' ? 'success' : 'warning'
}
</script>

<style lang="scss" scoped>
.partners-table-container {
  background: #ffffff;
  border-radius: 12px;
  border: 1px solid #e5e7eb;
  overflow-x: auto;
  overflow-y: visible;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  -webkit-overflow-scrolling: touch;

  @media (max-width: 1024px) {
    border-radius: 8px;
  }

  @media (max-width: 768px) {
    border-radius: 8px;
  }
}

// ========== HEADER STYLES ==========
.partner-table-header {
  display: grid;
  grid-template-columns: 50px 1fr 1.2fr 1fr 1fr 0.9fr 0.9fr 0.9fr 0.8fr 0.8fr;
  align-items: center;
  padding: 14px 16px;
  background: linear-gradient(135deg, #f9fafb 0%, #f3f4f6 100%);
  border-bottom: 2px solid #d1d5db;
  gap: 12px;
  position: sticky;
  top: 0;
  z-index: 10;
  min-width: max-content;

  @media (max-width: 1600px) {
    grid-template-columns: 45px 0.9fr 1.1fr 0.9fr 0.9fr 0.8fr 0.8fr 0.8fr 0.7fr 0.7fr;
    gap: 10px;
  }

  @media (max-width: 1400px) {
    grid-template-columns: 40px 0.8fr 1fr 0.9fr 0.9fr 0.8fr 0.8fr 0.8fr 0.7fr 0.7fr;
    gap: 10px;
    padding: 12px 12px;
  }

  @media (max-width: 1200px) {
    grid-template-columns: 35px 120px 140px 110px 110px 100px 100px 100px 90px 80px;
    gap: 8px;
    padding: 12px;
  }

  @media (max-width: 992px) {
    grid-template-columns: 35px 110px 130px 100px 100px 90px 90px 90px 80px 70px;
    gap: 8px;
    padding: 10px 12px;
  }

  @media (max-width: 768px) {
    grid-template-columns: 35px 100px 110px 90px 90px 80px 80px 80px 70px 60px;
    padding: 10px 12px;
    gap: 6px;
  }

  @media (max-width: 640px) {
    grid-template-columns: 30px 90px 100px 80px 80px 70px 70px 70px 60px 50px;
    padding: 10px;
    gap: 6px;
  }

  @media (max-width: 480px) {
    grid-template-columns: 28px 75px 85px 70px 70px 60px 60px 60px 50px 45px;
    padding: 8px 10px;
    gap: 5px;
  }
}

.header-cell {
  display: flex;
  align-items: center;
  gap: 6px;
  color: #6b7280;
  font-weight: 600;
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  min-width: 0;

  @media (max-width: 1400px) {
    font-size: 10px;
    gap: 5px;
  }

  @media (max-width: 768px) {
    font-size: 10px;
    gap: 4px;
  }

  @media (max-width: 480px) {
    font-size: 9px;
    gap: 3px;
  }

  .el-icon {
    font-size: 14px;
    color: #409eff;
    flex-shrink: 0;

    @media (max-width: 1400px) {
      font-size: 13px;
    }

    @media (max-width: 768px) {
      font-size: 12px;
    }

    @media (max-width: 480px) {
      font-size: 11px;
    }
  }
}

.header-cell.cell-index {
  justify-content: center;

  .el-icon {
    display: none;
  }
}

.header-text {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

// ========== ROW STYLES ==========
.table-body {
  min-width: max-content;
}

.partner-table-row {
  display: grid;
  grid-template-columns: 50px 1fr 1.2fr 1fr 1fr 0.9fr 0.9fr 0.9fr 0.8fr 0.8fr;
  align-items: center;
  padding: 12px 16px;
  background: #ffffff;
  border-bottom: 1px solid #e5e7eb;
  transition: all 0.2s ease;
  gap: 12px;
  min-width: max-content;

  &:hover {
    background: #f9fafb;
  }

  @media (max-width: 1600px) {
    grid-template-columns: 45px 0.9fr 1.1fr 0.9fr 0.9fr 0.8fr 0.8fr 0.8fr 0.7fr 0.7fr;
    gap: 10px;
  }

  @media (max-width: 1400px) {
    grid-template-columns: 40px 0.8fr 1fr 0.9fr 0.9fr 0.8fr 0.8fr 0.8fr 0.7fr 0.7fr;
    gap: 10px;
    padding: 10px 12px;
  }

  @media (max-width: 1200px) {
    grid-template-columns: 35px 120px 140px 110px 110px 100px 100px 100px 90px 80px;
    gap: 8px;
    padding: 10px 12px;
  }

  @media (max-width: 992px) {
    grid-template-columns: 35px 110px 130px 100px 100px 90px 90px 90px 80px 70px;
    gap: 8px;
    padding: 8px 12px;
  }

  @media (max-width: 768px) {
    grid-template-columns: 35px 100px 110px 90px 90px 80px 80px 80px 70px 60px;
    padding: 8px 12px;
    gap: 6px;
  }

  @media (max-width: 640px) {
    grid-template-columns: 30px 90px 100px 80px 80px 70px 70px 70px 60px 50px;
    padding: 8px 10px;
    gap: 6px;
  }

  @media (max-width: 480px) {
    grid-template-columns: 28px 75px 85px 70px 70px 60px 60px 60px 50px 45px;
    padding: 6px 10px;
    gap: 5px;
  }
}

.table-cell {
  display: flex;
  align-items: center;
  padding: 4px 0;
  min-width: 0;
}

.table-cell.cell-index {
  justify-content: center;
}

.index-number {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  background: #409eff;
  color: white;
  border-radius: 50%;
  font-weight: 600;
  font-size: 13px;

  @media (max-width: 1400px) {
    width: 24px;
    height: 24px;
    font-size: 12px;
  }

  @media (max-width: 768px) {
    width: 24px;
    height: 24px;
    font-size: 11px;
  }

  @media (max-width: 480px) {
    width: 22px;
    height: 22px;
    font-size: 10px;
  }
}

.cell-value {
  font-size: 13px;
  color: #1f2937;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;

  @media (max-width: 1400px) {
    font-size: 12px;
  }

  @media (max-width: 768px) {
    font-size: 12px;
  }

  @media (max-width: 480px) {
    font-size: 11px;
  }
}

// ========== EMPTY STATE ==========
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  text-align: center;

  @media (max-width: 768px) {
    padding: 40px 20px;
  }

  @media (max-width: 480px) {
    padding: 30px 15px;
  }
}

.empty-icon {
  font-size: 64px;
  color: #d1d5db;
  margin-bottom: 16px;

  @media (max-width: 768px) {
    font-size: 48px;
  }

  @media (max-width: 480px) {
    font-size: 40px;
    margin-bottom: 12px;
  }
}

.empty-text {
  font-size: 16px;
  color: #6b7280;
  margin: 0;

  @media (max-width: 768px) {
    font-size: 14px;
  }

  @media (max-width: 480px) {
    font-size: 13px;
  }
}
</style>
