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

    <el-alert
      v-if="!loyihaStore.storageReady"
      class="storage-warning"
      type="warning"
      :closable="false"
      show-icon
      :title="$t('loyihaStorageNotReady')"
    />

    <div v-if="loyihaStore.error" class="error-banner">{{ loyihaStore.error }}</div>

    <div class="toolbar" v-if="loyihas.length">
      <span class="toolbar-count">
        {{ $t('loyihaFilteredCount', { count: filteredLoyihas.length }) }}
      </span>
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
            <tr v-for="(row, index) in pagedLoyihas" :key="row.id">
              <td class="table-index">
                <span class="index-badge">{{ (currentPage - 1) * pageSize + index + 1 }}</span>
              </td>
              <td><span class="cell-text bold">{{ row.order_number ?? '—' }}</span></td>
              <td><span class="cell-text">{{ managerName(row) }}</span></td>
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
              <td class="actions-cell">
                <div class="actions-row">
                  <el-button text size="small" :icon="Folder" @click="openFilesDialog(row)">
                    {{ $t('loyihaFilesButton') }}
                  </el-button>
                  <el-button text size="small" :icon="Edit" @click="openEditDialog(row)">
                    {{ $t('edit') }}
                  </el-button>
                  <el-popconfirm
                    :title="$t('loyihaDeleteConfirm')"
                    width="260"
                    placement="top"
                    :confirm-button-text="t('deleteConfirm')"
                    :cancel-button-text="t('cancel')"
                    @confirm="handleDelete(row.id)"
                  >
                    <template #reference>
                      <el-button text size="small" type="danger" :icon="Delete">
                        {{ $t('delete') }}
                      </el-button>
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

    <!-- Qo'shish / tahrirlash -->
    <el-dialog
      v-model="dialogVisible"
      :title="editing ? $t('edit') : $t('loyihaDialogTitle')"
      width="820px"
      class="loyiha-dialog"
      destroy-on-close
    >
      <el-form ref="formRef" :model="form" :rules="formRules" label-position="top">
        <el-row :gutter="18">
          <el-col :span="8">
            <el-form-item :label="$t('loyihaNumberLabel')" prop="order_number">
              <el-input-number v-model="form.order_number" :min="1" :controls="false" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item :label="$t('loyihaManagerLabel')" prop="manager_id">
              <el-select
                v-model="form.manager_id"
                :placeholder="$t('loyihaManagerPlaceholder')"
                filterable
                clearable
                style="width: 100%"
              >
                <el-option
                  v-for="u in employees"
                  :key="u.id"
                  :label="`${u.firstname} ${u.lastname || ''}`.trim()"
                  :value="u.id"
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item :label="$t('loyihaOtherLabel')" prop="other_source">
              <el-input v-model="form.other_source" :placeholder="$t('loyihaOtherPlaceholder')" maxlength="200" />
            </el-form-item>
          </el-col>

          <el-col :span="8">
            <el-form-item :label="$t('loyihaSystemLabel')" prop="system_info">
              <el-input v-model="form.system_info" :placeholder="$t('loyihaSystemPlaceholder')" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item :label="$t('loyihaAreaLabel')" prop="area">
              <el-input-number v-model="form.area" :min="0" :precision="2" :controls="false" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item :label="$t('loyihaDifficultyLabel')" prop="difficulty">
              <div class="difficulty-picker">
                <el-slider v-model="form.difficulty" :min="1" :max="10" :step="1" show-stops />
                <span class="difficulty-badge" :class="difficultyClass(form.difficulty)">
                  {{ form.difficulty }}/10
                </span>
              </div>
            </el-form-item>
          </el-col>

          <el-col :span="8">
            <el-form-item :label="$t('loyihaPhoneLabel')" prop="contact_phone">
              <el-input v-model="form.contact_phone" maxlength="60" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item :label="$t('loyihaEmailLabel')" prop="contact_email">
              <el-input v-model="form.contact_email" maxlength="120" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item :label="$t('loyihaAddressLabel')" prop="contact_address">
              <el-input v-model="form.contact_address" maxlength="300" />
            </el-form-item>
          </el-col>

          <el-col :span="24">
            <el-form-item :label="$t('loyihaCommentLabel')" prop="comment">
              <el-input
                v-model="form.comment"
                type="textarea"
                :rows="4"
                maxlength="2000"
                show-word-limit
                :placeholder="$t('loyihaCommentPlaceholder')"
              />
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>

      <template #footer>
        <el-button @click="dialogVisible = false">{{ $t('cancel') }}</el-button>
        <el-button type="primary" :loading="loyihaStore.isLoading" @click="handleSubmit">
          {{ $t('save') }}
        </el-button>
      </template>
    </el-dialog>

    <!-- Fayllar -->
    <el-dialog
      v-model="filesDialogVisible"
      :title="filesTitle"
      width="880px"
      class="files-dialog"
      destroy-on-close
    >
      <div class="files-grid">
        <!-- 1-bo'lim: arxiv, o'zgarmas -->
        <section class="file-section archive-section">
          <header class="file-section-head">
            <div>
              <h4>🔒 {{ $t('loyihaArchiveSection') }}</h4>
              <p class="file-section-hint">{{ $t('loyihaArchiveHint') }}</p>
            </div>
            <el-upload
              :show-file-list="false"
              :before-upload="(file) => handleUpload(file, 'archive')"
              :disabled="!loyihaStore.storageReady"
            >
              <el-button
                type="primary"
                size="small"
                :icon="Upload"
                :loading="uploading === 'archive'"
                :disabled="!loyihaStore.storageReady"
              >
                {{ $t('loyihaUpload') }}
              </el-button>
            </el-upload>
          </header>

          <ul class="file-list">
            <li v-for="file in sectionFiles('archive')" :key="file.id" class="file-item">
              <div class="file-main">
                <span class="file-name" :title="file.file_name">{{ file.file_name }}</span>
                <span class="file-meta">
                  {{ formatDateTime(file.createdAt) }} · {{ formatSize(file.size_bytes) }}
                  <template v-if="file.uploader">· {{ file.uploader.firstname }}</template>
                </span>
              </div>
              <div class="file-actions">
                <el-button text size="small" :icon="Download" @click="downloadFile(file)">
                  {{ $t('loyihaDownload') }}
                </el-button>
                <span class="locked-hint" :title="$t('loyihaArchiveLocked')">🔒</span>
              </div>
            </li>
            <li v-if="!sectionFiles('archive').length" class="file-empty">
              {{ $t('loyihaNoFiles') }}
            </li>
          </ul>
        </section>

        <!-- 2-bo'lim: ishchi fayllar, to'liq boshqariladi -->
        <section class="file-section">
          <header class="file-section-head">
            <div>
              <h4>📁 {{ $t('loyihaWorkingSection') }}</h4>
              <p class="file-section-hint">{{ $t('loyihaWorkingHint') }}</p>
            </div>
            <el-upload
              :show-file-list="false"
              :before-upload="(file) => handleUpload(file, 'working')"
              :disabled="!loyihaStore.storageReady"
            >
              <el-button
                type="primary"
                size="small"
                :icon="Upload"
                :loading="uploading === 'working'"
                :disabled="!loyihaStore.storageReady"
              >
                {{ $t('loyihaUpload') }}
              </el-button>
            </el-upload>
          </header>

          <ul class="file-list">
            <li v-for="file in sectionFiles('working')" :key="file.id" class="file-item">
              <div class="file-main">
                <template v-if="renamingId === file.id">
                  <el-input
                    v-model="renameValue"
                    size="small"
                    @keyup.enter="saveRename(file)"
                    :placeholder="$t('loyihaFileName')"
                  />
                </template>
                <template v-else>
                  <span class="file-name" :title="file.file_name">{{ file.file_name }}</span>
                  <span class="file-meta">
                    {{ formatDateTime(file.createdAt) }} · {{ formatSize(file.size_bytes) }}
                    <template v-if="file.title">· {{ file.title }}</template>
                  </span>
                </template>
              </div>
              <div class="file-actions">
                <template v-if="renamingId === file.id">
                  <el-button text size="small" type="primary" @click="saveRename(file)">
                    {{ $t('save') }}
                  </el-button>
                  <el-button text size="small" @click="renamingId = null">{{ $t('cancel') }}</el-button>
                </template>
                <template v-else>
                  <el-button text size="small" :icon="Download" @click="downloadFile(file)" />
                  <el-button text size="small" :icon="Edit" @click="startRename(file)" />
                  <el-popconfirm
                    :title="$t('loyihaFileDeleteConfirm')"
                    width="240"
                    :confirm-button-text="t('deleteConfirm')"
                    :cancel-button-text="t('cancel')"
                    @confirm="handleFileDelete(file)"
                  >
                    <template #reference>
                      <el-button text size="small" type="danger" :icon="Delete" />
                    </template>
                  </el-popconfirm>
                </template>
              </div>
            </li>
            <li v-if="!sectionFiles('working').length" class="file-empty">
              {{ $t('loyihaNoFiles') }}
            </li>
          </ul>
        </section>
      </div>

      <template #footer>
        <el-button @click="filesDialogVisible = false">{{ $t('cancel') }}</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import * as XLSX from 'xlsx'
