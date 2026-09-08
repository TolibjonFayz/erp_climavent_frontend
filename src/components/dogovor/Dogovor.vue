<template>
  <div class="dogovor-container" v-loading="dogovorStore.isLoading || uploadLoading">
    <div class="page-header">
      <div class="header-main">
        <div class="header-content">
          <h1>{{ $t('dogovorPageTitle') }}</h1>
          <p class="subtitle">
            {{ isAdmin ? $t('dogovorPageSubtitle') : $t('dogovorPageSubtitleOwn') }}
          </p>
        </div>

        <div class="header-actions">
          <el-upload
            class="dogovor-upload"
            :show-file-list="false"
            :before-upload="handleBeforeUpload"
            accept=".xlsx,.xls"
          >
            <el-button type="default" size="large" :icon="Upload" :loading="uploadLoading">
              {{ $t('dogovorButtonUploadFile') }}
            </el-button>
          </el-upload>

          <el-button size="large" :icon="Download" @click="exportExcel">
            {{ $t('dogovorExportExcel') }}
          </el-button>

          <el-button type="primary" size="large" :icon="Plus" @click="openCreateDialog">
            {{ $t('dogovorButtonAdd') }}
          </el-button>
        </div>
      </div>

      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-title">{{ $t('dogovorStatTotal') }}</div>
          <div class="stat-value">{{ totalDogovors }}</div>
        </div>
        <div class="stat-card">
          <div class="stat-title">{{ $t('dogovorStatusOpen') }}</div>
          <div class="stat-value">{{ statusCount.Open }}</div>
        </div>
        <div class="stat-card">
          <div class="stat-title">{{ $t('dogovorStatusShipped') }}</div>
          <div class="stat-value">{{ statusCount.Shipped }}</div>
        </div>
        <div class="stat-card">
          <div class="stat-title">{{ $t('dogovorStatSum') }}</div>
          <div class="stat-value stat-money">{{ formatMoneyShort(totalSum) }}</div>
        </div>
      </div>
    </div>

    <div v-if="uploadError" class="error-banner">{{ uploadError }}</div>
    <div v-if="dogovorStore.error" class="error-banner">{{ dogovorStore.error }}</div>

    <div class="toolbar" v-if="dogovors.length">
      <span class="toolbar-count">
        {{ $t('dogovorFilteredCount', { count: filteredDogovors.length }) }}
      </span>
      <button class="toolbar-reset-btn" @click="resetFilters">
        {{ $t('dogovorResetFilters') }}
      </button>
    </div>

    <div class="table-container" v-if="dogovors.length && !showSkeleton">
      <div class="table-wrapper">
        <table class="modern-table">
          <thead>
            <tr>
              <th class="table-index">#</th>
              <th>{{ $t('dogovorTableNumber') }}</th>
              <th>{{ $t('dogovorTableStatus') }}</th>
              <th>{{ $t('dogovorTableClient') }}</th>
              <th>{{ $t('dogovorTableManager') }}</th>
              <th>{{ $t('dogovorTableDate') }}</th>
              <th>{{ $t('dogovorTablePaymentDate') }}</th>
              <th>{{ $t('dogovorTableSum') }}</th>
              <th>{{ $t('dogovorTablePrepayment') }}</th>
              <th>{{ $t('dogovorTableInn') }}</th>
              <th>{{ $t('dogovorTablePhone') }}</th>
              <th>{{ $t('dogovorTableComment') }}</th>
              <th v-if="isAdmin" class="admin-col">{{ $t('dogovorTableAdminComment') }}</th>
              <th>{{ $t('actions') }}</th>
            </tr>
            <tr class="filter-row">
              <th></th>
              <th>
                <input v-model="filters.number" class="col-filter" :placeholder="$t('dogovorFilterPlaceholder')" />
              </th>
              <th>
                <select v-model="filters.status" class="col-filter">
                  <option value="">{{ $t('dogovorAllStatuses') }}</option>
                  <option v-for="opt in statusOptions" :key="opt.value" :value="opt.value">
                    {{ $t(opt.labelKey) }}
                  </option>
                </select>
              </th>
              <th>
                <input v-model="filters.client" class="col-filter" :placeholder="$t('dogovorFilterPlaceholder')" />
              </th>
              <th>
                <input v-model="filters.manager" class="col-filter" :placeholder="$t('dogovorFilterPlaceholder')" />
              </th>
              <th>
                <input v-model="filters.date" class="col-filter" :placeholder="$t('dogovorFilterPlaceholder')" />
              </th>
              <th>
                <input v-model="filters.paymentDate" class="col-filter" :placeholder="$t('dogovorFilterPlaceholder')" />
              </th>
              <th>
                <input v-model="filters.sum" class="col-filter" :placeholder="$t('dogovorFilterPlaceholder')" />
              </th>
              <th>
                <input v-model="filters.prepayment" class="col-filter" :placeholder="$t('dogovorFilterPlaceholder')" />
              </th>
              <th>
                <input v-model="filters.inn" class="col-filter" :placeholder="$t('dogovorFilterPlaceholder')" />
              </th>
              <th>
                <input v-model="filters.phone" class="col-filter" :placeholder="$t('dogovorFilterPlaceholder')" />
              </th>
              <th class="comment-filter-col">
                <input v-model="filters.comment" class="col-filter" :placeholder="$t('dogovorFilterPlaceholder')" />
              </th>
              <th v-if="isAdmin" class="admin-col">
                <input v-model="filters.adminComment" class="col-filter" :placeholder="$t('dogovorFilterPlaceholder')" />
              </th>
              <th></th>
            </tr>
          </thead>
          <tbody class="table-row">
            <tr v-for="(row, index) in pagedDogovors" :key="row.id">
              <td class="table-index">
                <span class="index-badge">{{ (currentPage - 1) * pageSize + index + 1 }}</span>
              </td>
              <td>
                <span class="cell-text bold">{{ row.dogovor_number ?? '—' }}</span>
              </td>
              <td>
                <span class="status-pill" :class="statusClass(row.dogovor_status)">
                  {{ statusLabel(row.dogovor_status) }}
                </span>
              </td>
              <td class="client-cell">
                <span class="cell-text bold">{{ row.client_name || '—' }}</span>
              </td>
              <td><span class="cell-text">{{ row.manager_name || '—' }}</span></td>
              <td><span class="cell-text">{{ formatDate(row.dogovor_date) }}</span></td>
              <td><span class="cell-text">{{ formatDate(row.payment_date) }}</span></td>
              <td><span class="cell-text">{{ formatMoney(row.dogovor_sum) }}</span></td>
              <td>
                <span class="cell-text">
                  {{ row.prepayment_percent != null ? row.prepayment_percent + '%' : '—' }}
                </span>
              </td>
              <td><span class="cell-text">{{ row.client_inn || '—' }}</span></td>
              <td><span class="cell-text">{{ row.client_phone || '—' }}</span></td>
              <td class="comment-cell"><span class="cell-text">{{ row.comment || '—' }}</span></td>
              <td v-if="isAdmin" class="comment-cell admin-col">
                <span class="cell-text admin-comment-text">{{ row.admin_comment || '—' }}</span>
              </td>
              <td class="actions-cell">
                <div class="actions-row">
                  <el-button text size="small" :icon="Printer" @click="printDogovor(row)">
                    {{ $t('dogovorPrint') }}
                  </el-button>
                  <template v-if="canModify(row)">
                    <el-button text size="small" :icon="Edit" @click="openEditDialog(row)">
                      {{ $t('edit') }}
                    </el-button>
                    <el-popconfirm
                      :title="$t('dogovorDeleteConfirm')"
                      width="240"
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
                  </template>
                  <span v-else class="locked-hint" :title="$t('dogovorLockedHint')">🔒</span>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="pagination-bar" v-if="filteredDogovors.length > pageSize">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :page-sizes="[20, 50, 100, 200]"
          :total="filteredDogovors.length"
          layout="total, sizes, prev, pager, next, jumper"
          background
        />
      </div>
    </div>

    <div v-else-if="dogovors.length && !filteredDogovors.length" class="empty-state">
      <el-empty :description="$t('dogovorNoMatchDescription')" />
    </div>
    <div v-else-if="showSkeleton" class="skeleton-state">
      <div class="skeleton-card"><el-skeleton :rows="6" animated /></div>
    </div>
    <div v-else class="empty-state">
      <div class="empty-card">
        <h3 class="empty-title">{{ $t('dogovorEmptyTitle') }}</h3>
        <p class="empty-description">{{ $t('dogovorEmptyDescription') }}</p>
        <el-button type="primary" :icon="Plus" @click="openCreateDialog">
          {{ $t('dogovorButtonAdd') }}
        </el-button>
      </div>
    </div>

    <!-- Qo'shish / tahrirlash -->
    <el-dialog
      v-model="dialogVisible"
      :title="editing ? $t('edit') : $t('dogovorDialogTitle')"
      width="880px"
      class="dogovor-dialog"
      destroy-on-close
    >
      <el-form ref="formRef" :model="form" :rules="formRules" label-position="top">
        <el-divider content-position="left">{{ $t('dogovorSectionMain') }}</el-divider>
        <el-row :gutter="18">
          <el-col :span="8">
            <el-form-item :label="$t('dogovorNumberLabel')" prop="dogovor_number">
              <el-input-number v-model="form.dogovor_number" :min="1" :controls="false" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item :label="$t('dogovorDateLabel')" prop="dogovor_date">
              <el-date-picker
                v-model="form.dogovor_date"
                type="date"
                format="YYYY-MM-DD"
                value-format="YYYY-MM-DD"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item :label="$t('dogovorStatusLabel')" prop="dogovor_status">
              <el-select v-model="form.dogovor_status" style="width: 100%">
                <el-option
                  v-for="opt in statusOptions"
                  :key="opt.value"
                  :label="$t(opt.labelKey)"
                  :value="opt.value"
                />
              </el-select>
            </el-form-item>
          </el-col>

          <el-col :span="12">
            <el-form-item :label="$t('dogovorClientLabel')" prop="client_name">
              <el-input v-model="form.client_name" maxlength="200" />
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item :label="$t('dogovorInnLabel')" prop="client_inn">
              <el-input v-model="form.client_inn" maxlength="20" />
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item :label="$t('dogovorPhoneLabel')" prop="client_phone">
              <el-input v-model="form.client_phone" maxlength="40" />
            </el-form-item>
          </el-col>

          <el-col :span="8">
            <el-form-item :label="$t('dogovorManagerLabel')" prop="manager_name">
              <el-input v-model="form.manager_name" maxlength="120" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item :label="$t('dogovorSumLabel')" prop="dogovor_sum">
              <el-input-number v-model="form.dogovor_sum" :min="0" :controls="false" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item :label="$t('dogovorPaymentDateLabel')" prop="payment_date">
              <el-date-picker
                v-model="form.payment_date"
                type="date"
                format="YYYY-MM-DD"
                value-format="YYYY-MM-DD"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>

          <el-col :span="8">
            <el-form-item :label="$t('dogovorInitialPaymentLabel')" prop="initial_payment">
              <el-input-number v-model="form.initial_payment" :min="0" :controls="false" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item :label="$t('dogovorPrepaymentLabel')" prop="prepayment_percent">
              <el-input-number
                v-model="form.prepayment_percent"
                :min="0"
                :max="100"
                :controls="false"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item :label="$t('dogovorProductionDaysLabel')" prop="production_days">
              <el-input-number v-model="form.production_days" :min="0" :controls="false" style="width: 100%" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-divider content-position="left">{{ $t('dogovorSectionRequisites') }}</el-divider>
        <el-row :gutter="18">
          <el-col :span="12">
            <el-form-item :label="$t('dogovorContactNameLabel')" prop="contact_name">
              <el-input v-model="form.contact_name" maxlength="120" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item :label="$t('dogovorContactPositionLabel')" prop="contact_position">
              <el-input v-model="form.contact_position" maxlength="120" />
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item :label="$t('dogovorAddressLabel')" prop="client_address">
              <el-input v-model="form.client_address" type="textarea" :rows="2" maxlength="400" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item :label="$t('dogovorBankLabel')" prop="client_bank">
              <el-input v-model="form.client_bank" maxlength="200" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item :label="$t('dogovorAccountLabel')" prop="client_account">
              <el-input v-model="form.client_account" maxlength="40" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item :label="$t('dogovorMfoLabel')" prop="client_mfo">
              <el-input v-model="form.client_mfo" maxlength="20" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item :label="$t('dogovorVatCodeLabel')" prop="client_vat_code">
              <el-input v-model="form.client_vat_code" maxlength="30" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-divider content-position="left">{{ $t('dogovorSectionItems') }}</el-divider>
        <table class="items-editor">
          <thead>
            <tr>
              <th style="width: 36px">№</th>
              <th>{{ $t('dogovorItemName') }}</th>
              <th style="width: 80px">{{ $t('dogovorItemUnit') }}</th>
              <th style="width: 90px">{{ $t('dogovorItemQty') }}</th>
              <th style="width: 140px">{{ $t('dogovorItemPrice') }}</th>
              <th style="width: 140px">{{ $t('dogovorItemTotal') }}</th>
              <th style="width: 44px"></th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(item, i) in form.items" :key="i">
              <td class="items-index">{{ i + 1 }}</td>
              <td><el-input v-model="item.name" size="small" :placeholder="$t('dogovorItemName')" /></td>
              <td><el-input v-model="item.unit" size="small" placeholder="шт" /></td>
              <td>
                <el-input-number v-model="item.qty" :min="0" :controls="false" size="small" style="width: 100%" />
              </td>
              <td>
                <el-input-number v-model="item.price" :min="0" :controls="false" size="small" style="width: 100%" />
              </td>
              <td class="items-total">{{ formatMoney((item.qty || 0) * (item.price || 0)) }}</td>
              <td>
                <el-button text size="small" type="danger" :icon="Delete" @click="removeItem(i)" />
              </td>
            </tr>
            <tr v-if="!form.items.length">
              <td colspan="7" class="items-empty">{{ $t('dogovorNoItems') }}</td>
            </tr>
          </tbody>
        </table>
        <div class="items-actions">
          <el-button size="small" :icon="Plus" @click="addItem">{{ $t('dogovorAddItem') }}</el-button>
          <span class="items-summary" v-if="form.items.length">
            {{ $t('dogovorItemsSubtotal') }}: <b>{{ formatMoney(itemsSubtotal) }}</b> ·
            {{ $t('dogovorVat') }}: <b>{{ formatMoney(itemsVat) }}</b> ·
            {{ $t('dogovorItemsTotal') }}: <b>{{ formatMoney(itemsTotal) }}</b>
          </span>
          <el-button
            v-if="form.items.length"
            size="small"
            type="primary"
            plain
            @click="applyItemsTotal"
          >
            {{ $t('dogovorApplyItemsTotal') }}
          </el-button>
        </div>

        <el-divider content-position="left">{{ $t('dogovorSectionNotes') }}</el-divider>
        <el-row :gutter="18">
          <el-col :span="24">
            <el-form-item :label="$t('dogovorCommentLabel')" prop="comment">
              <el-input v-model="form.comment" type="textarea" :rows="2" maxlength="500" show-word-limit />
            </el-form-item>
          </el-col>
          <el-col v-if="isAdmin" :span="24">
            <el-form-item :label="$t('dogovorAdminCommentLabel')" prop="admin_comment" class="admin-comment-field">
              <el-input v-model="form.admin_comment" type="textarea" :rows="2" maxlength="400" show-word-limit />
              <span class="admin-field-hint">{{ $t('dogovorAdminCommentHint') }}</span>
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>

      <template #footer>
        <el-button @click="dialogVisible = false">{{ $t('cancel') }}</el-button>
        <el-button type="primary" :loading="dogovorStore.isLoading" @click="handleSubmit">
          {{ $t('save') }}
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import * as XLSX from 'xlsx'
import { ElMessage } from 'element-plus'
import { Plus, Upload, Edit, Delete, Download, Printer } from '@element-plus/icons-vue'
import { useDogovorStore } from '@/stores/dogovor'
import { useUsersStore } from '@/stores/user'
import { printDogovorDocument } from '@/utils/dogovorPdf'

