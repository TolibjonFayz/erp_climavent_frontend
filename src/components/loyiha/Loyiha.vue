<template>
  <div class="loyiha-container" v-loading="loyihaStore.isLoading">
    <div class="page-header">
      <div class="header-main">
        <div class="header-content">
          <h1>{{ $t('loyihaPageTitle') }}</h1>
          <p class="subtitle">{{ $t('loyihaPageSubtitle') }}</p>
        </div>

        <div class="header-actions">
          <el-button size="large" :icon="Download" @click="exportExcel">
            {{ $t('loyihaExportExcel') }}
          </el-button>
          <el-button type="primary" size="large" :icon="Plus" @click="openCreateDialog">
            {{ $t('loyihaButtonAdd') }}
          </el-button>
        </div>
      </div>

      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-title">{{ $t('loyihaStatTotal') }}</div>
          <div class="stat-value">{{ loyihas.length }}</div>
        </div>
        <div class="stat-card">
          <div class="stat-title">{{ $t('loyihaStatArea') }}</div>
          <div class="stat-value">{{ formatNumber(totalArea) }} m²</div>
        </div>
        <div class="stat-card">
          <div class="stat-title">{{ $t('loyihaStatAvgDifficulty') }}</div>
          <div class="stat-value">{{ avgDifficulty ?? '—' }}</div>
        </div>
        <div class="stat-card">
          <div class="stat-title">{{ $t('loyihaStatFiles') }}</div>
          <div class="stat-value">{{ totalFiles }}</div>
        </div>
      </div>
    </div>

    <div v-if="loyihaStore.error" class="error-banner">{{ loyihaStore.error }}</div>

    <div class="toolbar" v-if="loyihas.length">
      <span class="toolbar-count">
        {{ $t('loyihaFilteredCount', { count: filteredLoyihas.length }) }}
      </span>
      <span class="toolbar-hint">{{ $t('loyihaRowClickHint') }}</span>
      <button class="toolbar-reset-btn" @click="resetFilters">
        {{ $t('loyihaResetFilters') }}
      </button>
    </div>

    <div class="table-container" v-if="loyihas.length">
      <div class="table-wrapper">
        <table class="modern-table">
          <thead>
            <tr>
              <th class="table-index">#</th>
              <th>{{ $t('loyihaTableNumber') }}</th>
              <th>{{ $t('loyihaTableManager') }}</th>
              <th>{{ $t('loyihaTableOther') }}</th>
              <th>{{ $t('loyihaTableSystem') }}</th>
              <th>{{ $t('loyihaTableArea') }}</th>
              <th>{{ $t('loyihaTableDifficulty') }}</th>
              <th>{{ $t('loyihaTableContact') }}</th>
              <th>{{ $t('loyihaTableComment') }}</th>
              <th>{{ $t('loyihaTableFiles') }}</th>
              <th>{{ $t('actions') }}</th>
            </tr>
            <tr class="filter-row">
              <th></th>
              <th><input v-model="filters.number" class="col-filter" :placeholder="$t('loyihaFilterPlaceholder')" /></th>
              <th><input v-model="filters.manager" class="col-filter" :placeholder="$t('loyihaFilterPlaceholder')" /></th>
              <th><input v-model="filters.other" class="col-filter" :placeholder="$t('loyihaFilterPlaceholder')" /></th>
              <th><input v-model="filters.system" class="col-filter" :placeholder="$t('loyihaFilterPlaceholder')" /></th>
              <th><input v-model="filters.area" class="col-filter" :placeholder="$t('loyihaFilterPlaceholder')" /></th>
              <th>
                <select v-model="filters.difficulty" class="col-filter">
                  <option value="">{{ $t('loyihaAllDifficulties') }}</option>
                  <option v-for="n in 10" :key="n" :value="String(n)">{{ n }}</option>
                </select>
              </th>
              <th><input v-model="filters.contact" class="col-filter" :placeholder="$t('loyihaFilterPlaceholder')" /></th>
              <th class="comment-filter-col">
                <input v-model="filters.comment" class="col-filter" :placeholder="$t('loyihaFilterPlaceholder')" />
              </th>
              <th></th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="(row, index) in pagedLoyihas"
              :key="row.id"
              class="clickable-row"
              @click="openDetail(row)"
            >
              <td class="table-index">
                <span class="index-badge">{{ (currentPage - 1) * pageSize + index + 1 }}</span>
              </td>
              <td><span class="cell-text bold">{{ row.order_number ?? '—' }}</span></td>
              <td><span class="cell-text">{{ row.manager_name || '—' }}</span></td>
              <td><span class="cell-text">{{ row.other_source || '—' }}</span></td>
              <td class="wrap-cell"><span class="cell-text">{{ row.system_info || '—' }}</span></td>
              <td><span class="cell-text">{{ row.area != null ? formatNumber(row.area) + ' m²' : '—' }}</span></td>
              <td>
                <span v-if="row.difficulty" class="difficulty-badge" :class="difficultyClass(row.difficulty)">
                  {{ row.difficulty }}/10
                </span>
                <span v-else class="cell-text">—</span>
              </td>
              <td class="wrap-cell">
                <div class="contact-lines">
                  <span v-if="row.contact_phone">📞 {{ row.contact_phone }}</span>
                  <span v-if="row.contact_email">✉️ {{ row.contact_email }}</span>
                  <span v-if="row.contact_address">📍 {{ row.contact_address }}</span>
                  <span v-if="!row.contact_phone && !row.contact_email && !row.contact_address">—</span>
                </div>
              </td>
              <td class="wrap-cell comment-cell"><span class="cell-text">{{ row.comment || '—' }}</span></td>
              <td>
                <div class="file-counts">
                  <span class="file-chip archive" :title="$t('loyihaArchiveSection')">
                    🔒 {{ fileCount(row, 'archive') }}
                  </span>
                  <span class="file-chip working" :title="$t('loyihaWorkingSection')">
                    📁 {{ fileCount(row, 'working') }}
                  </span>
                </div>
              </td>
              <!-- Qatorga bosilganda detail ochiladi, tugmalar esa o'z ishini qiladi -->
              <td class="actions-cell" @click.stop>
                <div class="actions-row">
                  <el-tooltip :content="$t('loyihaOpenDetail')" placement="top">
                    <el-button circle size="small" :icon="View" @click="openDetail(row)" />
                  </el-tooltip>
                  <el-tooltip :content="$t('edit')" placement="top">
                    <el-button circle size="small" :icon="EditPen" @click="openEditDialog(row)" />
                  </el-tooltip>
                  <el-popconfirm
                    :title="$t('loyihaDeleteConfirm')"
                    width="270"
                    placement="top-end"
                    :confirm-button-text="$t('deleteConfirm')"
                    :cancel-button-text="$t('cancel')"
                    @confirm="handleDelete(row.id)"
                  >
                    <template #reference>
                      <el-button circle size="small" type="danger" plain :icon="Delete" />
                    </template>
                  </el-popconfirm>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="pagination-bar" v-if="filteredLoyihas.length > pageSize">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :page-sizes="[20, 50, 100]"
          :total="filteredLoyihas.length"
          layout="total, sizes, prev, pager, next"
          background
        />
      </div>
    </div>

    <div v-else class="empty-state">
      <div class="empty-card">
        <h3 class="empty-title">{{ $t('loyihaEmptyTitle') }}</h3>
        <p class="empty-description">{{ $t('loyihaEmptyDescription') }}</p>
        <el-button type="primary" :icon="Plus" @click="openCreateDialog">
          {{ $t('loyihaButtonAdd') }}
        </el-button>
      </div>
    </div>

    <LoyihaFormDialog v-model="dialogVisible" :model-value-data="editing" @saved="refresh" />
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import * as XLSX from 'xlsx'
import { ElMessage } from 'element-plus'
import { Plus, EditPen, Delete, Download, View } from '@element-plus/icons-vue'
import { useLoyihaStore } from '@/stores/loyiha'
import { useUsersStore } from '@/stores/user'
import LoyihaFormDialog from './LoyihaFormDialog.vue'
import { formatNumber, difficultyClass } from '@/utils/loyihaFormat'

