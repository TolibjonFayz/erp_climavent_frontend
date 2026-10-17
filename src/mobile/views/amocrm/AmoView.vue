<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { showFailToast, showToast } from 'vant'
import { useAmocrmStore } from '@/stores/amocrm'
import {
  MONTHS,
  TALKED,
  callStatusKey,
  countryName,
  fmtDuration,
  fmtNum,
  formatDate,
  formatDateTime,
  pct,
  ymd,
} from '@/components/amocrm/amoFormat'
import MPage from '../../components/MPage.vue'
import MStats from '../../components/MStats.vue'
import MEmpty from '../../components/MEmpty.vue'
import MSelectSheet from '../../components/MSelectSheet.vue'
import { useBackClose } from '../../native'
import { errorText } from '../../utils'
import { drillRequest, drillStats } from './drill'

const { t, locale } = useI18n()
const router = useRouter()
const amoStore = useAmocrmStore()

// ─── Filtrlar (saytdagi AmoCrmStats bilan bir xil) ───
const PRESETS = [
  { key: 'today', label: 'amoPresetToday' },
  { key: 'week', label: 'amoPresetWeek' },
  { key: 'month', label: 'amoPresetMonth' },
  { key: 'quarter', label: 'amoPreset3m' },
  { key: 'year', label: 'amoPresetYear' },
]
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
const scope = ref('clients')
const userId = ref(null)
const tab = ref('calls')
const loading = ref(false)
const loadError = ref('')

const stats = computed(() => amoStore.stats)
const calls = computed(() => stats.value?.calls)
const leads = computed(() => stats.value?.leads)
const users = computed(() => stats.value?.users || [])
const sync = computed(() => stats.value?.sync)
const ready = computed(() => !!calls.value && !!leads.value)

async function load() {
  loading.value = true
  loadError.value = ''
  try {
    await amoStore.getStats({
      from: range.value[0],
      to: range.value[1],
      responsible_user_id: userId.value || undefined,
      scope: scope.value,
    })
  } catch (e) {
    loadError.value = errorText(e, t, locale.value)
  } finally {
    loading.value = false
  }
}
onMounted(load)

function applyPreset(key) {
  preset.value = key
  range.value = presetRange(key)
  load()
}

// O'z davri
const calendarOpen = ref(false)
useBackClose(calendarOpen)
const minDate = new Date(new Date().getFullYear() - 3, 0, 1)
function onRange([from, to]) {
  calendarOpen.value = false
  preset.value = ''
  range.value = [ymd(from), ymd(to)]
  load()
}
const rangeLabel = computed(() => {
  const [a, b] = range.value
  return a === b ? formatDate(a) : `${formatDate(a)} – ${formatDate(b)}`
})

const userName = (id) => users.value.find((u) => u.id === id)?.name || `#${id}`
const managerSheet = ref(false)
const managerOptions = computed(() => [
  { value: null, label: t('m.allManagers') },
  ...users.value.map((u) => ({ value: u.id, label: u.name })),
])
function onManager(v) {
  userId.value = v
  load()
}

// ─── Qo'lda yangilash ───
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
      showToast(t('amoNotConfigured'))
      return
    }
    showToast(t(res.started ? 'amoSyncStarted' : 'amoSyncBusy'))
    syncing.value = true
    pollSync()
  } catch (e) {
    showFailToast(errorText(e, t, locale.value))
  }
}
function pollSync() {
  clearTimeout(pollTimer)
  pollTimer = setTimeout(async () => {
    try {
      const s = await amoStore.getSyncStatus()
      if (s?.running) return pollSync()
    } catch {
      /* keyingi urinishda */
    }
    syncing.value = false
    load()
  }, 3000)
}
onBeforeUnmount(() => clearTimeout(pollTimer))

// ─── Ro'yxatga o'tish ───
const periodLabel = computed(() =>
  userId.value ? `${rangeLabel.value} · ${userName(userId.value)}` : rangeLabel.value,
)
const baseParams = () => ({
  from: range.value[0],
  to: range.value[1],
  responsible_user_id: userId.value || undefined,
  scope: scope.value,
})
function drillCalls(kind, title, extra = {}, opts = {}) {
  drillStats.value = stats.value
  drillRequest.value = {
    type: 'calls',
    title,
    subtitle: opts.subtitle || periodLabel.value,
    params: { ...baseParams(), kind, ...extra },
    groupByPhone: opts.groupByPhone ?? kind === 'in_missed',
    onlyNotCalledBack: !!opts.onlyNotCalledBack,
  }
  router.push({ name: 'amocrm-list' })
}
function drillLeads(title, extra = {}) {
  drillStats.value = stats.value
  drillRequest.value = { type: 'leads', title, subtitle: periodLabel.value, params: { ...baseParams(), ...extra } }
  router.push({ name: 'amocrm-list' })
}

