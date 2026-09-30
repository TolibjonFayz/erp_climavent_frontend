<template>
  <UiPage
    :title="$t('dogovorPageTitle')"
    :subtitle="isAdmin ? $t('dogovorPageSubtitle') : $t('dogovorPageSubtitleOwn')"
  >
    <template #actions>
      <el-upload
        class="dg-upload"
        :show-file-list="false"
        :before-upload="handleBeforeUpload"
        accept=".xlsx,.xls"
      >
        <el-button :icon="Upload" :loading="uploadLoading">
          {{ $t('dogovorButtonUploadFile') }}
        </el-button>
      </el-upload>
      <el-button :icon="Download" @click="exportExcel">{{ $t('dogovorExportExcel') }}</el-button>
      <el-button type="primary" :icon="Plus" @click="openCreateDialog">
        {{ $t('dogovorButtonAdd') }}
      </el-button>
    </template>

    <!-- Ko'rsatkichlar: bosilsa shu holat bo'yicha filtrlanadi -->
    <div class="dg-stats">
      <UiStat
        :label="$t('dogovorStatTotal')"
        :value="fmtNum(totalDogovors)"
        :sub="formatMoneyShort(totalSum)"
        clickable
        @click="filters.status = ''"
      />
      <UiStat
        v-for="st in statusStats"
        :key="st.value"
        :label="$t(st.labelKey)"
        :value="fmtNum(st.count)"
        :sub="formatMoneyShort(st.sum)"
        :tone="st.tone"
        clickable
        @click="filters.status = st.value"
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
      v-if="dogovorStore.error"
      type="error"
      show-icon
      :closable="false"
      :title="dogovorStore.error"
    />

    <!-- Filtrlar -->
    <UiToolbar v-if="dogovors.length">
      <UiField :label="$t('dogovorTableClient')" grow>
        <el-input
          v-model="filters.client"
          :prefix-icon="Search"
          clearable
          :placeholder="$t('dogovorFilterPlaceholder')"
        />
      </UiField>
      <UiField :label="$t('dogovorTableStatus')">
        <el-select
          v-model="filters.status"
          clearable
          :placeholder="$t('dogovorAllStatuses')"
          class="dg-select"
        >
          <el-option
            v-for="opt in statusOptions"
            :key="opt.value"
            :label="$t(opt.labelKey)"
            :value="opt.value"
          />
        </el-select>
      </UiField>
      <UiField :label="$t('dogovorTableManager')">
        <el-input
          v-model="filters.manager"
          clearable
          :placeholder="$t('dogovorFilterPlaceholder')"
          class="dg-select"
        />
      </UiField>
      <UiField :label="$t('dogovorTableComment')">
        <el-input
          v-model="filters.comment"
          clearable
          :placeholder="$t('dogovorFilterPlaceholder')"
          class="dg-select"
        />
      </UiField>

      <template v-if="moreFilters">
        <UiField
          v-for="f in extraFilters"
          :key="f.key"
          :label="$t(f.labelKey)"
          :hint="f.hint ? $t(f.hint) : ''"
        >
          <el-input
            v-model="filters[f.key]"
            clearable
            :placeholder="f.placeholder || $t('dogovorFilterPlaceholder')"
            class="dg-select-sm"
          />
        </UiField>
      </template>

      <template #actions>
        <el-button link type="primary" @click="moreFilters = !moreFilters">
          {{ moreFilters ? $t('kpLessFilters') : $t('kpMoreFilters') }}
          <span v-if="!moreFilters && hiddenFilterCount" class="dg-badge">{{
            hiddenFilterCount
          }}</span>
        </el-button>
      </template>
    </UiToolbar>

    <!-- Jadval -->
    <UiPanel v-if="dogovors.length || showSkeleton" flush>
      <template #title>
        {{ $t('dogovorListTitle') }}
        <span class="dg-count">{{ fmtNum(filteredDogovors.length) }}</span>
      </template>
      <template #actions>
        <el-button v-if="hasFilters" link type="primary" @click="resetFilters">
          {{ $t('dogovorResetFilters') }}
        </el-button>
      </template>

      <el-skeleton v-if="showSkeleton" :rows="6" animated class="dg-skeleton" />
      <el-table
        v-else
        :data="pagedDogovors"
        class="dg-table"
        :empty-text="$t('dogovorNoMatchDescription')"
      >
        <el-table-column type="index" :index="rowIndex" label="#" width="60" />
        <el-table-column :label="$t('dogovorTableNumber')" min-width="90">
          <template #default="{ row }">
            <span class="dg-strong">{{ row.dogovor_number ?? '—' }}</span>
          </template>
        </el-table-column>
        <el-table-column :label="$t('dogovorTableStatus')" min-width="150">
          <template #default="{ row }">
            <el-tag :type="statusTag(row.dogovor_status)" size="small" effect="light">
              {{ statusLabel(row.dogovor_status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column :label="$t('dogovorTableClient')" min-width="210">
          <template #default="{ row }">
            <span class="dg-strong">{{ row.client_name || '—' }}</span>
            <div v-if="row.client_inn" class="dg-sub">
              {{ $t('dogovorTableInn') }}: {{ row.client_inn }}
            </div>
          </template>
        </el-table-column>
        <el-table-column :label="$t('dogovorTableManager')" min-width="160">
          <template #default="{ row }">{{ row.manager_name || '—' }}</template>
        </el-table-column>
        <el-table-column :label="$t('dogovorTableDate')" min-width="110">
          <template #default="{ row }">{{ formatDate(row.dogovor_date) }}</template>
        </el-table-column>
        <el-table-column :label="$t('dogovorTablePaymentDate')" min-width="120">
          <template #default="{ row }">
            <span :class="{ 'dg-muted': !row.payment_date }">{{
              formatDate(row.payment_date)
            }}</span>
          </template>
        </el-table-column>
        <el-table-column :label="$t('dogovorTableSum')" min-width="150" align="right">
          <template #default="{ row }">
            <span class="dg-money">{{ fmtMoney(row.dogovor_sum) }}</span>
          </template>
        </el-table-column>
        <el-table-column :label="$t('dogovorTablePrepayment')" min-width="100" align="right">
          <template #default="{ row }">
            {{ row.prepayment_percent != null ? `${row.prepayment_percent}%` : '—' }}
          </template>
        </el-table-column>
        <el-table-column :label="$t('dogovorTablePhone')" min-width="150">
          <template #default="{ row }">
            <a v-if="row.client_phone" :href="telHref(row.client_phone)" class="dg-link">
              {{ row.client_phone }}
            </a>
            <span v-else class="dg-muted">—</span>
          </template>
        </el-table-column>
        <el-table-column :label="$t('dogovorTableComment')" min-width="190" show-overflow-tooltip>
          <template #default="{ row }">
            <span :class="{ 'dg-muted': !row.comment }">{{ row.comment || '—' }}</span>
          </template>
        </el-table-column>
        <el-table-column
          v-if="isAdmin"
          :label="$t('dogovorTableAdminComment')"
          min-width="170"
          show-overflow-tooltip
        >
          <template #default="{ row }">
            <span :class="row.admin_comment ? 'dg-admin-note' : 'dg-muted'">
              {{ row.admin_comment || '—' }}
            </span>
          </template>
        </el-table-column>
        <el-table-column width="120" align="right" fixed="right">
          <template #default="{ row }">
            <div class="dg-actions">
              <el-tooltip :content="$t('dogovorPrint')" placement="top">
                <el-button
                  link
                  :icon="Printer"
                  :aria-label="$t('dogovorPrint')"
                  @click="printDogovor(row)"
                />
              </el-tooltip>
              <template v-if="canModify(row)">
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
                  :title="$t('dogovorDeleteConfirm')"
                  width="240"
                  placement="top"
                  :confirm-button-text="t('deleteConfirm')"
                  :cancel-button-text="t('cancel')"
                  @confirm="handleDelete(row.id)"
                >
                  <template #reference>
                    <el-button link type="danger" :icon="Delete" :aria-label="$t('delete')" />
                  </template>
                </el-popconfirm>
              </template>
              <el-tooltip v-else :content="$t('dogovorLockedHint')" placement="left">
                <el-icon class="dg-lock"><Lock /></el-icon>
              </el-tooltip>
            </div>
          </template>
        </el-table-column>
      </el-table>

      <div v-if="filteredDogovors.length > pageSize" class="dg-pager">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :page-sizes="[20, 50, 100, 200]"
          :total="filteredDogovors.length"
          layout="total, sizes, prev, pager, next, jumper"
          background
        />
      </div>
    </UiPanel>

    <!-- Hali shartnoma yo'q -->
    <UiPanel v-else>
      <el-empty>
        <template #description>
          <h3 class="dg-empty-title">{{ $t('dogovorEmptyTitle') }}</h3>
          <p class="dg-muted">{{ $t('dogovorEmptyDescription') }}</p>
        </template>
        <el-button type="primary" :icon="Plus" @click="openCreateDialog">
          {{ $t('dogovorButtonAdd') }}
        </el-button>
      </el-empty>
    </UiPanel>

    <!-- Qo'shish / tahrirlash -->
    <el-dialog
      v-model="dialogVisible"
      :title="editing ? $t('edit') : $t('dogovorDialogTitle')"
      width="880px"
      append-to-body
      class="dogovor-dialog"
      destroy-on-close
    >
      <el-form ref="formRef" :model="form" :rules="formRules" label-position="top">
        <el-divider content-position="left">{{ $t('dogovorSectionMain') }}</el-divider>
        <el-row :gutter="18">
          <el-col :span="8">
            <el-form-item :label="$t('dogovorNumberLabel')" prop="dogovor_number">
              <el-input-number
                v-model="form.dogovor_number"
                :min="1"
                :controls="false"
                style="width: 100%"
              />
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
              <el-input-number
                v-model="form.dogovor_sum"
                :min="0"
                :controls="false"
                style="width: 100%"
              />
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
              <el-input-number
                v-model="form.initial_payment"
                :min="0"
                :controls="false"
                style="width: 100%"
              />
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
              <el-input-number
                v-model="form.production_days"
                :min="0"
                :controls="false"
                style="width: 100%"
              />
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
              <td>
                <el-input v-model="item.name" size="small" :placeholder="$t('dogovorItemName')" />
              </td>
              <td><el-input v-model="item.unit" size="small" placeholder="шт" /></td>
              <td>
                <el-input-number
                  v-model="item.qty"
                  :min="0"
                  :controls="false"
                  size="small"
                  style="width: 100%"
                />
              </td>
              <td>
                <el-input-number
                  v-model="item.price"
                  :min="0"
                  :controls="false"
                  size="small"
                  style="width: 100%"
                />
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
          <el-button size="small" :icon="Plus" @click="addItem">{{
            $t('dogovorAddItem')
          }}</el-button>
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
              <el-input
                v-model="form.comment"
                type="textarea"
                :rows="2"
                maxlength="500"
                show-word-limit
              />
            </el-form-item>
          </el-col>
          <el-col v-if="isAdmin" :span="24">
            <el-form-item
              :label="$t('dogovorAdminCommentLabel')"
              prop="admin_comment"
              class="admin-comment-field"
            >
              <el-input
                v-model="form.admin_comment"
                type="textarea"
                :rows="2"
                maxlength="400"
                show-word-limit
              />
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
  </UiPage>
</template>

<script setup>
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import * as XLSX from 'xlsx'
import { ElMessage } from 'element-plus'
import {
  Delete,
  Download,
  Edit,
  Lock,
  Plus,
  Printer,
  Search,
  Upload,
} from '@element-plus/icons-vue'
import UiPage from '@/components/ui/UiPage.vue'
import UiStat from '@/components/ui/UiStat.vue'
import UiToolbar from '@/components/ui/UiToolbar.vue'
import UiField from '@/components/ui/UiField.vue'
import UiPanel from '@/components/ui/UiPanel.vue'
import { fmtNum, formatDate, telHref } from '@/utils/format'
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
// Holat rangi: ochiq — ko'k, qisman — sariq, yuklangan — yashil, yopilgan — kulrang
const STATUS_TAG = { Open: 'primary', PartlyShipped: 'warning', Shipped: 'success', Closed: 'info' }
const statusTag = (status) => STATUS_TAG[status] || 'info'

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
const moreFilters = ref(false)

// "Ko'proq filtr" ortidagi maydonlar
const extraFilters = [
  { key: 'number', labelKey: 'dogovorTableNumber' },
  {
    key: 'date',
    labelKey: 'dogovorTableDate',
    placeholder: 'dd.mm.yyyy',
    hint: 'kpDateFilterHint',
  },
  {
    key: 'paymentDate',
    labelKey: 'dogovorTablePaymentDate',
    placeholder: 'dd.mm.yyyy',
    hint: 'kpDateFilterHint',
  },
  { key: 'sum', labelKey: 'dogovorTableSum' },
  { key: 'prepayment', labelKey: 'dogovorTablePrepayment' },
  { key: 'inn', labelKey: 'dogovorTableInn' },
  { key: 'phone', labelKey: 'dogovorTablePhone' },
]
if (isAdmin.value) extraFilters.push({ key: 'adminComment', labelKey: 'dogovorTableAdminComment' })

const filled = (v) => Boolean(String(v ?? '').trim())
const hiddenFilterCount = computed(
  () =>
    extraFilters.filter((f) => filled(filters[f.key])).length +
    (filled(filters.adminComment) && !isAdmin.value ? 1 : 0),
)
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
// Har holat: soni va summasi (ko'rsatkich kartalari uchun)
const STATUS_TONE = { Open: '', PartlyShipped: 'warn', Shipped: 'good', Closed: '' }
const statusStats = computed(() =>
  statusOptions.map((o) => {
    const list = dogovors.value.filter((d) => d.dogovor_status === o.value)
    return {
      ...o,
      tone: STATUS_TONE[o.value],
      count: list.length,
      sum: list.reduce((acc, d) => acc + (Number(d.dogovor_sum) || 0), 0),
    }
  }),
)
const showSkeleton = computed(() => dogovorStore.isLoading && !dogovors.value.length)

// ─── Formatlash ───
const formatMoney = (value) => {
  if (value === null || value === undefined || value === '') return '—'
  return new Intl.NumberFormat('uz-UZ', { maximumFractionDigits: 2 }).format(value)
}
// Jadval uchun: "13 090 872 so'm"
const fmtMoney = (value) => {
  if (value === null || value === undefined || value === '') return '—'
  return `${fmtNum(Math.round(Number(value)))} ${t('amoCurrency')}`
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
.dg-stats {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 12px;
}
.dg-select {
  width: 190px;
}
.dg-select-sm {
  width: 150px;
}
.dg-badge {
  margin-left: 4px;
  min-width: 18px;
  padding: 0 5px;
  font-size: 11px;
  line-height: 18px;
  color: white;
  background: var(--ui-link);
  border-radius: 999px;
}
.dg-count {
  margin-left: 4px;
  padding: 0 8px;
  font-size: 12px;
  font-weight: 600;
  line-height: 20px;
  color: var(--ui-muted);
  background: var(--ui-line-soft);
  border-radius: 999px;
}
.dg-skeleton {
  padding: 16px;
}
.dg-strong {
  font-weight: 600;
  color: var(--ui-ink);
}
.dg-sub {
  font-size: 12px;
  color: var(--ui-muted);
}
.dg-money {
  font-weight: 600;
  color: var(--ui-ink);
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}
.dg-link {
  color: var(--ui-link);
  text-decoration: none;
  font-variant-numeric: tabular-nums;
  &:hover {
    text-decoration: underline;
  }
}
.dg-muted {
  color: var(--ui-faint);
}
.dg-admin-note {
  color: var(--ui-warn);
}
.dg-actions {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}
.dg-lock {
  color: var(--ui-faint);
}
.dg-pager {
  display: flex;
  justify-content: flex-end;
  padding: 12px 16px;
  border-top: 1px solid var(--ui-line-soft);
}
.dg-empty-title {
  margin: 0 0 4px;
  font-size: 16px;
  color: var(--ui-ink);
}
.dg-table :deep(.el-table__cell) {
  padding: 10px 0;
}

@media (max-width: 1280px) {
  .dg-stats {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}
@media (max-width: 900px) {
  .dg-stats {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
  .dg-select,
  .dg-select-sm {
    width: 100%;
  }
}

/* ─── Qo'shish / tahrirlash dialogi (mahsulotlar jadvali) ─── */
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
</style>
