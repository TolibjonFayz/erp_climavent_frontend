<template>
  <UiPage :title="$t('loyihaPageTitle')" :subtitle="$t('loyihaPageSubtitle')">
    <template #actions>
      <el-button :icon="Download" @click="exportExcel">{{ $t('loyihaExportExcel') }}</el-button>
      <el-button type="primary" :icon="Plus" @click="openCreateDialog">
        {{ $t('loyihaButtonAdd') }}
      </el-button>
    </template>

    <!-- Ko'rsatkichlar -->
    <div class="ly-stats">
      <UiStat
        :label="$t('loyihaStatTotal')"
        :value="fmtNum(loyihas.length)"
        clickable
        @click="filters.status = ''"
      />
      <UiStat :label="$t('loyihaStatArea')" :value="`${formatNumber(totalArea)} m²`" />
      <UiStat
        :label="$t('loyihaStatusInProgress')"
        :value="fmtNum(statusCount.in_progress)"
        tone="warn"
        clickable
        @click="filters.status = 'in_progress'"
      />
      <UiStat
        :label="$t('loyihaStatusDone')"
        :value="fmtNum(statusCount.done)"
        tone="good"
        clickable
        @click="filters.status = 'done'"
      />
    </div>

    <el-alert
      v-if="loyihaStore.error"
      type="error"
      show-icon
      :closable="false"
      :title="loyihaStore.error"
    />

    <!-- Filtrlar -->
    <UiToolbar v-if="loyihas.length">
      <UiField :label="$t('loyihaTableManager')" grow>
        <el-input
          v-model="filters.manager"
          :prefix-icon="Search"
          clearable
          :placeholder="$t('loyihaFilterPlaceholder')"
        />
      </UiField>
      <UiField :label="$t('loyihaTableStatus')">
        <el-select
          v-model="filters.status"
          clearable
          :placeholder="$t('loyihaAllStatuses')"
          class="ly-select"
        >
          <el-option
            v-for="opt in statusOptions"
            :key="opt.value"
            :label="$t(opt.labelKey)"
            :value="opt.value"
          />
        </el-select>
      </UiField>
      <UiField :label="$t('loyihaTableSystem')">
        <el-input
          v-model="filters.system"
          clearable
          :placeholder="$t('loyihaFilterPlaceholder')"
          class="ly-select"
        />
      </UiField>
      <UiField :label="$t('loyihaTableDifficulty')">
        <el-select
          v-model="filters.difficulty"
          clearable
          :placeholder="$t('loyihaAllDifficulties')"
          class="ly-select-sm"
        >
          <el-option v-for="n in 10" :key="n" :label="`${n}/10`" :value="String(n)" />
        </el-select>
      </UiField>

      <template v-if="moreFilters">
        <UiField v-for="f in extraFilters" :key="f.key" :label="$t(f.labelKey)">
          <el-input
            v-model="filters[f.key]"
            clearable
            :placeholder="$t('loyihaFilterPlaceholder')"
            class="ly-select-sm"
          />
        </UiField>
      </template>

      <template #actions>
        <el-button link type="primary" @click="moreFilters = !moreFilters">
          {{ moreFilters ? $t('kpLessFilters') : $t('kpMoreFilters') }}
          <span v-if="!moreFilters && hiddenFilterCount" class="ly-badge">{{
            hiddenFilterCount
          }}</span>
        </el-button>
      </template>
    </UiToolbar>

    <!-- Jadval -->
    <UiPanel v-if="loyihas.length" flush>
      <template #title>
        {{ $t('loyihaListTitle') }}
        <span class="ly-count">{{ fmtNum(filteredLoyihas.length) }}</span>
      </template>
      <template #actions>
        <span class="ly-hint">{{ $t('loyihaRowClickHint') }}</span>
        <el-button v-if="hasFilters" link type="primary" @click="resetFilters">
          {{ $t('loyihaResetFilters') }}
        </el-button>
      </template>

      <el-table
        :data="pagedLoyihas"
        class="ly-table"
        :empty-text="$t('custNothingFound')"
        @row-click="openDetail"
      >
        <el-table-column type="index" :index="rowIndex" label="#" width="56" />
        <el-table-column :label="$t('loyihaTableNumber')" min-width="80">
          <template #default="{ row }">
            <span class="ly-id">{{ formatLoyihaId(row.order_number) }}</span>
          </template>
        </el-table-column>
        <el-table-column :label="$t('loyihaTableStatus')" min-width="120">
          <template #default="{ row }">
            <el-tag
              :type="row.status === 'done' ? 'success' : 'warning'"
              size="small"
              effect="light"
            >
              {{ $t(statusLabelKey(row.status)) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column :label="$t('loyihaTableManager')" min-width="170">
          <template #default="{ row }">
            <span class="ly-strong">{{ row.manager_name || '—' }}</span>
            <div v-if="row.other_source" class="ly-sub">
              {{ $t('loyihaTableOther') }}: {{ row.other_source }}
            </div>
          </template>
        </el-table-column>
        <el-table-column :label="$t('loyihaTableSystem')" min-width="170" show-overflow-tooltip>
          <template #default="{ row }">{{ row.system_info || '—' }}</template>
        </el-table-column>
        <el-table-column :label="$t('loyihaTableArea')" min-width="125" align="right">
          <template #default="{ row }">
            {{ row.area != null ? `${formatNumber(row.area)} m²` : '—' }}
          </template>
        </el-table-column>
        <el-table-column :label="$t('loyihaTableDifficulty')" min-width="100" align="center">
          <template #default="{ row }">
            <el-tag
              v-if="row.difficulty"
              :type="difficultyTag(row.difficulty)"
              size="small"
              effect="plain"
            >
              {{ row.difficulty }}/10
            </el-tag>
            <span v-else class="ly-muted">—</span>
          </template>
        </el-table-column>
        <el-table-column
          v-for="doc in docCols"
          :key="doc.key"
          :label="$t(doc.labelKey)"
          min-width="150"
        >
          <template #default="{ row }">
            <template
              v-if="row[`${doc.key}_number`] || row[`${doc.key}_sum`] || row[`${doc.key}_date`]"
            >
              <span v-if="row[`${doc.key}_number`]" class="ly-strong"
                >№{{ row[`${doc.key}_number`] }}</span
              >
              <div v-if="row[`${doc.key}_sum`]" class="ly-money">
                {{ formatMoney(row[`${doc.key}_sum`]) }} {{ $t('amoCurrency') }}
              </div>
              <div v-if="row[`${doc.key}_date`]" class="ly-sub">
                {{ formatDate(row[`${doc.key}_date`]) }}
              </div>
            </template>
            <span v-else class="ly-muted">—</span>
          </template>
        </el-table-column>
        <el-table-column :label="$t('loyihaTableContact')" min-width="180">
          <template #default="{ row }">
            <a
              v-if="row.contact_phone"
              :href="telHref(row.contact_phone)"
              class="ly-link"
              @click.stop
            >
              {{ row.contact_phone }}
            </a>
            <div v-if="row.contact_address" class="ly-sub">{{ row.contact_address }}</div>
            <span v-if="!row.contact_phone && !row.contact_address" class="ly-muted">—</span>
          </template>
        </el-table-column>
        <el-table-column :label="$t('loyihaTableComment')" min-width="180" show-overflow-tooltip>
          <template #default="{ row }">
            <span :class="{ 'ly-muted': !row.comment }">{{ row.comment || '—' }}</span>
          </template>
        </el-table-column>
        <el-table-column :label="$t('loyihaTableFiles')" min-width="110">
          <template #default="{ row }">
            <span class="ly-files">
              <el-tooltip :content="$t('loyihaArchiveSection')" placement="top">
                <span class="ly-file"
                  ><el-icon><Lock /></el-icon>{{ fileCount(row, 'archive') }}</span
                >
              </el-tooltip>
              <el-tooltip :content="$t('loyihaWorkingSection')" placement="top">
                <span class="ly-file"
                  ><el-icon><Folder /></el-icon>{{ fileCount(row, 'working') }}</span
                >
              </el-tooltip>
            </span>
          </template>
        </el-table-column>
        <el-table-column width="112" align="right" fixed="right">
          <template #default="{ row }">
            <div class="ly-actions" @click.stop>
              <el-tooltip :content="$t('loyihaOpenDetail')" placement="top">
                <el-button
                  link
                  :icon="View"
                  :aria-label="$t('loyihaOpenDetail')"
                  @click="openDetail(row)"
                />
              </el-tooltip>
              <el-tooltip :content="$t('edit')" placement="top">
                <el-button
                  link
                  type="primary"
                  :icon="EditPen"
                  :aria-label="$t('edit')"
                  @click="openEditDialog(row)"
                />
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
                  <el-button link type="danger" :icon="Delete" :aria-label="$t('delete')" />
                </template>
              </el-popconfirm>
            </div>
          </template>
        </el-table-column>
      </el-table>

      <div v-if="filteredLoyihas.length > pageSize" class="ly-pager">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :page-sizes="[20, 50, 100]"
          :total="filteredLoyihas.length"
          layout="total, sizes, prev, pager, next"
          background
        />
      </div>
    </UiPanel>

    <!-- Hali loyiha yo'q -->
    <UiPanel v-else>
      <el-empty>
        <template #description>
          <h3 class="ly-empty-title">{{ $t('loyihaEmptyTitle') }}</h3>
          <p class="ly-muted">{{ $t('loyihaEmptyDescription') }}</p>
        </template>
        <el-button type="primary" :icon="Plus" @click="openCreateDialog">
          {{ $t('loyihaButtonAdd') }}
        </el-button>
      </el-empty>
    </UiPanel>

    <LoyihaFormDialog v-model="dialogVisible" :model-value-data="editing" @saved="refresh" />
  </UiPage>
</template>

<script setup>
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import * as XLSX from 'xlsx'
import { ElMessage } from 'element-plus'
import {
  Delete,
  Download,
  EditPen,
  Folder,
  Lock,
  Plus,
  Search,
  View,
} from '@element-plus/icons-vue'
import UiPage from '@/components/ui/UiPage.vue'
import UiStat from '@/components/ui/UiStat.vue'
import UiToolbar from '@/components/ui/UiToolbar.vue'
import UiField from '@/components/ui/UiField.vue'
import UiPanel from '@/components/ui/UiPanel.vue'
import { fmtNum, telHref } from '@/utils/format'
import { useLoyihaStore } from '@/stores/loyiha'
import { useUsersStore } from '@/stores/user'
import LoyihaFormDialog from './LoyihaFormDialog.vue'
import {
  formatNumber,
  formatDate,
  formatMoney,
  formatLoyihaId,
  difficultyTag,
  statusLabelKey,
  LOYIHA_STATUS_OPTIONS,
} from '@/utils/loyihaFormat'

const { t } = useI18n()
const router = useRouter()
const loyihaStore = useLoyihaStore()
const usersStore = useUsersStore()

const loyihas = computed(() => loyihaStore.allLoyihas || [])
const currentUserId = Number(localStorage.getItem('userid'))

const statusOptions = LOYIHA_STATUS_OPTIONS
// KP va shartnoma ustunlari (raqam, summa, sana)
const docCols = [
  { key: 'kp', labelKey: 'loyihaTableKp' },
  { key: 'dogovor', labelKey: 'loyihaTableDogovor' },
]

// ─── Filtrlar ───
const filters = reactive({
  number: '',
  status: '',
  manager: '',
  other: '',
  system: '',
  area: '',
  difficulty: '',
  kp: '',
  dogovor: '',
  contact: '',
  comment: '',
})

const currentPage = ref(1)
const pageSize = ref(20)
const moreFilters = ref(false)

// "Ko'proq filtr" ortidagi maydonlar
const extraFilters = [
  { key: 'number', labelKey: 'loyihaTableNumber' },
  { key: 'other', labelKey: 'loyihaTableOther' },
  { key: 'area', labelKey: 'loyihaTableArea' },
  { key: 'kp', labelKey: 'loyihaTableKp' },
  { key: 'dogovor', labelKey: 'loyihaTableDogovor' },
  { key: 'contact', labelKey: 'loyihaTableContact' },
  { key: 'comment', labelKey: 'loyihaTableComment' },
]
const filled = (v) => Boolean(String(v ?? '').trim())
const hiddenFilterCount = computed(() => extraFilters.filter((f) => filled(filters[f.key])).length)
const hasFilters = computed(() => Object.values(filters).some(filled))
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

const contactText = (row) => [row.contact_phone, row.contact_address].filter(Boolean).join(' ')

const kpText = (row) => [row.kp_number, row.kp_sum, row.kp_date].filter(Boolean).join(' ')
const dogovorText = (row) =>
  [row.dogovor_number, row.dogovor_sum, row.dogovor_date].filter(Boolean).join(' ')

const filteredLoyihas = computed(() =>
  loyihas.value.filter(
    (row) =>
      // Loyiha id nol bilan ham qidirilsin ("0001" ham, "1" ham topsin)
      (textMatch(row.order_number, filters.number) ||
        textMatch(formatLoyihaId(row.order_number), filters.number)) &&
      (!filters.status || row.status === filters.status) &&
      textMatch(row.manager_name, filters.manager) &&
      textMatch(row.other_source, filters.other) &&
      textMatch(row.system_info, filters.system) &&
      textMatch(row.area, filters.area) &&
      (!filters.difficulty || String(row.difficulty) === filters.difficulty) &&
      textMatch(kpText(row), filters.kp) &&
      textMatch(dogovorText(row), filters.dogovor) &&
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
const statusCount = computed(() => ({
  in_progress: loyihas.value.filter((row) => row.status !== 'done').length,
  done: loyihas.value.filter((row) => row.status === 'done').length,
}))

const fileCount = (row, section) => (row.files || []).filter((f) => f.section === section).length

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
    [t('loyihaTableNumber')]: formatLoyihaId(row.order_number),
    [t('loyihaTableStatus')]: t(statusLabelKey(row.status)),
    [t('loyihaTableManager')]: row.manager_name || '—',
    [t('loyihaTableOther')]: row.other_source || '—',
    [t('loyihaTableSystem')]: row.system_info || '—',
    [t('loyihaTableArea')]: row.area ?? '—',
    [t('loyihaTableDifficulty')]: row.difficulty ?? '—',
    [t('loyihaKpNumberLabel')]: row.kp_number || '—',
    [t('loyihaKpSumLabel')]: row.kp_sum ?? '—',
    [t('loyihaKpDateLabel')]: row.kp_date || '—',
    [t('loyihaDogovorNumberLabel')]: row.dogovor_number || '—',
    [t('loyihaDogovorSumLabel')]: row.dogovor_sum ?? '—',
    [t('loyihaDogovorDateLabel')]: row.dogovor_date || '—',
    [t('loyihaPhoneLabel')]: row.contact_phone || '—',
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

<style scoped>
.ly-stats {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
}
.ly-select {
  width: 190px;
}
.ly-select-sm {
  width: 150px;
}
.ly-badge {
  margin-left: 4px;
  min-width: 18px;
  padding: 0 5px;
  font-size: 11px;
  line-height: 18px;
  color: white;
  background: var(--ui-link);
  border-radius: 999px;
}
.ly-count {
  margin-left: 4px;
  padding: 0 8px;
  font-size: 12px;
  font-weight: 600;
  line-height: 20px;
  color: var(--ui-muted);
  background: var(--ui-line-soft);
  border-radius: 999px;
}
.ly-hint {
  font-size: 12px;
  color: var(--ui-muted);
}
.ly-table :deep(.el-table__row) {
  cursor: pointer;
}
.ly-table :deep(.el-table__cell) {
  padding: 10px 0;
}
.ly-id {
  font-weight: 700;
  color: var(--ui-link);
  font-variant-numeric: tabular-nums;
}
.ly-strong {
  font-weight: 600;
  color: var(--ui-ink);
}
.ly-sub {
  font-size: 12px;
  color: var(--ui-muted);
}
.ly-money {
  font-size: 13px;
  color: var(--ui-ink-2);
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}
.ly-link {
  color: var(--ui-link);
  text-decoration: none;
  font-variant-numeric: tabular-nums;
}
.ly-link:hover {
  text-decoration: underline;
}
.ly-muted {
  color: var(--ui-faint);
}
.ly-files {
  display: inline-flex;
  gap: 10px;
}
.ly-file {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  font-size: 13px;
  color: var(--ui-ink-2);
}
.ly-file .el-icon {
  color: var(--ui-muted);
}
.ly-actions {
  display: inline-flex;
  gap: 4px;
}
.ly-pager {
  display: flex;
  justify-content: flex-end;
  padding: 12px 16px;
  border-top: 1px solid var(--ui-line-soft);
}
.ly-empty-title {
  margin: 0 0 4px;
  font-size: 16px;
  color: var(--ui-ink);
}

@media (max-width: 900px) {
  .ly-stats {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
  .ly-select,
  .ly-select-sm {
    width: 100%;
  }
}
</style>
