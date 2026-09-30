<template>
  <UiPage :title="$t('yaqindaBorilganObyektlar')" :subtitle="$t('barchaobyektlarmalumotlari')">
    <template #actions>
      <el-button type="primary" :icon="Plus" @click="goToCreateSite">
        {{ $t('yangiQoshish') }}
      </el-button>
    </template>

    <!-- Ko'rsatkichlar -->
    <div class="sl-stats">
      <UiStat
        :label="$t('siteTotal')"
        :value="fmtNum(rows.length)"
        :sub="$t('siteWithContract', { n: fmtNum(withContract) })"
        clickable
        @click="resetFilters"
      />
      <UiStat
        :label="$t('today')"
        :hint="$t('siteHintAdded')"
        :value="fmtNum(added.today)"
        :sub="$t('siteAdded')"
        tone="good"
      />
      <UiStat
        :label="$t('thisWeek')"
        :hint="$t('siteHintAdded')"
        :value="fmtNum(added.week)"
        :sub="$t('siteAdded')"
      />
      <UiStat
        :label="$t('thisMonth')"
        :hint="$t('siteHintAdded')"
        :value="fmtNum(added.month)"
        :sub="$t('siteAdded')"
      />
    </div>

    <!-- Filtrlar -->
    <UiToolbar>
      <UiField :label="$t('custSearch')" grow>
        <el-input
          v-model="search"
          :prefix-icon="Search"
          clearable
          :placeholder="$t('siteSearchPh')"
        />
      </UiField>
      <UiField :label="$t('qayerga')">
        <el-select v-model="whereto" clearable :placeholder="$t('custAll')" class="sl-select">
          <el-option v-for="w in wheretoOptions" :key="w" :label="w" :value="w" />
        </el-select>
      </UiField>
      <UiField :label="$t('shartnomaKp')">
        <el-select v-model="contract" clearable :placeholder="$t('custAll')" class="sl-select">
          <el-option v-for="c in contractOptions" :key="c" :label="c" :value="c" />
        </el-select>
      </UiField>
    </UiToolbar>

    <!-- Jadval -->
    <UiPanel flush>
      <template #title>
        {{ $t('siteVisits') }}
        <span class="sl-count">{{ fmtNum(filtered.length) }}</span>
      </template>
      <template #actions>
        <el-button v-if="hasFilters" link type="primary" @click="resetFilters">
          {{ $t('custResetFilters') }}
        </el-button>
      </template>

      <el-table
        v-loading="loading"
        :data="pageRows"
        :default-sort="{ prop: 'created', order: 'descending' }"
        class="sl-table"
        @sort-change="onSort"
        @row-click="openDetail"
      >
        <el-table-column type="index" :index="rowIndex" label="#" width="56" />
        <el-table-column prop="whereto" :label="$t('qayerga')" min-width="200" sortable="custom">
          <template #default="{ row }">
            <span class="sl-strong">{{ row.whereto || '—' }}</span>
            <div v-if="row.company" class="sl-sub">{{ row.company }}</div>
          </template>
        </el-table-column>
        <el-table-column prop="gone" :label="$t('ketilganvaqt')" min-width="170" sortable="custom">
          <template #default="{ row }">{{ formatDateTime(row.gone) }}</template>
        </el-table-column>
        <el-table-column :label="$t('kelganvaqt')" min-width="150">
          <template #default="{ row }">
            <span v-if="row.came">{{ formatDateTime(row.came) }}</span>
            <el-tag v-else size="small" type="warning" effect="plain">{{
              $t('siteNotBack')
            }}</el-tag>
            <div v-if="row.came && row.gone" class="sl-sub">
              {{ formatSpan(row.gone, row.came, t) }}
            </div>
          </template>
        </el-table-column>
        <el-table-column :label="$t('shartnomaKp')" min-width="150">
          <template #default="{ row }">
            <el-tag v-if="row.contract" size="small" type="info" effect="plain">
              {{ row.contract }}
            </el-tag>
            <span v-else class="sl-muted">—</span>
          </template>
        </el-table-column>
        <el-table-column :label="$t('joylashuv')" min-width="170">
          <template #default="{ row }">{{ row.location || '—' }}</template>
        </el-table-column>
        <el-table-column
          prop="created"
          :label="$t('custCreated')"
          min-width="170"
          sortable="custom"
        >
          <template #default="{ row }">{{ formatDateTime(row.created) }}</template>
        </el-table-column>
        <el-table-column width="120" align="right" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click.stop="openDetail(row)">
              {{ $t('viewDetails') }} <el-icon class="sl-arrow"><ArrowRight /></el-icon>
            </el-button>
          </template>
        </el-table-column>

        <template #empty>
          <el-empty :description="hasFilters ? $t('custNothingFound') : $t('youhaventbeenyet')">
            <el-button v-if="hasFilters" @click="resetFilters">
              {{ $t('custResetFilters') }}
            </el-button>
            <el-button v-else type="primary" :icon="Plus" @click="goToCreateSite">
              {{ $t('firstobject') }}
            </el-button>
          </el-empty>
        </template>
      </el-table>

      <div v-if="filtered.length > pageSize" class="sl-pager">
        <el-pagination
          v-model:current-page="page"
          :page-size="pageSize"
          :total="filtered.length"
          layout="total, prev, pager, next"
          background
        />
      </div>
    </UiPanel>
  </UiPage>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { ArrowRight, Plus, Search } from '@element-plus/icons-vue'
