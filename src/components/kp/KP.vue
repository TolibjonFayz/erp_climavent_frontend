<template>
  <UiPage
    :title="$t('kpPageTitle')"
    :subtitle="isAdmin ? $t('kpPageSubtitle') : $t('kpPageSubtitleOwn')"
  >
    <template #actions>
      <el-upload
        class="kp-upload"
        :show-file-list="false"
        :before-upload="handleBeforeUpload"
        accept=".xlsx,.xls"
      >
        <el-button :icon="Upload" :loading="uploadLoading">
          {{ uploadLoading ? $t('kpUploading') : uploadButtonText }}
        </el-button>
      </el-upload>
      <el-button type="primary" :icon="Plus" @click="openCreateDialog">
        {{ $t('kpButtonAdd') }}
      </el-button>
    </template>

    <!-- Ko'rsatkichlar: bosilsa shu holat bo'yicha filtrlanadi -->
    <div class="kp-stats">
      <UiStat
        :label="$t('kpStatTotal')"
        :value="fmtNum(totalKPs)"
        :sub="fmtMoney(statusSum.all)"
        clickable
        @click="filterStatus = ''"
      />
      <UiStat
        :label="$t('kpStatOpen')"
        :value="fmtNum(statusCount.Open)"
        :sub="fmtMoney(statusSum.Open)"
        clickable
        @click="filterStatus = 'Open'"
      />
      <UiStat
        :label="$t('kpStatNegotiation')"
        :value="fmtNum(statusCount.Negotiation)"
        :sub="fmtMoney(statusSum.Negotiation)"
        tone="warn"
        clickable
        @click="filterStatus = 'Negotiation'"
      />
      <UiStat
        :label="$t('kpStatClosed')"
        :value="fmtNum(statusCount.Closed)"
        :sub="fmtMoney(statusSum.Closed)"
        tone="good"
        clickable
        @click="filterStatus = 'Closed'"
      />
    </div>

    <el-alert
      v-if="uploadError"
      type="warning"
      show-icon
      :title="uploadError"
      @close="uploadError = ''"
    />
    <el-alert
      v-if="kpStore.error"
      type="error"
      show-icon
      :closable="false"
      :title="kpStore.error"
    />

    <!-- Filtrlar -->
    <UiToolbar v-if="kps.length">
      <UiField :label="$t('kpTableClient')" grow>
        <el-input
          v-model="filterClient"
          :prefix-icon="Search"
          clearable
          :placeholder="$t('kpFilterPlaceholder')"
        />
      </UiField>
      <UiField :label="$t('kpTableStatus')">
        <el-select
          v-model="filterStatus"
          clearable
          :placeholder="$t('kpAllStatuses')"
          class="kp-select"
        >
          <el-option
            v-for="opt in statusOptions"
            :key="opt.value"
            :label="$t(opt.labelKey)"
            :value="opt.value"
          />
        </el-select>
      </UiField>
      <UiField :label="$t('kpTableManager')">
        <el-input
          v-model="filterManager"
          clearable
          :placeholder="$t('kpFilterPlaceholder')"
          class="kp-select"
        />
      </UiField>
      <UiField :label="$t('kpTableComment')">
        <el-select
          v-model="filterComment"
          clearable
          filterable
          :placeholder="$t('kpAllComments')"
          class="kp-select"
        >
          <el-option
            v-for="opt in KP_COMMENT_FILTER_OPTIONS"
            :key="opt"
            :label="opt"
            :value="opt"
          />
        </el-select>
      </UiField>

      <template v-if="moreFilters">
        <UiField :label="$t('kpTableNumber')">
          <el-input
            v-model="filterKpNumber"
            clearable
            :placeholder="$t('kpFilterPlaceholder')"
            class="kp-select-sm"
          />
        </UiField>
        <UiField :label="$t('kpTableDate')" :hint="$t('kpDateFilterHint')">
          <el-input
            v-model="filterKpDate"
            clearable
            placeholder="dd.mm.yyyy"
            class="kp-select-sm"
          />
        </UiField>
        <UiField :label="$t('kpTableClosedDate')" :hint="$t('kpDateFilterHint')">
          <el-input
            v-model="filterClosedDate"
            clearable
            placeholder="dd.mm.yyyy"
            class="kp-select-sm"
          />
        </UiField>
        <UiField :label="$t('kpTableSum')">
          <el-input
            v-model="filterSum"
            clearable
            :placeholder="$t('kpFilterPlaceholder')"
            class="kp-select-sm"
          />
        </UiField>
        <UiField v-if="isAdmin" :label="$t('kpTableAdminComment')">
          <el-input
            v-model="filterAdminComment"
            clearable
            :placeholder="$t('kpFilterPlaceholder')"
            class="kp-select"
          />
        </UiField>
      </template>

      <template #actions>
        <el-button link type="primary" @click="moreFilters = !moreFilters">
          {{ moreFilters ? $t('kpLessFilters') : $t('kpMoreFilters') }}
          <span v-if="!moreFilters && hiddenFilterCount" class="kp-badge">{{
            hiddenFilterCount
          }}</span>
        </el-button>
      </template>
    </UiToolbar>

    <!-- Jadval -->
    <UiPanel v-if="kps.length || showSkeleton" flush>
      <template #title>
        {{ $t('kpListTitle') }}
        <span class="kp-count">{{ fmtNum(filteredKps.length) }}</span>
      </template>
      <template #actions>
        <el-button v-if="hasFilters" link type="primary" @click="resetFilters">
          {{ $t('kpResetFilters') }}
        </el-button>
      </template>

      <el-skeleton v-if="showSkeleton" :rows="6" animated class="kp-skeleton" />
      <el-table v-else :data="pagedKps" class="kp-table" :empty-text="$t('kpNoMatchDescription')">
        <el-table-column type="index" :index="rowIndex" label="#" width="60" />
        <el-table-column :label="$t('kpTableNumber')" min-width="90">
          <template #default="{ row }">
            <span class="kp-num">{{ row.kp_number ?? '—' }}</span>
          </template>
        </el-table-column>
        <el-table-column :label="$t('kpTableStatus')" min-width="130">
          <template #default="{ row }">
            <el-tag :type="statusTag(row.kp_status || row.status)" size="small" effect="light">
              {{ statusLabel(row.kp_status || row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column :label="$t('kpTableClient')" min-width="200">
          <template #default="{ row }">
            <span class="kp-strong">{{ row.client_name || row.client || '—' }}</span>
          </template>
        </el-table-column>
        <el-table-column :label="$t('kpTableManager')" min-width="170">
          <template #default="{ row }">{{ row.manager_name || row.manager || '—' }}</template>
        </el-table-column>
        <el-table-column :label="$t('kpTableDate')" min-width="115">
          <template #default="{ row }">{{ formatDate(row.kp_date || row.kpDate) }}</template>
        </el-table-column>
        <el-table-column :label="$t('kpTableClosedDate')" min-width="125">
          <template #default="{ row }">
            <span :class="{ 'kp-muted': !row.closed_date }">{{ formatDate(row.closed_date) }}</span>
          </template>
        </el-table-column>
        <el-table-column :label="$t('kpTableSum')" min-width="150" align="right">
          <template #default="{ row }">
            <span class="kp-money">{{ fmtMoney(row.kp_sum || row.sum) }}</span>
          </template>
        </el-table-column>
        <el-table-column :label="$t('kpTableComment')" min-width="200" show-overflow-tooltip>
          <template #default="{ row }">
            <span :class="{ 'kp-muted': !row.comment }">{{ row.comment || '—' }}</span>
          </template>
        </el-table-column>
        <el-table-column
          v-if="isAdmin"
          :label="$t('kpTableAdminComment')"
          min-width="180"
          show-overflow-tooltip
        >
          <template #default="{ row }">
            <span :class="row.admin_comment ? 'kp-admin-note' : 'kp-muted'">
              {{ row.admin_comment || '—' }}
            </span>
          </template>
        </el-table-column>
        <el-table-column width="100" align="right" fixed="right">
          <template #default="{ row }">
            <div v-if="canModify(row)" class="kp-actions">
              <el-tooltip :content="$t('edit')" placement="top">
                <el-button
                  link
                  type="primary"
                  :icon="Edit"
                  :aria-label="$t('edit')"
                  @click="openEditDialog(row)"
                />
              </el-tooltip>
              <el-popconfirm
                :title="$t('kpDeleteConfirm')"
                width="240"
                placement="top"
                :confirm-button-text="t('deleteConfirm')"
                :cancel-button-text="t('cancel')"
                @confirm="handleDelete(row.id || row._id)"
              >
                <template #reference>
                  <el-button link type="danger" :icon="Delete" :aria-label="$t('delete')" />
                </template>
              </el-popconfirm>
            </div>
            <el-tooltip v-else :content="$t('kpLockedHint')" placement="left">
              <el-icon class="kp-lock"><Lock /></el-icon>
            </el-tooltip>
          </template>
        </el-table-column>
      </el-table>

      <div v-if="filteredKps.length > pageSize" class="kp-pager">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :page-sizes="[20, 50, 100, 200]"
          :total="filteredKps.length"
          layout="total, sizes, prev, pager, next, jumper"
          background
        />
      </div>
    </UiPanel>

    <!-- Hali KP yo'q -->
    <UiPanel v-else>
      <el-empty :description="$t('kpEmptyDescription')">
        <template #description>
          <h3 class="kp-empty-title">{{ $t('kpEmptyTitle') }}</h3>
          <p class="kp-muted">{{ $t('kpEmptyDescription') }}</p>
        </template>
        <el-button type="primary" :icon="Plus" @click="openCreateDialog">
          {{ $t('kpEmptyAction') }}
        </el-button>
      </el-empty>
    </UiPanel>

    <el-dialog
      v-model="dialogVisible"
      :title="editingKP ? $t('edit') : $t('kpDialogTitle')"
      width="720px"
      append-to-body
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
            <el-form-item
              :label="$t('kpAdminCommentLabel')"
              prop="admin_comment"
              class="admin-comment-field"
            >
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
  </UiPage>
</template>

<script setup>
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useKPsStore } from '@/stores/kp'
import { useUsersStore } from '@/stores/user'
import { ElMessage } from 'element-plus'
import { Delete, Edit, Lock, Plus, Search, Upload } from '@element-plus/icons-vue'
import UiPage from '@/components/ui/UiPage.vue'
import UiStat from '@/components/ui/UiStat.vue'
import UiToolbar from '@/components/ui/UiToolbar.vue'
import UiField from '@/components/ui/UiField.vue'
import UiPanel from '@/components/ui/UiPanel.vue'
import { fmtNum, formatDate } from '@/utils/format'
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
const moreFilters = ref(false)

// Yashirin (qo'shimcha) filtrlardan nechtasi to'ldirilgan — tugmada ko'rsatiladi
const hiddenFilterCount = computed(
  () =>
    [filterKpNumber, filterKpDate, filterClosedDate, filterSum, filterAdminComment].filter((f) =>
      String(f.value ?? '').trim(),
    ).length,
)
const hasFilters = computed(
  () =>
    hiddenFilterCount.value > 0 ||
    [filterStatus, filterClient, filterManager, filterComment].some((f) =>
      String(f.value ?? '').trim(),
    ),
)
const rowIndex = (i) => (currentPage.value - 1) * pageSize.value + i + 1

const textMatch = (value, filter) => {
  const f = String(filter ?? '')
    .trim()
    .toLowerCase()
  return (
    !f ||
    String(value ?? '')
      .toLowerCase()
      .includes(f)
  )
}

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
    uploadError.value = error?.response?.data?.message || error?.message || t('kpUploadError')
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

// Summa: "51 497 600 so'm"
const fmtMoney = (value) => {
  if (value === null || value === undefined || value === '') return '—'
  return `${fmtNum(Math.round(Number(value)))} ${t('amoCurrency')}`
}

// Holat rangi: ochiq — ko'k, muzokara — sariq, yopilgan — yashil
const STATUS_TAG = { open: 'primary', negotiation: 'warning', closed: 'success' }
const statusTag = (status) => STATUS_TAG[String(status || '').toLowerCase()] || 'info'

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
// Har holat bo'yicha umumiy summa
const statusSum = computed(() => {
  const res = { all: 0, Open: 0, Negotiation: 0, Closed: 0 }
  for (const kp of kps.value) {
    const sum = Number(kp.kp_sum || kp.sum) || 0
    res.all += sum
    const st = kp.kp_status || kp.status
    if (st in res) res[st] += sum
  }
  return res
})
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
      error?.response?.data?.message ||
      error?.message ||
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

<style scoped>
.kp-stats {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
}
.kp-select {
  width: 190px;
}
.kp-select-sm {
  width: 140px;
}
.kp-badge {
  margin-left: 4px;
  min-width: 18px;
  padding: 0 5px;
  font-size: 11px;
  line-height: 18px;
  color: white;
  background: var(--ui-link);
  border-radius: 999px;
}
.kp-count {
  margin-left: 4px;
  padding: 0 8px;
  font-size: 12px;
  font-weight: 600;
  line-height: 20px;
  color: var(--ui-muted);
  background: var(--ui-line-soft);
  border-radius: 999px;
}
.kp-skeleton {
  padding: 16px;
}
.kp-num {
  font-variant-numeric: tabular-nums;
  color: var(--ui-ink-2);
}
.kp-strong {
  font-weight: 600;
  color: var(--ui-ink);
}
.kp-money {
  font-weight: 600;
  color: var(--ui-ink);
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}
.kp-muted {
  color: var(--ui-faint);
}
.kp-admin-note {
  color: var(--ui-warn);
}
.kp-actions {
  display: inline-flex;
  gap: 4px;
}
.kp-lock {
  color: var(--ui-faint);
}
.kp-pager {
  display: flex;
  justify-content: flex-end;
  padding: 12px 16px;
  border-top: 1px solid var(--ui-line-soft);
}
.kp-empty-title {
  margin: 0 0 4px;
  font-size: 16px;
  color: var(--ui-ink);
}
.kp-table :deep(.el-table__cell) {
  padding: 10px 0;
}

@media (max-width: 900px) {
  .kp-stats {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
  .kp-select,
  .kp-select-sm {
    width: 100%;
  }
}
/* Qo'shish / tahrirlash dialogi */
.kp-form :deep(.el-form-item) {
  margin-bottom: 18px;
}
.admin-comment-field :deep(.el-textarea__inner) {
  border-color: #f59e0b;
  background: #fffaf0;
}
.admin-field-hint {
  display: block;
  margin-top: 4px;
  font-size: 12px;
  color: var(--ui-warn);
}
</style>