const { t } = useI18n()
const dogovorStore = useDogovorStore()
const usersStore = useUsersStore()

const dogovors = computed(() => dogovorStore.allDogovors || [])
const currentUserId = Number(localStorage.getItem('userid'))
const isAdmin = computed(() => !!usersStore.currentUser?.is_admin)

// Kiritgan xodim 2 kun ichida tahrirlashi/o'chirishi mumkin (backend ham shuni tekshiradi)
const EDIT_WINDOW_MS = 2 * 24 * 60 * 60 * 1000
const canModify = (row) => {
  if (isAdmin.value) return true
  if (row.created_by == null || Number(row.created_by) !== currentUserId) return false
  const createdAt = new Date(row.createdAt).getTime()
  if (Number.isNaN(createdAt)) return false
  return Date.now() - createdAt <= EDIT_WINDOW_MS
}

const statusOptions = [
  { value: 'Open', labelKey: 'dogovorStatusOpen' },
  { value: 'Shipped', labelKey: 'dogovorStatusShipped' },
  { value: 'PartlyShipped', labelKey: 'dogovorStatusPartlyShipped' },
  { value: 'Closed', labelKey: 'dogovorStatusClosed' },
]

const statusLabel = (status) => {
  const found = statusOptions.find((o) => o.value === status)
  return found ? t(found.labelKey) : status || '—'
}
const statusClass = (status) =>
  ({
    Open: 'status-open',
    Shipped: 'status-shipped',
    PartlyShipped: 'status-partly',
    Closed: 'status-closed',
  })[status] || 'status-default'

