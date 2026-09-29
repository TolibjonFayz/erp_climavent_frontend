<template>
  <section class="amo" v-loading="amoStore.isLoading && !stats">
    <!-- Sarlavha va filtrlar -->
    <div class="amo-head">
      <div class="amo-head__text">
        <h3>{{ $t('amoTitle') }}</h3>
        <span class="amo-sync" :class="{ 'is-error': sync?.has_error }">
          <el-icon v-if="syncing" class="is-loading"><Loading /></el-icon>
          <template v-if="syncing">{{ $t('amoSyncing') }}</template>
          <template v-else-if="sync?.last_sync_at">
            {{ $t('amoLastSync') }}: {{ formatDateTime(sync.last_sync_at) }}
          </template>
          <template v-else>{{ $t('amoNeverSynced') }}</template>
        </span>
      </div>
      <div class="amo-filters">
        <el-radio-group v-model="preset" size="small" @change="applyPreset">
          <el-radio-button v-for="p in presets" :key="p.key" :value="p.key">
            {{ $t(p.label) }}
          </el-radio-button>
        </el-radio-group>
        <el-date-picker
          v-model="range"
          type="daterange"
          size="small"
          value-format="YYYY-MM-DD"
          format="DD.MM.YYYY"
          :clearable="false"
          class="amo-range"
          @change="onRangeChange"
        />
        <el-select
          v-model="userId"
          size="small"
          clearable
          filterable
          :placeholder="$t('amoAllManagers')"
          class="amo-user"
          @change="load"
        >
          <el-option v-for="u in users" :key="u.id" :label="u.name" :value="u.id" />
        </el-select>
        <el-button
          size="small"
          :icon="Refresh"
          :loading="syncing"
          :disabled="!sync?.configured"
          @click="startSync"
        >
          {{ $t('amoRefresh') }}
        </el-button>
      </div>
    </div>

    <el-alert
      v-if="sync && !sync.configured"
      type="info"
      :closable="false"
      show-icon
      :title="$t('amoNotConfigured')"
      class="amo-alert"
    />
    <el-alert
      v-else-if="sync?.has_error"
      type="warning"
      :closable="false"
      show-icon
      :title="$t('amoSyncError')"
      :description="syncErrorText"
      class="amo-alert"
    />
    <el-alert
      v-if="loadError"
      type="error"
      :closable="false"
      show-icon
      :title="loadError"
      class="amo-alert"
    />

    <template v-if="stats">
      <!-- ═══ Qo'ng'iroqlar ═══ -->
      <div class="amo-block">
        <div class="amo-block__head">
          <h4>{{ $t('amoCallsTitle') }}</h4>
          <span class="amo-hint">{{ $t('amoCallsHint') }}</span>
        </div>

        <div class="amo-kpis">
          <div class="amo-kpi">
            <div class="amo-kpi__value">{{ fmtNum(calls.total) }}</div>
            <div class="amo-kpi__label">{{ $t('amoCallsTotal') }}</div>
          </div>
          <div class="amo-kpi">
            <div class="amo-kpi__value">{{ fmtNum(calls.incoming) }}</div>
            <div class="amo-kpi__label">{{ $t('amoCallsIn') }}</div>
          </div>
          <div class="amo-kpi">
            <div class="amo-kpi__value">{{ fmtNum(calls.outgoing) }}</div>
            <div class="amo-kpi__label">{{ $t('amoCallsOut') }}</div>
          </div>
          <div class="amo-kpi">
            <div class="amo-kpi__value">
              {{ fmtNum(calls.answered) }}
              <small>{{ pct(calls.answered, calls.total) }}%</small>
            </div>
            <div class="amo-kpi__label">{{ $t('amoCallsAnswered') }}</div>
          </div>
          <div class="amo-kpi">
            <div class="amo-kpi__value">{{ fmtDuration(calls.duration) }}</div>
            <div class="amo-kpi__label">{{ $t('amoCallsDuration') }}</div>
          </div>
        </div>

        <div class="amo-grid">
          <!-- Natija (status) bo'yicha -->
          <div class="amo-card">
            <div class="amo-card__title">{{ $t('amoByStatus') }}</div>
            <div v-if="!calls.total" class="amo-empty">{{ $t('amoNoData') }}</div>
            <div v-else class="amo-bars">
              <div v-for="s in callStatuses" :key="s.status" class="amo-bar-row">
                <span class="amo-bar-row__label">{{ $t('amoCall_' + s.key) }}</span>
                <div class="amo-bar-row__track">
                  <div
                    class="amo-bar-row__fill"
                    :style="{ width: barWidth(s.count, maxStatusCount) }"
                  ></div>
                </div>
                <span class="amo-bar-row__val">
                  {{ fmtNum(s.count) }} <small>{{ pct(s.count, calls.total) }}%</small>
                </span>
              </div>
            </div>
          </div>

          <!-- Kunlar / oylar bo'yicha -->
          <div class="amo-card">
            <div class="amo-card__title">
              {{ $t(trendByMonth ? 'amoByMonth' : 'amoByDay') }}
              <span class="amo-legend">
                <span class="amo-legend__item"
                  ><i class="sw sw--answered"></i>{{ $t('amoLegendAnswered') }}</span
                >
                <span class="amo-legend__item"
                  ><i class="sw sw--other"></i>{{ $t('amoLegendOther') }}</span
                >
              </span>
            </div>
            <div v-if="!calls.total" class="amo-empty">{{ $t('amoNoData') }}</div>
            <div v-else class="amo-trend" @mouseleave="hover = null">
              <div
                v-for="(d, i) in trend"
                :key="d.key"
                class="amo-trend__col"
                @mouseenter="hover = i"
              >
                <div class="amo-trend__stack" :class="{ 'is-hover': hover === i }">
                  <div
                    class="amo-trend__seg amo-trend__seg--other"
                    :style="{ height: segHeight(d.total - d.answered) }"
                  ></div>
                  <div
                    class="amo-trend__seg amo-trend__seg--answered"
                    :style="{ height: segHeight(d.answered) }"
                  ></div>
                </div>
                <span v-if="showTrendLabel(i)" class="amo-trend__label">{{ d.short }}</span>
              </div>
              <div v-if="hover !== null && trend[hover]" class="amo-tip" :style="tipStyle">
                <b>{{ trend[hover].title }}</b>
                <div>{{ $t('amoCallsTotal') }}: {{ fmtNum(trend[hover].total) }}</div>
                <div>{{ $t('amoLegendAnswered') }}: {{ fmtNum(trend[hover].answered) }}</div>
              </div>
            </div>
          </div>
        </div>

        <!-- Menejerlar bo'yicha -->
        <div class="amo-card">
          <div class="amo-card__title">{{ $t('amoByManager') }}</div>
          <el-table
            :data="managerRows"
            size="small"
            :empty-text="$t('amoNoData')"
            :default-sort="{ prop: 'total', order: 'descending' }"
          >
            <el-table-column prop="name" :label="$t('amoManager')" min-width="160" fixed />
            <el-table-column
              prop="total"
              :label="$t('amoCallsTotal')"
              sortable
              align="right"
              min-width="90"
            />
            <el-table-column
              prop="incoming"
              :label="$t('amoCallsIn')"
              sortable
              align="right"
              min-width="90"
            />
            <el-table-column
              prop="outgoing"
              :label="$t('amoCallsOut')"
              sortable
              align="right"
              min-width="90"
            />
            <el-table-column
              prop="answered"
              :label="$t('amoCallsAnswered')"
              sortable
              align="right"
              min-width="110"
            />
            <el-table-column
              prop="no_answer"
              :label="$t('amoCall_no_answer')"
              sortable
              align="right"
              min-width="100"
            />
            <el-table-column
              prop="busy"
              :label="$t('amoCall_busy')"
              sortable
              align="right"
              min-width="80"
            />
            <el-table-column
              prop="rate"
              :label="$t('amoAnswerRate')"
              sortable
              align="right"
              min-width="90"
            >
              <template #default="{ row }">{{ row.rate }}%</template>
            </el-table-column>
            <el-table-column
              prop="duration"
              :label="$t('amoCallsDuration')"
              sortable
              align="right"
              min-width="110"
            >
              <template #default="{ row }">{{ fmtDuration(row.duration) }}</template>
            </el-table-column>
          </el-table>
        </div>
      </div>

      <!-- ═══ Sdelkalar ═══ -->
      <div class="amo-block">
        <div class="amo-block__head">
          <h4>{{ $t('amoLeadsTitle') }}</h4>
          <span class="amo-hint">{{ $t('amoLeadsHint') }}</span>
        </div>

        <div class="amo-kpis">
          <div class="amo-kpi">
            <div class="amo-kpi__value">{{ fmtNum(leads.total) }}</div>
            <div class="amo-kpi__label">{{ $t('amoLeadsTotal') }}</div>
          </div>
          <div class="amo-kpi">
            <div class="amo-kpi__value">{{ fmtMoney(leads.sum) }}</div>
            <div class="amo-kpi__label">{{ $t('amoLeadsSum') }}</div>
          </div>
          <div class="amo-kpi">
            <div class="amo-kpi__value">
              {{ fmtNum(leads.won.count) }}
              <small>{{ fmtMoney(leads.won.sum) }}</small>
            </div>
            <div class="amo-kpi__label">{{ $t('amoLeadsWon') }}</div>
          </div>
          <div class="amo-kpi">
            <div class="amo-kpi__value">
              {{ fmtNum(leads.lost.count) }}
              <small>{{ fmtMoney(leads.lost.sum) }}</small>
            </div>
            <div class="amo-kpi__label">{{ $t('amoLeadsLost') }}</div>
          </div>
        </div>

        <div class="amo-card">
          <div v-if="!leads.pipelines.length" class="amo-empty">{{ $t('amoNoData') }}</div>
          <el-tabs v-else v-model="pipelineTab">
            <el-tab-pane
              v-for="p in leads.pipelines"
              :key="p.id"
              :name="String(p.id)"
              :label="`${p.name} (${fmtNum(p.total)})`"
            >
              <div class="amo-stage-head">
                <span>{{ $t('amoStage') }}</span>
                <span></span>
                <span class="num">{{ $t('amoCount') }}</span>
                <span class="num">{{ $t('amoSum') }}</span>
              </div>
              <div v-for="s in p.statuses" :key="s.id" class="amo-stage">
                <span class="amo-stage__name">
                  <i class="amo-stage__dot" :style="{ background: s.color || '#d5d8db' }"></i>
                  {{ s.name }}
                </span>
                <div class="amo-bar-row__track">
                  <div
                    class="amo-bar-row__fill"
                    :style="{ width: barWidth(s.count, maxStageCount(p)) }"
                  ></div>
                </div>
                <span class="num">{{ fmtNum(s.count) }}</span>
                <span class="num muted">{{ fmtMoney(s.sum) }}</span>
              </div>
            </el-tab-pane>
          </el-tabs>
        </div>
      </div>
    </template>
  </section>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { ElMessage } from 'element-plus'
