<template>
  <UiPage :title="$t('mijozlarVaHamkorlar')" :subtitle="$t('mijozlarHamkorlarTable')">
    <template #actions>
      <el-button type="primary" :icon="Plus" @click="openAddDialog">
        {{ $t('yangiQoshish') }}
      </el-button>
    </template>

    <!-- Ko'rsatkichlar -->
    <div class="cl-stats">
      <UiStat
        :label="$t('custTotal')"
        :value="fmtNum(allPartners.length)"
        :sub="$t('custGroupsCount', { n: activeGroupsCount })"
        clickable
        @click="resetFilters"
      />
      <UiStat
        :label="$t('today')"
        :hint="$t('custHintAdded')"
        :value="fmtNum(addedToday)"
        :sub="$t('custAdded')"
        tone="good"
      />
      <UiStat
        :label="$t('thisWeek')"
        :hint="$t('custHintAdded')"
        :value="fmtNum(addedWeek)"
        :sub="$t('custAdded')"
      />
      <UiStat
        :label="$t('thisMonth')"
        :hint="$t('custHintAdded')"
        :value="fmtNum(addedMonth)"
        :sub="$t('custAdded')"
      />
    </div>

    <!-- Filtrlar -->
    <UiToolbar>
      <UiField :label="$t('guruh')" class="cl-groups-field">
        <div class="cl-groups">
          <button
            v-for="g in groups"
            :key="g.value"
            type="button"
            class="cl-group"
            :class="{ 'is-active': group === g.value }"
            @click="group = g.value"
          >
            {{ g.label }}
            <span class="cl-group__count">{{ g.count }}</span>
          </button>
        </div>
      </UiField>
      <UiField :label="$t('custSearch')" grow>
        <el-input
          v-model="search"
          :prefix-icon="Search"
          clearable
          :placeholder="$t('custSearchPh')"
        />
      </UiField>
      <UiField :label="$t('turi')">
        <el-select v-model="legalType" clearable :placeholder="$t('custAll')" class="cl-select">
          <el-option v-for="t in legalTypes" :key="t" :label="t" :value="t" />
        </el-select>
      </UiField>
      <UiField :label="$t('viloyat')">
        <el-select
          v-model="region"
          clearable
          filterable
          :placeholder="$t('custAll')"
          class="cl-select"
        >
          <el-option v-for="r in regions" :key="r.value" :label="r.label" :value="r.value" />
        </el-select>
      </UiField>
    </UiToolbar>

    <!-- Jadval -->
    <UiPanel flush>
      <template #title>
        {{ activeGroupLabel }}
        <span class="cl-count">{{ fmtNum(filtered.length) }}</span>
      </template>
      <template #actions>
        <el-button v-if="hasFilters" link type="primary" @click="resetFilters">
          {{ $t('custResetFilters') }}
        </el-button>
      </template>

      <el-table
        v-loading="loading"
        :data="pageRows"
        :default-sort="{ prop: 'createdAt', order: 'descending' }"
        class="cl-table"
        @sort-change="onSort"
        @row-click="openDetail"
      >
        <el-table-column type="index" :index="rowIndex" label="#" width="56" />
        <el-table-column prop="fullname" :label="$t('ism')" min-width="190" sortable="custom">
          <template #default="{ row }">
            <span class="cl-name">{{ row.fullname || '—' }}</span>
            <span v-if="group === 'all'" class="cl-group-tag">
              {{ partnerTypeLabel(row.partner_type) }}
            </span>
          </template>
        </el-table-column>
        <el-table-column :label="$t('telefon')" min-width="170">
          <template #default="{ row }">
            <a
              v-if="row.phone_number"
              :href="telHref(row.phone_number)"
              class="cl-phone"
              @click.stop
            >
              {{ row.phone_number }}
            </a>
            <span v-else class="cl-muted">—</span>
            <div v-if="row.additional_phone_number" class="cl-sub">
              <a :href="telHref(row.additional_phone_number)" class="cl-phone" @click.stop>
                {{ row.additional_phone_number }}
              </a>
            </div>
          </template>
        </el-table-column>
        <el-table-column :label="$t('custRegion')" min-width="200">
          <template #default="{ row }">
            <span>{{ regionLine(row) || '—' }}</span>
            <div v-if="row.republic" class="cl-sub">{{ formatLocationName(row.republic) }}</div>
          </template>
        </el-table-column>
        <el-table-column :label="$t('turi')" min-width="130">
          <template #default="{ row }">
            <el-tag
              v-if="row.mijozturi"
              :type="partnerTypeTag(row.mijozturi)"
              size="small"
              effect="plain"
            >
              {{ row.mijozturi }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="inn" :label="$t('inn')" min-width="110">
          <template #default="{ row }">{{ row.inn || '—' }}</template>
        </el-table-column>
        <el-table-column
          prop="createdAt"
          :label="$t('custCreated')"
          min-width="140"
          sortable="custom"
        >
          <template #default="{ row }">{{ formatDate(row.createdAt) }}</template>
        </el-table-column>
        <el-table-column width="120" align="right" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click.stop="openDetail(row)">
              {{ $t('viewDetails') }} <el-icon class="cl-arrow"><ArrowRight /></el-icon>
            </el-button>
          </template>
        </el-table-column>

        <template #empty>
          <el-empty :description="hasFilters ? $t('custNothingFound') : $t('hozirchamijozlaryoq')">
            <el-button v-if="hasFilters" @click="resetFilters">{{
              $t('custResetFilters')
            }}</el-button>
            <el-button v-else type="primary" :icon="Plus" @click="openAddDialog">
              {{ $t('yangiQoshish') }}
            </el-button>
          </el-empty>
        </template>
      </el-table>

      <div v-if="filtered.length > pageSize" class="cl-pager">
        <el-pagination
          v-model:current-page="page"
          :page-size="pageSize"
          :total="filtered.length"
          layout="total, prev, pager, next"
          background
        />
      </div>
    </UiPanel>

    <!-- Yangi mijoz qo'shish -->
    <el-dialog
      v-model="addDialogVisible"
      :title="$t('yangiMijozQoshishText')"
      width="640px"
      top="6vh"
      append-to-body
      destroy-on-close
    >
      <div class="cl-add-group">
        <span class="cl-add-group__label">{{ $t('guruh') }}</span>
        <el-select v-model="newGroup" class="cl-add-group__select">
          <el-option v-for="g in partnerGroups" :key="g.value" :label="g.label" :value="g.value" />
        </el-select>
      </div>
      <CustomerForm
        v-if="addDialogVisible"
        embedded
        @success="handleAddSuccess"
        @cancel="addDialogVisible = false"
      />
    </el-dialog>
  </UiPage>
</template>

<script setup>
import router from '@/router'
import { computed, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { usePartnersStore } from '@/stores/partners'
import { ArrowRight, Plus, Search } from '@element-plus/icons-vue'
import UiPage from '@/components/ui/UiPage.vue'
import UiStat from '@/components/ui/UiStat.vue'
import UiToolbar from '@/components/ui/UiToolbar.vue'
import UiField from '@/components/ui/UiField.vue'
import UiPanel from '@/components/ui/UiPanel.vue'
import CustomerForm from './CustomerForm.vue'
import { formatLocationName, partnerTypeLabel, partnerTypeTag } from '@/utils/partners'

const { t } = useI18n()
const partnersStore = usePartnersStore()

const loading = ref(false)
const addDialogVisible = ref(false)

// Guruhlar tartibi (partner_type) — yorliqlar i18n'dan
const PARTNER_GROUPS = [
  { value: 'doimiymijoz', labelKey: 'doimiymijoz' },
  { value: 'montajnik', labelKey: 'montajguruhlar' },
  { value: 'quruvchi', labelKey: 'quruvchi' },
  { value: 'dokonchitadbirkor', labelKey: 'dokonchitadbirkor' },
  { value: 'proyektinstitut', labelKey: 'proyektinstitut' },
  { value: 'tenderfirmalar', labelKey: 'tenderfirmalar' },
  { value: 'uks', labelKey: 'uks' },
  { value: 'boshqa', labelKey: 'boshqa' },
]
const partnerGroups = computed(() =>
  PARTNER_GROUPS.map((g) => ({ value: g.value, label: t(g.labelKey) })),
)

const allPartners = computed(() => partnersStore.allPartnersofUser || [])

// ─── Filtrlar ─────────────────────────────────────────────
const group = ref('all')
const search = ref('')
const legalType = ref('')
const region = ref('')

const countBy = computed(() => {
  const m = {}
  for (const p of allPartners.value) m[p.partner_type] = (m[p.partner_type] || 0) + 1
  return m
})
const groups = computed(() => [
  { value: 'all', label: t('custAll'), count: allPartners.value.length },
  ...partnerGroups.value.map((g) => ({ ...g, count: countBy.value[g.value] || 0 })),
])
const activeGroupsCount = computed(() => Object.keys(countBy.value).length)
const activeGroupLabel = computed(() => groups.value.find((g) => g.value === group.value)?.label)

const legalTypes = computed(() =>
  [...new Set(allPartners.value.map((p) => p.mijozturi).filter(Boolean))].sort(),
)
const regions = computed(() =>
  [...new Set(allPartners.value.map((p) => p.viloyat).filter(Boolean))]
    .map((v) => ({ value: v, label: formatLocationName(v) }))
    .sort((a, b) => a.label.localeCompare(b.label)),
)

const hasFilters = computed(
  () => group.value !== 'all' || Boolean(search.value || legalType.value || region.value),
)

function resetFilters() {
  group.value = 'all'
  search.value = ''
  legalType.value = ''
  region.value = ''
}

const digits = (s) => String(s || '').replace(/[^0-9]/g, '')

const filtered = computed(() => {
  const q = search.value.trim().toLowerCase()
  const qDigits = digits(q)
  return allPartners.value.filter((p) => {
    if (group.value !== 'all' && p.partner_type !== group.value) return false
    if (legalType.value && p.mijozturi !== legalType.value) return false
    if (region.value && p.viloyat !== region.value) return false
    if (!q) return true
    if (
      String(p.fullname || '')
        .toLowerCase()
        .includes(q)
    )
      return true
    if (qDigits.length >= 3) {
      return [p.phone_number, p.additional_phone_number, p.inn].some((v) =>
        digits(v).includes(qDigits),
      )
    }
    return false
  })
})

// ─── Saralash va sahifalash ───────────────────────────────
const sort = ref({ prop: 'createdAt', order: 'descending' })
function onSort({ prop, order }) {
  sort.value = { prop, order }
}

const sorted = computed(() => {
  const { prop, order } = sort.value
  if (!prop || !order) return filtered.value
  const dir = order === 'ascending' ? 1 : -1
  return [...filtered.value].sort((a, b) => {
    const x = a[prop] ?? ''
    const y = b[prop] ?? ''
    if (prop === 'createdAt') return (new Date(x) - new Date(y)) * dir
    return String(x).localeCompare(String(y)) * dir
  })
})

const pageSize = 50
const page = ref(1)
watch([group, search, legalType, region], () => (page.value = 1))
const pageRows = computed(() =>
  sorted.value.slice((page.value - 1) * pageSize, page.value * pageSize),
)
const rowIndex = (i) => (page.value - 1) * pageSize + i + 1

// ─── Ko'rsatkichlar ───────────────────────────────────────
const startOfDay = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate())
const countSince = (since) =>
  allPartners.value.filter((p) => p.createdAt && new Date(p.createdAt) >= since).length

const addedToday = computed(() => countSince(startOfDay(new Date())))
const addedWeek = computed(() => {
  // Hafta dushanbadan boshlanadi
  const d = startOfDay(new Date())
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7))
  return countSince(d)
})
const addedMonth = computed(() => {
  const now = new Date()
  return countSince(new Date(now.getFullYear(), now.getMonth(), 1))
})