const fmtMoney = (n) => `${fmtNum(Math.round(n || 0))} ${t('amoCurrency')}`

// ─── Asosiy ko'rsatkichlar ───
const overview = computed(() => {
  if (!ready.value) return []
  const c = calls.value
  const inc = c.incoming
  const l = leads.value
  return [
    { key: 'total', label: t('amoCallsTotal'), value: fmtNum(c.total), sub: fmtDuration(c.duration, t), onClick: () => drillCalls('all', t('amoCallsTotal')) },
    { key: 'talked', label: t('amoTalked'), value: fmtNum(c.talked), sub: `${pct(c.talked, c.total)}%`, tone: 'good', onClick: () => drillCalls('answered', t('amoTalked')) },
    { key: 'missed', label: t('amoInMissed'), value: fmtNum(inc.missed), sub: `${pct(inc.missed, inc.total)}% ${t('m.ofIncoming')}`, tone: 'bad', onClick: () => drillCalls('in_missed', t('amoInMissed')) },
    { key: 'ncb', label: t('amoNotCalledBack'), value: fmtNum(inc.not_called_back), sub: t('amoNumbersOf', { n: fmtNum(inc.missed_numbers) }), tone: 'bad', onClick: () => drillCalls('in_missed', t('amoNotCalledBack'), {}, { groupByPhone: true, onlyNotCalledBack: true }) },
    { key: 'leads', label: t('amoLeadsTotal'), value: fmtNum(l.total), sub: fmtMoney(l.sum), onClick: () => drillLeads(t('amoLeadsTotal')) },
    { key: 'won', label: t('amoLeadsWon'), value: fmtNum(l.won.count), sub: fmtMoney(l.won.sum), tone: 'good', onClick: () => drillLeads(t('amoLeadsWon'), { status_id: 142 }) },
  ]
})

// ─── Qo'ng'iroqlar: yo'nalishlar ───
function statusRows(direction, list, extra = {}, prefix = '') {
  const kind = direction === 'in' ? 'in' : 'out'
  return (list || [])
    .filter((s) => s.count > 0)
    .map((s) => {
      const label = t(callStatusKey(direction, s.status))
      return {
        status: s.status,
        count: s.count,
        good: s.status === TALKED,
        label,
        onClick: () =>
          drillCalls(kind, `${prefix}${label}`, { status: s.status, ...extra }, { groupByPhone: direction === 'in' && s.status !== TALKED }),
      }
    })
    .sort((a, b) => b.count - a.count)
}

const directions = computed(() => {
  if (!ready.value) return []
  const inc = calls.value.incoming
  const out = calls.value.outgoing
  return [
    {
      key: 'in',
      icon: 'down',
      title: t('amoInTitle'),
      total: inc.total,
      onTotal: () => drillCalls('in', t('amoInTotal')),
      rows: statusRows('in', inc.by_status),
      tiles: [
        { key: 'a', label: t('amoInAnswered'), value: fmtNum(inc.answered), sub: `${pct(inc.answered, inc.total)}%`, tone: 'good', onClick: () => drillCalls('in_answered', t('amoInAnswered')) },
        { key: 'm', label: t('amoInMissed'), value: fmtNum(inc.missed), sub: `${pct(inc.missed, inc.total)}%`, tone: 'bad', onClick: () => drillCalls('in_missed', t('amoInMissed')) },
        { key: 'n', label: t('amoMissedNumbers'), value: fmtNum(inc.missed_numbers), onClick: () => drillCalls('in_missed', t('amoMissedNumbers'), {}, { groupByPhone: true }) },
        { key: 'c', label: t('amoNotCalledBack'), value: fmtNum(inc.not_called_back), sub: `${pct(inc.not_called_back, inc.missed_numbers)}%`, tone: 'bad', onClick: () => drillCalls('in_missed', t('amoNotCalledBack'), {}, { groupByPhone: true, onlyNotCalledBack: true }) },
      ],
    },
    {
      key: 'out',
      icon: 'back-top',
      title: t('amoOutTitle'),
      total: out.total,
      onTotal: () => drillCalls('out', t('amoOutTotal')),
      rows: statusRows('out', out.by_status),
      tiles: [
        { key: 'a', label: t('amoOutAnswered'), value: fmtNum(out.answered), sub: `${pct(out.answered, out.total)}%`, tone: 'good', onClick: () => drillCalls('out_answered', t('amoOutAnswered')) },
        { key: 'n', label: t('amoOutNoAnswer'), value: fmtNum(out.no_answer), sub: `${pct(out.no_answer, out.total)}%`, tone: 'warn', onClick: () => drillCalls('out_no_answer', t('amoOutNoAnswer')) },
      ],
    },
  ]
})
const maxRow = (rows) => Math.max(1, ...rows.map((r) => r.count))
const barW = (v, max) => (v ? `${Math.max(3, (v / max) * 100)}%` : '0')