import { ElMessage } from 'element-plus'
import { Plus, Edit, Delete, Upload, Download, Folder } from '@element-plus/icons-vue'
import { useLoyihaStore } from '@/stores/loyiha'
import { useUsersStore } from '@/stores/user'

const { t } = useI18n()
const loyihaStore = useLoyihaStore()
const usersStore = useUsersStore()

const loyihas = computed(() => loyihaStore.allLoyihas || [])
const employees = computed(() => usersStore.allUsers || [])
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

const managerName = (row) =>
  row.manager ? `${row.manager.firstname} ${row.manager.lastname || ''}`.trim() : '—'

const contactText = (row) =>
  [row.contact_phone, row.contact_email, row.contact_address].filter(Boolean).join(' ')

const filteredLoyihas = computed(() =>
  loyihas.value.filter(
    (row) =>
      textMatch(row.order_number, filters.number) &&
      textMatch(managerName(row), filters.manager) &&
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

// ─── Formatlash ───
const formatNumber = (value) =>
  new Intl.NumberFormat('uz-UZ', { maximumFractionDigits: 2 }).format(Number(value) || 0)

const formatDateTime = (value) => {
  if (!value) return '—'
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return '—'
  return `${d.toLocaleDateString('uz-UZ')} ${String(d.getHours()).padStart(2, '0')}:${String(
    d.getMinutes(),
  ).padStart(2, '0')}`
}

const formatSize = (bytes) => {
  const n = Number(bytes) || 0
  if (n >= 1024 * 1024) return (n / 1024 / 1024).toFixed(1) + ' MB'
  if (n >= 1024) return Math.round(n / 1024) + ' KB'
  return n + ' B'
}

const difficultyClass = (value) => {
  const n = Number(value) || 0
  if (n >= 8) return 'diff-high'
  if (n >= 4) return 'diff-mid'
  return 'diff-low'
}

// ─── Forma ───
const dialogVisible = ref(false)
const editing = ref(null)
const formRef = ref(null)

const initialForm = () => ({
  order_number: null,
  manager_id: null,
  other_source: '',
  system_info: '',
  area: null,
  difficulty: 5,
  contact_phone: '',
  contact_email: '',
  contact_address: '',
  comment: '',
})

const form = reactive(initialForm())

const formRules = {
  contact_email: [
    { type: 'email', message: () => t('loyihaValidationEmail'), trigger: 'blur' },
  ],
}

const openCreateDialog = async () => {
  editing.value = null
  Object.assign(form, initialForm())
  try {
    form.order_number = await loyihaStore.nextNumber()
  } catch {
    // raqamni taklif qilib bo'lmasa ham forma ochilaveradi
  }
  dialogVisible.value = true
}

const openEditDialog = (row) => {
  editing.value = row
  Object.assign(form, {
    ...initialForm(),
    ...row,
    difficulty: row.difficulty || 5,
  })
  dialogVisible.value = true
}

const handleSubmit = async () => {
  if (!formRef.value) return
  try {
    await formRef.value.validate()
  } catch {
    return
  }

  const text = (value) => (value && String(value).trim() ? String(value).trim() : undefined)
  const payload = {
    order_number: form.order_number || undefined,
    manager_id: form.manager_id || undefined,
    other_source: text(form.other_source),
    system_info: text(form.system_info),
    area: form.area ?? undefined,
    difficulty: form.difficulty || undefined,
    contact_phone: text(form.contact_phone),
    contact_email: text(form.contact_email),
    contact_address: text(form.contact_address),
    comment: text(form.comment),
  }

  try {
    if (editing.value) {
      await loyihaStore.updateLoyiha(editing.value.id, payload)
      ElMessage.success(t('loyihaMessageUpdated'))
    } else {
      await loyihaStore.createLoyiha(payload)
      ElMessage.success(t('loyihaMessageSaved'))
    }
    dialogVisible.value = false
    await loyihaStore.getAllLoyihas()
  } catch (error) {
    ElMessage.error(error?.response?.data?.message || t('loyihaMessageSaveError'))
  }
}

const handleDelete = async (id) => {
  try {
    await loyihaStore.deleteLoyiha(id)
    ElMessage.success(t('loyihaMessageDeleted'))
    await loyihaStore.getAllLoyihas()
  } catch (error) {
    ElMessage.error(error?.response?.data?.message || t('loyihaMessageDeleteError'))
  }
}

// ─── Fayllar ───
const filesDialogVisible = ref(false)
const activeLoyiha = ref(null)
const uploading = ref(null)
const renamingId = ref(null)
const renameValue = ref('')

const filesTitle = computed(() =>
  activeLoyiha.value
    ? `${t('loyihaFilesTitle')} — №${activeLoyiha.value.order_number ?? activeLoyiha.value.id}`
    : t('loyihaFilesTitle'),
)

const openFilesDialog = (row) => {
  activeLoyiha.value = row
  renamingId.value = null
  filesDialogVisible.value = true
}

const sectionFiles = (section) =>
  (activeLoyiha.value?.files || [])
    .filter((f) => f.section === section)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))

