<template>
  <div class="obyekt-container">
    <div class="page-header">
      <div class="header-content">
        <div class="header-text">
          <h1>Yaqinda borilgan obyektlar</h1>
          <p class="subtitle">Barcha obyektlar va tashrif ma'lumotlari</p>
        </div>
        <el-button
          type="primary"
          size="large"
          class="add-btn"
          :icon="Plus"
          @click="goToCreateObyekt()"
        >
          Yangi qo'shish
        </el-button>
      </div>
    </div>

    <div class="table-container" v-loading="loading">
      <div class="table-wrapper" v-if="comeandgoesStore.allComeAndGoesofUser.length > 0">
        <table class="modern-table">
          <thead>
            <tr>
              <th class="table-index">#</th>
              <th>
                <div class="th-content">
                  <el-icon class="th-icon"><Location /></el-icon>
                  Qayerga
                </div>
              </th>
              <th>
                <div class="th-content">
                  <el-icon class="th-icon"><Clock /></el-icon>
                  Ketilgan <br />
                  vaqt
                </div>
              </th>
              <th>
                <div class="th-content">
                  <el-icon class="th-icon"><Clock /></el-icon>
                  Qaytilgan <br />
                  vaqt
                </div>
              </th>
              <th>
                <div class="th-content">
                  <el-icon class="th-icon"><Document /></el-icon>
                  Dogovor <br />
                  yoki KP
                </div>
              </th>
              <th>
                <div class="th-content">
                  <el-icon class="th-icon"><MapLocation /></el-icon>
                  Joylashuv
                </div>
              </th>
              <th>
                <div class="th-content">
                  <el-icon class="th-icon"><OfficeBuilding /></el-icon>
                  Firma nomi
                </div>
              </th>

              <th>
                <div class="th-content">
                  <el-icon class="th-icon"><Clock /></el-icon>
                  Ma'lumot <br />
                  kiritilgan vaqt
                </div>
              </th>
              <th class="table-actions">Amallar</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="(item, index) in comeandgoesStore.allComeAndGoesofUser"
              :key="index"
              class="table-row"
            >
              <td class="table-index">
                <span class="index-badge">
                  {{ index + 1 }}
                </span>
              </td>
              <td>
                <div class="cell-content">
                  <span class="cell-text bold">{{ item.comeAndGoInsides[0].whereto }}</span>
                </div>
              </td>
              <td>
                <div class="cell-content">
                  <span class="cell-text">{{
                    formatDate(item.comeAndGoInsides[0].when_gone)
                  }}</span>
                </div>
              </td>
              <td>
                <div class="cell-content">
                  <span class="cell-text">{{
                    formatDate(item.comeAndGoInsides[0].when_came)
                  }}</span>
                </div>
              </td>
              <td>
                <div class="cell-content">
                  <el-tag type="info" size="small">{{
                    item.comeAndGoInsides[0].dogovor_or_kp
                  }}</el-tag>
                </div>
              </td>
              <td>
                <div class="cell-content">
                  <span class="cell-text">{{ item.comeAndGoInsides[0].locationname }}</span>
                </div>
              </td>
              <td>
                <div class="cell-content">
                  <span class="cell-text company">{{ item.comeAndGoInsides[0].company_name }}</span>
                </div>
              </td>
              <td>
                <div class="cell-content">
                  <span class="cell-text company">{{
                    formatDate(item.comeAndGoInsides[0].createdAt)
                  }}</span>
                </div>
              </td>
              <td class="table-actions">
                <el-button
                  type="primary"
                  link
                  size="small"
                  @click="router.push({ name: 'single-obyekt', params: { id: item.id } })"
                >
                  Ko'proq
                  <el-icon class="ml-1"><ArrowRight /></el-icon>
                </el-button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div v-else class="empty-state">
        <div class="empty-icon">
          <el-icon :size="64"><FolderOpened /></el-icon>
        </div>
        <h3>Hech qanday obyekt topilmadi</h3>
        <p>Siz hali hech qayerga bormagan ekansiz. Yangi obyekt qo'shing!</p>
        <el-button type="primary" :icon="Plus" @click="goToCreateObyekt()">
          Birinchi obyektni qo'shish
        </el-button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { formatDate } from '@/composables/useDateFormatter'
import { useComeAndGoesStore } from '@/stores/comeandgoes'
import {
  Plus,
  Clock,
  Location,
  Document,
  MapLocation,
  OfficeBuilding,
  ArrowRight,
  FolderOpened,
} from '@element-plus/icons-vue'
import { onMounted, ref, computed } from 'vue'
import router from '@/router'

const comeandgoesStore = useComeAndGoesStore()
const loading = ref(false)

const goToCreateObyekt = () => {
  router.push({ name: 'create-obyekt' })
}