const { t } = useI18n()
const router = useRouter()
const loyihaStore = useLoyihaStore()
const usersStore = useUsersStore()

const loyihas = computed(() => loyihaStore.allLoyihas || [])
const currentUserId = Number(localStorage.getItem('userid'))

// ─── Filtrlar ───
const filters = reactive({
  number: '',
  manager: '',
  other: '',
  system: '',
  area: '',
  difficulty: '',
  contact: '',
  comment: '',
})

const currentPage = ref(1)
const pageSize = ref(20)

const textMatch = (value, filter) =>
  !filter.trim() || String(value ?? '').toLowerCase().includes(filter.trim().toLowerCase())

const contactText = (row) =>
  [row.contact_phone, row.contact_email, row.contact_address].filter(Boolean).join(' ')

const filteredLoyihas = computed(() =>
  loyihas.value.filter(
    (row) =>
      textMatch(row.order_number, filters.number) &&
      textMatch(row.manager_name, filters.manager) &&
      textMatch(row.other_source, filters.other) &&
      textMatch(row.system_info, filters.system) &&
      textMatch(row.area, filters.area) &&
      (!filters.difficulty || String(row.difficulty) === filters.difficulty) &&
      textMatch(contactText(row), filters.contact) &&
      textMatch(row.comment, filters.comment),
  ),
)