// ─── Filtrlar ───
const filters = reactive({
  number: '',
  status: '',
  client: '',
  manager: '',
  date: '',
  paymentDate: '',
  sum: '',
  prepayment: '',
  inn: '',
  phone: '',
  comment: '',
  adminComment: '',
})

const currentPage = ref(1)
const pageSize = ref(20)

const textMatch = (value, filter) =>
  !filter.trim() || String(value ?? '').toLowerCase().includes(filter.trim().toLowerCase())

// Backend dogovor_number bo'yicha kamayish tartibida qaytaradi — tartibni saqlaymiz
const filteredDogovors = computed(() =>
  dogovors.value.filter(
    (row) =>
      textMatch(row.dogovor_number, filters.number) &&
      (!filters.status || row.dogovor_status === filters.status) &&
      textMatch(row.client_name, filters.client) &&
      textMatch(row.manager_name, filters.manager) &&
      textMatch(formatDate(row.dogovor_date), filters.date) &&
      textMatch(formatDate(row.payment_date), filters.paymentDate) &&
      textMatch(row.dogovor_sum, filters.sum) &&
      textMatch(row.prepayment_percent, filters.prepayment) &&
      textMatch(row.client_inn, filters.inn) &&
      textMatch(row.client_phone, filters.phone) &&
      textMatch(row.comment, filters.comment) &&
      (!isAdmin.value || textMatch(row.admin_comment, filters.adminComment)),
  ),
)