import router from '@/router'
import { useComeAndGoesStore } from '@/stores/comeandgoes'
import UiPage from '@/components/ui/UiPage.vue'
import UiStat from '@/components/ui/UiStat.vue'
import UiToolbar from '@/components/ui/UiToolbar.vue'
import UiField from '@/components/ui/UiField.vue'
import UiPanel from '@/components/ui/UiPanel.vue'
import { countByPeriod, fmtNum, formatDateTime, formatSpan } from '@/utils/format'

const { t } = useI18n()
const comeandgoesStore = useComeAndGoesStore()
const loading = ref(false)

// Har bir yozuvning birinchi "ichki" qatori — tashrif ma'lumoti
const rows = computed(() =>
  (Array.isArray(comeandgoesStore.allComeAndGoesofUser)
    ? comeandgoesStore.allComeAndGoesofUser
    : []
  ).map((item) => {
    const v = item.comeAndGoInsides?.[0] || {}
    return {
      id: item.id,
      whereto: v.whereto || '',
      company: v.company_name || '',
      gone: v.when_gone || null,
      came: v.when_came || null,
      contract: v.dogovor_or_kp || '',
      location: v.locationname || '',
      created: v.createdAt || item.createdAt || null,
    }
  }),
)

const added = computed(() => countByPeriod(rows.value, (r) => r.created))
const withContract = computed(() => rows.value.filter((r) => r.contract).length)

// ─── Filtrlar ─────────────────────────────────────────────
const search = ref('')
const whereto = ref('')
const contract = ref('')

const uniq = (arr) => [...new Set(arr.filter(Boolean))].sort((a, b) => a.localeCompare(b))
const wheretoOptions = computed(() => uniq(rows.value.map((r) => r.whereto)))
const contractOptions = computed(() => uniq(rows.value.map((r) => r.contract)))

const hasFilters = computed(() => Boolean(search.value || whereto.value || contract.value))
function resetFilters() {
  search.value = ''
  whereto.value = ''
  contract.value = ''
}

const filtered = computed(() => {
  const q = search.value.trim().toLowerCase()
  return rows.value.filter((r) => {
    if (whereto.value && r.whereto !== whereto.value) return false
    if (contract.value && r.contract !== contract.value) return false
    if (!q) return true
    return [r.whereto, r.company, r.location, r.contract].some((v) =>
      String(v).toLowerCase().includes(q),
    )
  })
})

// ─── Saralash va sahifalash ───────────────────────────────
const sort = ref({ prop: 'created', order: 'descending' })
function onSort({ prop, order }) {
  sort.value = { prop, order }
}
const DATE_PROPS = ['gone', 'created']
const sorted = computed(() => {
  const { prop, order } = sort.value
  if (!prop || !order) return filtered.value
  const dir = order === 'ascending' ? 1 : -1
  return [...filtered.value].sort((a, b) => {
    if (DATE_PROPS.includes(prop)) return (new Date(a[prop] || 0) - new Date(b[prop] || 0)) * dir
    return String(a[prop] || '').localeCompare(String(b[prop] || '')) * dir
  })
})

const pageSize = 50
const page = ref(1)
watch([search, whereto, contract], () => (page.value = 1))
const pageRows = computed(() =>
  sorted.value.slice((page.value - 1) * pageSize, page.value * pageSize),
)
const rowIndex = (i) => (page.value - 1) * pageSize + i + 1

// ─── Amallar ──────────────────────────────────────────────
const goToCreateSite = () => router.push({ name: 'site-create' })
const openDetail = (row) => router.push({ name: 'site-detail', params: { id: row.id } })

onMounted(async () => {
  loading.value = true
  try {
    await comeandgoesStore.getComeAndGoesOfUser(Number(localStorage.getItem('userid')))
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>
.sl-stats {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
}
.sl-select {
  width: 200px;
}
.sl-count {
  margin-left: 4px;
  padding: 0 8px;
  font-size: 12px;
  font-weight: 600;
  line-height: 20px;
  color: var(--ui-muted);
  background: var(--ui-line-soft);
  border-radius: 999px;
}
.sl-table :deep(.el-table__row) {
  cursor: pointer;
}
.sl-strong {
  font-weight: 600;
  color: var(--ui-ink);
}
.sl-sub {
  font-size: 12px;
  color: var(--ui-muted);
}
.sl-muted {
  color: var(--ui-faint);
}
.sl-arrow {
  margin-left: 2px;
}
.sl-pager {
  display: flex;
  justify-content: flex-end;
  padding: 12px 16px;
  border-top: 1px solid var(--ui-line-soft);
}

@media (max-width: 900px) {
  .sl-stats {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
  .sl-select {
    width: 100%;
  }
}
</style>