// Ochiq turgan oynani yangilangan ma'lumot bilan qayta bog'laymiz
const refreshActive = async () => {
  await loyihaStore.getAllLoyihas()
  if (activeLoyiha.value) {
    activeLoyiha.value =
      loyihas.value.find((row) => row.id === activeLoyiha.value.id) || activeLoyiha.value
  }
}

const handleUpload = async (file, section) => {
  if (!activeLoyiha.value) return false
  uploading.value = section
  try {
    await loyihaStore.uploadFile(activeLoyiha.value.id, section, file)
    ElMessage.success(t('loyihaFileUploaded'))
    await refreshActive()
  } catch (error) {
    ElMessage.error(error?.response?.data?.message || t('loyihaFileUploadError'))
  } finally {
    uploading.value = null
  }
  return false // Element Plus o'zi yubormasin
}

const downloadFile = async (file) => {
  try {
    const url = await loyihaStore.getFileLink(file.id, 'download')
    if (url) window.open(url, '_blank')
  } catch {
    ElMessage.error(t('loyihaFileLinkError'))
  }
}

const startRename = (file) => {
  renamingId.value = file.id
  renameValue.value = file.file_name
}

const saveRename = async (file) => {
  const name = renameValue.value.trim()
  if (!name) return
  try {
    await loyihaStore.updateFile(file.id, { file_name: name })
    renamingId.value = null
    ElMessage.success(t('loyihaFileUpdated'))
    await refreshActive()
  } catch (error) {
    ElMessage.error(error?.response?.data?.message || t('loyihaFileUpdateError'))
  }
}