const pagedDogovors = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  return filteredDogovors.value.slice(start, start + pageSize.value)
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
const totalDogovors = computed(() => dogovors.value.length)
const statusCount = computed(() => ({
  Open: dogovors.value.filter((d) => d.dogovor_status === 'Open').length,
  Shipped: dogovors.value.filter((d) => d.dogovor_status === 'Shipped').length,
  PartlyShipped: dogovors.value.filter((d) => d.dogovor_status === 'PartlyShipped').length,
  Closed: dogovors.value.filter((d) => d.dogovor_status === 'Closed').length,
}))
const totalSum = computed(() =>
  dogovors.value.reduce((acc, d) => acc + (Number(d.dogovor_sum) || 0), 0),
)
const showSkeleton = computed(() => dogovorStore.isLoading && !dogovors.value.length)

// ─── Formatlash ───
const formatDate = (value) => {
  if (!value) return '—'
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString('uz-UZ')
}

const formatMoney = (value) => {
  if (value === null || value === undefined || value === '') return '—'
  return new Intl.NumberFormat('uz-UZ', { maximumFractionDigits: 2 }).format(value)
}

// 1 225 936 013 096 -> "1.23 trln"
const formatMoneyShort = (value) => {
  const n = Number(value) || 0
  if (n >= 1e12) return (n / 1e12).toFixed(2) + ' trln'
  if (n >= 1e9) return (n / 1e9).toFixed(2) + ' mlrd'
  if (n >= 1e6) return (n / 1e6).toFixed(1) + ' mln'
  return formatMoney(n)
}

