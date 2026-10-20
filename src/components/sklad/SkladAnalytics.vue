<template>
  <div class="sk-viz">
    <!-- Kunlik kirim / chiqim -->
    <UiPanel :title="$t('skAnDaily')" :hint="$t('skAnDailyHint')">
      <template #actions>
        <span class="sk-legend">
          <i class="sw sw-in" />{{ $t('skStatIn') }} <i class="sw sw-out" />{{ $t('skStatOut') }}
        </span>
      </template>
      <div v-if="loading" class="sk-empty">…</div>
      <div v-else-if="!daily.max" class="sk-empty">{{ $t('skNoMoves') }}</div>
      <div v-else class="sk-chart" @mouseleave="hover = null">
        <svg :viewBox="`0 0 ${W} ${H}`" role="img" :aria-label="$t('skAnDaily')">
          <g v-for="tick in daily.ticks" :key="tick">
            <line :x1="PADL" :x2="W - 4" :y1="y(tick)" :y2="y(tick)" class="grid" />
            <text :x="PADL - 6" :y="y(tick) + 4" class="axis" text-anchor="end">{{ fmtCompact(tick) }}</text>
          </g>
          <g v-for="(d, i) in daily.days" :key="d.date">
            <rect
              v-if="d.in"
              :x="x(i) + 1"
              :y="y(d.in)"
              :width="bw"
              :height="Math.max(1, y(0) - y(d.in))"
              rx="3"
              class="bar-in"
            />
            <rect
              v-if="d.out"
              :x="x(i) + bw + 3"
              :y="y(d.out)"
              :width="bw"
              :height="Math.max(1, y(0) - y(d.out))"
              rx="3"
              class="bar-out"
            />
            <text v-if="i % labelEvery === 0" :x="x(i) + slot / 2" :y="H - 6" class="axis" text-anchor="middle">
              {{ d.day }}
            </text>
            <rect
              :x="x(i)"
              :y="PADT"
              :width="slot"
              :height="y(0) - PADT"
              class="hit"
              tabindex="0"
              @mouseenter="hover = { i, d }"
              @focus="hover = { i, d }"
            />
          </g>
          <line :x1="PADL" :x2="W - 4" :y1="y(0)" :y2="y(0)" class="base" />
        </svg>
        <div v-if="hover" class="sk-tip" :style="{ left: `${((x(hover.i) + slot / 2) / W) * 100}%` }">
          <div class="sk-tip__date">{{ hover.d.date.split('-').reverse().join('.') }}</div>
          <div><i class="sw sw-in" /><b>{{ fmtQty(hover.d.in) }}</b> {{ $t('skStatIn') }}</div>
          <div><i class="sw sw-out" /><b>{{ fmtQty(hover.d.out) }}</b> {{ $t('skStatOut') }}</div>
          <div class="sk-tip__sub">{{ $t('skAnMovesN', { n: hover.d.count }) }}</div>
        </div>
      </div>
    </UiPanel>

    <div class="sk-grid">
      <!-- Guruhlar bo'yicha -->
      <UiPanel :title="$t('skAnGroups')" :hint="$t('skAnGroupsHint')">
        <div class="sk-bars">
          <div class="sk-bars__head">
            <span>{{ $t('skColGroup') }}</span><span>{{ $t('skColClosing') }}</span>
            <span class="num">{{ $t('skColIn') }}</span><span class="num">{{ $t('skColOut') }}</span>
          </div>
          <div v-for="g in groups" :key="g.name" class="sk-bars__row" :title="`${g.name}: ${fmtQty(g.closing)}`">
            <span class="lbl">{{ g.name }} <small>{{ g.count }}</small></span>
            <span class="track"><span class="fill fill-stock" :style="{ width: pct(g.closing, groupMax) }" /><em>{{ fmtQty(g.closing) }}</em></span>
            <span class="num is-in">{{ g.in ? '+' + fmtQty(g.in) : '·' }}</span>
            <span class="num is-out">{{ g.out ? '−' + fmtQty(g.out) : '·' }}</span>
          </div>
        </div>
      </UiPanel>

      <!-- Eng ko'p jo'natilganlar -->
      <UiPanel :title="$t('skAnTopOut')" :hint="$t('skAnTopOutHint')">
        <div v-if="!topOut.length" class="sk-empty">{{ $t('skNoMoves') }}</div>
        <button
          v-for="it in topOut"
          :key="it.id"
          type="button"
          class="sk-rank"
          @click="$emit('open', it.id)"
        >
          <span class="lbl">{{ it.name }}</span>
          <span class="track"><span class="fill fill-out" :style="{ width: pct(it.out, topOut[0].out) }" /></span>
          <span class="num">{{ fmtQty(it.out) }}</span>
        </button>
      </UiPanel>
    </div>

    <div class="sk-grid">
      <!-- Harakatsiz qoldiq -->
      <UiPanel :title="$t('skAnDead')" :hint="$t('skAnDeadHint')">
        <template #actions>{{ $t('skAnDeadSum', { n: fmtNum(dead.length), q: fmtQty(deadQty) }) }}</template>
        <button v-for="it in dead.slice(0, 12)" :key="it.id" type="button" class="sk-line" @click="$emit('open', it.id)">
          <span class="lbl">{{ it.name }}</span>
          <span class="sk-muted">{{ it.group_name }}</span>
          <b class="num">{{ fmtQty(it.closing) }}</b>
        </button>
        <div v-if="!dead.length" class="sk-empty">{{ $t('skAnNone') }}</div>
      </UiPanel>

      <!-- Ma'lumot sifati -->
      <UiPanel :title="$t('skAnQuality')" :hint="$t('skAnQualityHint')">
        <ul class="sk-quality">
          <li :class="negative.length ? 'bad' : 'good'">
            <span>{{ negative.length ? '⚠️' : '✓' }}</span>{{ $t('skAnNegative', { n: negative.length }) }}
          </li>
          <li :class="noGroup ? 'warn' : 'good'">
            <span>{{ noGroup ? '⚠️' : '✓' }}</span>{{ $t('skAnNoGroup', { n: noGroup }) }}
          </li>
          <li :class="noMin === items.length ? 'warn' : 'good'">
            <span>{{ noMin === items.length ? 'ℹ️' : '✓' }}</span>{{ $t('skAnNoMin', { n: noMin }) }}
          </li>
          <li :class="noSap ? 'warn' : 'good'">
            <span>{{ noSap ? 'ℹ️' : '✓' }}</span>{{ $t('skAnNoSap', { n: noSap }) }}
          </li>
        </ul>
        <button v-for="it in negative" :key="it.id" type="button" class="sk-line" @click="$emit('open', it.id)">
          <span class="lbl">{{ it.name }}</span>
          <b class="num st-neg">{{ fmtQty(it.closing) }}</b>
        </button>
      </UiPanel>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import UiPanel from '@/components/ui/UiPanel.vue'