import { Loading, Refresh } from '@element-plus/icons-vue'
import { useAmocrmStore } from '@/stores/amocrm'

const { t, locale } = useI18n()
const amoStore = useAmocrmStore()

// ─── Filtrlar ─────────────────────────────────────────────
const presets = [
  { key: 'today', label: 'amoPresetToday' },
  { key: 'week', label: 'amoPresetWeek' },
  { key: 'month', label: 'amoPresetMonth' },
  { key: 'quarter', label: 'amoPreset3m' },
  { key: 'year', label: 'amoPresetYear' },
]

const pad = (n) => String(n).padStart(2, '0')
const ymd = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`

function presetRange(key) {
  const today = new Date()
  const from = new Date(today)
  if (key === 'week') from.setDate(today.getDate() - 6)
  else if (key === 'month') from.setDate(1)
  else if (key === 'quarter') from.setMonth(today.getMonth() - 3)
  else if (key === 'year') from.setFullYear(today.getFullYear() - 1)
  return [ymd(from), ymd(today)]
}

const preset = ref('month')
const range = ref(presetRange('month'))
const userId = ref(null)
const pipelineTab = ref('')
const loadError = ref('')

function applyPreset(key) {
  range.value = presetRange(key)
  load()
}

function onRangeChange() {
  preset.value = ''
  load()
}

// ─── Ma'lumot ─────────────────────────────────────────────
const stats = computed(() => amoStore.stats)
const calls = computed(() => stats.value?.calls)
const leads = computed(() => stats.value?.leads)
const users = computed(() => stats.value?.users || [])
const sync = computed(() => stats.value?.sync)

async function load() {
  loadError.value = ''
  try {
    await amoStore.getStats({
      from: range.value[0],
      to: range.value[1],
      responsible_user_id: userId.value || undefined,
    })
  } catch (err) {
    loadError.value = err?.response?.data?.message || err?.message || t('amoLoadError')
  }
}

// Birinchi voronkani tanlab qo'yamiz (yoki tanlangani yo'qolsa)
watch(
  () => leads.value?.pipelines,
  (list) => {
    if (!list?.length) return
    if (!list.some((p) => String(p.id) === pipelineTab.value)) {
      const main = list.find((p) => p.is_main) || list[0]
      pipelineTab.value = String(main.id)
    }
  },
)

const syncErrorText = computed(() =>
  (sync.value?.states || [])
    .filter((s) => s.last_status === 'error')
    .map((s) => `${s.entity}: ${s.last_error}`)
    .join('\n'),
)

// ─── Qo'lda yangilash ─────────────────────────────────────
const syncing = ref(false)
let pollTimer = null

watch(
  () => sync.value?.running,
  (running) => {
    if (running && !syncing.value) {
      syncing.value = true
      pollSync()
    }
  },
)

async function startSync() {
  try {
    const res = await amoStore.runSync()
    if (!res?.started && res?.reason !== 'already_running') {
      ElMessage.warning(t('amoNotConfigured'))
      return
    }
    ElMessage.info(t(res.started ? 'amoSyncStarted' : 'amoSyncBusy'))
    syncing.value = true
    pollSync()
  } catch (err) {
    ElMessage.error(err?.response?.data?.message || err?.message)
  }
}

function pollSync() {
  clearTimeout(pollTimer)
  pollTimer = setTimeout(async () => {
    try {
      const status = await amoStore.getSyncStatus()
      if (status?.running) return pollSync()
    } catch {
      /* keyingi urinishda */
    }
    syncing.value = false
    load()
  }, 3000)
}

onMounted(load)
onBeforeUnmount(() => clearTimeout(pollTimer))

// ─── Qo'ng'iroqlar hisoblari ──────────────────────────────
const callStatuses = computed(() =>
  (calls.value?.by_status || []).slice().sort((a, b) => b.count - a.count),
)
const maxStatusCount = computed(() => Math.max(1, ...callStatuses.value.map((s) => s.count)))

const managerRows = computed(() => {
  const names = new Map(users.value.map((u) => [u.id, u.name]))
  return (calls.value?.by_user || []).map((u) => ({
    name: u.user_id ? names.get(u.user_id) || `#${u.user_id}` : t('amoUnknownManager'),
    total: u.total,
    incoming: u.incoming,
    outgoing: u.outgoing,
    answered: u.answered,
    no_answer: u.by_status?.[6] || 0,
    busy: u.by_status?.[7] || 0,
    rate: pct(u.answered, u.total),
    duration: u.duration,
  }))
})