// ─── Excel yuklash / eksport ───
const uploadLoading = ref(false)
const uploadError = ref('')

const handleBeforeUpload = async (file) => {
  uploadError.value = ''
  uploadLoading.value = true
  try {
    const result = await dogovorStore.importDogovors(file)
    await dogovorStore.getAllDogovors()
    ElMessage.success(
      t('dogovorImportSummary', {
        created: result?.imported ?? 0,
        updated: result?.updated ?? 0,
        skipped: result?.skipped ?? 0,
      }),
    )
    if (result?.errors?.length) {
      uploadError.value = `${t('dogovorImportPartialErrors')}: ${result.errors.slice(0, 5).join('; ')}`
    }
  } catch (error) {
    uploadError.value = error?.response?.data?.message || error?.message || t('dogovorUploadError')
  } finally {
    uploadLoading.value = false
  }
  return false // Element Plus o'zi yubormasin — biz o'zimiz yubordik
}

const exportExcel = () => {
  const list = filteredDogovors.value
  if (!list.length) {
    ElMessage.warning(t('dogovorNoDataToExport'))
    return
  }
  const rows = list.map((row, index) => ({
    '№': index + 1,
    [t('dogovorTableNumber')]: row.dogovor_number ?? '—',
    [t('dogovorTableDate')]: formatDate(row.dogovor_date),
    [t('dogovorTableClient')]: row.client_name || '—',
    [t('dogovorTableSum')]: row.dogovor_sum ?? 0,
    [t('dogovorTableStatus')]: statusLabel(row.dogovor_status),
    [t('dogovorTableInn')]: row.client_inn || '—',
    [t('dogovorTablePaymentDate')]: formatDate(row.payment_date),
    [t('dogovorInitialPaymentLabel')]: row.initial_payment ?? 0,
    [t('dogovorTablePrepayment')]: row.prepayment_percent ?? 0,
    [t('dogovorTablePhone')]: row.client_phone || '—',
    [t('dogovorTableManager')]: row.manager_name || '—',
    [t('dogovorAddressLabel')]: row.client_address || '—',
    [t('dogovorContactPositionLabel')]: row.contact_position || '—',
    [t('dogovorContactNameLabel')]: row.contact_name || '—',
    [t('dogovorTableComment')]: row.comment || '—',
  }))
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(rows), 'Dogovor')
  const stamp = new Date().toLocaleDateString('uz-UZ').replace(/\//g, '-')
  XLSX.writeFile(wb, `Dogovorlar_${stamp}.xlsx`)
  ElMessage.success(t('dogovorExportDone'))
}