import { useSkladStore } from '@/stores/sklad'
import { fmtNum } from '@/utils/format'
import { fmtQty, lastDayOfPeriod } from '@/utils/skladFormat'

const props = defineProps({
  items: { type: Array, required: true },
})
defineEmits(['open'])
const store = useSkladStore()
const loading = ref(false)
const hover = ref(null)

async function load() {
  loading.value = true
  try {
    await store.loadMovements()
  } finally {
    loading.value = false
  }
}
onMounted(load)
watch(() => store.period, load)

// ─── Kunlik grafik geometriyasi ───
const W = 960
const H = 220
const PADL = 44
const PADT = 10
const PADB = 24
const daysInPeriod = computed(() => Number(lastDayOfPeriod(store.period).slice(-2)) || 31)
const slot = computed(() => (W - PADL - 4) / daysInPeriod.value)
const bw = computed(() => Math.max(2, (slot.value - 6) / 2))
const labelEvery = computed(() => (daysInPeriod.value > 20 ? 2 : 1))
const x = (i) => PADL + i * slot.value

const daily = computed(() => {
  const n = daysInPeriod.value
  const days = Array.from({ length: n }, (_, i) => ({
    day: i + 1,
    date: `${store.period}-${String(i + 1).padStart(2, '0')}`,
    in: 0,
    out: 0,
    count: 0,
  }))
  for (const m of store.movements) {
    const d = Number(String(m.move_date).slice(8, 10)) - 1
    if (!days[d] || String(m.move_date).slice(0, 7) !== store.period) continue
    if (m.type === 'in') days[d].in += m.qty
    if (m.type === 'out') days[d].out += m.qty
    if (m.type === 'in' || m.type === 'out') days[d].count++
  }
  const raw = Math.max(0, ...days.map((d) => Math.max(d.in, d.out)))
  const step = niceStep(raw / 4)
  const max = raw ? Math.ceil(raw / step) * step : 0
  const ticks = max ? Array.from({ length: max / step + 1 }, (_, i) => i * step) : []
  return { days, max, ticks }
})
const y = (v) => {
  const max = daily.value.max || 1
  return H - PADB - (v / max) * (H - PADB - PADT)
}

