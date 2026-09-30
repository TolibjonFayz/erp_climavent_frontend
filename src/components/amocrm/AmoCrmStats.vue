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
        <el-radio-group v-model="scope" size="small" class="amo-scope" @change="load">
          <el-radio-button value="clients">
            <AmoHint :label="$t('amoScopeClients')" :hint="$t('amoHintScopeClients')" />
          </el-radio-button>
          <el-radio-button value="all">{{ $t('amoScopeAll') }}</el-radio-button>
        </el-radio-group>
        <el-button size="small" :icon="UserFilled" @click="exclusionsOpen = true">
          {{ $t('amoExclusionsBtn') }}
        </el-button>
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
      <p class="amo-click-hint">
        <el-icon><Pointer /></el-icon>
        {{ $t('amoClickHint') }}
      </p>

      <!-- ═══ Qo'ng'iroqlar ═══ -->
      <div class="amo-block">
        <div class="amo-block__head">
          <h4>{{ $t('amoCallsTitle') }}</h4>
          <span class="amo-summary">
            <AmoHint :label="$t('amoCallsTotal')" :hint="$t('amoHintCallsTotal')" />:
            <button type="button" class="amo-num" @click="drillCalls('all', $t('amoCallsTotal'))">
              {{ fmtNum(calls.total) }}
            </button>
            <span class="amo-dot">·</span>
            <AmoHint :label="$t('amoTalked')" :hint="$t('amoHintTalked')" />:
            <button type="button" class="amo-num" @click="drillCalls('answered', $t('amoTalked'))">
              {{ fmtNum(calls.talked) }}
            </button>
            <span class="amo-dot">·</span>
            <AmoHint :label="$t('amoCallsDuration')" :hint="$t('amoHintDuration')" />:
            <b>{{ fmtDuration(calls.duration, t) }}</b>
          </span>
        </div>

        <!-- Mijoz emas deb chiqarib tashlanganlar -->
        <div v-if="calls.excluded?.calls" class="amo-excluded">
          <el-icon><Filter /></el-icon>
          <AmoHint :hint="$t('amoHintExcluded')">
            {{
              $t(scope === 'clients' ? 'amoExcludedSummary' : 'amoExcludedSummaryAll', {
                calls: fmtNum(calls.excluded.calls),
                numbers: fmtNum(calls.excluded.numbers),
              })
            }}
          </AmoHint>
          <button
            v-for="r in calls.excluded.by_reason"
            :key="r.reason"
            type="button"
            class="amo-chip"
            @click="drillExcluded(r.reason)"
          >
            {{ $t(`amoExcl_${r.reason}`) }}: <b>{{ fmtNum(r.calls) }}</b>
          </button>
        </div>

        <div class="amo-dir-grid">
          <div v-for="dir in directions" :key="dir.key" class="amo-card">
            <div class="amo-card__title">
              <AmoHint :hint="dir.hint">
                <el-icon><component :is="dir.icon" /></el-icon>
                {{ dir.title }}
              </AmoHint>
            </div>
            <div class="amo-kpis">
              <component
                :is="k.onClick ? 'button' : 'div'"
                v-for="k in dir.tiles"
                :key="k.key"
                :type="k.onClick ? 'button' : undefined"
                class="amo-kpi"
                :class="[k.tone && `amo-kpi--${k.tone}`, { 'is-link': k.onClick }]"
                @click="k.onClick && k.onClick()"
              >
                <div class="amo-kpi__value">
                  {{ k.value }}
                  <small v-if="k.sub">{{ k.sub }}</small>
                </div>
                <div class="amo-kpi__label"><AmoHint :label="k.label" :hint="k.hint" /></div>
              </component>
            </div>

            <div class="amo-sub">
              <AmoHint :label="dir.resultsTitle" :hint="dir.resultsHint" />
            </div>
            <div v-if="!dir.rows.length" class="amo-empty">{{ $t('amoNoData') }}</div>
            <div v-else class="amo-bars">
              <button
                v-for="r in dir.rows"
                :key="r.status"
                type="button"
                class="amo-bar-row is-link"
                @click="r.onClick()"
              >
                <span class="amo-bar-row__label" :class="{ 'is-bad': r.bad }">
                  <AmoHint :label="r.label" :hint="r.hint" />
                </span>
                <span class="amo-bar-row__track">
                  <span
                    class="amo-bar-row__fill"
                    :class="{ 'is-bad': r.bad }"
                    :style="{ width: barWidth(r.count, dir.max) }"
                  ></span>
                </span>
                <span class="amo-bar-row__val">
                  {{ fmtNum(r.count) }} <small>{{ pct(r.count, dir.total) }}%</small>
                </span>
              </button>
            </div>
          </div>
        </div>

        <!-- Telefoniya platformalari bo'yicha -->
        <div v-if="calls.by_source?.length" class="amo-card amo-gap">
          <div class="amo-card__title">
            <AmoHint :label="$t('amoBySource')" :hint="$t('amoHintBySource')" />
          </div>
          <div class="amo-src">
            <div class="amo-src__row amo-src__row--head">
              <span>{{ $t('amoColSource') }}</span>
              <span class="num">
                <AmoHint :label="$t('amoSrcClients')" :hint="$t('amoHintSrcClients')" />
              </span>
              <span class="num">{{ $t('amoTalked') }}</span>
              <span class="num">{{ $t('amoInMissed') }}</span>
              <span class="num">
                <AmoHint :label="$t('amoSrcExcluded')" :hint="$t('amoHintSrcExcluded')" />
              </span>
            </div>
            <div v-for="src in calls.by_source" :key="src.source" class="amo-src__row">
              <span class="amo-src__name">{{ sourceLabel(src.source) }}</span>
              <span class="num">
                <button type="button" class="amo-num" @click="drillSource(src, 'all', 'clients')">
                  {{ fmtNum(src.clients) }}
                </button>
              </span>
              <span class="num">
                <button
                  type="button"
                  class="amo-num"
                  @click="drillSource(src, 'answered', 'clients')"
                >
                  {{ fmtNum(src.talked) }}
                </button>
              </span>
              <span class="num">
                <button
                  type="button"
                  class="amo-num is-bad"
                  @click="drillSource(src, 'in_missed', 'clients')"
                >
                  {{ fmtNum(src.in_missed) }}
                </button>
              </span>
              <span class="num">
                <button
                  v-if="src.excluded"
                  type="button"
                  class="amo-num is-muted"
                  @click="drillSource(src, 'all', 'excluded')"
                >
                  {{ fmtNum(src.excluded) }}
                </button>
                <span v-else>0</span>
              </span>
            </div>
          </div>
        </div>

        <!-- Kunlar / oylar bo'yicha -->
        <div class="amo-card amo-gap">
          <div class="amo-card__title">
            <AmoHint
              :label="$t(trendByMonth ? 'amoByMonth' : 'amoByDay')"
              :hint="$t('amoHintTrend')"
            />
            <span class="amo-legend">
              <span class="amo-legend__item"
                ><i class="sw sw--answered"></i>{{ $t('amoTalked') }}</span
              >
              <span class="amo-legend__item"
                ><i class="sw sw--other"></i>{{ $t('amoNotTalked') }}</span
              >
            </span>
          </div>
          <div v-if="!calls.total" class="amo-empty">{{ $t('amoNoData') }}</div>
          <div v-else class="amo-trend" @mouseleave="hover = null">
            <button
              v-for="(d, i) in trend"
              :key="d.key"
              type="button"
              class="amo-trend__col"
              :aria-label="`${d.title}: ${d.total}`"
              @mouseenter="hover = i"
              @focus="hover = i"
              @click="drillBucket(d)"
            >
              <span class="amo-trend__stack" :class="{ 'is-hover': hover === i }">
                <span
                  class="amo-trend__seg amo-trend__seg--other"
                  :style="{ height: segHeight(d.total - d.talked) }"
                ></span>
                <span
                  class="amo-trend__seg amo-trend__seg--answered"
                  :style="{ height: segHeight(d.talked) }"
                ></span>
              </span>
              <span v-if="showTrendLabel(i)" class="amo-trend__label">{{ d.short }}</span>
            </button>
            <div v-if="hover !== null && trend[hover]" class="amo-tip" :style="tipStyle">
              <b>{{ trend[hover].title }}</b>
              <div>{{ $t('amoCallsTotal') }}: {{ fmtNum(trend[hover].total) }}</div>
              <div>{{ $t('amoTalked') }}: {{ fmtNum(trend[hover].talked) }}</div>
              <div>{{ $t('amoInMissed') }}: {{ fmtNum(trend[hover].in_missed) }}</div>
            </div>
          </div>
        </div>

        <!-- Menejerlar bo'yicha -->
        <div class="amo-card amo-gap">
          <div class="amo-card__title">
            <AmoHint :label="$t('amoByManager')" :hint="$t('amoHintByManager')" />
          </div>
          <el-table
            :data="managerRows"
            size="small"
            :empty-text="$t('amoNoData')"
            :default-sort="{ prop: 'total', order: 'descending' }"
          >
            <el-table-column prop="name" :label="$t('amoManager')" min-width="150" fixed />
            <el-table-column
              v-for="col in managerCols"
              :key="col.prop"
              :prop="col.prop"
              sortable
              align="right"
              :min-width="col.width"
            >
              <template #header>
                <AmoHint :label="col.label" :hint="col.hint" />
              </template>
              <template #default="{ row }">
                <button
                  v-if="col.kind && row[col.prop]"
                  type="button"
                  class="amo-num"
                  :class="{ 'is-bad': col.bad }"
                  @click="drillUser(row, col)"
                >
                  {{ fmtNum(row[col.prop]) }}
                </button>
                <span v-else-if="col.kind">0</span>
                <span v-else>{{ fmtDuration(row[col.prop], t) }}</span>
              </template>
            </el-table-column>
          </el-table>
        </div>
      </div>

      <!-- ═══ Lidlar ═══ -->
      <div class="amo-block">
        <div class="amo-block__head">
          <h4>{{ $t('amoLeadsTitle') }}</h4>
          <span class="amo-hint-text">{{ $t('amoLeadsHint') }}</span>
        </div>

        <div class="amo-kpis amo-kpis--leads">
          <component
            :is="k.onClick ? 'button' : 'div'"
            v-for="k in leadTiles"
            :key="k.key"
            :type="k.onClick ? 'button' : undefined"
            class="amo-kpi"
            :class="[k.tone && `amo-kpi--${k.tone}`, { 'is-link': k.onClick }]"
            @click="k.onClick && k.onClick()"
          >
            <div class="amo-kpi__value">
              {{ k.value }}
              <small v-if="k.sub">{{ k.sub }}</small>
            </div>
            <div class="amo-kpi__label"><AmoHint :label="k.label" :hint="k.hint" /></div>
          </component>
        </div>

        <div class="amo-leads-grid">
          <!-- Bosqichlar -->
          <div class="amo-card">
            <div class="amo-card__title">
              <AmoHint :label="$t('amoStagesTitle')" :hint="$t('amoHintStages')" />
            </div>
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
                <button
                  v-for="s in p.statuses"
                  :key="s.id"
                  type="button"
                  class="amo-stage is-link"
                  :disabled="!s.count"
                  @click="drillLeads(s.name, { pipeline_id: p.id, status_id: s.id })"
                >
                  <span class="amo-stage__name">
                    <i class="amo-stage__dot" :style="{ background: s.color || '#d5d8db' }"></i>
                    {{ s.name }}
                  </span>
                  <span class="amo-bar-row__track">
                    <span
                      class="amo-bar-row__fill"
                      :style="{ width: barWidth(s.count, maxStageCount(p)) }"
                    ></span>
                  </span>
                  <span class="num">{{ fmtNum(s.count) }}</span>
                  <span class="num muted">{{ fmtMoney(s.sum) }}</span>
                </button>
              </el-tab-pane>
            </el-tabs>
          </div>

          <!-- Yo'qotish sabablari -->
          <div class="amo-card">
            <div class="amo-card__title">
              <AmoHint :label="$t('amoLossReasonsTitle')" :hint="$t('amoHintLossReasons')" />
            </div>
            <div v-if="!leads.loss_reasons?.length" class="amo-empty">{{ $t('amoNoData') }}</div>
            <div v-else class="amo-bars">
              <button
                v-for="r in leads.loss_reasons"
                :key="r.id"
                type="button"
                class="amo-bar-row amo-bar-row--reason is-link"
                @click="
                  drillLeads(r.name || $t('amoLossReasonNone'), {
                    status_id: 143,
                    loss_reason_id: r.id,
                  })
                "
              >
                <span class="amo-bar-row__label" :class="{ 'is-strong': isNotOurs(r) }">
                  {{ r.name || $t('amoLossReasonNone') }}
                </span>
                <span class="amo-bar-row__track">
                  <span
                    class="amo-bar-row__fill"
                    :style="{ width: barWidth(r.count, maxReasonCount) }"
                  ></span>
                </span>
                <span class="amo-bar-row__val">
                  {{ fmtNum(r.count) }} <small>{{ pct(r.count, leads.lost.count) }}%</small>
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </template>

    <AmoDrillDrawer v-model="drillOpen" :request="drillRequest" :stats="stats" @changed="load" />
    <AmoExclusionsDrawer v-model="exclusionsOpen" :users="users" @changed="load" />
  </section>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { ElMessage } from 'element-plus'