// ─── Formatlash ───────────────────────────────────────────
const numberFmt = new Intl.NumberFormat('ru-RU')
const fmtNum = (n) => numberFmt.format(n || 0)
const pad = (n) => String(n).padStart(2, '0')
function formatDate(value) {
  if (!value) return '—'
  const d = new Date(value)
  return `${pad(d.getDate())}.${pad(d.getMonth() + 1)}.${d.getFullYear()}`
}
const regionLine = (p) =>
  [p.viloyat, p.shahar_tuman].filter(Boolean).map(formatLocationName).join(', ')
const telHref = (phone) => {
  const d = digits(phone)
  return d ? `tel:+${d.length === 9 ? `998${d}` : d}` : undefined
}

// ─── Amallar ──────────────────────────────────────────────
function openDetail(row) {
  router.push({ name: 'customer-detail', params: { id: row.id } })
}

// Forma partner_type'ni localStorage'dan o'qiydi — tanlangan guruh shu yerga yoziladi
const newGroup = ref('doimiymijoz')
watch(newGroup, (v) => localStorage.setItem('mijozTur', v))

function openAddDialog() {
  newGroup.value = group.value !== 'all' ? group.value : 'doimiymijoz'
  localStorage.setItem('mijozTur', newGroup.value)
  addDialogVisible.value = true
}