// 45 kundan uzun davr oylar bo'yicha guruhlanadi
const trendByMonth = computed(() => {
  const [from, to] = range.value
  return (new Date(to) - new Date(from)) / 86400000 > 45
})

// Brauzerlarda o'zbekcha oy nomlari bo'lmasligi mumkin — o'zimiz beramiz
const MONTHS = {
  uz: ['Yan', 'Fev', 'Mar', 'Apr', 'May', 'Iyn', 'Iyl', 'Avg', 'Sen', 'Okt', 'Noy', 'Dek'],
  ru: ['янв', 'фев', 'мар', 'апр', 'май', 'июн', 'июл', 'авг', 'сен', 'окт', 'ноя', 'дек'],
}
const monthNames = computed(() => MONTHS[locale.value] || MONTHS.uz)

const trend = computed(() => {
  const daily = new Map((calls.value?.daily || []).map((d) => [d.day, d]))
  const [fromStr, toStr] = range.value
  const cursor = new Date(`${fromStr}T00:00:00`)
  const end = new Date(`${toStr}T00:00:00`)
  const buckets = new Map()

  while (cursor <= end) {
    const day = ymd(cursor)
    const key = trendByMonth.value ? day.slice(0, 7) : day
    if (!buckets.has(key)) {
      const m = cursor.getMonth()
      buckets.set(key, {
        key,
        total: 0,
        answered: 0,
        short: trendByMonth.value ? monthNames.value[m] : String(cursor.getDate()),
        title: trendByMonth.value
          ? `${monthNames.value[m]} ${cursor.getFullYear()}`
          : `${pad(cursor.getDate())}.${pad(m + 1)}.${cursor.getFullYear()}`,
      })
    }
    const d = daily.get(day)
    if (d) {
      const b = buckets.get(key)
      b.total += d.total
      b.answered += d.answered
    }
    cursor.setDate(cursor.getDate() + 1)
  }
  return [...buckets.values()]
})