import { Bottom, Filter, Loading, Pointer, Refresh, Top, UserFilled } from '@element-plus/icons-vue'
import { useAmocrmStore } from '@/stores/amocrm'
import AmoHint from './AmoHint.vue'
import AmoDrillDrawer from './AmoDrillDrawer.vue'
import AmoExclusionsDrawer from './AmoExclusionsDrawer.vue'
import {
  AMO_CALL_STATUS_RU,
  TALKED,
  callStatusKey,
  fmtDuration,
  fmtNum,
  formatDate,
  formatDateTime,
  pct,
  ymd,
} from './amoFormat'

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
// Standart — faqat mijozlar bilan qo'ng'iroqlar (hamkasb, tanish, ichki raqamlar chiqariladi)
const scope = ref('clients')
const exclusionsOpen = ref(false)
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
      scope: scope.value,
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

// ─── Ro'yxat (son ustiga bosilganda) ──────────────────────
const drillOpen = ref(false)
const drillRequest = ref(null)

const userName = (id) => users.value.find((u) => u.id === id)?.name || `#${id}`

const periodLabel = computed(() => {
  const [from, to] = range.value
  const period = from === to ? formatDate(from) : `${formatDate(from)} – ${formatDate(to)}`
  return userId.value ? `${period} · ${userName(userId.value)}` : period
})