const pagedLoyihas = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  return filteredLoyihas.value.slice(start, start + pageSize.value)
})

watch(
  () => ({ ...filters }),
  () => {
    currentPage.value = 1
  },
)

const resetFilters = () => {
  Object.keys(filters).forEach((key) => {
    filters[key] = ''
  })
}

// ─── Statistika ───
const totalArea = computed(() =>
  loyihas.value.reduce((acc, row) => acc + (Number(row.area) || 0), 0),
)
const avgDifficulty = computed(() => {
  const rated = loyihas.value.filter((row) => row.difficulty)
  if (!rated.length) return null
  const sum = rated.reduce((acc, row) => acc + Number(row.difficulty), 0)
  return (sum / rated.length).toFixed(1)
})
const totalFiles = computed(() =>
  loyihas.value.reduce((acc, row) => acc + (row.files?.length || 0), 0),
)

const fileCount = (row, section) =>
  (row.files || []).filter((f) => f.section === section).length

// ─── Amallar ───
const dialogVisible = ref(false)
const editing = ref(null)

const openDetail = (row) => router.push(`/loyiha/${row.id}`)

const openCreateDialog = () => {
  editing.value = null
  dialogVisible.value = true
}

const openEditDialog = (row) => {
  editing.value = row
  dialogVisible.value = true
}

const refresh = () => loyihaStore.getAllLoyihas()

const handleDelete = async (id) => {
  try {
    await loyihaStore.deleteLoyiha(id)
    ElMessage.success(t('loyihaMessageDeleted'))
    await refresh()
  } catch (error) {
    ElMessage.error(error?.response?.data?.message || t('loyihaMessageDeleteError'))
  }
}

// ─── Excel eksport ───
const exportExcel = () => {
  const list = filteredLoyihas.value
  if (!list.length) {
    ElMessage.warning(t('loyihaNoDataToExport'))
    return
  }
  const rows = list.map((row, index) => ({
    '№': index + 1,
    [t('loyihaTableNumber')]: row.order_number ?? '—',
    [t('loyihaTableManager')]: row.manager_name || '—',
    [t('loyihaTableOther')]: row.other_source || '—',
    [t('loyihaTableSystem')]: row.system_info || '—',
    [t('loyihaTableArea')]: row.area ?? '—',
    [t('loyihaTableDifficulty')]: row.difficulty ?? '—',
    [t('loyihaPhoneLabel')]: row.contact_phone || '—',
    [t('loyihaEmailLabel')]: row.contact_email || '—',
    [t('loyihaAddressLabel')]: row.contact_address || '—',
    [t('loyihaTableComment')]: row.comment || '—',
    [t('loyihaArchiveSection')]: fileCount(row, 'archive'),
    [t('loyihaWorkingSection')]: fileCount(row, 'working'),
  }))
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(rows), 'Loyihalar')
  const stamp = new Date().toLocaleDateString('uz-UZ').replace(/\//g, '-')
  XLSX.writeFile(wb, `Loyihalar_${stamp}.xlsx`)
  ElMessage.success(t('loyihaExportDone'))
}

onMounted(async () => {
  try {
    if (!usersStore.currentUser) await usersStore.getUserInfo(currentUserId)
    await Promise.all([loyihaStore.getAllLoyihas(), loyihaStore.checkStorage()])
  } catch {
    ElMessage.error(t('loyihaMessageLoadError'))
  }
})
</script>

<style lang="scss" scoped>
.loyiha-container {
  width: 100%;
  padding: 32px;
  background: #f5f7fa;
  min-height: 100vh;
  overflow-x: hidden;
  box-sizing: border-box;
}

.page-header {
  margin-bottom: 26px;
  padding: 24px 28px;
  background: #ffffff;
  border-radius: 24px;
  box-shadow: 0 18px 48px rgba(15, 23, 42, 0.08);
}

