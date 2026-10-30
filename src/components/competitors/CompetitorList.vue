<template>
  <UiPage :title="$t('raqibtext')" :subtitle="$t('compSubtitle')" wide>
    <template #actions>
      <el-button :icon="Plus" @click="openCompetitor(null)">{{ $t('cmpAdd') }}</el-button>
      <el-button type="primary" :icon="Plus" :disabled="!competitors.length" @click="openEncounter(null)">
        {{ $t('cmpEncAdd') }}
      </el-button>
    </template>

    <div v-loading="loading" class="cmp">
      <div class="cmp-stats">
        <UiStat :label="$t('cmpStatCompetitors')" :value="fmtNum(competitors.length)" />
        <UiStat
          :label="$t('cmpStatEncounters')"
          :value="fmtNum(totals.total)"
          :sub="$t('cmpStatPending', { n: totals.pending })"
        />
        <UiStat
          :label="$t('cmpStatWinRate')"
          :hint="$t('cmpStatWinRateHint')"
          :tone="rate === null ? '' : rate >= 50 ? 'good' : 'bad'"
          :value="rate === null ? '—' : `${rate}%`"
          :sub="$t('cmpStatWonLost', { won: totals.won, lost: totals.lost })"
        />
        <UiStat
          :label="$t('cmpStatTop')"
          :value="top ? top.name : '—'"
          money
          :sub="top ? $t('cmpStatTopSub', { n: top.stats.total }) : ''"
        />
      </div>

      <el-empty v-if="!loading && !competitors.length" :description="$t('cmpEmpty')">
        <el-button type="primary" :icon="Plus" @click="openCompetitor(null)">{{ $t('cmpAdd') }}</el-button>
      </el-empty>

      <UiPanel v-else flush>
        <el-tabs v-model="tab" class="cmp-tabs">
          <!-- Raqiblar -->
          <el-tab-pane :label="$t('cmpTabCompetitors')" name="list">
            <el-table :data="competitors" size="small" @row-click="openDetail">
              <el-table-column prop="name" :label="$t('cmpName')" min-width="200">
                <template #default="{ row }">
                  <b>{{ row.name }}</b>
                  <div v-if="row.brands" class="cmp-sub">{{ row.brands }}</div>
                </template>
              </el-table-column>
              <el-table-column :label="$t('cmpStatEncounters')" width="120" align="center">
                <template #default="{ row }">{{ row.stats.total }}</template>
              </el-table-column>
              <el-table-column :label="$t('cmpWonLost')" width="140" align="center">
                <template #default="{ row }">
                  <span class="cmp-good">{{ row.stats.won }}</span> /
                  <span class="cmp-bad">{{ row.stats.lost }}</span>
                </template>
              </el-table-column>
              <el-table-column :label="$t('cmpStatWinRate')" width="130" align="center">
                <template #default="{ row }">{{ fmtRate(winRate(row.stats)) }}</template>
              </el-table-column>
              <el-table-column :label="$t('cmpPriceGap')" width="160" align="center">
                <template #default="{ row }">
                  <span
                    v-if="row.stats.avg_price_gap_pct !== null"
                    :class="row.stats.avg_price_gap_pct > 0 ? 'cmp-bad' : 'cmp-good'"
                  >
                    {{ row.stats.avg_price_gap_pct > 0 ? '+' : '' }}{{ row.stats.avg_price_gap_pct }}%
                  </span>
                  <span v-else>—</span>
                </template>
              </el-table-column>
              <el-table-column :label="$t('cmpLastEncounter')" width="140">
                <template #default="{ row }">{{ row.stats.last_date ? formatDate(row.stats.last_date) : '—' }}</template>
              </el-table-column>
            </el-table>
          </el-tab-pane>

          <!-- Uchrashuvlar -->
          <el-tab-pane :label="`${$t('cmpTabEncounters')} · ${encounters.length}`" name="encounters">
            <div class="cmp-filters">
              <el-select v-model="filterCompetitor" clearable filterable :placeholder="$t('cmpAllCompetitors')">
                <el-option v-for="c in competitors" :key="c.id" :label="c.name" :value="c.id" />
              </el-select>
              <el-select v-model="filterOutcome" clearable :placeholder="$t('cmpAllOutcomes')">
                <el-option v-for="o in OUTCOMES" :key="o.value" :label="$t(o.labelKey)" :value="o.value" />
              </el-select>
            </div>
            <EncountersTable
              :rows="filteredEncounters"
              :show-author="isAdmin"
              @edit="openEncounter"
              @delete="removeEncounter"
            />
          </el-tab-pane>

          <!-- Sabablar -->
          <el-tab-pane :label="$t('cmpTabReasons')" name="reasons">
            <div class="cmp-reasons">
              <div v-for="side in reasonSides" :key="side.outcome" class="cmp-reasons__col">
                <h4>{{ $t(side.titleKey) }} · {{ side.total }}</h4>
                <p v-if="!side.total" class="cmp-sub">{{ $t('cmpNoData') }}</p>
                <div v-for="r in side.rows" :key="r.reason" class="cmp-bar">
                  <span class="cmp-bar__label">{{ $t(`cmpReason_${r.reason}`) }}</span>
                  <div class="cmp-bar__track">
                    <div class="cmp-bar__fill" :class="`is-${side.outcome}`" :style="{ width: `${r.pct}%` }" />
                  </div>
                  <span class="cmp-bar__num">{{ r.count }} · {{ r.pct }}%</span>
                </div>
              </div>
            </div>
          </el-tab-pane>
        </el-tabs>
      </UiPanel>
    </div>

    <!-- Raqib tafsiloti -->
    <el-drawer v-model="detailOpen" :title="selected?.name" size="640px" append-to-body>
      <template v-if="selected">
        <UiInfoList :items="detailItems" />
        <div class="cmp-detail-actions">
          <el-button :icon="Edit" :disabled="!canEditCompetitor(selected)" @click="openCompetitor(selected)">
            {{ $t('edit') }}
          </el-button>
          <el-button type="primary" :icon="Plus" @click="openEncounter(null, { competitor_id: selected.id })">
            {{ $t('cmpEncAdd') }}
          </el-button>
          <el-button v-if="isAdmin" type="danger" plain :icon="Delete" @click="removeCompetitor(selected)">
            {{ $t('delete') }}
          </el-button>
        </div>
        <h4 class="cmp-detail-title">{{ $t('cmpTabEncounters') }}</h4>
        <EncountersTable
          :rows="encounters.filter((e) => e.competitor_id === selected.id)"
          :show-competitor="false"
          @edit="openEncounter"
          @delete="removeEncounter"
        />
      </template>
    </el-drawer>

    <CompetitorDialog v-model="competitorDialog" :competitor="editingCompetitor" @saved="onCompetitorSaved" />
    <EncounterDialog
      v-model="encounterDialog"
      :competitors="competitors"
      :encounter="editingEncounter"
      :preset="encounterPreset"
      @saved="load"
    />
  </UiPage>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Delete, Edit, Plus } from '@element-plus/icons-vue'