// ─── Shartnoma hujjatini chop etish / PDF ───
const printDogovor = async (row) => {
  try {
    await printDogovorDocument(row)
  } catch {
    ElMessage.error(t('dogovorPrintError'))
  }
}

// ─── Forma ───
const dialogVisible = ref(false)
const editing = ref(null)
const formRef = ref(null)

const initialForm = () => ({
  dogovor_number: null,
  dogovor_date: new Date().toISOString().slice(0, 10),
  client_name: '',
  dogovor_sum: null,
  dogovor_status: 'Open',
  client_inn: '',
  payment_date: '',
  initial_payment: null,
  prepayment_percent: null,
  client_phone: '',
  manager_name: '',
  client_address: '',
  contact_name: '',
  contact_position: '',
  client_bank: '',
  client_account: '',
  client_mfo: '',
  client_vat_code: '',
  items: [],
  production_days: null,
  comment: '',
  admin_comment: '',
})

const form = reactive(initialForm())

const formRules = {
  dogovor_date: [{ required: true, message: t('dogovorValidationDate'), trigger: 'change' }],
  client_name: [{ required: true, message: t('dogovorValidationClient'), trigger: 'blur' }],
  dogovor_sum: [{ required: true, message: t('dogovorValidationSum'), trigger: 'change' }],
}