// ─── Kunlik / oylik grafik ───
const trendByMonth = computed(() => {
  const [from, to] = range.value
  return (new Date(to) - new Date(from)) / 86400000 > 45
})
const trend = computed(() => {
  if (!ready.value) return []
  const daily = new Map((calls.value.daily || []).map((d) => [d.day, d]))
  const names = MONTHS[locale.value] || MONTHS.uz
  const cursor = new Date(`${range.value[0]}T00:00:00`)
  const end = new Date(`${range.value[1]}T00:00:00`)
  const buckets = new Map()
  while (cursor <= end) {
    const day = ymd(cursor)
    const key = trendByMonth.value ? day.slice(0, 7) : day
    if (!buckets.has(key)) {
      const m = cursor.getMonth()
      const last = new Date(cursor.getFullYear(), m + 1, 0)
      buckets.set(key, {
        key,
        from: trendByMonth.value ? `${key}-01` : day,
        to: trendByMonth.value ? ymd(last) : day,
        total: 0,
        talked: 0,
        missed: 0,
        short: trendByMonth.value ? names[m] : String(cursor.getDate()),
        title: trendByMonth.value ? `${names[m]} ${cursor.getFullYear()}` : formatDate(cursor),
      })
    }
    const d = daily.get(day)
    if (d) {
      const b = buckets.get(key)
      b.total += d.total
      b.talked += d.talked
      b.missed += d.in_missed
    }
    cursor.setDate(cursor.getDate() + 1)
  }
  return [...buckets.values()]
})
const trendMax = computed(() => Math.max(1, ...trend.value.map((d) => d.total)))
function drillBucket(b) {
  const from = b.from < range.value[0] ? range.value[0] : b.from
  const to = b.to > range.value[1] ? range.value[1] : b.to
  drillCalls('all', `${t('amoCallsTitle')} — ${b.title}`, { from, to }, { subtitle: b.title, groupByPhone: false })
}

// ─── Menejerlar ───
const managers = computed(() =>
  (calls.value?.by_user || []).map((u) => ({
    ...u,
    name: u.user_id ? userName(u.user_id) : t('amoUnknownManager'),
  })),
)
function drillManager(row, kind, label) {
  if (!row.user_id) return
  drillCalls(kind, `${row.name} — ${label}`, { responsible_user_id: row.user_id }, { subtitle: `${rangeLabel.value} · ${row.name}` })
}

// ─── Lidlar ───
const pipelineId = ref(null)
const pipelines = computed(() => leads.value?.pipelines || [])
watch(pipelines, (list) => {
  if (!list.length) return
  if (!list.some((p) => p.id === pipelineId.value)) pipelineId.value = (list.find((p) => p.is_main) || list[0]).id
})
const pipeline = computed(() => pipelines.value.find((p) => p.id === pipelineId.value))
const lossReasons = computed(() => leads.value?.loss_reasons || [])
const leadTiles = computed(() => {
  if (!ready.value) return []
  const l = leads.value
  return [
    { key: 'total', label: t('amoLeadsTotal'), value: fmtNum(l.total), sub: fmtMoney(l.sum), onClick: () => drillLeads(t('amoLeadsTotal')) },
    { key: 'won', label: t('amoLeadsWon'), value: fmtNum(l.won.count), sub: fmtMoney(l.won.sum), tone: 'good', onClick: () => drillLeads(t('amoLeadsWon'), { status_id: 142 }) },
    { key: 'lost', label: t('amoLeadsLost'), value: fmtNum(l.lost.count), sub: fmtMoney(l.lost.sum), tone: 'bad', onClick: () => drillLeads(t('amoLeadsLost'), { status_id: 143 }) },
    { key: 'conv', label: t('m.conversion'), value: `${pct(l.won.count, l.total)}%` },
  ]
})

