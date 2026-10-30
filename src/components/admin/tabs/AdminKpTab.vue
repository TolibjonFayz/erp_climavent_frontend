<template>
  <div class="adm-page">
    <div class="page-head">
      <span class="page-accent"></span>
      <h2 class="page-title">{{ $t('admKpTitle') }}</h2>
    </div>
    <div class="adm-toolbar">
      <span class="kp-filtered-count">{{ $t('admFoundN', { n: filtered.length }) }}</span>
      <button class="adm-reset-btn" @click="resetFilters">
        <el-icon><RefreshLeft /></el-icon> {{ $t('admResetFilters') }}
      </button>
      <button class="adm-reset-btn" style="margin-left: auto" :disabled="exporting" @click="exportKp">
        <el-icon v-if="!exporting"><Download /></el-icon>
        <el-icon v-else class="is-loading"><Loading /></el-icon>
        {{ $t('admExportExcel') }}
      </button>
    </div>
    <div v-loading="loading" class="tbl-wrap">
      <el-table :data="paged" stripe border style="width: 100%" :empty-text="$t('admNothingFound')">
        <el-table-column label="№" type="index" width="60" align="center" />
        <el-table-column prop="kp_number" :label="$t('admKpNumber')" width="110">
          <template #header><input v-model="filter.number" class="col-filter-admin" :placeholder="$t('admKpNumber')" /></template>
          <template #default="{ row }">{{ row.kp_number ?? '—' }}</template>
        </el-table-column>
        <el-table-column :label="$t('admStatus')" width="130">
          <template #header>
            <select v-model="filter.status" class="col-filter-admin">
              <option value="">{{ $t('admStatus') }}</option>
              <option v-for="opt in STATUSES" :key="opt.value" :value="opt.value">{{ $t(opt.key) }}</option>
            </select>
          </template>
          <template #default="{ row }">
            <el-tag :type="statusTag(row.kp_status)">{{ statusLabel(row.kp_status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="client_name" :label="$t('admClient')" min-width="160">
          <template #header><input v-model="filter.client" class="col-filter-admin" :placeholder="$t('admClient')" /></template>
        </el-table-column>
        <el-table-column prop="manager_name" :label="$t('admManager')" min-width="150">
          <template #header><input v-model="filter.manager" class="col-filter-admin" :placeholder="$t('admManager')" /></template>
        </el-table-column>
        <el-table-column prop="kp_date" :label="$t('admDate')" width="120">
          <template #header><input v-model="filter.date" class="col-filter-admin" :placeholder="$t('admDate')" /></template>
        </el-table-column>
        <el-table-column :label="$t('admClosedDate')" width="130">
          <template #header><input v-model="filter.closedDate" class="col-filter-admin" :placeholder="$t('admClosedDate')" /></template>
          <template #default="{ row }">{{ row.closed_date ?? '—' }}</template>
        </el-table-column>
        <el-table-column :label="$t('admSum')" width="140">
          <template #header><input v-model="filter.sum" class="col-filter-admin" :placeholder="$t('admSum')" /></template>
          <template #default="{ row }">{{ fmtNum(row.kp_sum ?? 0) }}</template>
        </el-table-column>
        <el-table-column :label="$t('admComment')" min-width="240" class-name="kp-wrap-col">
          <template #header>
            <select v-model="filter.comment" class="col-filter-admin">
              <option value="">{{ $t('admComment') }}</option>
              <option v-for="opt in KP_COMMENT_FILTER_OPTIONS" :key="opt" :value="opt">{{ opt }}</option>
            </select>
          </template>
          <template #default="{ row }">{{ row.comment || '—' }}</template>
        </el-table-column>
        <el-table-column :label="$t('admAdminComment')" min-width="200" class-name="kp-wrap-col">
          <template #header><input v-model="filter.adminComment" class="col-filter-admin" :placeholder="$t('admAdminComment')" /></template>
          <template #default="{ row }"><span class="kp-admin-comment">{{ row.admin_comment || '—' }}</span></template>
        </el-table-column>
        <el-table-column :label="$t('admCreatedBy')" min-width="150">
          <template #header><input v-model="filter.creator" class="col-filter-admin" :placeholder="$t('admCreatedBy')" /></template>
          <template #default="{ row }">{{ creatorName(row) }}</template>
        </el-table-column>
        <el-table-column :label="$t('admActions')" width="140" fixed="right">
          <template #default="{ row }">
            <el-button text size="small" :icon="Edit" @click="openEdit(row)">{{ $t('admEdit') }}</el-button>
            <el-button text size="small" type="danger" :icon="Delete" @click="remove(row)">{{ $t('admDelete') }}</el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>
    <div v-if="filtered.length > pageSize" class="kp-pagination-bar">
      <el-pagination
        v-model:current-page="page"
        v-model:page-size="pageSize"
        :page-sizes="[50, 100, 200, 500]"
        :total="filtered.length"
        layout="total, sizes, prev, pager, next, jumper"
        background
      />
    </div>

    <!-- ═══════ KP TAHRIRLASH ═══════ -->
    <el-dialog v-model="dialogVisible" :title="$t('admKpEditTitle')" width="720px" destroy-on-close>
      <el-form ref="formRef" :model="form" :rules="rules" label-position="top">
        <el-row :gutter="18">
          <el-col :span="12">
            <el-form-item :label="$t('admDocNumber')" prop="kp_number">
              <el-input-number v-model="form.kp_number" :min="1" :controls="false" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item :label="$t('admKpStatus')" prop="kp_status">
              <el-select v-model="form.kp_status" style="width: 100%">
                <el-option v-for="opt in STATUSES" :key="opt.value" :label="$t(opt.key)" :value="opt.value" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item :label="$t('admClientName')" prop="client_name">
              <el-input v-model="form.client_name" maxlength="120" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item :label="$t('admManagerName')" prop="manager_name">
              <el-input v-model="form.manager_name" maxlength="120" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item :label="$t('admKpDate')" prop="kp_date">
              <el-date-picker v-model="form.kp_date" type="date" format="YYYY-MM-DD" value-format="YYYY-MM-DD" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item :label="$t('admClosedDate')" prop="closed_date">
              <el-date-picker v-model="form.closed_date" type="date" format="YYYY-MM-DD" value-format="YYYY-MM-DD" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item :label="$t('admNextMeeting')" prop="dogovor_next">
              <el-date-picker v-model="form.dogovor_next" type="date" format="YYYY-MM-DD" value-format="YYYY-MM-DD" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item :label="$t('admSum')" prop="kp_sum">
              <el-input-number v-model="form.kp_sum" :min="0" :step="100" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item :label="$t('admComment')" prop="commentSelect">
              <el-select v-model="form.commentSelect" :placeholder="$t('admCommentPick')" filterable style="width: 100%">
                <el-option v-for="opt in KP_COMMENT_OPTIONS" :key="opt" :label="opt" :value="opt" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col v-if="form.commentSelect === CONTRACT_NUMBER_OPTION" :span="24">
            <el-form-item :label="$t('admContractNumber')" prop="contractNumber">
              <el-input v-model="form.contractNumber" :placeholder="$t('admContractNumberPh')" maxlength="60" />
            </el-form-item>
          </el-col>
          <el-col v-if="form.commentSelect === OTHER_COMMENT_OPTION" :span="24">
            <el-form-item :label="$t('admCommentWrite')" prop="customComment">
              <el-input v-model="form.customComment" type="textarea" rows="3" maxlength="400" show-word-limit />
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item :label="$t('admAdminCommentLong')" prop="admin_comment">
              <el-input
                v-model="form.admin_comment"
                type="textarea"
                rows="3"
                maxlength="400"
                show-word-limit
                class="admin-comment-textarea"
              />
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">{{ $t('cancel') }}</el-button>
        <el-button type="primary" :loading="loading" @click="save">{{ $t('save') }}</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { computed, reactive, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Delete, Download, Edit, Loading, RefreshLeft } from '@element-plus/icons-vue'
import { useKPsStore } from '@/stores/kp'
import { errorText } from '@/utils/errorText'
import { fmtNum } from '@/utils/format'
import {
  CONTRACT_NUMBER_OPTION,
  KP_COMMENT_FILTER_OPTIONS,
  KP_COMMENT_OPTIONS,
  OTHER_COMMENT_OPTION,
  commentMatchesFilter,
  deriveCommentForm,
  resolveCommentValue,
} from '@/constants/kpComments'
import { dateOrEmpty, exportSheet, useAdminAudit } from '../adminShared'

const { t } = useI18n()
const kpStore = useKPsStore()
const { addAuditLog } = useAdminAudit()

const STATUSES = [
  { value: 'Open', key: 'kpStatusOpen', tag: 'success' },
  { value: 'Negotiation', key: 'kpStatusNegotiation', tag: 'warning' },
  { value: 'Closed', key: 'kpStatusClosed', tag: 'info' },
]
const statusLabel = (s) => {
  const opt = STATUSES.find((o) => o.value === s)
  return opt ? t(opt.key) : s || '—'
}
const statusTag = (s) => STATUSES.find((o) => o.value === s)?.tag || 'info'
const creatorName = (row) => (row.creator ? `${row.creator.firstname} ${row.creator.lastname}` : '—')

// ─── Ustun filtrlari va sahifalash ───
const EMPTY_FILTER = {
  number: '',
  status: '',
  client: '',
  manager: '',
  date: '',
  closedDate: '',
  sum: '',
  comment: '',
  adminComment: '',
  creator: '',
}
const filter = reactive({ ...EMPTY_FILTER })
const page = ref(1)
const pageSize = ref(50)
function resetFilters() {
  Object.assign(filter, EMPTY_FILTER)
  page.value = 1
}
const has = (value, f) => !f.trim() || String(value ?? '').toLowerCase().includes(f.trim().toLowerCase())

// Backend KP'larni createdAt bo'yicha (yangilari birinchi) qaytaradi — shu tartibni saqlaymiz
const filtered = computed(() =>
  (kpStore.allKPs || []).filter(
    (kp) =>
      has(kp.kp_number, filter.number) &&
      (!filter.status || kp.kp_status === filter.status) &&
      has(kp.client_name, filter.client) &&
      has(kp.manager_name, filter.manager) &&
      has(kp.kp_date, filter.date) &&
      has(kp.closed_date, filter.closedDate) &&
      has(kp.kp_sum, filter.sum) &&
      commentMatchesFilter(kp.comment, filter.comment) &&
      has(kp.admin_comment, filter.adminComment) &&
      has(creatorName(kp), filter.creator),
  ),
)
const paged = computed(() => filtered.value.slice((page.value - 1) * pageSize.value, page.value * pageSize.value))
watch(
  () => ({ ...filter }),
  () => {
    page.value = 1
  },
)

// ─── Tahrirlash ───
const loading = ref(false)
const dialogVisible = ref(false)
const formRef = ref(null)
const editing = ref(null)
const form = reactive({
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
const req = (key, trigger = 'blur') => [{ required: true, message: t(key), trigger }]
const rules = {
  kp_status: req('admValKpStatus', 'change'),
  client_name: req('admValClient'),
  kp_date: req('admValKpDate', 'change'),
  manager_name: req('admValManager'),
  kp_sum: req('admValSum', 'change'),
}

function openEdit(row) {
  editing.value = row
  Object.assign(form, {
    kp_number: row.kp_number ?? null,
    kp_status: row.kp_status || 'Open',
    client_name: row.client_name || '',
    kp_date: row.kp_date || '',
    manager_name: row.manager_name || '',
    kp_sum: row.kp_sum ?? null,
    dogovor_next: row.dogovor_next || '',
    closed_date: row.closed_date || '',
    ...deriveCommentForm(row.comment),
    admin_comment: row.admin_comment || '',
  })
  dialogVisible.value = true
}

async function save() {
  if (!(await formRef.value?.validate().catch(() => false))) return
  loading.value = true
  try {
    await kpStore.updateKP(editing.value.id, {
      kp_number: form.kp_number || undefined,
      kp_status: form.kp_status,
      client_name: form.client_name.trim(),
      kp_date: form.kp_date,
      manager_name: form.manager_name.trim(),
      kp_sum: form.kp_sum,
      dogovor_next: form.dogovor_next || undefined,
      closed_date: form.closed_date || undefined,
      comment:
        resolveCommentValue({
          commentSelect: form.commentSelect,
          contractNumber: form.contractNumber,
          customComment: form.customComment,
        }) || undefined,
      admin_comment: form.admin_comment?.trim() || undefined,
    })
    await kpStore.getAllKPs()
    addAuditLog({
      action: 'edit',
      message: t('admLogKpEdited', { id: editing.value.id, c: form.client_name }),
      type: 'info',
      target_id: editing.value.id,
    })
    ElMessage.success(t('admKpUpdated'))
    dialogVisible.value = false
  } catch (e) {
    ElMessage.error(errorText(e, t('admKpUpdateError')))
  } finally {
    loading.value = false
  }
}

async function remove(row) {
  try {
    await ElMessageBox.confirm(
      t('admKpDeleteConfirm', { c: row.client_name, n: row.kp_number ?? row.id }),
      t('admConfirm'),
      { confirmButtonText: t('admYes'), cancelButtonText: t('cancel'), type: 'warning' },
    )
  } catch {
    return
  }
  loading.value = true
  try {
    await kpStore.deleteKP(row.id)
    await kpStore.getAllKPs()
    addAuditLog({
      action: 'delete',
      message: t('admLogKpDeleted', { id: row.id, c: row.client_name }),
      type: 'warning',
      target_id: row.id,
    })
    ElMessage.success(t('admKpDeleted'))
  } catch (e) {
    ElMessage.error(errorText(e, t('admKpDeleteError')))
  } finally {
    loading.value = false
  }
}

// ─── Excel ───
const exporting = ref(false)
function exportKp() {
  exporting.value = true
  try {
    const rows = (kpStore.allKPs || []).map((k, i) => ({
      '№': i + 1,
      ID: k.id,
      [t('admKpNumber')]: k.kp_number ?? '—',
      [t('admStatus')]: statusLabel(k.kp_status),
      [t('admClient')]: k.client_name ?? '—',
      [t('admManager')]: k.manager_name ?? '—',
      [t('admDate')]: k.kp_date ?? '—',
      [t('admClosedDate')]: k.closed_date ?? '—',
      [t('admNextMeeting')]: k.dogovor_next ?? '—',
      [t('admSum')]: k.kp_sum ?? 0,
      [t('admComment')]: k.comment ?? '—',
      [t('admAdminComment')]: k.admin_comment ?? '—',
      [t('admCreatedBy')]: creatorName(k),
      [t('admCreatedAt')]: dateOrEmpty(t, k.createdAt),
    }))
    if (!exportSheet(rows, 'KP', 'KP')) return ElMessage.warning(t('admNoDataToExport'))
    addAuditLog({ action: 'export', message: t('admLogExported', { x: 'KP', n: rows.length }), type: 'info' })
    ElMessage.success(t('admExported', { x: 'KP' }))
  } catch (e) {
    ElMessage.error(t('admExportError', { e: e.message }))
  } finally {
    exporting.value = false
  }
}
</script>