const baseParams = () => ({
  from: range.value[0],
  to: range.value[1],
  responsible_user_id: userId.value || undefined,
  scope: scope.value,
})

// O'tkazib yuborilgan kiruvchilar odatda raqam bo'yicha ko'rilgani qulay
function drillCalls(kind, title, extra = {}, opts = {}) {
  drillRequest.value = {
    type: 'calls',
    title,
    subtitle: opts.subtitle || periodLabel.value,
    params: { ...baseParams(), kind, ...extra },
    groupByPhone: opts.groupByPhone ?? kind === 'in_missed',
    onlyNotCalledBack: Boolean(opts.onlyNotCalledBack),
  }
  drillOpen.value = true
}

function drillLeads(title, extra = {}) {
  drillRequest.value = {
    type: 'leads',
    title,
    subtitle: periodLabel.value,
    params: { ...baseParams(), ...extra },
  }
  drillOpen.value = true
}

function drillBucket(d) {
  // Oy ustuni tanlangan davr chegarasidan chiqmasin
  const from = d.from < range.value[0] ? range.value[0] : d.from
  const to = d.to > range.value[1] ? range.value[1] : d.to
  const sub = userId.value ? `${d.title} · ${userName(userId.value)}` : d.title
  drillCalls(
    'all',
    `${t('amoCallsTitle')} — ${d.title}`,
    { from, to },
    { subtitle: sub, groupByPhone: false },
  )
}

