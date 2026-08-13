<template>
  <div class="kp-container" v-loading="kpStore.isLoading || uploadLoading">
    <div class="page-header">
      <div class="header-main">
        <div class="header-content">
            <h1>{{ $t('kpPageTitle') }}</h1>
            <p class="subtitle">{{ isAdmin ? $t('kpPageSubtitle') : $t('kpPageSubtitleOwn') }}</p>
          </div>

          <div class="header-actions">
            <el-upload
              class="kp-upload"
              :show-file-list="false"
              :before-upload="handleBeforeUpload"
              accept=".xlsx,.xls"
            >
              <el-button
                type="default"
                size="large"
                :icon="Upload"
                :loading="uploadLoading"
              >
                {{ uploadButtonText }}
              </el-button>
            </el-upload>
            <span v-if="uploadLoading" class="upload-status">
              <el-icon class="status-icon is-loading"><Loading /></el-icon>
              {{ $t('kpUploading') }}
            </span>

            <el-button type="primary" size="large" :icon="Plus" @click="openCreateDialog">
              {{ $t('kpButtonAdd') }}
            </el-button>
          </div>
        </div>

      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-title">{{ $t('kpStatTotal') }}</div>
          <div class="stat-value">{{ totalKPs }}</div>
        </div>
        <div class="stat-card">
          <div class="stat-title">{{ $t('kpStatOpen') }}</div>
          <div class="stat-value">{{ statusCount.Open }}</div>
        </div>
        <div class="stat-card">
          <div class="stat-title">{{ $t('kpStatNegotiation') }}</div>
          <div class="stat-value">{{ statusCount.Negotiation }}</div>
        </div>
        <div class="stat-card">
          <div class="stat-title">{{ $t('kpStatClosed') }}</div>
          <div class="stat-value">{{ statusCount.Closed }}</div>
        </div>
      </div>
    </div>

    <div v-if="uploadError" class="error-banner">{{ uploadError }}</div>
    <div v-if="kpStore.error" class="error-banner">{{ kpStore.error }}</div>

    <div class="toolbar" v-if="kps.length">
      <span class="toolbar-count">{{ $t('kpFilteredCount', { count: filteredKps.length }) }}</span>
      <button class="toolbar-reset-btn" @click="resetFilters">
        {{ $t('kpResetFilters') }}
      </button>
    </div>

    <div class="table-container" v-if="kps.length && !showSkeleton">
      <div class="table-wrapper">
        <table class="modern-table">
          <thead>
            <tr>
              <th class="table-index">#</th>
              <th>
                <div class="th-content">
                  <el-icon class="th-icon"><Document /></el-icon> {{ $t('kpTableNumber') }}
                </div>
              </th>
              <th>
                <div class="th-content">
                  <el-icon class="th-icon"><Document /></el-icon> {{ $t('kpTableStatus') }}
                </div>
              </th>
              <th>
                <div class="th-content">
                  <el-icon class="th-icon"><Document /></el-icon> {{ $t('kpTableClient') }}
                </div>
              </th>
              <th>
                <div class="th-content">
                  <el-icon class="th-icon"><Document /></el-icon> {{ $t('kpTableManager') }}
                </div>
              </th>
              <th>
                <div class="th-content">
                  <el-icon class="th-icon"><Document /></el-icon> {{ $t('kpTableDate') }}
                </div>
              </th>
              <th>
                <div class="th-content">
                  <el-icon class="th-icon"><Document /></el-icon> {{ $t('kpTableClosedDate') }}
                </div>
              </th>
              <th>
                <div class="th-content">
                  <el-icon class="th-icon"><Document /></el-icon> {{ $t('kpTableSum') }}
                </div>
              </th>
              <th>
                <div class="th-content">
                  <el-icon class="th-icon"><Document /></el-icon> {{ $t('kpTableComment') }}
                </div>
              </th>
              <th v-if="isAdmin" class="admin-col">
                <div class="th-content">
                  <el-icon class="th-icon"><Document /></el-icon> {{ $t('kpTableAdminComment') }}
                </div>
              </th>
              <th>
                <div class="th-content">
                  {{ $t('actions') }}
                </div>
              </th>
            </tr>
            <tr class="filter-row">
              <th></th>
              <th><input v-model="filterKpNumber" class="col-filter" :placeholder="$t('kpFilterPlaceholder')" /></th>
              <th>
                <select v-model="filterStatus" class="col-filter">
                  <option value="">{{ $t('kpAllStatuses') }}</option>
                  <option v-for="opt in statusOptions" :key="opt.value" :value="opt.value">
                    {{ $t(opt.labelKey) }}
                  </option>
                </select>
              </th>
              <th><input v-model="filterClient" class="col-filter" :placeholder="$t('kpFilterPlaceholder')" /></th>
              <th><input v-model="filterManager" class="col-filter" :placeholder="$t('kpFilterPlaceholder')" /></th>
              <th><input v-model="filterKpDate" class="col-filter" :placeholder="$t('kpFilterPlaceholder')" /></th>
              <th><input v-model="filterClosedDate" class="col-filter" :placeholder="$t('kpFilterPlaceholder')" /></th>
              <th><input v-model="filterSum" class="col-filter" :placeholder="$t('kpFilterPlaceholder')" /></th>
              <th class="comment-filter-col">
                <select v-model="filterComment" class="col-filter">
                  <option value="">{{ $t('kpAllComments') }}</option>
                  <option v-for="opt in KP_COMMENT_FILTER_OPTIONS" :key="opt" :value="opt">{{ opt }}</option>
                </select>
              </th>
              <th v-if="isAdmin" class="admin-col">
                <input v-model="filterAdminComment" class="col-filter" :placeholder="$t('kpFilterPlaceholder')" />
              </th>
              <th></th>
            </tr>
          </thead>
          <tbody class="table-row">
            <tr v-for="(kp, index) in pagedKps" :key="kp.id || kp._id || index">
              <td class="table-index">
                <span class="index-badge">{{ (currentPage - 1) * pageSize + index + 1 }}</span>
              </td>
              <td>
                <div class="cell-content">
                  <span class="cell-text">{{ kp.kp_number ?? '—' }}</span>
                </div>
              </td>
              <td>
                <div class="cell-content">
                  <span class="status-pill" :class="statusClass(kp.kp_status || kp.status)">
                    {{ statusLabel(kp.kp_status || kp.status) }}
                  </span>
                </div>
              </td>
              <td>
                <div class="cell-content">
                  <span class="cell-text bold">{{ kp.client_name || kp.client || '—' }}</span>
                </div>
              </td>
              <td>
                <div class="cell-content">
                  <span class="cell-text">{{ kp.manager_name || kp.manager || '—' }}</span>
                </div>
              </td>
              <td>
                <div class="cell-content">
                  <span class="cell-text">{{ formatDate(kp.kp_date || kp.kpDate) }}</span>
                </div>
              </td>
              <td>
                <div class="cell-content">
                  <span class="cell-text">{{ formatDate(kp.closed_date) }}</span>
                </div>
              </td>
              <td>
                <div class="cell-content">
                  <span class="cell-text">{{ formatMoney(kp.kp_sum || kp.sum) }}</span>
                </div>
              </td>
              <td class="comment-cell">
                <div class="cell-content">
                  <span class="cell-text">{{ kp.comment || '—' }}</span>
                </div>
              </td>
              <td v-if="isAdmin" class="comment-cell admin-col">
                <div class="cell-content">
                  <span class="cell-text admin-comment-text">{{ kp.admin_comment || '—' }}</span>
                </div>
              </td>
              <td class="actions-cell">
                <div class="actions-row" v-if="canModify(kp)">
                  <el-button text size="small" :icon="Edit" @click="openEditDialog(kp)">{{ $t('edit') }}</el-button>
                  <el-popconfirm
                    :title="$t('kpDeleteConfirm')"
                    width="240"
                    placement="top"
                    :confirm-button-text="t('deleteConfirm')"
                    :cancel-button-text="t('cancel')"
                    @confirm="handleDelete(kp.id || kp._id)"
                  >
                    <template #reference>
                      <el-button text size="small" type="danger" :icon="Delete">{{ $t('delete') }}</el-button>
                    </template>
                  </el-popconfirm>
                </div>
                <span v-else class="locked-hint" :title="$t('kpLockedHint')">🔒</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="pagination-bar" v-if="filteredKps.length > pageSize">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :page-sizes="[20, 50, 100, 200]"
          :total="filteredKps.length"
          layout="total, sizes, prev, pager, next, jumper"
          background
        />
      </div>
    </div>
    <div v-else-if="kps.length && !filteredKps.length && !showSkeleton" class="empty-state">
      <el-empty :description="$t('kpNoMatchDescription')" />
    </div>
    <div v-else-if="showSkeleton" class="skeleton-state">
      <div class="skeleton-card">
        <div class="skeleton-heading">
          <el-skeleton rows="1" animated />
        </div>
        <el-skeleton rows="4" animated />
        <div class="skeleton-actions">
          <el-skeleton rows="1" animated />
        </div>
      </div>
    </div>

    <div v-else class="empty-state">
      <div class="empty-card">
        <div class="empty-hero">
          <div class="empty-hero__blob"></div>
        </div>
        <h3 class="empty-title">{{ $t('kpEmptyTitle') }}</h3>
        <p class="empty-description">{{ $t('kpEmptyDescription') }}</p>
        <div class="empty-actions">
          <el-button type="primary" size="medium" :icon="Plus" @click="openCreateDialog">
            {{ $t('kpEmptyAction') }}
          </el-button>
        </div>
      </div>
    </div>

    <el-dialog
      v-model="dialogVisible"
      :title="editingKP ? $t('edit') : $t('kpDialogTitle')"
      width="720px"
      class="kp-dialog"
      destroy-on-close
    >
      <el-form
        ref="kpFormRef"
        :model="kpForm"
        :rules="formRules"
        label-position="top"
        class="kp-form"
      >
        <el-row :gutter="18">
          <el-col :span="12">
            <el-form-item :label="$t('kpNumberLabel')" prop="kp_number">
              <el-input-number
                v-model="kpForm.kp_number"
                :min="1"
                :controls="false"
                :placeholder="$t('kpNumberPlaceholder')"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item :label="$t('kpStatusLabel')" prop="kp_status">
              <el-select
                v-model="kpForm.kp_status"
                :placeholder="$t('kpStatusPlaceholder')"
                style="width: 100%"
              >
                <el-option
                  v-for="option in statusOptions"
                  :key="option.value"
                  :label="$t(option.labelKey)"
                  :value="option.value"
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item :label="$t('kpClientLabel')" prop="client_name">
              <el-input
                v-model="kpForm.client_name"
                :placeholder="$t('kpClientPlaceholder')"
                maxlength="120"
              />
            </el-form-item>
          </el-col>

          <el-col :span="12">
            <el-form-item :label="$t('kpDateLabel')" prop="kp_date">
              <el-date-picker
                v-model="kpForm.kp_date"
                type="date"
                :placeholder="$t('kpDatePlaceholder')"
                format="YYYY-MM-DD"
                value-format="YYYY-MM-DD"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item :label="$t('kpNextDateLabel')" prop="dogovor_next">
              <el-date-picker
                v-model="kpForm.dogovor_next"
                type="date"
                :placeholder="$t('kpDatePlaceholder')"
                format="YYYY-MM-DD"
                value-format="YYYY-MM-DD"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item :label="$t('kpClosedDateLabel')" prop="closed_date">
              <el-date-picker
                v-model="kpForm.closed_date"
                type="date"
                :placeholder="$t('kpDatePlaceholder')"
                format="YYYY-MM-DD"
                value-format="YYYY-MM-DD"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>

          <el-col :span="12">
            <el-form-item :label="$t('kpManagerLabel')" prop="manager_name">
              <el-input
                v-model="kpForm.manager_name"
                :placeholder="$t('kpManagerPlaceholder')"
                maxlength="120"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item :label="$t('kpSumLabel')" prop="kp_sum">
              <el-input-number
                v-model="kpForm.kp_sum"
                :min="0"
                :step="100"
                :placeholder="$t('kpSumPlaceholder')"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>

          <el-col :span="24">
            <el-form-item :label="$t('kpCommentLabel')" prop="commentSelect">
              <el-select
                v-model="kpForm.commentSelect"
                :placeholder="$t('kpCommentSelectPlaceholder')"
                filterable
                style="width: 100%"
              >
                <el-option v-for="opt in KP_COMMENT_OPTIONS" :key="opt" :label="opt" :value="opt" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col v-if="kpForm.commentSelect === CONTRACT_NUMBER_OPTION" :span="24">
            <el-form-item :label="$t('kpContractNumberLabel')" prop="contractNumber">
              <el-input
                v-model="kpForm.contractNumber"
                :placeholder="$t('kpContractNumberPlaceholder')"
                maxlength="60"
              />
            </el-form-item>
          </el-col>
          <el-col v-if="kpForm.commentSelect === OTHER_COMMENT_OPTION" :span="24">
            <el-form-item :label="$t('kpCustomCommentLabel')" prop="customComment">
              <el-input
                type="textarea"
                v-model="kpForm.customComment"
                :placeholder="$t('kpCommentPlaceholder')"
                rows="3"
                maxlength="400"
                show-word-limit
              />
            </el-form-item>
          </el-col>

          <el-col v-if="isAdmin" :span="24">
            <el-form-item :label="$t('kpAdminCommentLabel')" prop="admin_comment" class="admin-comment-field">
              <el-input
                type="textarea"
                v-model="kpForm.admin_comment"
                :placeholder="$t('kpAdminCommentPlaceholder')"
                rows="3"
                maxlength="400"
                show-word-limit
              />
              <span class="admin-field-hint">{{ $t('kpAdminCommentHint') }}</span>
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>

      <template #footer>
        <el-button @click="dialogVisible = false">{{ $t('cancel') }}</el-button>
        <el-button type="primary" :loading="kpStore.isLoading" @click="handleSubmit">
          {{ editingKP ? $t('save') : $t('save') }}
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useKPsStore } from '@/stores/kp'
import { useUsersStore } from '@/stores/user'
import { ElMessage } from 'element-plus'
import { Document, Plus, Upload, Edit, Delete, Loading, Search } from '@element-plus/icons-vue'
import {
  KP_COMMENT_OPTIONS,
  KP_COMMENT_FILTER_OPTIONS,
  CONTRACT_NUMBER_OPTION,
  OTHER_COMMENT_OPTION,
  deriveCommentForm,
  resolveCommentValue,
  commentMatchesFilter,
} from '@/constants/kpComments'