async function reload() {
  loading.value = true
  try {
    await partnersStore.getAllPartnersOfUser(Number(localStorage.getItem('userid')))
  } finally {
    loading.value = false
  }
}

async function handleAddSuccess() {
  addDialogVisible.value = false
  await reload()
}

onMounted(reload)
</script>

<style scoped>
.cl-stats {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
}

/* Guruh tanlash — yorliq + son */
.cl-groups-field {
  flex: 1 1 100%;
}
.cl-groups {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}
.cl-group {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 30px;
  padding: 0 10px;
  font: inherit;
  font-size: 13px;
  color: var(--ui-ink-2);
  background: var(--ui-surface);
  border: 1px solid var(--ui-line);
  border-radius: 999px;
  cursor: pointer;
  transition:
    border-color 0.15s,
    background 0.15s;
}
.cl-group:hover {
  border-color: #bfdbfe;
}
.cl-group.is-active {
  background: var(--ui-link-soft);
  border-color: var(--ui-link);
  color: var(--ui-link);
  font-weight: 600;
}
.cl-group:focus-visible {
  outline: 2px solid var(--ui-link);
  outline-offset: 2px;
}
.cl-group__count {
  min-width: 20px;
  padding: 0 6px;
  font-size: 11px;
  font-weight: 600;
  line-height: 18px;
  text-align: center;
  color: var(--ui-muted);
  background: var(--ui-line-soft);
  border-radius: 999px;
}
.cl-group.is-active .cl-group__count {
  color: white;
  background: var(--ui-link);
}
.cl-select {
  width: 190px;
}