const handleEdit = (index, row) => {
  router.push({ name: 'single-obyekt', params: { id: row.id } })
}

onMounted(async () => {
  loading.value = true
  const userId = localStorage.getItem('userid')
  await comeandgoesStore.getComeAndGoesOfUser(Number(userId))
  loading.value = false
})
</script>

<style lang="scss" scoped>
.obyekt-container {
  width: 100%;
  padding: 32px;
  background: #f5f7fa;
  min-height: 100vh;
  overflow-x: hidden;
  box-sizing: border-box;
}

.page-header {
  margin-bottom: 32px;
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 24px;
  flex-wrap: wrap;
}

.header-text {
  h1 {
    font-size: 32px;
    font-weight: 700;
    color: #1f2937;
    margin: 0 0 8px 0;
    word-break: break-word;
  }

  .subtitle {
    font-size: 15px;
    color: #6b7280;
    margin: 0;
    word-break: break-word;
  }
}

.add-btn {
  padding: 12px 24px;
  font-weight: 600;
  box-shadow: 0 2px 8px rgba(64, 158, 255, 0.3);
  flex-shrink: 0;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(64, 158, 255, 0.4);
  }
}

.table-container {
  background: white;
  border-radius: 16px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  width: 100%;
}

.table-wrapper {
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
}

.modern-table {
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
  font-family:
    -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;

  thead {
    background: linear-gradient(to bottom, #f9fafb 0%, #f3f4f6 100%);
    position: sticky;
    top: 0;
    z-index: 10;
  }

  th {
    padding: 18px 20px;
    text-align: left;
    font-weight: 600;
    color: #374151;
    font-size: 13px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    border-bottom: 2px solid #e5e7eb;
    white-space: nowrap;

    &.table-index {
      width: 60px;
      text-align: center;
    }

    &.table-actions {
      width: 120px;
      text-align: right;
    }
  }

  .th-content {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .th-icon {
    color: #409eff;
    font-size: 16px;
  }

  tbody {
    tr {
      transition: all 0.2s ease;
      border-bottom: 1px solid #f3f4f6;

      &:hover {
        background: #f9fafb;
        transform: scale(1.001);
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
      }

      &:last-child {
        border-bottom: none;
      }
    }
  }

  td {
    padding: 16px 20px;
    color: #4b5563;
    font-size: 14px;
    vertical-align: middle;

    &.table-index {
      text-align: center;
    }

    &.table-actions {
      text-align: right;
    }
  }

  .index-badge {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    background: linear-gradient(135deg, #409eff 0%, #3a8ee6 100%);
    color: white;
    border-radius: 8px;
    font-weight: 600;
    font-size: 13px;
    box-shadow: 0 2px 4px rgba(64, 158, 255, 0.3);
  }

  .cell-content {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .cell-text {
    color: #374151;

    &.bold {
      font-weight: 600;
      color: #1f2937;
    }

    &.company {
      color: #409eff;
      font-weight: 500;
    }
  }
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80px 40px;
  text-align: center;

  .empty-icon {
    margin-bottom: 24px;
    color: #d1d5db;
  }

  h3 {
    font-size: 20px;
    font-weight: 600;
    color: #1f2937;
    margin: 0 0 12px 0;
  }

  p {
    font-size: 15px;
    color: #6b7280;
    margin: 0 0 24px 0;
    max-width: 400px;
  }
}

.ml-1 {
  margin-left: 4px;
}

/* Responsive Design */
@media (max-width: 1200px) {
  .obyekt-container {
    padding: 24px;
  }

  .modern-table {
    th,
    td {
      padding: 14px 16px;
      font-size: 13px;
    }
  }
}

@media (max-width: 768px) {
  .obyekt-container {
    padding: 16px;
  }

  .header-content {
    flex-direction: column;
    align-items: stretch;
  }

  .header-text {
    h1 {
      font-size: 24px;
    }

    .subtitle {
      font-size: 14px;
    }
  }

  .add-btn {
    width: 100%;
  }

  .table-wrapper {
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
  }

  .modern-table {
    min-width: 900px;
  }
}

@media (max-width: 480px) {
  .obyekt-container {
    padding: 12px;
  }

  .page-header {
    margin-bottom: 20px;
  }

  .header-text h1 {
    font-size: 20px;
  }

  .empty-state {
    padding: 60px 20px;

    h3 {
      font-size: 18px;
    }

    p {
      font-size: 14px;
    }
  }
}

// Scrollbar styling
.table-wrapper::-webkit-scrollbar {
  height: 8px;
}

.table-wrapper::-webkit-scrollbar-track {
  background: #f3f4f6;
  border-radius: 4px;
}

.table-wrapper::-webkit-scrollbar-thumb {
  background: #d1d5db;
  border-radius: 4px;

  &:hover {
    background: #9ca3af;
  }
}
</style>