const { t } = useI18n()
const kpStore = useKPsStore()
const usersStore = useUsersStore()
const kps = computed(() => kpStore.allKPs || [])

const currentUserId = Number(localStorage.getItem('userid'))
const isAdmin = computed(() => !!usersStore.currentUser?.is_admin)

// Kiritgan xodim shu muddat ichida o'z KP'sini tahrirlashi/o'chirishi mumkin (backend bilan mos)
const EDIT_WINDOW_MS = 2 * 24 * 60 * 60 * 1000
const canModify = (kp) => {
  if (isAdmin.value) return true
  if (kp.created_by == null || Number(kp.created_by) !== currentUserId) return false
  const createdAt = new Date(kp.createdAt).getTime()
  if (Number.isNaN(createdAt)) return false
  return Date.now() - createdAt <= EDIT_WINDOW_MS
}
const dialogVisible = ref(false)
const kpFormRef = ref(null)
const editingKP = ref(null)
const uploadLoading = ref(false)
const uploadError = ref('')

const uploadButtonText = computed(() => {
  const s = t('kpButtonUploadFile')
  return s === 'kpButtonUploadFile' ? 'Fayl yuklash' : s
})

const statusOptions = [
  { labelKey: 'kpStatusOpen', value: 'Open' },
  { labelKey: 'kpStatusNegotiation', value: 'Negotiation' },
  { labelKey: 'kpStatusClosed', value: 'Closed' },
]