const itemsSubtotal = computed(() =>
  form.items.reduce((acc, item) => acc + (Number(item.qty) || 0) * (Number(item.price) || 0), 0),
)
const itemsVat = computed(() => itemsSubtotal.value * 0.12)
const itemsTotal = computed(() => itemsSubtotal.value + itemsVat.value)

const addItem = () => form.items.push({ name: '', unit: 'шт', qty: 1, price: 0 })
const removeItem = (index) => form.items.splice(index, 1)
const applyItemsTotal = () => {
  form.dogovor_sum = Math.round(itemsTotal.value * 100) / 100
  ElMessage.success(t('dogovorItemsTotalApplied'))
}

const openCreateDialog = () => {
  editing.value = null
  Object.assign(form, initialForm())
  dialogVisible.value = true
}

const openEditDialog = (row) => {
  editing.value = row
  Object.assign(form, {
    ...initialForm(),
    ...row,
    // JSONB null bo'lishi mumkin — tahrirlagichga doim massiv kerak
    items: Array.isArray(row.items) ? row.items.map((i) => ({ ...i })) : [],
    payment_date: row.payment_date ? String(row.payment_date).slice(0, 10) : '',
    dogovor_date: row.dogovor_date ? String(row.dogovor_date).slice(0, 10) : '',
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
    dogovor_number: form.dogovor_number || undefined,
    dogovor_date: form.dogovor_date,
    client_name: form.client_name.trim(),
    dogovor_sum: Number(form.dogovor_sum) || 0,
    dogovor_status: form.dogovor_status,
    client_inn: text(form.client_inn),
    payment_date: text(form.payment_date),
    initial_payment: form.initial_payment ?? undefined,
    prepayment_percent: form.prepayment_percent ?? undefined,
    client_phone: text(form.client_phone),
    manager_name: text(form.manager_name),
    client_address: text(form.client_address),
    contact_name: text(form.contact_name),
    contact_position: text(form.contact_position),
    client_bank: text(form.client_bank),
    client_account: text(form.client_account),
    client_mfo: text(form.client_mfo),
    client_vat_code: text(form.client_vat_code),
    items: form.items
      .filter((i) => i.name && String(i.name).trim())
      .map((i) => ({
        name: String(i.name).trim(),
        unit: i.unit ? String(i.unit).trim() : undefined,
        qty: Number(i.qty) || 0,
        price: Number(i.price) || 0,
      })),
    production_days: form.production_days ?? undefined,
    comment: text(form.comment),
  }
  if (isAdmin.value) payload.admin_comment = text(form.admin_comment)

  try {
    if (editing.value) {
      await dogovorStore.updateDogovor(editing.value.id, payload)
      ElMessage.success(t('dogovorMessageUpdated'))
    } else {
      await dogovorStore.createDogovor(payload)
      ElMessage.success(t('dogovorMessageSaved'))
    }
    dialogVisible.value = false
    await dogovorStore.getAllDogovors()
  } catch (error) {
    ElMessage.error(error?.response?.data?.message || t('dogovorMessageSaveError'))
  }
}

const handleDelete = async (id) => {
  try {
    await dogovorStore.deleteDogovor(id)
    ElMessage.success(t('dogovorMessageDeleted'))
    await dogovorStore.getAllDogovors()
  } catch (error) {
    ElMessage.error(error?.response?.data?.message || t('dogovorMessageDeleteError'))
  }
}

onMounted(async () => {
  try {
    if (!usersStore.currentUser) await usersStore.getUserInfo(currentUserId)
    await dogovorStore.getAllDogovors()
  } catch {
    ElMessage.error(t('dogovorMessageLoadError'))
  }
})
</script>

<style lang="scss" scoped>
.dogovor-container {
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
    max-width: 560px;
    line-height: 1.7;
  }
}