function niceStep(v) {
  if (v <= 0) return 1
  const p = 10 ** Math.floor(Math.log10(v))
  const f = v / p
  return (f <= 1 ? 1 : f <= 2 ? 2 : f <= 5 ? 5 : 10) * p
}
const fmtCompact = (n) => (n >= 1000 ? `${Math.round(n / 100) / 10}k` : String(n))
const pct = (v, max) => `${max ? Math.max(1, (v / max) * 100) : 0}%`

// ─── Guruhlar ───
const groups = computed(() => {
  const map = new Map()
  for (const it of props.items) {
    const k = it.group_name || '—'
    const g = map.get(k) || { name: k, count: 0, closing: 0, in: 0, out: 0 }
    g.count++
    g.closing += it.closing
    g.in += it.in
    g.out += it.out
    map.set(k, g)
  }
  return [...map.values()].sort((a, b) => b.closing - a.closing)
})
const groupMax = computed(() => Math.max(0, ...groups.value.map((g) => g.closing)))

const topOut = computed(() =>
  props.items
    .filter((i) => i.out > 0)
    .sort((a, b) => b.out - a.out)
    .slice(0, 10),
)

const dead = computed(() =>
  props.items.filter((i) => i.closing > 0 && !i.in && !i.out && !i.reserve).sort((a, b) => b.closing - a.closing),
)
const deadQty = computed(() => dead.value.reduce((s, i) => s + i.closing, 0))
const negative = computed(() => props.items.filter((i) => i.closing < 0))
const noGroup = computed(() => props.items.filter((i) => !i.group_name).length)
const noMin = computed(() => props.items.filter((i) => i.min_qty == null).length)
const noSap = computed(() => props.items.filter((i) => !i.sap_code).length)
</script>