// ─── Har ustun bo'yicha filtr (jadval sarlavhasida) + pagination (1000+ qator uchun) ───
const filterKpNumber = ref('')
const filterStatus = ref('')
const filterClient = ref('')
const filterManager = ref('')
const filterKpDate = ref('')
const filterClosedDate = ref('')
const filterSum = ref('')
const filterComment = ref('')
const filterAdminComment = ref('')
const currentPage = ref(1)
const pageSize = ref(20)

const textMatch = (value, filter) =>
  !filter.trim() || String(value ?? '').toLowerCase().includes(filter.trim().toLowerCase())

// Backend KP'larni createdAt bo'yicha (yangilari birinchi) qaytaradi — shu tartibni saqlaymiz
const filteredKps = computed(() =>
  kps.value.filter(
    (kp) =>
      textMatch(kp.kp_number, filterKpNumber.value) &&
      (!filterStatus.value || (kp.kp_status || kp.status) === filterStatus.value) &&
      textMatch(kp.client_name, filterClient.value) &&
      textMatch(kp.manager_name, filterManager.value) &&
      textMatch(formatDate(kp.kp_date), filterKpDate.value) &&
      textMatch(formatDate(kp.closed_date), filterClosedDate.value) &&
      textMatch(kp.kp_sum, filterSum.value) &&
      commentMatchesFilter(kp.comment, filterComment.value) &&
      (!isAdmin.value || textMatch(kp.admin_comment, filterAdminComment.value)),
  ),
)