const maxTrend = computed(() => Math.max(1, ...trend.value.map((d) => d.total)))
const segHeight = (v) => `${(v / maxTrend.value) * 100}%`
// Ustunlar ko'p bo'lsa, har birining ostiga yozuv sig'maydi
const showTrendLabel = (i) => {
  const n = trend.value.length
  const step = n > 20 ? Math.ceil(n / 10) : 1
  return i % step === 0 || i === n - 1
}

const hover = ref(null)
const tipStyle = computed(() => {
  const n = trend.value.length || 1
  const left = ((hover.value + 0.5) / n) * 100
  return left > 60 ? { right: `${100 - left}%` } : { left: `${left}%` }
})

// ─── Sdelkalar ────────────────────────────────────────────
const maxStageCount = (p) => Math.max(1, ...p.statuses.map((s) => s.count))

// ─── Formatlash ───────────────────────────────────────────
const numberFmt = new Intl.NumberFormat('ru-RU')
const fmtNum = (n) => numberFmt.format(n || 0)
const fmtMoney = (n) => `${numberFmt.format(Math.round(n || 0))} ${t('amoCurrency')}`
const pct = (part, total) => (total ? Math.round((part / total) * 100) : 0)
const barWidth = (v, max) => (v ? `${Math.max(2, (v / max) * 100)}%` : '0')