import competitorsApi from '@/api/competitors'
import { useUsersStore } from '@/stores/user'
import { errorText } from '@/utils/errorText'
import { fmtNum, formatDate } from '@/utils/format'
import UiPage from '@/components/ui/UiPage.vue'
import UiPanel from '@/components/ui/UiPanel.vue'
import UiStat from '@/components/ui/UiStat.vue'
import UiInfoList from '@/components/ui/UiInfoList.vue'
import CompetitorDialog from './CompetitorDialog.vue'
import EncounterDialog from './EncounterDialog.vue'
import EncountersTable from './EncountersTable.vue'
import { OUTCOMES, REASONS, winRate } from './competitorFormat'

// Raqiblar: kimga va nima uchun yutqazyapmiz. Katalog umumiy; uchrashuvlar (va statistika)
// oddiy xodim uchun faqat o'zi kiritganlari bo'yicha — backend shunday qaytaradi.
const { t } = useI18n()
const usersStore = useUsersStore()
const isAdmin = computed(() => !!usersStore.currentUser?.is_admin)

const loading = ref(false)
const tab = ref('list')
const competitors = ref([])
const encounters = ref([])

async function load() {
  loading.value = true
  try {
    const [list, enc] = await Promise.all([competitorsApi.list(), competitorsApi.encounters()])
    competitors.value = list || []
    encounters.value = enc || []
    if (selected.value) selected.value = competitors.value.find((c) => c.id === selected.value.id) || null
  } catch (err) {
    ElMessage.error(errorText(err, t('xatolikYuzBerdi')))
  } finally {
    loading.value = false
  }
}
onMounted(load)

// ─── Ko'rsatkichlar ───
const totals = computed(() =>
  competitors.value.reduce(
    (s, c) => ({
      total: s.total + c.stats.total,
      won: s.won + c.stats.won,
      lost: s.lost + c.stats.lost,
      pending: s.pending + c.stats.pending,
    }),
    { total: 0, won: 0, lost: 0, pending: 0 },
  ),
)
const rate = computed(() => winRate(totals.value))
const top = computed(() =>
  [...competitors.value].filter((c) => c.stats.total).sort((a, b) => b.stats.total - a.stats.total)[0],
)
const fmtRate = (r) => (r === null ? '—' : `${r}%`)

// ─── Uchrashuvlar filtri ───
const filterCompetitor = ref(null)
const filterOutcome = ref(null)
const filteredEncounters = computed(() =>
  encounters.value.filter(
    (e) =>
      (!filterCompetitor.value || e.competitor_id === filterCompetitor.value) &&
      (!filterOutcome.value || e.outcome === filterOutcome.value),
  ),
)