const pagedKps = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  return filteredKps.value.slice(start, start + pageSize.value)
})

// Filtr o'zgarsa 1-sahifaga qaytish
watch(
  [
    filterKpNumber,
    filterStatus,
    filterClient,
    filterManager,
    filterKpDate,
    filterClosedDate,
    filterSum,
    filterComment,
    filterAdminComment,
  ],
  () => {
    currentPage.value = 1
  },
)

const resetFilters = () => {
  filterKpNumber.value = ''
  filterStatus.value = ''
  filterClient.value = ''
  filterManager.value = ''
  filterKpDate.value = ''
  filterClosedDate.value = ''
  filterSum.value = ''
  filterComment.value = ''
  filterAdminComment.value = ''
}

const initialForm = () => ({
  kp_number: null,
  kp_status: 'Open',
  client_name: '',
  kp_date: '',
  manager_name: '',
  kp_sum: null,
  dogovor_next: '',
  closed_date: '',
  commentSelect: '',
  contractNumber: '',
  customComment: '',
  admin_comment: '',
})

const kpForm = reactive(initialForm())

const formRules = {
  kp_status: [{ required: true, message: t('kpValidationStatus'), trigger: 'change' }],
  client_name: [{ required: true, message: t('kpValidationClient'), trigger: 'blur' }],
  kp_date: [{ required: true, message: t('kpValidationDate'), trigger: 'change' }],
  manager_name: [{ required: true, message: t('kpValidationManager'), trigger: 'blur' }],
  kp_sum: [{ required: true, message: t('kpValidationSum'), trigger: 'change' }],
}