.header-main {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  flex-wrap: wrap;
}

.header-content {
  min-width: 250px;

  h1 {
    font-size: 34px;
    font-weight: 700;
    color: #111827;
    margin: 0 0 6px 0;
    letter-spacing: -0.03em;
  }

  .subtitle {
    font-size: 15px;
    color: #6b7280;
    margin: 0;
    max-width: 620px;
    line-height: 1.7;
  }
}

.header-actions {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  gap: 16px;
  margin-top: 24px;
}

.stat-card {
  padding: 18px 20px;
  border-radius: 18px;
  background: #ffffff;
  border: 1px solid #e5e7eb;
  box-shadow: 0 10px 24px rgba(15, 23, 42, 0.04);
}

.stat-title {
  font-size: 13px;
  font-weight: 600;
  color: #6b7280;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  margin-bottom: 10px;
}

.stat-value {
  font-size: 26px;
  font-weight: 700;
  color: #111827;
}

.error-banner {
  margin-bottom: 16px;
  padding: 12px 16px;
  border-radius: 10px;
  background: #fef2f2;
  color: #b91c1c;
  border: 1px solid #fecaca;
}

.toolbar {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
  margin-bottom: 18px;
}

.toolbar-count {
  font-size: 13px;
  color: #6b7280;
}

.toolbar-hint {
  font-size: 12.5px;
  color: #9ca3af;
}

.toolbar-reset-btn {
  margin-left: auto;
  background: #f3f4f6;
  border: 1px solid #e5e7eb;
  color: #4b5563;
  font-size: 13px;
  padding: 6px 14px;
  border-radius: 8px;
  cursor: pointer;

  &:hover {
    background: #e5e7eb;
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
}

.modern-table {
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;

  thead {
    background: linear-gradient(to bottom, #f9fafb 0%, #f3f4f6 100%);
  }

  th {
    padding: 16px 18px;
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
  }

  tbody tr {
    border-bottom: 1px solid #f3f4f6;

    &:hover {
      background: #f9fafb;
    }

    &.clickable-row {
      cursor: pointer;
    }
  }

  td {
    padding: 14px 18px;
    color: #4b5563;
    font-size: 14px;
    vertical-align: top;

    &.table-index {
      text-align: center;
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
  }

  .cell-text {
    color: #374151;

    &.bold {
      font-weight: 600;
      color: #1f2937;
    }
  }
}

.wrap-cell {
  min-width: 180px;
  max-width: 320px;
  white-space: normal;
  word-break: break-word;
  line-height: 1.6;
}

.comment-cell {
  max-width: 360px;
}

.contact-lines {
  display: flex;
  flex-direction: column;
  gap: 3px;
  font-size: 13px;
}

.filter-row th {
  padding: 6px 8px;
  background: #f9fafb;
  border-bottom: 2px solid #e5e7eb;
}

.col-filter {
  width: 100%;
  box-sizing: border-box;
  padding: 6px 8px;
  font-size: 12px;
  font-weight: 400;
  text-transform: none;
  letter-spacing: normal;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  background: white;
  color: #374151;

  &:focus {
    outline: none;
    border-color: #409eff;
  }
}

.comment-filter-col {
  min-width: 180px;
}

.difficulty-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 52px;
  padding: 4px 10px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 700;
  color: #fff;
  white-space: nowrap;

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

.file-counts {
  display: flex;
  gap: 6px;
}

.file-chip {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  padding: 3px 9px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 600;

  &.archive {
    background: #fef3c7;
    color: #b45309;
  }

  &.working {
    background: #e0efff;
    color: #2563eb;
  }
}

.actions-cell {
  white-space: nowrap;
}

.actions-row {
  display: flex;
  gap: 6px;
  align-items: center;
}

.pagination-bar {
  display: flex;
  justify-content: flex-end;
  padding: 18px 20px;
  border-top: 1px solid #f3f4f6;
}

.empty-state {
  padding: 60px 24px;
  display: flex;
  justify-content: center;
}

.empty-card {
  padding: 44px 36px;
  border-radius: 20px;
  background: #ffffff;
  border: 1px solid #e5e7eb;
  text-align: center;
}

.empty-title {
  margin: 0 0 12px;
  font-size: 22px;
  color: #111827;
}

.empty-description {
  margin: 0 0 22px;
  color: #6b7280;
  font-size: 14px;
}

@media (max-width: 768px) {
  .loyiha-container {
    padding: 18px 12px;
  }
}
</style>