<style scoped lang="scss">
/* Seriya ranglari: kirim = 1-slot (ko'k), chiqim = 2-slot (to'q sariq) */
.sk-viz {
  --sk-in: #2a78d6;
  --sk-out: #eb6834;
  --sk-stock: #2a78d6;
  display: flex;
  flex-direction: column;
  gap: 16px;
}
:global(html.dark) .sk-viz {
  --sk-in: #3987e5;
  --sk-out: #d95926;
  --sk-stock: #3987e5;
}
.sk-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(380px, 1fr));
  gap: 16px;
}
@media (max-width: 600px) {
  .sk-grid {
    grid-template-columns: 1fr;
  }
}
.sk-legend {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: var(--ui-ink-2);
}
.sw {
  display: inline-block;
  width: 10px;
  height: 10px;
  border-radius: 3px;
  margin: 0 4px 0 8px;
  vertical-align: -1px;
}
.sw-in {
  background: var(--sk-in);
}
.sw-out {
  background: var(--sk-out);
}
.sk-chart {
  position: relative;
  svg {
    display: block;
    width: 100%;
    height: auto;
  }
  rect {
    stroke: none;
  }
  .grid {
    stroke: var(--ui-line-soft);
  }
  .base {
    stroke: var(--ui-line-strong);
  }
  .axis {
    font-size: 10px;
    fill: var(--ui-muted);
  }
  .bar-in {
    fill: var(--sk-in);
  }
  .bar-out {
    fill: var(--sk-out);
  }
  .hit {
    fill: transparent;
    cursor: crosshair;
    outline: none;
    &:hover,
    &:focus {
      fill: var(--ui-ink);
      fill-opacity: 0.05;
    }
  }
}
.sk-tip {
  position: absolute;
  top: 6px;
  transform: translateX(-50%);
  padding: 8px 10px;
  border-radius: 8px;
  background: var(--ui-surface);
  border: 1px solid var(--ui-line);
  box-shadow: 0 6px 18px rgba(0, 0, 0, 0.12);
  font-size: 12px;
  color: var(--ui-ink-2);
  pointer-events: none;
  white-space: nowrap;
  b {
    color: var(--ui-ink);
    font-variant-numeric: tabular-nums;
  }
  .sw {
    margin-left: 0;
  }
}
.sk-tip__date {
  font-weight: 700;
  color: var(--ui-ink);
  margin-bottom: 2px;
}
.sk-tip__sub {
  color: var(--ui-muted);
}
.sk-bars__head,
.sk-bars__row {
  display: grid;
  grid-template-columns: minmax(120px, 1fr) minmax(120px, 1.4fr) 64px 64px;
  gap: 10px;
  align-items: center;
}
.sk-bars__head {
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: var(--ui-muted);
  padding-bottom: 6px;
}
.sk-bars__row {
  padding: 6px 0;
  border-top: 1px solid var(--ui-line-soft);
  font-size: 13px;
}
.lbl {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: var(--ui-ink-2);
  small {
    color: var(--ui-muted);
  }
}
.track {
  position: relative;
  display: flex;
  align-items: center;
  gap: 6px;
  height: 18px;
  em {
    font-style: normal;
    font-size: 12px;
    font-weight: 600;
    color: var(--ui-ink);
    font-variant-numeric: tabular-nums;
  }
}
.fill {
  display: block;
  height: 8px;
  border-radius: 0 4px 4px 0;
  max-width: calc(100% - 52px);
}
.fill-stock {
  background: var(--sk-stock);
}
.fill-out {
  background: var(--sk-out);
  max-width: 100%;
}
.num {
  text-align: right;
  font-variant-numeric: tabular-nums;
  font-size: 12px;
}
.is-in {
  color: var(--ui-good);
}
.is-out {
  color: var(--ui-orange-ink);
}
.sk-rank,
.sk-line {
  display: grid;
  width: 100%;
  align-items: center;
  gap: 10px;
  padding: 7px 8px;
  margin: 0 -8px;
  border: 0;
  border-radius: 6px;
  background: none;
  font: inherit;
  font-size: 13px;
  text-align: left;
  cursor: pointer;
  color: var(--ui-ink-2);
  &:hover {
    background: var(--ui-surface-2);
  }
  &:focus-visible {
    outline: 2px solid var(--ui-link);
  }
}
.sk-rank {
  grid-template-columns: minmax(140px, 1.3fr) 1fr 56px;
  width: calc(100% + 16px);
}
.sk-line {
  grid-template-columns: 1fr auto 70px;
  width: calc(100% + 16px);
  border-top: 1px solid var(--ui-line-soft);
}
.sk-muted {
  font-size: 12px;
  color: var(--ui-muted);
}
.st-neg {
  color: var(--ui-bad);
}
.sk-quality {
  list-style: none;
  margin: 0 0 8px;
  padding: 0;
  li {
    display: flex;
    gap: 8px;
    padding: 6px 0;
    font-size: 13px;
    color: var(--ui-ink-2);
    span {
      width: 18px;
      text-align: center;
    }
    &.good span {
      color: var(--ui-good);
      font-weight: 700;
    }
  }
}
.sk-empty {
  padding: 24px;
  text-align: center;
  color: var(--ui-muted);
}
</style>