const resetForm = () => {
  Object.assign(kpForm, initialForm())
}

const openCreateDialog = () => {
  editingKP.value = null
  resetForm()
  dialogVisible.value = true
}

const handleBeforeUpload = async (file) => {
  uploadError.value = ''
  uploadLoading.value = true
  try {
    const result = await kpStore.importKPs(file)
    await kpStore.getAllKPs()
    const created = result?.imported ?? 0
    const updated = result?.updated ?? 0
    const skipped = result?.skipped ?? 0
    ElMessage.success(
      t('kpImportSummary', { created, updated, skipped }) ||
        `Yaratildi: ${created}, yangilandi: ${updated}, o'tkazib yuborildi: ${skipped}`,
    )
    if (result?.errors?.length) {
      uploadError.value = `${t('kpImportPartialErrors')}: ${result.errors.slice(0, 5).join('; ')}`
    }
  } catch (error) {
    uploadError.value =
      error?.response?.data?.message || error?.message || t('kpUploadError')
  } finally {
    uploadLoading.value = false
  }
  // Element Plus'ning avtomatik yuklashiga yo'l qo'ymaymiz — biz o'zimiz backend'ga yuboramiz
  return false
}

const openEditDialog = (kp) => {
  editingKP.value = kp
  Object.assign(kpForm, {
    kp_number: kp.kp_number ?? null,
    kp_status: kp.kp_status || kp.status || 'Open',
    client_name: kp.client_name || kp.client || '',
    kp_date: kp.kp_date || kp.kpDate || '',
    manager_name: kp.manager_name || kp.manager || '',
    kp_sum: kp.kp_sum || kp.sum || null,
    dogovor_next: kp.dogovor_next || kp.next_date || '',
    closed_date: kp.closed_date || '',
    ...deriveCommentForm(kp.comment),
    admin_comment: kp.admin_comment || '',
  })
  dialogVisible.value = true
}