// ─── Xorijiy ───
const foreign = computed(() => calls.value?.foreign || null)
const countries = computed(() =>
  (foreign.value?.by_country || []).map((c) => ({ ...c, name: countryName(c.country, locale.value, t) })),
)
const foreignTiles = computed(() => {
  const f = foreign.value
  if (!f) return []
  return [
    { key: 'total', label: t('amoForeignTotal'), value: fmtNum(f.total), sub: `${pct(f.total, calls.value.total)}%`, onClick: () => drillCalls('all', `${t('amoTabForeign')} — ${t('amoCallsTotal')}`, { country: 'foreign' }) },
    { key: 'numbers', label: t('amoForeignNumbers'), value: fmtNum(f.numbers), onClick: () => drillCalls('all', `${t('amoTabForeign')} — ${t('amoForeignNumbers')}`, { country: 'foreign' }, { groupByPhone: true }) },
    { key: 'talked', label: t('amoTalked'), value: fmtNum(f.talked), tone: 'good', onClick: () => drillCalls('answered', `${t('amoTabForeign')} — ${t('amoTalked')}`, { country: 'foreign' }) },
    { key: 'missed', label: t('amoInMissed'), value: fmtNum(f.incoming?.missed), tone: 'bad', onClick: () => drillCalls('in_missed', `${t('amoTabForeign')} — ${t('amoInMissed')}`, { country: 'foreign' }) },
  ]
})

const TABS = computed(() => [
  { key: 'calls', label: t('m.amoTabCalls') },
  { key: 'managers', label: t('m.amoTabManagers') },
  { key: 'leads', label: t('m.amoTabLeads') },
  { key: 'foreign', label: t('amoTabForeign'), hide: !foreign.value?.total },
])
</script>