// ─── Sabablar: yutqazganda va yutganda nima hal qildi ───
const reasonSides = computed(() =>
  [
    { outcome: 'lost', titleKey: 'cmpReasonsLost' },
    { outcome: 'won', titleKey: 'cmpReasonsWon' },
  ].map((side) => {
    const list = encounters.value.filter((e) => e.outcome === side.outcome)
    const total = list.length
    const rows = REASONS.map((reason) => {
      const count = list.filter((e) => (e.reason || 'other') === reason).length
      return { reason, count, pct: total ? Math.round((count / total) * 100) : 0 }
    })
      .filter((r) => r.count)
      .sort((a, b) => b.count - a.count)
    return { ...side, total, rows }
  }),
)

// ─── Tafsilot ───
const detailOpen = ref(false)
const selected = ref(null)
function openDetail(row) {
  selected.value = row
  detailOpen.value = true
}
const detailItems = computed(() => {
  const c = selected.value
  return [
    { key: 'brands', label: t('cmpBrands'), value: c.brands },
    { key: 'website', label: t('cmpWebsite'), value: c.website },
    { key: 'phone', label: t('telefon'), value: c.phone },
    { key: 'strengths', label: t('cmpStrengths'), value: c.strengths },
    { key: 'weaknesses', label: t('cmpWeaknesses'), value: c.weaknesses },
    { key: 'note', label: t('cmpNote'), value: c.note },
    {
      key: 'stats',
      label: t('cmpStatEncounters'),
      value: `${c.stats.total} · ${t('cmpStatWonLost', { won: c.stats.won, lost: c.stats.lost })}`,
    },
  ]
})
const canEditCompetitor = (c) => isAdmin.value || Number(c.created_by) === Number(usersStore.currentUser?.id)

// ─── Dialoglar ───
const competitorDialog = ref(false)
const editingCompetitor = ref(null)
function openCompetitor(c) {
  editingCompetitor.value = c
  competitorDialog.value = true
}
async function onCompetitorSaved() {
  await load()
}

const encounterDialog = ref(false)
const editingEncounter = ref(null)
const encounterPreset = ref({})
function openEncounter(e, preset = {}) {
  editingEncounter.value = e
  encounterPreset.value = preset
  encounterDialog.value = true
}

async function removeEncounter(e) {
  try {
    await ElMessageBox.confirm(t('cmpDeleteEncConfirm'), t('delete'), { type: 'warning' })
  } catch {
    return
  }
  try {
    await competitorsApi.removeEncounter(e.id)
    await load()
  } catch (err) {
    ElMessage.error(errorText(err, t('xatolikYuzBerdi')))
  }
}

async function removeCompetitor(c) {
  try {
    await ElMessageBox.confirm(t('cmpDeleteConfirm', { name: c.name, n: c.stats.total }), t('delete'), {
      type: 'warning',
    })
  } catch {
    return
  }
  try {
    await competitorsApi.remove(c.id)
    detailOpen.value = false
    selected.value = null
    await load()
  } catch (err) {
    ElMessage.error(errorText(err, t('xatolikYuzBerdi')))
  }
}
</script>

<style scoped>
.cmp {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.cmp-stats {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
}
.cmp-tabs {
  padding: 0 16px 8px;
}
.cmp-tabs :deep(.el-table__row) {
  cursor: pointer;
}
.cmp-sub {
  font-size: 12px;
  color: var(--ui-muted);
}
.cmp-good {
  color: var(--ui-good);
  font-weight: 600;
}
.cmp-bad {
  color: var(--ui-bad);
  font-weight: 600;
}
.cmp-filters {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 10px;
}
.cmp-filters .el-select {
  width: 220px;
}
.cmp-reasons {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
  padding: 8px 0 12px;
}
.cmp-reasons h4 {
  margin: 0 0 12px;
  font-size: 14px;
  color: var(--ui-ink);
}
.cmp-bar {
  display: grid;
  grid-template-columns: 110px 1fr 70px;
  align-items: center;
  gap: 10px;
  margin-bottom: 8px;
  font-size: 13px;
}
.cmp-bar__track {
  height: 10px;
  background: var(--ui-surface-2);
  border-radius: 999px;
  overflow: hidden;
}
.cmp-bar__fill {
  height: 100%;
  border-radius: 999px;
}
.cmp-bar__fill.is-lost {
  background: var(--ui-bad);
}
.cmp-bar__fill.is-won {
  background: var(--ui-good);
}
.cmp-bar__num {
  text-align: right;
  color: var(--ui-muted);
}
.cmp-detail-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin: 16px 0;
}
.cmp-detail-title {
  margin: 8px 0;
  font-size: 14px;
}
@media (max-width: 900px) {
  .cmp-stats {
    grid-template-columns: 1fr 1fr;
  }
  .cmp-reasons {
    grid-template-columns: 1fr;
  }
}
</style>