const formatDate = (value) => {
  if (!value) return '—'
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString('uz-UZ')
}

const formatMoney = (value) => {
  if (value === null || value === undefined || value === '') return '—'
  return new Intl.NumberFormat('uz-UZ', {
    style: 'currency',
    currency: 'UZS',
    maximumFractionDigits: 0,
  }).format(value)
}

const statusClass = (status) => {
  const normalized = String(status || '').toLowerCase()
  if (normalized === 'open') return 'status-open'
  if (normalized === 'negotiation') return 'status-negotiation'
  if (normalized === 'closed') return 'status-closed'
  return 'status-default'
}

const statusLabel = (status) => {
  if (!status) return '—'
  const s = String(status)
  if (s === 'Open') return t('kpStatusOpen')
  if (s === 'Negotiation') return t('kpStatusNegotiation')
  if (s === 'Closed') return t('kpStatusClosed')
  return s
}

const totalKPs = computed(() => kps.value.length)
const statusCount = computed(() => ({
  Open: kps.value.filter((kp) => (kp.kp_status || kp.status) === 'Open').length,
  Negotiation: kps.value.filter((kp) => (kp.kp_status || kp.status) === 'Negotiation').length,
  Closed: kps.value.filter((kp) => (kp.kp_status || kp.status) === 'Closed').length,
}))
const showSkeleton = computed(() => kpStore.isLoading && !kps.value.length)