.header-actions {
  display: flex;
  align-items: center;
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
  font-size: 28px;
  font-weight: 700;
  color: #111827;

  &.stat-money {
    font-size: 22px;
  }
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
  transition: background 0.15s ease;

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
  -webkit-overflow-scrolling: touch;
}

.modern-table {
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;

  thead {
    background: linear-gradient(to bottom, #f9fafb 0%, #f3f4f6 100%);
    position: sticky;
    top: 0;
    z-index: 10;
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
    transition: background 0.2s ease;
    border-bottom: 1px solid #f3f4f6;

    &:hover {
      background: #f9fafb;
    }
  }

  td {
    padding: 14px 18px;
    color: #4b5563;
    font-size: 14px;
    vertical-align: middle;

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

.client-cell {
  min-width: 220px;
  max-width: 360px;
  white-space: normal;
  word-break: break-word;
}

.comment-cell {
  min-width: 200px;
  max-width: 360px;
  white-space: normal;
  overflow-wrap: break-word;
  word-break: break-word;
  line-height: 1.6;
}

.comment-filter-col {
  min-width: 200px;
}

.admin-col {
  background: #fffaf0;
}

.admin-comment-text {
  color: #b45309;
  font-style: italic;
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
  text-transform: uppercase;
  color: white;
  white-space: nowrap;
}

.status-open {
  background: #10b981;
}
.status-shipped {
  background: #6366f1;
}
.status-partly {
  background: #e6a23c;
}
.status-closed {
  background: #6b7280;
}
.status-default {
  background: #9ca3af;
}

.actions-cell {
  white-space: nowrap;
}

.actions-row {
  display: flex;
  gap: 4px;
  align-items: center;
}

.locked-hint {
  color: #9ca3af;
  font-size: 13px;
  cursor: default;
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
  align-items: center;
  color: #6b7280;
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

.skeleton-state {
  display: flex;
  justify-content: center;
}

.skeleton-card {
  width: 100%;
  padding: 34px;
  border-radius: 24px;
  background: #ffffff;
  border: 1px solid #e5e7eb;
}

/* ─── Bandlar tahrirlagichi ─────────────────────── */
.items-editor {
  width: 100%;
  border-collapse: collapse;
  margin-bottom: 10px;

  th {
    background: #f9fafb;
    font-size: 12px;
    font-weight: 600;
    color: #6b7280;
    text-align: left;
    padding: 8px 10px;
    border-bottom: 1px solid #e5e7eb;
  }

  td {
    padding: 6px 8px;
    border-bottom: 1px solid #f3f4f6;
    font-size: 13px;
  }

  .items-index {
    text-align: center;
    color: #9ca3af;
  }

  .items-total {
    text-align: right;
    font-weight: 600;
    color: #1f2937;
  }

  .items-empty {
    text-align: center;
    color: #9ca3af;
    padding: 14px;
  }
}

.items-actions {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
  margin-bottom: 6px;
}

.items-summary {
  font-size: 13px;
  color: #4b5563;
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

:deep(.dogovor-dialog .el-dialog) {
  border-radius: 16px;
}

@media (max-width: 768px) {
  .dogovor-container {
    padding: 18px 12px;
  }
}
</style>