const handleFileDelete = async (file) => {
  try {
    await loyihaStore.deleteFile(file.id)
    ElMessage.success(t('loyihaFileDeleted'))
    await refreshActive()
  } catch (error) {
    ElMessage.error(error?.response?.data?.message || t('loyihaFileDeleteError'))
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
    [t('loyihaTableManager')]: managerName(row),
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
    await Promise.all([
      loyihaStore.getAllLoyihas(),
      usersStore.getAllUsers(),
      loyihaStore.checkStorage(),
    ])
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

.storage-warning {
  margin-bottom: 16px;
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
  gap: 2px;
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

.difficulty-picker {
  display: flex;
  align-items: center;
  gap: 14px;
  width: 100%;

  :deep(.el-slider) {
    flex: 1;
  }
}

/* ─── Fayllar oynasi ─────────────────────────────── */
.files-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 18px;
}

.file-section {
  border: 1px solid #e5e7eb;
  border-radius: 14px;
  padding: 14px 16px;
  background: #fff;

  &.archive-section {
    background: #fffdf5;
    border-color: #f5dab1;
  }
}

.file-section-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 10px;
  margin-bottom: 12px;

  h4 {
    margin: 0 0 2px;
    font-size: 15px;
    color: #1f2937;
  }
}

.file-section-hint {
  margin: 0;
  font-size: 12px;
  color: #6b7280;
  max-width: 260px;
  line-height: 1.5;
}

.file-list {
  list-style: none;
  margin: 0;
  padding: 0;
  max-height: 320px;
  overflow-y: auto;
}

.file-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 9px 0;
  border-bottom: 1px solid #f3f4f6;

  &:last-child {
    border-bottom: none;
  }
}

.file-main {
  min-width: 0;
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.file-name {
  font-size: 13px;
  font-weight: 600;
  color: #1f2937;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.file-meta {
  font-size: 11.5px;
  color: #9ca3af;
}

.file-actions {
  display: flex;
  align-items: center;
  gap: 2px;
  flex-shrink: 0;
}

.locked-hint {
  font-size: 12px;
  color: #b45309;
  cursor: default;
}

.file-empty {
  color: #9ca3af;
  font-size: 13px;
  text-align: center;
  padding: 18px 0;
}

@media (max-width: 900px) {
  .files-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .loyiha-container {
    padding: 18px 12px;
  }
}
</style>