const handleSubmit = async () => {
  if (!kpFormRef.value) return

  try {
    await kpFormRef.value.validate()
  } catch {
    return
  }

  const payload = {
    kp_number: kpForm.kp_number || undefined,
    kp_status: kpForm.kp_status,
    client_name: kpForm.client_name.trim(),
    kp_date: kpForm.kp_date,
    manager_name: kpForm.manager_name.trim(),
    kp_sum: kpForm.kp_sum,
    dogovor_next: kpForm.dogovor_next || undefined,
    closed_date: kpForm.closed_date || undefined,
    comment:
      resolveCommentValue({
        commentSelect: kpForm.commentSelect,
        contractNumber: kpForm.contractNumber,
        customComment: kpForm.customComment,
      }) || undefined,
  }
  // admin_comment faqat admin uchun — backend ham qat'iy tekshiradi, bu shunchaki UI tozaligi
  if (isAdmin.value) {
    payload.admin_comment = kpForm.admin_comment?.trim() || undefined
  }

  try {
    if (editingKP.value) {
      const id = editingKP.value.id || editingKP.value._id
      await kpStore.updateKP(id, payload)
      ElMessage.success(t('kpMessageUpdated'))
    } else {
      await kpStore.createKP(payload)
      ElMessage.success(t('kpMessageSaved'))
    }
    dialogVisible.value = false
    await kpStore.getAllKPs()
  } catch (error) {
    const message =
      error?.response?.data?.message || error?.message ||
      (editingKP.value ? t('kpMessageUpdateError') : t('kpMessageSaveError'))
    ElMessage.error(message)
  }
}

const handleDelete = async (id) => {
  if (!id) return

  try {
    await kpStore.deleteKP(id)
    ElMessage.success(t('kpMessageDeleted'))
    await kpStore.getAllKPs()
  } catch (error) {
    const message = error?.response?.data?.message || error?.message || t('kpMessageDeleteError')
    ElMessage.error(message)
  }
}

onMounted(async () => {
  try {
    if (!usersStore.currentUser) {
      await usersStore.getUserInfo(currentUserId)
    }
    await kpStore.getAllKPs()
  } catch {
    ElMessage.error(t('kpMessageLoadError'))
  }
})
</script>

<style lang="scss" scoped>
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
}

.header-content h1 {
  font-size: 34px;
  font-weight: 700;
  color: #111827;
  margin: 0 0 6px 0;
  letter-spacing: -0.03em;
}

.header-content .subtitle {
  font-size: 15px;
  color: #6b7280;
  margin: 0;
  max-width: 560px;
  line-height: 1.7;
}

.header-actions {
  display: flex;
  align-items: center;
}
.header-actions {
  gap: 12px;
}
.upload-status {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  color: #6b7280;
  font-size: 14px;
}
.upload-status .status-icon {
  color: #409eff;
}
.upload-status .status-icon.is-loading {
  animation: kp-spin 1s linear infinite;
}
@keyframes kp-spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
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
  transition: background 0.15s ease;

  &:hover {
    background: #e5e7eb;
  }
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

.pagination-bar {
  display: flex;
  justify-content: flex-end;
  padding: 18px 20px;
  border-top: 1px solid #f3f4f6;
}

.kp-container {
  width: 100%;
  padding: 32px;
  background: #f5f7fa;
  min-height: 100vh;
  overflow-x: hidden;
  box-sizing: border-box;
}

.actions-cell {
  white-space: nowrap;
}