// Chiqarib tashlangan raqamlar (sabab bo'yicha)
function drillExcluded(reason) {
  drillCalls(
    'all',
    `${t('amoExcludedTitle')} — ${t(`amoExcl_${reason}`)}`,
    { scope: 'excluded', reason },
    { groupByPhone: true },
  )
}

// Platforma (Moi Zvonki / Sipuni) bo'yicha
function drillSource(src, kind, srcScope) {
  const title = `${sourceLabel(src.source)} — ${
    srcScope === 'excluded'
      ? t('amoSrcExcluded')
      : kind === 'all'
        ? t('amoSrcClients')
        : kind === 'answered'
          ? t('amoTalked')
          : t('amoInMissed')
  }`
  drillCalls(
    kind,
    title,
    { source: src.source, scope: srcScope },
    { groupByPhone: kind === 'in_missed' || srcScope === 'excluded' },
  )
}

// Telefoniya manbasining chiroyli nomi
function sourceLabel(src) {
  if (!src) return t('amoSourceUnknown')
  if (/moi|мои|zvonki|звонки/i.test(src)) return 'Moi Zvonki'
  if (/sipuni/i.test(src)) return 'Sipuni'
  return src
}

function drillUser(row, col) {
  if (!row.user_id) return
  const sub = `${formatDate(range.value[0])} – ${formatDate(range.value[1])} · ${row.name}`
  drillCalls(
    col.kind,
    `${row.name} — ${col.label}`,
    { responsible_user_id: row.user_id },
    { subtitle: sub },
  )
}