<template>
  <MPage :title="$t('m.amoStats')" :subtitle="sync?.last_sync_at ? `${$t('amoLastSync')}: ${formatDateTime(sync.last_sync_at)}` : ''" :back="{ name: 'more' }" :on-refresh="load">
    <template #right>
      <button type="button" class="m-head__btn" :disabled="syncing" @click="startSync">
        <van-loading v-if="syncing" size="18" />
        <van-icon v-else name="replay" />
      </button>
    </template>
    <template #header>
      <div class="m-chips">
        <button
          v-for="p in PRESETS"
          :key="p.key"
          type="button"
          class="m-chip"
          :class="{ 'is-active': preset === p.key }"
          @click="applyPreset(p.key)"
        >
          {{ $t(p.label) }}
        </button>
        <button type="button" class="m-chip" :class="{ 'is-active': !preset }" @click="calendarOpen = true">
          <van-icon name="calendar-o" /> {{ preset ? $t('m.customRange') : rangeLabel }}
        </button>
      </div>
      <div class="am-filters">
        <div class="am-seg">
          <button type="button" :class="{ 'is-active': scope === 'clients' }" @click="(scope = 'clients'), load()">{{ $t('amoScopeClients') }}</button>
          <button type="button" :class="{ 'is-active': scope === 'all' }" @click="(scope = 'all'), load()">{{ $t('amoScopeAll') }}</button>
        </div>
        <button type="button" class="am-manager" @click="managerSheet = true">
          <van-icon name="manager-o" />
          <span>{{ userId ? userName(userId) : $t('m.allManagers') }}</span>
          <van-icon name="arrow-down" />
        </button>
      </div>
    </template>

    <div v-if="loading && !ready" class="am-pad">
      <van-skeleton :row="5" class="m-card" />
      <van-skeleton :row="5" class="m-card" />
    </div>

    <MEmpty v-else-if="loadError && !ready" icon="warning-o" :title="$t('m.loadFailed')" :text="loadError">
      <van-button round type="primary" @click="load">{{ $t('m.retry') }}</van-button>
    </MEmpty>

    <MEmpty v-else-if="sync && !sync.configured" icon="info-o" :title="$t('amoNotConfigured')" />

    <template v-else-if="ready">
      <div v-if="sync?.has_error" class="am-alert">
        <van-icon name="warning-o" /> {{ $t('m.amoSyncError') }}
      </div>

      <MStats :items="overview" grid />

      <div class="am-tabs">
        <template v-for="tb in TABS" :key="tb.key">
          <button v-if="!tb.hide" type="button" :class="{ 'is-active': tab === tb.key }" @click="tab = tb.key">
            {{ tb.label }}
          </button>
        </template>
      </div>

      <!-- Qo'ng'iroqlar -->
      <template v-if="tab === 'calls'">
        <section v-for="d in directions" :key="d.key">
          <div class="m-section">
            <span class="m-section__title"><van-icon :name="d.icon" /> {{ d.title }}</span>
            <button type="button" class="m-section__action" @click="d.onTotal">{{ fmtNum(d.total) }} ›</button>
          </div>
          <MStats :items="d.tiles" grid class="am-tiles" />
          <div v-if="d.rows.length" class="m-card m-bars">
            <button v-for="r in d.rows" :key="r.status" type="button" class="am-row" @click="r.onClick">
              <div class="m-bar__head">
                <span class="m-bar__label"><span>{{ r.label }}</span></span>
                <span class="m-bar__value">{{ fmtNum(r.count) }}<small>{{ pct(r.count, d.total) }}%</small></span>
              </div>
              <div class="m-bar__track">
                <div class="m-bar__fill" :style="{ width: barW(r.count, maxRow(d.rows)), background: r.good ? 'var(--m-good)' : '#f59e0b' }"></div>
              </div>
            </button>
          </div>
        </section>

        <div class="m-section">
          <span class="m-section__title">{{ trendByMonth ? $t('m.byMonth') : $t('m.byDay') }}</span>
        </div>
        <div class="m-card am-trend-card">
          <div class="am-trend">
            <button
              v-for="b in trend"
              :key="b.key"
              type="button"
              class="am-trend__col"
              :title="b.title"
              @click="b.total && drillBucket(b)"
            >
              <span class="am-trend__stack" :style="{ height: `${(b.total / trendMax) * 100}%` }">
                <span class="is-missed" :style="{ flex: b.missed }"></span>
                <span class="is-other" :style="{ flex: Math.max(0, b.total - b.talked - b.missed) }"></span>
                <span class="is-talked" :style="{ flex: b.talked }"></span>
              </span>
              <span class="am-trend__label">{{ b.short }}</span>
            </button>
          </div>
          <div class="am-legend">
            <span><i class="is-talked"></i>{{ $t('amoTalked') }}</span>
            <span><i class="is-missed"></i>{{ $t('amoInMissed') }}</span>
            <span><i class="is-other"></i>{{ $t('m.otherCalls') }}</span>
          </div>
        </div>
      </template>

      <!-- Menejerlar -->
      <template v-else-if="tab === 'managers'">
        <div class="am-list">
          <article v-for="m in managers" :key="m.user_id || 'none'" class="m-card am-mgr">
            <header class="am-mgr__head">
              <b>{{ m.name }}</b>
              <button type="button" class="am-mgr__total" @click="drillManager(m, 'all', $t('amoColAll'))">
                {{ fmtNum(m.total) }} ›
              </button>
            </header>
            <div class="am-mgr__grid">
              <button type="button" @click="drillManager(m, 'in_answered', $t('amoColInAnswered'))">
                <small>{{ $t('amoColInAnswered') }}</small><b class="m-num">{{ fmtNum(m.in_answered) }}</b>
              </button>
              <button type="button" class="is-bad" @click="drillManager(m, 'in_missed', $t('amoColInMissed'))">
                <small>{{ $t('amoColInMissed') }}</small><b class="m-num">{{ fmtNum(m.in_missed) }}</b>
              </button>
              <button type="button" @click="drillManager(m, 'out_answered', $t('amoColOutAnswered'))">
                <small>{{ $t('amoColOutAnswered') }}</small><b class="m-num">{{ fmtNum(m.out_answered) }}</b>
              </button>
              <button type="button" class="is-warn" @click="drillManager(m, 'out_no_answer', $t('amoColOutNoAnswer'))">
                <small>{{ $t('amoColOutNoAnswer') }}</small><b class="m-num">{{ fmtNum(m.out_no_answer) }}</b>
              </button>
            </div>
            <footer class="am-mgr__foot">
              <span><van-icon name="down" /> {{ fmtNum(m.in_total) }}</span>
              <span><van-icon name="back-top" /> {{ fmtNum(m.out_total) }}</span>
              <span><van-icon name="clock-o" /> {{ fmtDuration(m.duration, t) }}</span>
            </footer>
          </article>
          <MEmpty v-if="!managers.length" icon="manager-o" :title="$t('m.nothingFound')" />
        </div>
      </template>

      <!-- Lidlar -->
      <template v-else-if="tab === 'leads'">
        <MStats :items="leadTiles" grid />
        <template v-if="pipelines.length">
          <div class="m-section"><span class="m-section__title">{{ $t('m.pipeline') }}</span></div>
          <div v-if="pipelines.length > 1" class="m-chips">
            <button
              v-for="p in pipelines"
              :key="p.id"
              type="button"
              class="m-chip"
              :class="{ 'is-active': pipelineId === p.id }"
              @click="pipelineId = p.id"
            >
              {{ p.name }} <span class="m-chip__count">{{ fmtNum(p.total) }}</span>
            </button>
          </div>
          <div v-if="pipeline" class="m-card m-bars">
            <button
              v-for="s in pipeline.statuses"
              :key="s.id"
              type="button"
              class="am-row"
              :disabled="!s.count"
              @click="drillLeads(s.name, { pipeline_id: pipeline.id, status_id: s.id })"
            >
              <div class="m-bar__head">
                <span class="m-bar__label"><i class="m-bar__dot" :style="{ background: s.color || '#d5d8db' }"></i><span>{{ s.name }}</span></span>
                <span class="m-bar__value">{{ fmtNum(s.count) }}<small>{{ fmtMoney(s.sum) }}</small></span>
              </div>
              <div class="m-bar__track">
                <div class="m-bar__fill" :style="{ width: barW(s.count, maxRow(pipeline.statuses)), background: s.color || '#94a3b8' }"></div>
              </div>
            </button>
          </div>
        </template>

        <template v-if="lossReasons.length">
          <div class="m-section"><span class="m-section__title">{{ $t('m.lossReasons') }}</span></div>
          <div class="m-card m-bars">
            <button
              v-for="r in lossReasons"
              :key="r.id"
              type="button"
              class="am-row"
              @click="drillLeads(r.name || $t('amoLossReasonNone'), { status_id: 143, loss_reason_id: r.id })"
            >
              <div class="m-bar__head">
                <span class="m-bar__label">
                  <span>{{ r.name || $t('amoLossReasonNone') }}</span>
                  <span v-if="r.is_not_ours" class="m-tag is-warn">{{ $t('amoNotOurs') }}</span>
                </span>
                <span class="m-bar__value">{{ fmtNum(r.count) }}<small>{{ pct(r.count, leads.lost.count) }}%</small></span>
              </div>
              <div class="m-bar__track">
                <div class="m-bar__fill" :style="{ width: barW(r.count, maxRow(lossReasons)), background: 'var(--m-bad)' }"></div>
              </div>
            </button>
          </div>
        </template>
      </template>

      <!-- Xorijiy -->
      <template v-else-if="tab === 'foreign' && foreign">
        <MStats :items="foreignTiles" grid />
        <div class="m-section"><span class="m-section__title">{{ $t('m.byCountry') }}</span></div>
        <van-cell-group inset>
          <van-cell
            v-for="c in countries"
            :key="c.country"
            :title="c.name"
            :label="`${$t('amoColNumbers')}: ${fmtNum(c.numbers)} · ${$t('amoColInMissed')}: ${fmtNum(c.in_missed)}`"
            :value="fmtNum(c.total)"
            is-link
            value-class="m-num"
            @click="drillCalls('all', c.name, { country: c.country })"
          />
        </van-cell-group>
      </template>
    </template>

    <van-calendar
      v-model:show="calendarOpen"
      type="range"
      :min-date="minDate"
      :max-date="new Date()"
      :allow-same-day="true"
      :show-confirm="true"
      :confirm-text="$t('m.done')"
      :confirm-disabled-text="$t('m.chooseEnd')"
      teleport="body"
      :close-on-popstate="false"
      @confirm="onRange"
    />
    <MSelectSheet
      v-model="managerSheet"
      :title="$t('amoManager')"
      :options="managerOptions"
      :selected="userId"
      @select="onManager"
    />
  </MPage>