function fmtDuration(sec) {
  const s = Number(sec) || 0
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  if (h) return `${h} ${t('amoHourShort')} ${m} ${t('amoMinShort')}`
  if (m) return `${m} ${t('amoMinShort')}`
  return `${s} ${t('amoSecShort')}`
}

function formatDateTime(value) {
  const d = new Date(value)
  return `${pad(d.getDate())}.${pad(d.getMonth() + 1)}.${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}
</script>

<style lang="scss" scoped>
// Qo'ng'iroqlar grafigi ranglari (dataviz validator'dan o'tgan kategoriya juftligi)
$c-answered: #2a78d6;
$c-other: #eb6834;
$c-bar: #2a78d6;
$ink: #1f2937;
$ink-2: #4b5563;
$muted: #6b7280;
$line: #eef0f3;

.amo {
  background: white;
  border-radius: 14px;
  padding: 18px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
  min-width: 0;
}

.amo-head {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
  flex-wrap: wrap;
  margin-bottom: 14px;

  h3 {
    margin: 0;
    font-size: 16px;
    font-weight: 600;
    color: $ink;
  }
}
.amo-head__text {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.amo-sync {
  font-size: 12px;
  color: $muted;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  &.is-error {
    color: #b45309;
  }
}
.amo-filters {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
}
.amo-range {
  width: 240px !important;
}
.amo-user {
  width: 190px;
}
.amo-alert {
  margin-bottom: 12px;
  :deep(.el-alert__description) {
    white-space: pre-line;
  }
}

.amo-block {
  margin-top: 8px;
  & + & {
    margin-top: 26px;
    padding-top: 20px;
    border-top: 1px solid $line;
  }
}
.amo-block__head {
  display: flex;
  align-items: baseline;
  gap: 10px;
  flex-wrap: wrap;
  margin-bottom: 12px;
  h4 {
    margin: 0;
    font-size: 15px;
    font-weight: 600;
    color: $ink;
  }
}
.amo-hint {
  font-size: 12px;
  color: $muted;
}

/* KPI */
.amo-kpis {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 10px;
  margin-bottom: 12px;
}
.amo-kpi {
  background: #f8fafc;
  border: 1px solid $line;
  border-radius: 12px;
  padding: 12px 14px;
}
.amo-kpi__value {
  font-size: 22px;
  font-weight: 700;
  color: $ink;
  line-height: 1.2;
  font-variant-numeric: tabular-nums;
  small {
    display: block;
    font-size: 12px;
    font-weight: 500;
    color: $muted;
  }
}
.amo-kpi__label {
  font-size: 12px;
  color: $muted;
  margin-top: 2px;
}

/* Kartochkalar */
.amo-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  margin-bottom: 12px;
}
.amo-card {
  border: 1px solid $line;
  border-radius: 12px;
  padding: 14px;
  min-width: 0;
}
.amo-card__title {
  font-size: 13px;
  font-weight: 600;
  color: $ink-2;
  margin-bottom: 12px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}
.amo-empty {
  font-size: 13px;
  color: $muted;
  padding: 18px 0;
  text-align: center;
}

/* Gorizontal barlar */
.amo-bars {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.amo-bar-row {
  display: grid;
  grid-template-columns: minmax(120px, 170px) 1fr auto;
  align-items: center;
  gap: 10px;
}
.amo-bar-row__label {
  font-size: 13px;
  color: $ink-2;
}
.amo-bar-row__track {
  height: 10px;
  background: #f1f3f5;
  border-radius: 4px;
  overflow: hidden;
}
.amo-bar-row__fill {
  height: 100%;
  background: $c-bar;
  border-radius: 0 4px 4px 0;
  transition: width 0.3s ease;
}
.amo-bar-row__val {
  font-size: 13px;
  font-weight: 600;
  color: $ink;
  min-width: 72px;
  text-align: right;
  font-variant-numeric: tabular-nums;
  small {
    font-weight: 400;
    color: $muted;
  }
}

/* Kunlik grafik */
.amo-legend {
  display: inline-flex;
  gap: 12px;
  font-size: 12px;
  font-weight: 400;
  color: $muted;
}
.amo-legend__item {
  display: inline-flex;
  align-items: center;
  gap: 5px;
}
.sw {
  width: 10px;
  height: 10px;
  border-radius: 2px;
  display: inline-block;
  &--answered {
    background: $c-answered;
  }
  &--other {
    background: $c-other;
  }
}
.amo-trend {
  position: relative;
  display: flex;
  align-items: stretch;
  gap: 2px;
  height: 190px;
  padding-bottom: 18px;
  border-bottom: 1px solid $line;
}
.amo-trend__col {
  flex: 1;
  min-width: 0;
  position: relative;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  cursor: default;
}
.amo-trend__stack {
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  gap: 2px;
  border-radius: 4px 4px 0 0;
  &.is-hover {
    background: #f1f5f9;
  }
}
.amo-trend__seg {
  width: 100%;
  max-width: 28px;
  margin: 0 auto;
  min-height: 0;
  &--other {
    background: $c-other;
    border-radius: 4px 4px 0 0;
  }
  &--answered {
    background: $c-answered;
  }
}
// Faqat "boshqa" bo'lmasa, yuqori burchak "suhbat bo'ldi"da yumaloq bo'ladi
.amo-trend__seg--other[style*='height: 0%'] + .amo-trend__seg--answered {
  border-radius: 4px 4px 0 0;
}
.amo-trend__label {
  position: absolute;
  bottom: -18px;
  left: 50%;
  transform: translateX(-50%);
  font-size: 10px;
  color: $muted;
  white-space: nowrap;
}
.amo-tip {
  position: absolute;
  top: 0;
  background: $ink;
  color: white;
  font-size: 12px;
  padding: 8px 10px;
  border-radius: 8px;
  pointer-events: none;
  white-space: nowrap;
  z-index: 2;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  b {
    display: block;
    margin-bottom: 2px;
  }
}

/* Voronka bosqichlari */
.amo-stage-head,
.amo-stage {
  display: grid;
  grid-template-columns: minmax(150px, 240px) 1fr 70px minmax(110px, 160px);
  gap: 12px;
  align-items: center;
}
.amo-stage-head {
  font-size: 12px;
  color: $muted;
  padding: 0 0 6px;
  border-bottom: 1px solid $line;
}
.amo-stage {
  padding: 9px 0;
  border-bottom: 1px solid $line;
  font-size: 13px;
  &:last-child {
    border-bottom: none;
  }
}
.amo-stage__name {
  display: flex;
  align-items: center;
  gap: 8px;
  color: $ink;
  min-width: 0;
}
.amo-stage__dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  flex-shrink: 0;
  box-shadow: inset 0 0 0 1px rgba(0, 0, 0, 0.08);
}
.num {
  text-align: right;
  font-variant-numeric: tabular-nums;
  font-weight: 600;
  color: $ink;
}
.num.muted {
  font-weight: 400;
  color: $ink-2;
}
.amo-stage-head .num {
  font-weight: 400;
  color: $muted;
}

@media (max-width: 900px) {
  .amo-grid {
    grid-template-columns: 1fr;
  }
  .amo-head {
    flex-direction: column;
    align-items: stretch;
  }
  .amo-head > * {
    min-width: 0;
    max-width: 100%;
  }
  .amo-range,
  .amo-user {
    width: 100% !important;
    flex: 1 1 100%;
    box-sizing: border-box;
  }
  .amo-stage-head,
  .amo-stage {
    grid-template-columns: 1fr 60px minmax(90px, 120px);
    & > :nth-child(2) {
      display: none;
    }
  }
}
</style>