// ─── Qo'ng'iroqlar: kiruvchi / chiquvchi bloklari ─────────
function statusRows(direction, list, total) {
  const kind = direction === 'in' ? 'in' : 'out'
  return (list || [])
    .filter((s) => s.count > 0)
    .map((s) => {
      const label = t(callStatusKey(direction, s.status))
      const ru = AMO_CALL_STATUS_RU[s.status]
      const explain = t(`${callStatusKey(direction, s.status)}_hint`)
      return {
        status: s.status,
        count: s.count,
        bad: s.status !== TALKED,
        label,
        hint: ru ? `${explain} ${t('amoInAmoAs', { name: ru })}` : explain,
        onClick: () =>
          drillCalls(
            kind,
            label,
            { status: s.status },
            { groupByPhone: direction === 'in' && s.status !== TALKED },
          ),
      }
    })
    .sort((a, b) => b.count - a.count)
    .map((r) => ({ ...r, total }))
}

const directions = computed(() => {
  const inc = calls.value.incoming
  const out = calls.value.outgoing
  const inRows = statusRows('in', inc.by_status, inc.total)
  const outRows = statusRows('out', out.by_status, out.total)
  return [
    {
      key: 'in',
      icon: Bottom,
      title: t('amoInTitle'),
      hint: t('amoHintInTitle'),
      resultsTitle: t('amoInResults'),
      resultsHint: t('amoHintInResults'),
      total: inc.total,
      rows: inRows,
      max: Math.max(1, ...inRows.map((r) => r.count)),
      tiles: [
        {
          key: 'in',
          label: t('amoInTotal'),
          hint: t('amoHintInTotal'),
          value: fmtNum(inc.total),
          onClick: () => drillCalls('in', t('amoInTotal')),
        },
        {
          key: 'in_answered',
          label: t('amoInAnswered'),
          hint: t('amoHintInAnswered'),
          value: fmtNum(inc.answered),
          sub: `${pct(inc.answered, inc.total)}%`,
          tone: 'good',
          onClick: () => drillCalls('in_answered', t('amoInAnswered')),
        },
        {
          key: 'in_missed',
          label: t('amoInMissed'),
          hint: t('amoHintInMissed'),
          value: fmtNum(inc.missed),
          sub: `${pct(inc.missed, inc.total)}%`,
          tone: 'bad',
          onClick: () => drillCalls('in_missed', t('amoInMissed')),
        },
        {
          key: 'missed_numbers',
          label: t('amoMissedNumbers'),
          hint: t('amoHintMissedNumbers'),
          value: fmtNum(inc.missed_numbers),
          onClick: () => drillCalls('in_missed', t('amoMissedNumbers'), {}, { groupByPhone: true }),
        },
        {
          key: 'not_called_back',
          label: t('amoNotCalledBack'),
          hint: t('amoHintNotCalledBack'),
          value: fmtNum(inc.not_called_back),
          sub: `${pct(inc.not_called_back, inc.missed_numbers)}%`,
          tone: 'bad',
          onClick: () =>
            drillCalls(
              'in_missed',
              t('amoNotCalledBack'),
              {},
              { groupByPhone: true, onlyNotCalledBack: true },
            ),
        },
      ],
    },
    {
      key: 'out',
      icon: Top,
      title: t('amoOutTitle'),
      hint: t('amoHintOutTitle'),
      resultsTitle: t('amoOutResults'),
      resultsHint: t('amoHintOutResults'),
      total: out.total,
      rows: outRows,
      max: Math.max(1, ...outRows.map((r) => r.count)),
      tiles: [
        {
          key: 'out',
          label: t('amoOutTotal'),
          hint: t('amoHintOutTotal'),
          value: fmtNum(out.total),
          onClick: () => drillCalls('out', t('amoOutTotal')),
        },
        {
          key: 'out_answered',
          label: t('amoOutAnswered'),
          hint: t('amoHintOutAnswered'),
          value: fmtNum(out.answered),
          sub: `${pct(out.answered, out.total)}%`,
          tone: 'good',
          onClick: () => drillCalls('out_answered', t('amoOutAnswered')),
        },
        {
          key: 'out_no_answer',
          label: t('amoOutNoAnswer'),
          hint: t('amoHintOutNoAnswer'),
          value: fmtNum(out.no_answer),
          sub: `${pct(out.no_answer, out.total)}%`,
          tone: 'warn',
          onClick: () => drillCalls('out_no_answer', t('amoOutNoAnswer')),
        },
      ],
    },
  ]
})