</template>

<style scoped>
.am-pad {
  padding-top: 12px;
}

.am-filters {
  display: flex;
  gap: 8px;
  padding: 0 12px 10px;
}

.am-seg {
  display: flex;
  padding: 3px;
  border-radius: 10px;
  background: var(--m-line-soft);
}

.am-seg button {
  border: 0;
  background: none;
  padding: 6px 10px;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 500;
  color: var(--m-muted);
  white-space: nowrap;
}

.am-seg button.is-active {
  background: var(--m-surface);
  color: var(--m-ink);
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.08);
}

.am-manager {
  flex: 1;
  min-width: 0;
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 0 10px;
  border: 1px solid var(--m-line);
  border-radius: 10px;
  background: var(--m-surface);
  font-size: 13px;
}

.am-manager span {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  text-align: left;
}

.am-alert {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 12px 12px 0;
  padding: 10px 12px;
  border-radius: 10px;
  background: var(--m-warn-soft);
  color: var(--m-warn);
  font-size: 13px;
}

.am-tabs {
  display: flex;
  gap: 4px;
  margin: 16px 12px 0;
  padding: 3px;
  border-radius: 12px;
  background: var(--m-line-soft);
}

.am-tabs button {
  flex: 1;
  border: 0;
  background: none;
  padding: 8px 4px;
  border-radius: 9px;
  font-size: 13px;
  font-weight: 600;
  color: var(--m-muted);
}