.cl-count {
  margin-left: 4px;
  padding: 0 8px;
  font-size: 12px;
  font-weight: 600;
  line-height: 20px;
  color: var(--ui-muted);
  background: var(--ui-line-soft);
  border-radius: 999px;
}

/* Jadval */
.cl-table :deep(.el-table__row) {
  cursor: pointer;
}
.cl-name {
  font-weight: 600;
  color: var(--ui-ink);
}
.cl-group-tag {
  display: block;
  font-size: 12px;
  color: var(--ui-muted);
}
.cl-phone {
  color: var(--ui-link);
  text-decoration: none;
  font-variant-numeric: tabular-nums;
}
.cl-phone:hover {
  text-decoration: underline;
}
.cl-sub {
  font-size: 12px;
  color: var(--ui-muted);
}
.cl-muted {
  color: var(--ui-faint);
}
.cl-arrow {
  margin-left: 2px;
}
.cl-pager {
  display: flex;
  justify-content: flex-end;
  padding: 12px 16px;
  border-top: 1px solid var(--ui-line-soft);
}

/* Qo'shish dialogidagi guruh tanlovi */
.cl-add-group {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
  padding: 10px 12px;
  background: var(--ui-surface-2);
  border: 1px solid var(--ui-line);
  border-radius: var(--ui-radius);
}
.cl-add-group__label {
  font-size: 11px;
  font-weight: 600;
  color: var(--ui-muted);
  text-transform: uppercase;
  letter-spacing: 0.04em;
}
.cl-add-group__select {
  flex: 1;
}

@media (max-width: 900px) {
  .cl-stats {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
  .cl-select {
    width: 100%;
  }
}
</style>