// ─── Menejerlar jadvali ───────────────────────────────────
const managerCols = computed(() => [
  { prop: 'total', kind: 'all', label: t('amoColAll'), hint: t('amoHintColAll'), width: 80 },
  { prop: 'in_total', kind: 'in', label: t('amoDirIn'), hint: t('amoHintInTotal'), width: 95 },
  {
    prop: 'in_answered',
    kind: 'in_answered',
    label: t('amoColInAnswered'),
    hint: t('amoHintInAnswered'),
    width: 110,
  },
  {
    prop: 'in_missed',
    kind: 'in_missed',
    label: t('amoColInMissed'),
    hint: t('amoHintInMissed'),
    width: 120,
    bad: true,
  },
  { prop: 'out_total', kind: 'out', label: t('amoDirOut'), hint: t('amoHintOutTotal'), width: 95 },
  {
    prop: 'out_answered',
    kind: 'out_answered',
    label: t('amoColOutAnswered'),
    hint: t('amoHintOutAnswered'),
    width: 110,
  },
  {
    prop: 'out_no_answer',
    kind: 'out_no_answer',
    label: t('amoColOutNoAnswer'),
    hint: t('amoHintOutNoAnswer'),
    width: 125,
  },
  { prop: 'duration', label: t('amoCallsDuration'), hint: t('amoHintDuration'), width: 115 },
])

const managerRows = computed(() =>
  (calls.value?.by_user || []).map((u) => ({
    ...u,
    name: u.user_id ? userName(u.user_id) : t('amoUnknownManager'),
  })),
)