.am-tabs button.is-active {
  background: var(--m-surface);
  color: var(--m-ink);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
}

.m-section__title .van-icon {
  vertical-align: -2px;
}

.am-tiles {
  padding-top: 0;
}

.am-row {
  display: block;
  width: 100%;
  border: 0;
  padding: 0;
  background: none;
  text-align: left;
}

.am-row:disabled {
  opacity: 0.5;
}

.am-trend-card {
  padding: 14px 10px 12px;
}

.am-trend {
  display: flex;
  align-items: flex-end;
  gap: 2px;
  height: 160px;
  overflow-x: auto;
}

.am-trend__col {
  flex: 1 0 9px;
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  align-items: center;
  gap: 4px;
  border: 0;
  padding: 0;
  background: none;
}

.am-trend__stack {
  width: 100%;
  max-width: 22px;
  min-height: 1px;
  display: flex;
  flex-direction: column;
  border-radius: 3px 3px 1px 1px;
  overflow: hidden;
}

.is-talked {
  background: #22c55e;
}

.is-missed {
  background: #ef4444;
}

.is-other {
  background: #cbd5e1;
}

.am-trend__label {
  font-size: 9px;
  color: var(--m-faint);
  height: 12px;
}

.am-legend {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-top: 10px;
  font-size: 12px;
  color: var(--m-ink-2);
}

.am-legend span {
  display: inline-flex;
  align-items: center;
  gap: 5px;
}

.am-legend i {
  width: 9px;
  height: 9px;
  border-radius: 2px;
}

.am-list {
  padding-top: 12px;
}

.am-mgr__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.am-mgr__head b {
  font-size: 15px;
}

.am-mgr__total {
  border: 0;
  background: var(--m-primary-soft);
  color: var(--m-primary);
  font-weight: 700;
  padding: 4px 10px;
  border-radius: 8px;
  font-size: 14px;
}

.am-mgr__grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 6px;
  margin-top: 10px;
}

.am-mgr__grid button {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 2px;
  padding: 8px 10px;
  border: 1px solid var(--m-line-soft);
  border-radius: 10px;
  background: var(--m-surface-2);
  text-align: left;
}

.am-mgr__grid small {
  font-size: 11px;
  color: var(--m-muted);
}

.am-mgr__grid b {
  font-size: 17px;
}

.am-mgr__grid .is-bad b {
  color: var(--m-bad);
}

.am-mgr__grid .is-warn b {
  color: var(--m-warn);
}

.am-mgr__foot {
  display: flex;
  gap: 14px;
  margin-top: 10px;
  font-size: 12px;
  color: var(--m-muted);
}
</style>