.actions-row {
  display: flex;
  gap: 8px;
  align-items: center;
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

  .error-banner {
    margin-bottom: 16px;
    padding: 12px 16px;
    border-radius: 10px;
    background: #fef2f2;
    color: #b91c1c;
    border: 1px solid #fecaca;
  }

  .empty-state {
    padding: 60px 24px;
    display: flex;
    justify-content: center;
    align-items: center;
    color: #6b7280;
  }

  .empty-card {
    padding: 44px 36px;
    border-radius: 20px;
    background: #f9fafb;
    border: 1px solid #e5e7eb;
    text-align: center;
    box-shadow: 0 8px 24px rgba(15, 23, 42, 0.04);
  }

  .empty-icon {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 84px;
    height: 84px;
    margin: 0 auto 18px;
    border-radius: 50%;
    background: #eef2ff;
    color: #3b82f6;
  }

  .empty-card h3 {
    margin: 0 0 12px;
    font-size: 20px;
    color: #111827;
  }

  .empty-card p {
    margin: 0 0 22px;
    color: #6b7280;
    font-size: 14px;
    line-height: 1.7;
  }

  .page-header {
    padding-bottom: 28px;
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
  font-size: 28px;
  font-weight: 700;
  color: #111827;
}

.status-pill {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 96px;
  padding: 6px 12px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.02em;
  text-transform: uppercase;
  color: white;
}

.status-open {
  background: #10b981;
}

.status-negotiation {
  background: #f59e0b;
}

.status-closed {
  background: #6366f1;
}

.status-default {
  background: #6b7280;
}

.comment-cell {
  min-width: 240px;
  max-width: 420px;
  white-space: normal;
  overflow-wrap: break-word;
  word-break: break-word;
  line-height: 1.6;

  .cell-content {
    align-items: flex-start;
  }
}

.comment-filter-col {
  min-width: 240px;
}

.admin-col {
  background: #fffaf0;
}

.admin-comment-text {
  color: #b45309;
  font-style: italic;
}

.locked-hint {
  color: #9ca3af;
  font-size: 13px;
  cursor: default;
}

.admin-comment-field :deep(.el-textarea__inner) {
  border-color: #f59e0b;
  background: #fffaf0;
}

.admin-field-hint {
  display: block;
  margin-top: 4px;
  font-size: 12px;
  color: #b45309;
}

.skeleton-state {
  // padding: 60px 28px;
  display: flex;
  justify-content: center;
}

.skeleton-card {
  width: 100%;
  padding: 34px 34px 28px;
  border-radius: 24px;
  background: #ffffff;
  border: 1px solid #e5e7eb;
  box-shadow: 0 18px 48px rgba(15, 23, 42, 0.08);
}

.skeleton-heading {
  margin-bottom: 22px;
}

.skeleton-actions {
  margin-top: 24px;
  width: 220px;
}

.empty-card {
  position: relative;
  padding: 50px 44px;
  border-radius: 28px;
  background:
    radial-gradient(circle at top left, rgba(59, 130, 246, 0.16), transparent 38%),
    linear-gradient(180deg, rgba(255, 255, 255, 0.98), rgba(245, 247, 250, 0.96));
  border: 1px solid rgba(59, 130, 246, 0.14);
  box-shadow: 0 30px 80px rgba(15, 23, 42, 0.12);
  overflow: hidden;
}

.empty-hero {
  position: absolute;
  top: -24px;
  right: -24px;
  width: 190px;
  height: 190px;
  pointer-events: none;
}

.empty-hero__blob {
  position: absolute;
  inset: 0;
  background: radial-gradient(circle, rgba(59, 130, 246, 0.18), transparent 60%);
  filter: blur(24px);
}

.empty-hero__icon {
  position: absolute;
  top: 30px;
  right: 24px;
  width: 80px;
  height: 80px;
  border-radius: 24px;
  background: rgba(255, 255, 255, 0.88);
  display: grid;
  place-items: center;
  box-shadow: 0 24px 60px rgba(59, 130, 246, 0.16);
}

.empty-title {
  margin: 0 0 16px;
  font-size: 28px;
  font-weight: 700;
  color: #111827;
}

.empty-description {
  margin: 0 0 28px;
  color: #4b5563;
  line-height: 1.8;
  max-width: 640px;
  font-size: 15px;
}

.empty-actions {
  display: flex;
  gap: 14px;
}

.kp-form :deep(.el-form-item) {
  margin-bottom: 18px;
}

:deep(.kp-dialog .el-dialog) {
  border-radius: 16px;
}

:deep(.kp-dialog .el-dialog__header) {
  padding: 24px 24px 0;
}

:deep(.kp-dialog .el-dialog__body) {
  padding: 20px 24px 24px;
}

:deep(.kp-dialog .el-dialog__footer) {
  padding: 0 24px 24px;
}
</style>