// ─── Kunlik / oylik grafik ────────────────────────────────
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
      const lastDay = new Date(cursor.getFullYear(), m + 1, 0)
      buckets.set(key, {
        key,
        from: trendByMonth.value ? `${key}-01` : day,
        to: trendByMonth.value ? ymd(lastDay) : day,
        total: 0,
        talked: 0,
        in_missed: 0,
        short: trendByMonth.value ? monthNames.value[m] : String(cursor.getDate()),
        title: trendByMonth.value
          ? `${monthNames.value[m]} ${cursor.getFullYear()}`
          : formatDate(cursor),
      })
    }
    const d = daily.get(day)
    if (d) {
      const b = buckets.get(key)
      b.total += d.total
      b.talked += d.talked
      b.in_missed += d.in_missed
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

// ─── Lidlar ───────────────────────────────────────────────
const maxStageCount = (p) => Math.max(1, ...p.statuses.map((s) => s.count))
const maxReasonCount = computed(() =>
  Math.max(1, ...(leads.value?.loss_reasons || []).map((r) => r.count)),
)

// "Bizniki emas" — shu ma'nodagi yo'qotish sabablari (amoCRM'da nomi har xil bo'lishi mumkin)
// "Bizniki emas" ma'nosidagi sabablarni backend belgilaydi (is_not_ours)
const isNotOurs = (r) => Boolean(r.is_not_ours)
const notOursReasons = computed(() => (leads.value?.loss_reasons || []).filter(isNotOurs))

const leadTiles = computed(() => {
  const l = leads.value
  const tiles = [
    {
      key: 'total',
      label: t('amoLeadsTotal'),
      hint: t('amoHintLeadsTotal'),
      value: fmtNum(l.total),
      onClick: () => drillLeads(t('amoLeadsTotal')),
    },
    {
      key: 'sum',
      label: t('amoLeadsSum'),
      hint: t('amoHintLeadsSum'),
      value: fmtMoney(l.sum),
    },
    {
      key: 'won',
      label: t('amoLeadsWon'),
      hint: t('amoHintWon'),
      value: fmtNum(l.won.count),
      sub: fmtMoney(l.won.sum),
      tone: 'good',
      onClick: () => drillLeads(t('amoLeadsWon'), { status_id: 142 }),
    },
    {
      key: 'lost',
      label: t('amoLeadsLost'),
      hint: t('amoHintLost'),
      value: fmtNum(l.lost.count),
      sub: fmtMoney(l.lost.sum),
      tone: 'bad',
      onClick: () => drillLeads(t('amoLeadsLost'), { status_id: 143 }),
    },
  ]
  const notOurs = notOursReasons.value
  if (notOurs.length) {
    const count = notOurs.reduce((a, r) => a + r.count, 0)
    tiles.push({
      key: 'not_ours',
      label: t('amoNotOurs'),
      hint: t('amoHintNotOurs', { names: notOurs.map((r) => `«${r.name}»`).join(', ') }),
      value: fmtNum(count),
      sub: `${pct(count, l.total)}% ${t('amoOfAllLeads')}`,
      tone: 'warn',
      // Bir nechta sabab bo'lsa, eng kattasi ochiladi — qolganlari sabablar kartasida
      onClick: () => drillLeads(t('amoNotOurs'), { status_id: 143, loss_reason_id: notOurs[0].id }),
    })
  }
  return tiles
})

// ─── Formatlash ───────────────────────────────────────────
const fmtMoney = (n) => `${fmtNum(Math.round(n || 0))} ${t('amoCurrency')}`
const barWidth = (v, max) => (v ? `${Math.max(2, (v / max) * 100)}%` : '0')
</script>

<style lang="scss" scoped>
// Grafik ranglari (dataviz validator'dan o'tgan kategoriya juftligi)
$c-answered: #2a78d6;
$c-other: #eb6834;
$c-bar: #2a78d6;
$c-bad: #b91c1c;
$c-warn: #b45309;
$c-good: #15803d;
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

button {
  font: inherit;
  color: inherit;
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
    color: $c-warn;
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
.amo-scope :deep(.el-radio-button__inner) {
  display: inline-flex;
  align-items: center;
}
.amo-excluded {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px 10px;
  margin: -4px 0 12px;
  padding: 8px 12px;
  background: #f8fafc;
  border: 1px dashed #cbd5e1;
  border-radius: 10px;
  font-size: 13px;
  color: $ink-2;
}
.amo-chip {
  border: 1px solid $line;
  background: white;
  border-radius: 999px;
  padding: 2px 10px;
  font-size: 12px;
  cursor: pointer;
  &:hover {
    border-color: #bfdbfe;
    color: $c-bar;
  }
}
.amo-src {
  overflow-x: auto;
}
.amo-src__row {
  min-width: 0;
  display: grid;
  grid-template-columns: minmax(120px, 1.4fr) repeat(4, minmax(80px, 1fr));
  gap: 10px;
  align-items: center;
  padding: 8px 0;
  border-bottom: 1px solid $line;
  font-size: 13px;
  &:last-child {
    border-bottom: none;
  }
  &--head {
    font-size: 12px;
    color: $muted;
    padding-top: 0;
  }
}
.amo-src__name {
  font-weight: 600;
  color: $ink;
}
.amo-click-hint {
  display: flex;
  align-items: center;
  gap: 6px;
  margin: 0 0 10px;
  font-size: 12px;
  color: $muted;
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
  gap: 10px 14px;
  flex-wrap: wrap;
  margin-bottom: 12px;
  h4 {
    margin: 0;
    font-size: 15px;
    font-weight: 600;
    color: $ink;
  }
}
.amo-summary {
  font-size: 13px;
  color: $ink-2;
  display: inline-flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 4px;
}
.amo-dot {
  color: #cbd5e1;
  margin: 0 4px;
}
.amo-hint-text {
  font-size: 12px;
  color: $muted;
}

// Bosiladigan son
.amo-num {
  background: none;
  border: none;
  padding: 0 2px;
  font-weight: 700;
  color: $c-bar;
  cursor: pointer;
  border-bottom: 1px dashed currentColor;
  font-variant-numeric: tabular-nums;
  &.is-bad {
    color: $c-bad;
  }
  &.is-muted {
    color: $muted;
  }
  &:hover {
    border-bottom-style: solid;
  }
}

.is-link {
  cursor: pointer;
}
.is-link:focus-visible,
.amo-num:focus-visible {
  outline: 2px solid $c-bar;
  outline-offset: 2px;
}

/* KPI */
.amo-kpis {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 8px;
  margin-bottom: 14px;
}
.amo-kpi {
  background: #f8fafc;
  border: 1px solid $line;
  border-left: 3px solid #cbd5e1;
  border-radius: 10px;
  padding: 10px 12px;
  text-align: left;
  transition:
    border-color 0.15s,
    box-shadow 0.15s;
  &.is-link:hover {
    border-color: #bfdbfe;
    box-shadow: 0 2px 8px rgba(42, 120, 214, 0.12);
  }
  &--good {
    border-left-color: $c-good;
  }
  &--bad {
    border-left-color: $c-bad;
    .amo-kpi__value {
      color: $c-bad;
    }
  }
  &--warn {
    border-left-color: $c-warn;
  }
}
.amo-kpi__value {
  font-size: 20px;
  font-weight: 700;
  color: $ink;
  line-height: 1.2;
  font-variant-numeric: tabular-nums;
  small {
    font-size: 12px;
    font-weight: 500;
    color: $muted;
    margin-left: 2px;
  }
}
.amo-kpi__label {
  font-size: 12px;
  color: $muted;
  margin-top: 3px;
}

/* Kartochkalar */
.amo-dir-grid,
.amo-leads-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  align-items: start;
}
.amo-leads-grid {
  grid-template-columns: 3fr 2fr;
}
.amo-card {
  border: 1px solid $line;
  border-radius: 12px;
  padding: 14px;
  min-width: 0;
}
.amo-gap {
  margin-top: 12px;
}
.amo-card__title {
  font-size: 14px;
  font-weight: 600;
  color: $ink;
  margin-bottom: 12px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}
.amo-sub {
  font-size: 12px;
  font-weight: 600;
  color: $ink-2;
  margin: 4px 0 8px;
  text-transform: uppercase;
  letter-spacing: 0.03em;
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
  gap: 2px;
}
.amo-bar-row {
  display: grid;
  grid-template-columns: minmax(140px, 1.3fr) 1fr auto;
  align-items: center;
  gap: 10px;
  padding: 6px 6px;
  margin: 0 -6px;
  border: none;
  background: none;
  border-radius: 6px;
  text-align: left;
  &.is-link:hover {
    background: #f1f5f9;
  }
}
.amo-bar-row__label {
  font-size: 13px;
  color: $ink-2;
  &.is-bad {
    color: $ink;
  }
  &.is-strong {
    font-weight: 600;
    color: $ink;
  }
}
.amo-bar-row__track {
  display: block;
  height: 10px;
  background: #f1f3f5;
  border-radius: 4px;
  overflow: hidden;
}
.amo-bar-row__fill {
  display: block;
  height: 100%;
  background: $c-bar;
  border-radius: 0 4px 4px 0;
  transition: width 0.3s ease;
  &.is-bad {
    background: $c-other;
  }
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
  cursor: pointer;
  background: none;
  border: none;
  padding: 0;
}
.amo-trend__stack {
  height: 100%;
  width: 100%;
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
  display: block;
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
// "Suhbat bo'lmadi" bo'lmasa, yuqori burchak "suhbat bo'ldi"da yumaloq bo'ladi
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
  grid-template-columns: minmax(150px, 220px) 1fr 60px minmax(110px, 150px);
  gap: 12px;
  align-items: center;
}
.amo-stage-head {
  font-size: 12px;
  color: $muted;
  padding: 0 6px 6px;
  border-bottom: 1px solid $line;
}
.amo-stage {
  width: 100%;
  padding: 9px 6px;
  border: none;
  border-bottom: 1px solid $line;
  background: none;
  font-size: 13px;
  text-align: left;
  &:last-child {
    border-bottom: none;
  }
  &.is-link:hover:not(:disabled) {
    background: #f1f5f9;
  }
  &:disabled {
    cursor: default;
    opacity: 0.6;
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

@media (max-width: 1100px) {
  .amo-dir-grid,
  .amo-leads-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 900px) {
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
  .amo-bar-row {
    grid-template-columns: minmax(110px, 1.2fr) 0.8fr auto;
  }
  .amo-src__row {
    grid-template-columns: minmax(72px, 1.1fr) repeat(4, minmax(40px, 1fr));
    gap: 4px;
    font-size: 12px;
  }
  .amo-stage-head,
  .amo-stage {
    grid-template-columns: 1fr 50px minmax(90px, 120px);
    & > :nth-child(2) {
      display: none;
    }
  }
}
</style>
