<template>
  <div class="obyekt-container">
    <div class="page-header">
      <div class="header-content">
        <div class="header-text">
          <h1>{{ $t('yaqindaBorilganObyektlar') }}</h1>
          <p class="subtitle">{{ $t('barchaobyektlarmalumotlari') }}</p>
        </div>

        <!-- Date Count Info -->
        <div class="date-filters">
          <el-tag size="large" type="success" effect="plain">
            {{ $t('today') }}: {{ getTodayCount() }}
          </el-tag>
          <el-tag size="large" type="primary" effect="plain">
            {{ $t('thisWeek') }} : {{ getWeekCount() }}
          </el-tag>
          <el-tag size="large" type="warning" effect="plain">
            {{ $t('thisMonth') }}: {{ getMonthCount() }}
          </el-tag>
        </div>

        <el-button
          type="primary"
          size="large"
          class="add-btn"
          :icon="Plus"
          @click="goToCreateObyekt()"
        >
          {{ $t('yangiQoshish') }}
        </el-button>
      </div>
    </div>

    <div class="table-container" v-loading="loading">
      <div
        class="table-wrapper"
        v-if="
          Array.isArray(comeandgoesStore.allComeAndGoesofUser) &&
          comeandgoesStore.allComeAndGoesofUser.length > 0
        "
      >
        <table class="modern-table">
          <thead>
            <tr>
              <th class="table-index">#</th>
              <th>
                <div class="th-content">
                  <el-icon class="th-icon"><Location /></el-icon>
                  {{ $t('qayerga') }}
                </div>
              </th>
              <th>
                <div class="th-content">
                  <el-icon class="th-icon"><Clock /></el-icon>
                  {{ $t('ketilganvaqt') }}
                </div>
              </th>
              <th>
                <div class="th-content">
                  <el-icon class="th-icon"><Clock /></el-icon>
                  {{ $t('kelganvaqt') }}
                </div>
              </th>
              <th>
                <div class="th-content">
                  <el-icon class="th-icon"><Document /></el-icon>
                  {{ $t('shartnomaKp') }}
                </div>
              </th>
              <th>
                <div class="th-content">
                  <el-icon class="th-icon"><MapLocation /></el-icon>
                  {{ $t('joylashuv') }}
                </div>
              </th>
              <th>
                <div class="th-content">
                  <el-icon class="th-icon"><OfficeBuilding /></el-icon>
                  {{ $t('kompaniyaNomi') }}
                </div>
              </th>

              <th>
                <div class="th-content">
                  <el-icon class="th-icon"><Clock /></el-icon>
                  {{ $t('malumotkiritilganvaqt') }}
                </div>
              </th>
              <th class="table-actions">{{ $t('actions') }}</th>
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
                  {{ $t('viewDetails') }}
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
        <h3>{{ $t('noobjectfound') }}</h3>
        <p>{{ $t('youhaventbeenyet') }}</p>
        <el-button type="primary" :icon="Plus" @click="goToCreateObyekt()">
          {{ $t('firstobject') }}
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

// Date counting functions
const isToday = (date) => {
  const today = new Date()
  const itemDate = new Date(date)
  return (
    itemDate.getDate() === today.getDate() &&
    itemDate.getMonth() === today.getMonth() &&
    itemDate.getFullYear() === today.getFullYear()
  )
}

const isThisWeek = (date) => {
  const today = new Date()
  const itemDate = new Date(date)
  const weekStart = new Date(today)
  weekStart.setDate(today.getDate() - today.getDay()) // Start of week (Sunday)
  weekStart.setHours(0, 0, 0, 0)
  const weekEnd = new Date(weekStart)
  weekEnd.setDate(weekStart.getDate() + 6) // End of week (Saturday)
  weekEnd.setHours(23, 59, 59, 999)
  return itemDate >= weekStart && itemDate <= weekEnd
}

const isThisMonth = (date) => {
  const today = new Date()
  const itemDate = new Date(date)
  return itemDate.getMonth() === today.getMonth() && itemDate.getFullYear() === today.getFullYear()
}

const getTodayCount = () => {
  const data = Array.isArray(comeandgoesStore.allComeAndGoesofUser)
    ? comeandgoesStore.allComeAndGoesofUser
    : []
  return data.filter((item) => item.createdAt && isToday(item.createdAt)).length
}

const getWeekCount = () => {
  const data = Array.isArray(comeandgoesStore.allComeAndGoesofUser)
    ? comeandgoesStore.allComeAndGoesofUser
    : []
  return data.filter((item) => item.createdAt && isThisWeek(item.createdAt)).length
}

const getMonthCount = () => {
  const data = Array.isArray(comeandgoesStore.allComeAndGoesofUser)
    ? comeandgoesStore.allComeAndGoesofUser
    : []
  return data.filter((item) => item.createdAt && isThisMonth(item.createdAt)).length
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
  flex: 1;
  min-width: 250px;

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

.date-filters {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  flex-shrink: 0;

  .el-tag {
    font-size: 15px;
    font-weight: 600;
    padding: 10px 20px;
    border-radius: 8px;
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

@media (max-width: 992px) {
  .obyekt-container {
    padding: 20px;
  }

  .page-header {
    margin-bottom: 24px;
  }

  .header-content {
    gap: 20px;
  }

  .header-text {
    min-width: 200px;

    h1 {
      font-size: 26px;
    }

    .subtitle {
      font-size: 14px;
    }
  }

  .date-filters {
    gap: 10px;

    .el-tag {
      padding: 8px 16px;
      font-size: 14px;
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
    gap: 16px;
  }

  .header-text {
    min-width: auto;

    h1 {
      font-size: 24px;
    }

    .subtitle {
      font-size: 14px;
    }
  }

  .date-filters {
    gap: 8px;
    justify-content: center;
    order: 2;

    .el-tag {
      flex: 1;
      min-width: 0;
      padding: 8px 12px;
      font-size: 13px;
      text-align: center;
    }
  }

  .add-btn {
    width: 100%;
    order: 3;
  }

  .table-wrapper {
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
  }

  .modern-table {
    min-width: 900px;
  }
}

@media (max-width: 640px) {
  .obyekt-container {
    padding: 12px;
  }

  .page-header {
    margin-bottom: 16px;
  }

  .header-text {
    h1 {
      font-size: 20px;
      margin-bottom: 6px;
    }

    .subtitle {
      font-size: 12px;
    }
  }

  .date-filters {
    gap: 6px;

    .el-tag {
      padding: 6px 10px;
      font-size: 12px;
    }
  }
}

@media (max-width: 480px) {
  .obyekt-container {
    padding: 10px;
  }

  .page-header {
    margin-bottom: 14px;
  }

  .header-text h1 {
    font-size: 18px;
    margin-bottom: 4px;
  }

  .header-text .subtitle {
    font-size: 11px;
  }

  .date-filters {
    gap: 6px;

    .el-tag {
      flex: 1;
      padding: 8px 12px;
      font-size: 12px;
      text-align: center;
    }
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

@media (max-width: 360px) {
  .obyekt-container {
    padding: 8px;
  }

  .header-text h1 {
    font-size: 16px;
  }

  .header-text .subtitle {
    font-size: 10px;
  }

  .date-filters {
    .el-tag {
      font-size: 11px;
      padding: 6px 10px;
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
