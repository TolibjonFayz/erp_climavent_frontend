<template>
  <section class="bsl" v-loading="loading">
    <div class="bsl-head">
      <div>
        <h2 class="bsl-title">{{ $t('bslTitle') }}</h2>
        <p class="bsl-sub">{{ $t('bslSubtitle', { from: formatDate(data.from), to: formatDate(data.to) }) }}</p>
      </div>
      <el-radio-group v-model="period" size="default" @change="load">
        <el-radio-button v-for="p in PERIODS" :key="p" :value="p">{{ $t(`bslPeriod_${p}`) }}</el-radio-button>
      </el-radio-group>
    </div>

    <el-alert v-if="error" type="error" :title="error" show-icon :closable="false" />

    <!-- Asosiy raqamlar -->
    <div class="bsl-kpis">
      <UiStat
        :label="$t('bslContracts')"
        tone="good"
        money
        :value="money(totals.dogovor_sum)"
        :sub="$t('bslCount', { n: fmtNum(totals.dogovor_count) })"
      />
      <UiStat
        :label="$t('bslKp')"
        money
        :value="money(totals.kp_sum)"
        :sub="$t('bslCount', { n: fmtNum(totals.kp_count) })"
      />
      <UiStat :label="$t('bslAvgContract')" money :value="money(totals.dogovor_avg)" :sub="$t('bslAvgSub')" />
      <UiStat :label="$t('bslClients')" :value="fmtNum(totals.clients)" :sub="$t('bslClientsSub')" />
    </div>

    <div class="bsl-grid">
      <!-- 12 oylik trend -->
      <UiPanel class="bsl-span2" :title="$t('bslTrend')" :hint="$t('bslTrendHint')">
        <div class="bsl-legend">
          <span><i class="is-dg" />{{ $t('bslContracts') }}</span>
          <span><i class="is-kp" />{{ $t('bslKp') }}</span>
        </div>
        <div class="bsl-chart-scroll">
          <svg
            class="bsl-chart"
            :viewBox="`0 0 ${chart.w} ${chart.h}`"
            role="img"
            :aria-label="$t('bslTrend')"
          >
            <g v-for="tick in chart.ticks" :key="tick.v">
              <line :x1="chart.left" :x2="chart.w" :y1="tick.y" :y2="tick.y" class="bsl-grid-line" />
              <text :x="chart.left - 8" :y="tick.y + 4" class="bsl-axis" text-anchor="end">{{ axisLabel(tick.v) }}</text>
            </g>
            <g v-for="(b, i) in chart.bars" :key="b.month">
              <rect :x="b.x" :y="b.kpY" :width="chart.bw" :height="b.kpH" class="bsl-bar is-kp" rx="2">
                <title>{{ b.label }} — {{ $t('bslKp') }}: {{ money(b.kp) }}</title>
              </rect>
              <rect :x="b.x + chart.bw + 2" :y="b.dgY" :width="chart.bw" :height="b.dgH" class="bsl-bar is-dg" rx="2">
                <title>{{ b.label }} — {{ $t('bslContracts') }}: {{ money(b.dg) }}</title>
              </rect>
              <text
                :x="b.x + chart.bw + 1"
                :y="chart.h - 6"
                class="bsl-axis"
                :class="{ 'is-current': i === chart.bars.length - 1 }"
                text-anchor="middle"
              >{{ b.label }}</text>
            </g>
          </svg>
        </div>
      </UiPanel>

      <!-- Shartnoma holatlari -->
      <UiPanel :title="$t('bslByStatus')">
        <div class="bsl-hbars">
          <div v-for="s in statusRows" :key="s.key" class="bsl-hbar">
            <span class="bsl-hbar__label">{{ $t(s.labelKey) }}</span>
            <div class="bsl-hbar__track">
              <div class="bsl-hbar__fill" :class="`is-${s.key}`" :style="{ width: `${s.pct}%` }" />
            </div>
            <span class="bsl-hbar__val">{{ fmtNum(s.count) }} · {{ short(s.sum) }}</span>
          </div>
          <p v-if="!statusRows.length" class="bsl-empty">{{ $t('bslNoData') }}</p>
        </div>
      </UiPanel>

      <!-- Menejerlar -->
      <UiPanel class="bsl-span3" :title="$t('bslManagers')" :hint="$t('bslConversionHint')" flush>
        <div class="bsl-table-scroll">
          <table class="bsl-table">
            <thead>
              <tr>
                <th>{{ $t('bslManager') }}</th>
                <th class="is-num">{{ $t('bslKp') }}</th>
                <th class="is-num">{{ $t('bslKpSum') }}</th>
                <th class="is-num">{{ $t('bslContracts') }}</th>
                <th class="is-num">{{ $t('bslContractSum') }}</th>
                <th>{{ $t('bslConversion') }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="m in managers" :key="m.name">
                <td class="is-name">{{ m.name }}</td>
                <td class="is-num">{{ fmtNum(m.kp_count) }}</td>
                <td class="is-num">{{ short(m.kp_sum) }}</td>
                <td class="is-num">{{ fmtNum(m.dogovor_count) }}</td>
                <td class="is-num"><b>{{ short(m.dogovor_sum) }}</b></td>
                <td>
                  <div v-if="m.conversion_pct !== null" class="bsl-conv">
                    <div class="bsl-conv__track">
                      <div class="bsl-conv__fill" :style="{ width: `${m.conversion_pct}%` }" />
                    </div>
                    <span class="bsl-conv__val">{{ m.conversion_pct }}%</span>
                    <span class="bsl-conv__sub">{{ m.converted_clients }}/{{ m.kp_clients }}</span>
                  </div>
                  <span v-else class="bsl-muted">—</span>
                </td>
              </tr>
              <tr v-if="!managers.length">
                <td colspan="6" class="bsl-empty">{{ $t('bslNoData') }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </UiPanel>

      <!-- Eng katta mijozlar -->
      <UiPanel :title="$t('bslTopClients')">
        <ol class="bsl-list">
          <li v-for="c in data.top_clients" :key="c.name">
            <span class="bsl-list__name">{{ c.name }}</span>
            <span class="bsl-list__val">{{ short(c.sum) }}</span>
            <span class="bsl-list__sub">{{ $t('bslCount', { n: c.count }) }}</span>
          </li>
        </ol>
        <p v-if="!data.top_clients?.length" class="bsl-empty">{{ $t('bslNoData') }}</p>
      </UiPanel>

      <!-- Uzoq vaqt olmagan mijozlar -->
      <UiPanel :title="$t('bslDormant')" :hint="$t('bslDormantHint')">
        <ol class="bsl-list">
          <li v-for="c in data.dormant_clients" :key="c.name">
            <span class="bsl-list__name">{{ c.name }}</span>
            <span class="bsl-list__val is-warn">{{ $t('bslDaysAgo', { n: c.days_since }) }}</span>
            <span class="bsl-list__sub">{{ c.manager }} · {{ $t('bslCount', { n: c.count }) }} · {{ short(c.sum) }}</span>
          </li>
        </ol>
        <p v-if="!data.dormant_clients?.length" class="bsl-empty">{{ $t('bslNoDormant') }}</p>
      </UiPanel>

      <!-- Raqiblar -->
      <UiPanel :title="$t('bslCompetitors')">
        <template v-if="comp.total">
          <div class="bsl-comp">
            <div><b>{{ comp.total }}</b><span>{{ $t('bslCompTotal') }}</span></div>
            <div class="is-good"><b>{{ comp.won }}</b><span>{{ $t('cmpOutcome_won') }}</span></div>
            <div class="is-bad"><b>{{ comp.lost }}</b><span>{{ $t('cmpOutcome_lost') }}</span></div>
          </div>
          <h4 v-if="comp.top_lost_to.length" class="bsl-h4">{{ $t('bslLostTo') }}</h4>
          <ol class="bsl-list">
            <li v-for="c in comp.top_lost_to" :key="c.name">
              <span class="bsl-list__name">{{ c.name }}</span>
              <span class="bsl-list__val is-bad">{{ c.count }}</span>
            </li>
          </ol>
          <p v-if="lostReasons" class="bsl-muted">{{ $t('bslLostReasons') }}: {{ lostReasons }}</p>
        </template>
        <div v-else class="bsl-empty">
          <p>{{ $t('bslNoCompetitors') }}</p>
          <router-link to="/competitors">{{ $t('bslGoCompetitors') }}</router-link>
        </div>
      </UiPanel>
    </div>
  </section>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import bossApi from '@/api/boss'
import UiPanel from '@/components/ui/UiPanel.vue'
import UiStat from '@/components/ui/UiStat.vue'
import { fmtNum, formatDate } from '@/utils/format'
import { errorText } from '@/utils/errorText'

// Direktor uchun savdo bo'limi: KP va shartnomalar (1C importi), menejerlar konversiyasi,
// 12 oylik trend, eng katta va uzoq vaqt olmagan mijozlar, raqiblarga yutqazishlar
const PERIODS = ['month', 'quarter', 'year']
const { t } = useI18n()

const period = ref('year')
const loading = ref(false)
const error = ref('')
const data = ref({ totals: {}, managers: [], trend: [], top_clients: [], dormant_clients: [], competitors: {} })

const totals = computed(() => data.value.totals || {})
const managers = computed(() => data.value.managers || [])
const comp = computed(() => ({ total: 0, won: 0, lost: 0, top_lost_to: [], lost_reasons: {}, ...data.value.competitors }))

async function load() {
  loading.value = true
  error.value = ''
  try {
    data.value = await bossApi.getSales(period.value)
  } catch (err) {
    error.value = errorText(err, t('xatolikYuzBerdi'))
  } finally {
    loading.value = false
  }
}
onMounted(load)

// ─── Formatlash: katta summalar "mlrd/mln" bilan ───
function short(v) {
  const n = Number(v) || 0
  if (Math.abs(n) >= 1e9) return `${(n / 1e9).toFixed(1)} ${t('bslBn')}`
  if (Math.abs(n) >= 1e6) return `${Math.round(n / 1e6)} ${t('bslMn')}`
  return fmtNum(Math.round(n))
}
const money = (v) => `${short(v)} ${t('amoCurrency')}`
// O'q yozuvlari qadamlari yaxlit — kasr qismi keraksiz ("150 mlrd", "2.5 mlrd")
function axisLabel(v) {
  if (v >= 1e9) return `${+(v / 1e9).toFixed(1)} ${t('bslBn')}`
  if (v >= 1e6) return `${Math.round(v / 1e6)} ${t('bslMn')}`
  return fmtNum(v)
}

// ─── Shartnoma holatlari ───
const STATUS = [
  { key: 'Open', labelKey: 'dogovorStatusOpen' },
  { key: 'PartlyShipped', labelKey: 'dogovorStatusPartlyShipped' },
  { key: 'Shipped', labelKey: 'dogovorStatusShipped' },
  { key: 'Closed', labelKey: 'dogovorStatusClosed' },
]
const statusRows = computed(() => {
  const by = totals.value.dogovor_by_status || {}
  const max = Math.max(1, ...Object.values(by).map((s) => s.count))
  return STATUS.filter((s) => by[s.key]).map((s) => ({
    ...s,
    count: by[s.key].count,
    sum: by[s.key].sum,
    pct: Math.round((by[s.key].count / max) * 100),
  }))
})

const REASON_KEYS = ['price', 'deadline', 'quality', 'relationship', 'other']
const lostReasons = computed(() => {
  const r = comp.value.lost_reasons || {}
  return REASON_KEYS.filter((k) => r[k])
    .sort((a, b) => r[b] - r[a])
    .map((k) => `${t(`cmpReason_${k}`)} ${r[k]}`)
    .join(', ')
})

// ─── 12 oylik trend: ikki seriyali ustunlar, bitta shkala ───
const MONTHS_SHORT = ['yan', 'fev', 'mar', 'apr', 'may', 'iyn', 'iyl', 'avg', 'sen', 'okt', 'noy', 'dek']
const chart = computed(() => {
  const rows = data.value.trend || []
  const w = 720
  const h = 230
  // Chapda "150 mlrd" kabi yozuvlar uchun joy
  const left = 74
  const top = 10
  const bottom = 26
  const plotH = h - top - bottom
  const max = Math.max(1, ...rows.flatMap((r) => [r.kp_sum, r.dogovor_sum]))
  // Yaxlit qadam: 1, 2, 5 × 10^n
  const raw = max / 4
  const pow = 10 ** Math.floor(Math.log10(raw))
  const stepV = [1, 2, 5, 10].map((m) => m * pow).find((s) => s >= raw)
  const top4 = stepV * Math.ceil(max / stepV)
  const y = (v) => top + plotH - (v / top4) * plotH
  const ticks = []
  for (let v = 0; v <= top4 + 1e-6; v += stepV) ticks.push({ v, y: y(v) })
  const slot = (w - left) / Math.max(1, rows.length)
  const bw = Math.max(6, Math.min(18, (slot - 10) / 2))
  const bars = rows.map((r, i) => {
    const x = left + i * slot + (slot - (bw * 2 + 2)) / 2
    return {
      month: r.month,
      label: MONTHS_SHORT[Number(r.month.slice(5, 7)) - 1],
      x,
      kp: r.kp_sum,
      dg: r.dogovor_sum,
      kpY: y(r.kp_sum),
      kpH: Math.max(0, top + plotH - y(r.kp_sum)),
      dgY: y(r.dogovor_sum),
      dgH: Math.max(0, top + plotH - y(r.dogovor_sum)),
    }
  })
  return { w, h, left, ticks, bars, bw }
})
</script>

<style scoped lang="scss">
.bsl {
  display: flex;
  flex-direction: column;
  gap: 14px;
}
.bsl-head {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  justify-content: space-between;
  gap: 10px 16px;
}
.bsl-title {
  margin: 0;
  font-size: 19px;
  font-weight: 700;
  color: var(--ui-ink);
}
.bsl-sub {
  margin: 2px 0 0;
  font-size: 13px;
  color: var(--ui-muted);
}
.bsl-kpis {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
}
.bsl-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 14px;
  align-items: start;
}
.bsl-span2 {
  grid-column: span 2;
}
.bsl-span3 {
  grid-column: 1 / -1;
}

/* Trend */
.bsl-legend {
  display: flex;
  gap: 16px;
  margin-bottom: 6px;
  font-size: 12px;
  color: var(--ui-muted);
  i {
    display: inline-block;
    width: 10px;
    height: 10px;
    margin-right: 6px;
    border-radius: 2px;
    vertical-align: -1px;
  }
}
.bsl-chart-scroll {
  overflow-x: auto;
}
.bsl-chart {
  width: 100%;
  min-width: 520px;
  height: auto;
  display: block;
}
.bsl-grid-line {
  stroke: var(--ui-line);
  stroke-width: 1;
}
.bsl-axis {
  fill: var(--ui-muted);
  font-size: 11px;
  font-variant-numeric: tabular-nums;
  &.is-current {
    fill: var(--ui-ink);
    font-weight: 700;
  }
}
.bsl-bar.is-dg,
.bsl-legend .is-dg {
  fill: var(--ui-good);
  background: var(--ui-good);
}
.bsl-bar.is-kp,
.bsl-legend .is-kp {
  fill: var(--ui-line-strong);
  background: var(--ui-line-strong);
}

/* Holat bo'yicha */
.bsl-hbars {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.bsl-hbar {
  display: grid;
  grid-template-columns: 110px 1fr auto;
  align-items: center;
  gap: 10px;
  font-size: 13px;
}
.bsl-hbar__label {
  color: var(--ui-ink-2);
}
.bsl-hbar__track {
  height: 8px;
  border-radius: 999px;
  background: var(--ui-surface-3);
  overflow: hidden;
}
.bsl-hbar__fill {
  height: 100%;
  border-radius: 999px;
  background: var(--ui-link);
  &.is-Shipped {
    background: var(--ui-good);
  }
  &.is-PartlyShipped {
    background: var(--ui-warn);
  }
  &.is-Closed {
    background: var(--ui-line-strong);
  }
}
.bsl-hbar__val {
  color: var(--ui-muted);
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}

/* Menejerlar */
.bsl-table-scroll {
  overflow-x: auto;
}
.bsl-table {
  width: 100%;
  min-width: 680px;
  border-collapse: collapse;
  font-size: 14px;
  th,
  td {
    padding: 10px 14px;
    border-bottom: 1px solid var(--ui-line);
    text-align: left;
  }
  th {
    font-size: 12px;
    font-weight: 600;
    color: var(--ui-muted);
    background: var(--ui-surface-2);
  }
  tbody tr:last-child td {
    border-bottom: 0;
  }
  .is-num {
    text-align: right;
    font-variant-numeric: tabular-nums;
  }
  .is-name {
    font-weight: 600;
    color: var(--ui-ink);
  }
}
.bsl-conv {
  display: flex;
  align-items: center;
  gap: 8px;
}
.bsl-conv__track {
  flex: 1;
  min-width: 70px;
  height: 8px;
  border-radius: 999px;
  background: var(--ui-surface-3);
  overflow: hidden;
}
.bsl-conv__fill {
  height: 100%;
  background: var(--ui-good);
  border-radius: 999px;
}
.bsl-conv__val {
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  color: var(--ui-ink);
}
.bsl-conv__sub {
  font-size: 12px;
  color: var(--ui-muted);
}

/* Ro'yxatlar */
.bsl-list {
  margin: 0;
  padding: 0;
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 2px;
  li {
    display: grid;
    grid-template-columns: 1fr auto;
    gap: 0 10px;
    padding: 7px 0;
    border-bottom: 1px dashed var(--ui-line);
  }
  li:last-child {
    border-bottom: 0;
  }
}
.bsl-list__name {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-weight: 600;
  color: var(--ui-ink);
}
.bsl-list__val {
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  color: var(--ui-ink);
  &.is-warn {
    color: var(--ui-warn);
  }
  &.is-bad {
    color: var(--ui-bad);
  }
}
.bsl-list__sub {
  grid-column: 1 / -1;
  font-size: 12px;
  color: var(--ui-muted);
}

/* Raqiblar */
.bsl-comp {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
  div {
    display: flex;
    flex-direction: column;
    padding: 10px;
    border-radius: 8px;
    background: var(--ui-surface-2);
  }
  b {
    font-size: 20px;
    font-variant-numeric: tabular-nums;
    color: var(--ui-ink);
  }
  span {
    font-size: 12px;
    color: var(--ui-muted);
  }
  .is-good b {
    color: var(--ui-good);
  }
  .is-bad b {
    color: var(--ui-bad);
  }
}
.bsl-h4 {
  margin: 14px 0 4px;
  font-size: 13px;
  color: var(--ui-ink-2);
}
.bsl-muted {
  font-size: 13px;
  color: var(--ui-muted);
}
.bsl-empty {
  padding: 16px 0;
  text-align: center;
  font-size: 13px;
  color: var(--ui-muted);
  a {
    color: var(--ui-link);
  }
}

@media (max-width: 1100px) {
  .bsl-grid {
    grid-template-columns: 1fr 1fr;
  }
  .bsl-span2,
  .bsl-span3 {
    grid-column: 1 / -1;
  }
}
@media (max-width: 700px) {
  .bsl-kpis,
  .bsl-grid {
    grid-template-columns: 1fr 1fr;
  }
  .bsl-grid > * {
    grid-column: 1 / -1;
  }
}
</style>
