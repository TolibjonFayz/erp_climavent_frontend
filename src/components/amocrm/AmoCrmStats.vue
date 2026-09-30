<template>
  <section class="amo" v-loading="amoStore.isLoading && !stats">
    <!-- ═══ Sarlavha ═══ -->
    <header class="amo-top">
      <div class="amo-top__title">
        <h3>
          {{ $t('amoTitle') }}
          <AmoHint :hint="$t('amoClickHint')" />
        </h3>
        <span class="amo-sync" :class="{ 'is-error': sync?.has_error, 'is-busy': syncing }">
          <i class="amo-sync__dot"></i>
          <template v-if="syncing">{{ $t('amoSyncing') }}</template>
          <template v-else-if="sync?.last_sync_at">
            {{ $t('amoLastSync') }}: {{ formatDateTime(sync.last_sync_at) }}
          </template>
          <template v-else>{{ $t('amoNeverSynced') }}</template>
        </span>
      </div>
      <div class="amo-top__actions">
        <el-button :icon="UserFilled" @click="exclusionsOpen = true">
          {{ $t('amoExclusionsBtn') }}
        </el-button>
        <el-button
          type="primary"
          plain
          :icon="Refresh"
          :loading="syncing"
          :disabled="!sync?.configured"
          @click="startSync"
        >
          {{ $t('amoRefresh') }}
        </el-button>
      </div>
    </header>

    <!-- ═══ Filtrlar ═══ -->
    <div class="amo-toolbar">
      <div class="amo-field amo-field--period">
        <span class="amo-field__label">{{ $t('amoFilterPeriod') }}</span>
        <div class="amo-field__row">
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
        </div>
      </div>
      <div class="amo-field">
        <span class="amo-field__label">{{ $t('amoFilterManager') }}</span>
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
      </div>
      <div class="amo-field">
        <span class="amo-field__label">
          <AmoHint :label="$t('amoFilterScope')" :hint="$t('amoHintScopeClients')" />
        </span>
        <el-radio-group v-model="scope" size="small" @change="load">
          <el-radio-button value="clients">{{ $t('amoScopeClients') }}</el-radio-button>
          <el-radio-button value="all">{{ $t('amoScopeAll') }}</el-radio-button>
        </el-radio-group>
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
      <!-- ═══ Asosiy ko'rsatkichlar ═══ -->
      <div class="amo-overview">
        <component
          :is="k.onClick ? 'button' : 'div'"
          v-for="k in overview"
          :key="k.key"
          :type="k.onClick ? 'button' : undefined"
          class="amo-stat"
          :class="[k.tone && `is-${k.tone}`, { 'is-link': k.onClick }]"
          @click="k.onClick && k.onClick()"
        >
          <span class="amo-stat__label">
            <AmoHint :label="k.label" :hint="k.hint" />
          </span>
          <span class="amo-stat__value">{{ k.value }}</span>
          <span class="amo-stat__sub">{{ k.sub || ' ' }}</span>
        </component>
      </div>

      <!-- ═══ Bo'limlar ═══ -->
      <el-tabs v-model="tab" class="amo-tabs">
        <!-- ─── Qo'ng'iroqlar ─── -->
        <el-tab-pane name="calls" :label="`${$t('amoTabCalls')} · ${fmtNum(calls.total)}`">
          <!-- Hisobga olinmaganlar -->
          <div v-if="calls.excluded?.calls" class="amo-note">
            <el-icon class="amo-note__icon"><Filter /></el-icon>
            <AmoHint :hint="$t('amoHintExcluded')">
              {{
                $t(scope === 'clients' ? 'amoExcludedSummary' : 'amoExcludedSummaryAll', {
                  calls: fmtNum(calls.excluded.calls),
                  numbers: fmtNum(calls.excluded.numbers),
                })
              }}
            </AmoHint>
            <span class="amo-note__chips">
              <button
                v-for="r in calls.excluded.by_reason"
                :key="r.reason"
                type="button"
                class="amo-chip"
                @click="drillExcluded(r.reason)"
              >
                {{ $t(`amoExcl_${r.reason}`) }} <b>{{ fmtNum(r.calls) }}</b>
              </button>
            </span>
          </div>

          <!-- Kiruvchi / chiquvchi -->
          <div class="amo-grid-2">
            <article v-for="dir in directions" :key="dir.key" class="amo-panel">
              <header class="amo-panel__head">
                <h4>
                  <span class="amo-dir-icon" :class="`is-${dir.key}`">
                    <el-icon><component :is="dir.icon" /></el-icon>
                  </span>
                  <AmoHint :label="dir.title" :hint="dir.hint" />
                </h4>
                <button type="button" class="amo-num amo-num--lg" @click="dir.onTotal()">
                  {{ fmtNum(dir.total) }}
                </button>
              </header>

              <dl class="amo-dl">
                <div v-for="r in dir.stats" :key="r.key" class="amo-dl__row">
                  <dt><AmoHint :label="r.label" :hint="r.hint" /></dt>
                  <dd>
                    <button
                      v-if="r.onClick"
                      type="button"
                      class="amo-num"
                      :class="r.tone && `is-${r.tone}`"
                      @click="r.onClick()"
                    >
                      {{ r.value }}
                    </button>
                    <b v-else>{{ r.value }}</b>
                    <small v-if="r.pct !== undefined">{{ r.pct }}%</small>
                  </dd>
                </div>
              </dl>

              <h5 class="amo-sub">
                <AmoHint :label="dir.resultsTitle" :hint="dir.resultsHint" />
              </h5>
              <div v-if="!dir.rows.length" class="amo-empty">{{ $t('amoNoData') }}</div>
              <div v-else class="amo-bars">
                <button
                  v-for="r in dir.rows"
                  :key="r.status"
                  type="button"
                  class="amo-bar-row is-link"
                  @click="r.onClick()"
                >
                  <span class="amo-bar-row__label">
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
            </article>
          </div>

          <!-- Dinamika -->
          <article class="amo-panel">
            <header class="amo-panel__head">
              <h4>
                <AmoHint
                  :label="`${$t('amoTrendTitle')} · ${$t(trendByMonth ? 'amoByMonth' : 'amoByDay')}`"
                  :hint="$t('amoHintTrend')"
                />
              </h4>
              <span class="amo-legend">
                <span class="amo-legend__item"
                  ><i class="sw sw--answered"></i>{{ $t('amoTalked') }}</span
                >
                <span class="amo-legend__item"
                  ><i class="sw sw--other"></i>{{ $t('amoNotTalked') }}</span
                >
              </span>
            </header>
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
          </article>

          <!-- Platformalar -->
          <article v-if="calls.by_source?.length" class="amo-panel">
            <header class="amo-panel__head">
              <h4><AmoHint :label="$t('amoBySource')" :hint="$t('amoHintBySource')" /></h4>
            </header>
            <el-table :data="calls.by_source" size="small" class="amo-table">
              <el-table-column :label="$t('amoColSource')" min-width="130">
                <template #default="{ row }">
                  <b>{{ sourceLabel(row.source) }}</b>
                </template>
              </el-table-column>
              <el-table-column align="right" min-width="120">
                <template #header>
                  <AmoHint :label="$t('amoSrcClients')" :hint="$t('amoHintSrcClients')" />
                </template>
                <template #default="{ row }">
                  <button type="button" class="amo-num" @click="drillSource(row, 'all', 'clients')">
                    {{ fmtNum(row.clients) }}
                  </button>
                </template>
              </el-table-column>
              <el-table-column :label="$t('amoTalked')" align="right" min-width="120">
                <template #default="{ row }">
                  <button
                    type="button"
                    class="amo-num"
                    @click="drillSource(row, 'answered', 'clients')"
                  >
                    {{ fmtNum(row.talked) }}
                  </button>
                </template>
              </el-table-column>
              <el-table-column :label="$t('amoInMissed')" align="right" min-width="130">
                <template #default="{ row }">
                  <button
                    type="button"
                    class="amo-num is-bad"
                    @click="drillSource(row, 'in_missed', 'clients')"
                  >
                    {{ fmtNum(row.in_missed) }}
                  </button>
                </template>
              </el-table-column>
              <el-table-column align="right" min-width="120">
                <template #header>
                  <AmoHint :label="$t('amoSrcExcluded')" :hint="$t('amoHintSrcExcluded')" />
                </template>
                <template #default="{ row }">
                  <button
                    v-if="row.excluded"
                    type="button"
                    class="amo-num is-muted"
                    @click="drillSource(row, 'all', 'excluded')"
                  >
                    {{ fmtNum(row.excluded) }}
                  </button>
                  <span v-else class="amo-muted">0</span>
                </template>
              </el-table-column>
            </el-table>
          </article>
        </el-tab-pane>

        <!-- ─── Menejerlar ─── -->
        <el-tab-pane name="managers" :label="`${$t('amoTabManagers')} · ${managerRows.length}`">
          <article class="amo-panel">
            <header class="amo-panel__head">
              <h4><AmoHint :label="$t('amoByManager')" :hint="$t('amoHintByManager')" /></h4>
              <span class="amo-panel__meta">
                {{ $t('amoCallsDuration') }}: <b>{{ fmtDuration(calls.duration, t) }}</b>
              </span>
            </header>
            <el-table
              :data="managerRows"
              size="small"
              class="amo-table"
              :empty-text="$t('amoNoData')"
              :default-sort="{ prop: 'total', order: 'descending' }"
            >
              <el-table-column prop="name" :label="$t('amoManager')" min-width="160" fixed />
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
                  <span v-else-if="col.kind" class="amo-muted">0</span>
                  <span v-else>{{ fmtDuration(row[col.prop], t) }}</span>
                </template>
              </el-table-column>
            </el-table>
          </article>
        </el-tab-pane>

        <!-- ─── Lidlar ─── -->
        <el-tab-pane name="leads" :label="`${$t('amoTabLeads')} · ${fmtNum(leads.total)}`">
          <p class="amo-caption">{{ $t('amoLeadsHint') }}</p>
          <div class="amo-overview amo-overview--leads">
            <component
              :is="k.onClick ? 'button' : 'div'"
              v-for="k in leadTiles"
              :key="k.key"
              :type="k.onClick ? 'button' : undefined"
              class="amo-stat amo-stat--sm"
              :class="[k.tone && `is-${k.tone}`, { 'is-link': k.onClick, 'is-money': k.money }]"
              @click="k.onClick && k.onClick()"
            >
              <span class="amo-stat__label"><AmoHint :label="k.label" :hint="k.hint" /></span>
              <span class="amo-stat__value">{{ k.value }}</span>
              <span class="amo-stat__sub">{{ k.sub || ' ' }}</span>
            </component>
          </div>

          <div class="amo-grid-2 amo-grid-2--leads">
            <!-- Bosqichlar -->
            <article class="amo-panel">
              <header class="amo-panel__head">
                <h4><AmoHint :label="$t('amoStagesTitle')" :hint="$t('amoHintStages')" /></h4>
              </header>
              <div v-if="!leads.pipelines.length" class="amo-empty">{{ $t('amoNoData') }}</div>
              <el-tabs v-else v-model="pipelineTab" class="amo-subtabs">
                <el-tab-pane
                  v-for="p in leads.pipelines"
                  :key="p.id"
                  :name="String(p.id)"
                  :label="`${p.name} (${fmtNum(p.total)})`"
                >
                  <div class="amo-stage amo-stage--head">
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
            </article>

            <!-- Yo'qotish sabablari -->
            <article class="amo-panel">
              <header class="amo-panel__head">
                <h4>
                  <AmoHint :label="$t('amoLossReasonsTitle')" :hint="$t('amoHintLossReasons')" />
                </h4>
                <span class="amo-panel__meta">{{ fmtNum(leads.lost.count) }}</span>
              </header>
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
            </article>
          </div>
        </el-tab-pane>
      </el-tabs>
    </template>

    <AmoDrillDrawer v-model="drillOpen" :request="drillRequest" :stats="stats" @changed="load" />
    <AmoExclusionsDrawer v-model="exclusionsOpen" :users="users" @changed="load" />
  </section>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { ElMessage } from 'element-plus'
import { Bottom, Filter, Refresh, Top, UserFilled } from '@element-plus/icons-vue'
import { useAmocrmStore } from '@/stores/amocrm'
import AmoHint from '@/components/ui/UiHint.vue'
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

// Oxirgi ochilgan bo'lim eslab qolinadi (faqat shu brauzerda)
const TAB_KEY = 'amocrm-stats-tab'
function readTab() {
  try {
    return localStorage.getItem(TAB_KEY) || 'calls'
  } catch {
    return 'calls'
  }
}
const tab = ref(readTab())
watch(tab, (v) => {
  try {
    localStorage.setItem(TAB_KEY, v)
  } catch {
    /* saqlab bo'lmasa — muhim emas */
  }
})

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
  const what =
    srcScope === 'excluded'
      ? t('amoSrcExcluded')
      : kind === 'all'
        ? t('amoSrcClients')
        : kind === 'answered'
          ? t('amoTalked')
          : t('amoInMissed')
  drillCalls(
    kind,
    `${sourceLabel(src.source)} — ${what}`,
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

// ─── Asosiy ko'rsatkichlar (tepadagi qator) ───────────────
const overview = computed(() => {
  const c = calls.value
  const inc = c.incoming
  const l = leads.value
  return [
    {
      key: 'total',
      label: t('amoCallsTotal'),
      hint: t('amoHintCallsTotal'),
      value: fmtNum(c.total),
      sub: `${t('amoCallsDuration')}: ${fmtDuration(c.duration, t)}`,
      onClick: () => drillCalls('all', t('amoCallsTotal')),
    },
    {
      key: 'talked',
      label: t('amoTalked'),
      hint: t('amoHintTalked'),
      value: fmtNum(c.talked),
      sub: t('amoOfCalls', { pct: pct(c.talked, c.total) }),
      tone: 'good',
      onClick: () => drillCalls('answered', t('amoTalked')),
    },
    {
      key: 'in_missed',
      label: t('amoInMissed'),
      hint: t('amoHintInMissed'),
      value: fmtNum(inc.missed),
      sub: t('amoOfIncoming', { pct: pct(inc.missed, inc.total) }),
      tone: 'bad',
      onClick: () => drillCalls('in_missed', t('amoInMissed')),
    },
    {
      key: 'not_called_back',
      label: t('amoNotCalledBack'),
      hint: t('amoHintNotCalledBack'),
      value: fmtNum(inc.not_called_back),
      sub: t('amoNumbersOf', { n: fmtNum(inc.missed_numbers) }),
      tone: 'bad',
      onClick: () =>
        drillCalls(
          'in_missed',
          t('amoNotCalledBack'),
          {},
          { groupByPhone: true, onlyNotCalledBack: true },
        ),
    },
    {
      key: 'leads',
      label: t('amoLeadsTotal'),
      hint: t('amoHintLeadsTotal'),
      value: fmtNum(l.total),
      sub: fmtMoney(l.sum),
      onClick: () => drillLeads(t('amoLeadsTotal')),
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
  ]
})

// ─── Qo'ng'iroqlar: kiruvchi / chiquvchi bloklari ─────────
function statusRows(direction, list) {
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
}

const directions = computed(() => {
  const inc = calls.value.incoming
  const out = calls.value.outgoing
  const inRows = statusRows('in', inc.by_status)
  const outRows = statusRows('out', out.by_status)
  return [
    {
      key: 'in',
      icon: Bottom,
      title: t('amoInTitle'),
      hint: t('amoHintInTitle'),
      resultsTitle: t('amoInResults'),
      resultsHint: t('amoHintInResults'),
      total: inc.total,
      onTotal: () => drillCalls('in', t('amoInTotal')),
      rows: inRows,
      max: Math.max(1, ...inRows.map((r) => r.count)),
      stats: [
        {
          key: 'in_answered',
          label: t('amoInAnswered'),
          hint: t('amoHintInAnswered'),
          value: fmtNum(inc.answered),
          pct: pct(inc.answered, inc.total),
          tone: 'good',
          onClick: () => drillCalls('in_answered', t('amoInAnswered')),
        },
        {
          key: 'in_missed',
          label: t('amoInMissed'),
          hint: t('amoHintInMissed'),
          value: fmtNum(inc.missed),
          pct: pct(inc.missed, inc.total),
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
          pct: pct(inc.not_called_back, inc.missed_numbers),
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
      onTotal: () => drillCalls('out', t('amoOutTotal')),
      rows: outRows,
      max: Math.max(1, ...outRows.map((r) => r.count)),
      stats: [
        {
          key: 'out_answered',
          label: t('amoOutAnswered'),
          hint: t('amoHintOutAnswered'),
          value: fmtNum(out.answered),
          pct: pct(out.answered, out.total),
          tone: 'good',
          onClick: () => drillCalls('out_answered', t('amoOutAnswered')),
        },
        {
          key: 'out_no_answer',
          label: t('amoOutNoAnswer'),
          hint: t('amoHintOutNoAnswer'),
          value: fmtNum(out.no_answer),
          pct: pct(out.no_answer, out.total),
          tone: 'warn',
          onClick: () => drillCalls('out_no_answer', t('amoOutNoAnswer')),
        },
        {
          key: 'duration',
          label: t('amoCallsDuration'),
          hint: t('amoHintDuration'),
          value: fmtDuration(calls.value.duration, t),
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
      money: true,
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
$c-link: #2a78d6;
$c-bad: #b91c1c;
$c-warn: #b45309;
$c-good: #15803d;
$ink: #111827;
$ink-2: #374151;
$muted: #6b7280;
$faint: #9ca3af;
$line: #e5e7eb;
$line-soft: #f1f3f5;
$surface-2: #f8fafc;
$radius: 10px;

.amo {
  background: white;
  border-radius: 14px;
  padding: 20px 22px 22px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
  min-width: 0;
  color: $ink-2;
}

button {
  font: inherit;
  color: inherit;
}

/* ─── Sarlavha ─── */
.amo-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
  padding-bottom: 16px;
  border-bottom: 1px solid $line;

  h3 {
    margin: 0;
    font-size: 18px;
    font-weight: 700;
    color: $ink;
    display: flex;
    align-items: center;
    gap: 6px;
  }
}
.amo-top__title {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.amo-top__actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}
.amo-sync {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: $muted;
  &__dot {
    width: 7px;
    height: 7px;
    border-radius: 50%;
    background: $c-good;
  }
  &.is-busy .amo-sync__dot {
    background: $c-link;
    animation: amo-pulse 1s ease-in-out infinite;
  }
  &.is-error {
    color: $c-warn;
    .amo-sync__dot {
      background: $c-warn;
    }
  }
}
@keyframes amo-pulse {
  50% {
    opacity: 0.3;
  }
}

/* ─── Filtrlar ─── */
.amo-toolbar {
  display: flex;
  flex-wrap: wrap;
  gap: 14px 28px;
  align-items: flex-end;
  margin: 16px 0;
  padding: 12px 16px;
  background: $surface-2;
  border: 1px solid $line;
  border-radius: $radius;
}
.amo-field {
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 0;
  &__label {
    font-size: 11px;
    font-weight: 600;
    color: $muted;
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }
  &__row {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    align-items: center;
  }
}
.amo-range {
  width: 240px !important;
}
.amo-user {
  width: 200px;
}
.amo-alert {
  margin-bottom: 12px;
  :deep(.el-alert__description) {
    white-space: pre-line;
  }
}

/* ─── Asosiy ko'rsatkichlar ─── */
.amo-overview {
  display: grid;
  grid-template-columns: repeat(6, minmax(0, 1fr));
  gap: 12px;
  margin-bottom: 8px;
  &--leads {
    grid-template-columns: repeat(auto-fit, minmax(170px, 1fr));
    margin-bottom: 16px;
  }
}
.amo-stat {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
  padding: 14px 16px;
  background: white;
  border: 1px solid $line;
  border-radius: $radius;
  text-align: left;
  transition:
    border-color 0.15s,
    box-shadow 0.15s;
  &.is-link {
    cursor: pointer;
    &:hover {
      border-color: #bfdbfe;
      box-shadow: 0 4px 12px rgba(42, 120, 214, 0.1);
    }
  }
  &__label {
    font-size: 12px;
    line-height: 16px;
    color: $muted;
    display: flex;
    align-items: flex-start;
    gap: 6px;
    // 2 qatorlik yorliqda ham raqamlar bir tekisda tursin
    min-height: 32px;
    &::before {
      content: '';
      width: 8px;
      height: 8px;
      margin-top: 4px;
      border-radius: 2px;
      background: #cbd5e1;
      flex-shrink: 0;
    }
  }
  &.is-good &__label::before {
    background: $c-good;
  }
  &.is-bad &__label::before {
    background: $c-bad;
  }
  &.is-warn &__label::before {
    background: $c-warn;
  }
  &__value {
    font-size: 24px;
    font-weight: 700;
    color: $ink;
    line-height: 1.2;
    font-variant-numeric: tabular-nums;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  &.is-bad &__value {
    color: $c-bad;
  }
  &__sub {
    font-size: 12px;
    line-height: 16px;
    color: $muted;
    min-height: 32px;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
  &--sm &__value {
    font-size: 20px;
  }
  // Katta summalar kesilmasin
  &.is-money &__value {
    font-size: 17px;
    line-height: 1.35;
    white-space: normal;
  }
}

/* ─── Tablar ─── */
.amo-tabs {
  margin-top: 8px;
  :deep(.el-tabs__header) {
    margin-bottom: 16px;
  }
  :deep(.el-tabs__item) {
    font-size: 14px;
    font-weight: 600;
    height: 44px;
  }
  :deep(.el-tab-pane) {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }
}
.amo-subtabs :deep(.el-tabs__header) {
  margin-bottom: 8px;
}
.amo-subtabs :deep(.el-tab-pane) {
  display: block;
}
.amo-caption {
  margin: -4px 0 0;
  font-size: 12px;
  color: $muted;
}

/* ─── Izoh qatori (hisobga olinmaganlar) ─── */
.amo-note {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px 12px;
  padding: 10px 14px;
  background: $surface-2;
  border: 1px solid $line;
  border-left: 3px solid $faint;
  border-radius: 8px;
  font-size: 13px;
  &__icon {
    color: $muted;
  }
  &__chips {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }
}
.amo-chip {
  border: 1px solid $line;
  background: white;
  border-radius: 999px;
  padding: 2px 10px;
  font-size: 12px;
  cursor: pointer;
  b {
    margin-left: 2px;
    color: $ink;
  }
  &:hover {
    border-color: #bfdbfe;
    color: $c-link;
  }
}

/* ─── Panellar ─── */
.amo-grid-2 {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  align-items: start;
  &--leads {
    grid-template-columns: 3fr 2fr;
  }
}
.amo-panel {
  border: 1px solid $line;
  border-radius: $radius;
  background: white;
  min-width: 0;
  padding: 0 16px 16px;
  &__head {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 10px;
    flex-wrap: wrap;
    min-height: 48px;
    margin: 0 -16px 14px;
    padding: 0 16px;
    border-bottom: 1px solid $line-soft;
    h4 {
      margin: 0;
      font-size: 14px;
      font-weight: 600;
      color: $ink;
      display: flex;
      align-items: center;
      gap: 8px;
    }
  }
  &__meta {
    font-size: 12px;
    color: $muted;
    b {
      color: $ink;
    }
  }
}
.amo-dir-icon {
  width: 26px;
  height: 26px;
  border-radius: 7px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  &.is-in {
    background: #eff6ff;
    color: $c-link;
  }
  &.is-out {
    background: #f0fdf4;
    color: $c-good;
  }
}

/* Ta'rif ro'yxati: yorliq ... qiymat */
.amo-dl {
  margin: 0 0 14px;
  &__row {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    gap: 12px;
    padding: 8px 0;
    border-bottom: 1px dashed $line;
    font-size: 13px;
    &:last-child {
      border-bottom: none;
    }
  }
  dt {
    color: $ink-2;
    min-width: 0;
  }
  dd {
    margin: 0;
    display: flex;
    align-items: baseline;
    gap: 6px;
    white-space: nowrap;
    b {
      font-weight: 700;
      color: $ink;
      font-variant-numeric: tabular-nums;
    }
    small {
      min-width: 34px;
      text-align: right;
      font-size: 12px;
      color: $muted;
      font-variant-numeric: tabular-nums;
    }
  }
}
.amo-sub {
  margin: 0 0 8px;
  font-size: 11px;
  font-weight: 600;
  color: $muted;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}
.amo-empty {
  font-size: 13px;
  color: $muted;
  padding: 20px 0;
  text-align: center;
}
.amo-muted {
  color: $faint;
}

/* Bosiladigan son */
.amo-num {
  background: none;
  border: none;
  padding: 0;
  font-weight: 700;
  color: $c-link;
  cursor: pointer;
  border-bottom: 1px dashed currentColor;
  font-variant-numeric: tabular-nums;
  line-height: 1.2;
  &.is-bad {
    color: $c-bad;
  }
  &.is-good {
    color: $c-good;
  }
  &.is-warn {
    color: $c-warn;
  }
  &.is-muted {
    color: $muted;
  }
  &--lg {
    font-size: 20px;
    color: $ink;
    border-bottom-color: $faint;
  }
  &:hover {
    border-bottom-style: solid;
  }
}
.is-link:focus-visible,
.amo-num:focus-visible,
.amo-chip:focus-visible {
  outline: 2px solid $c-link;
  outline-offset: 2px;
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
  gap: 12px;
  padding: 7px 8px;
  margin: 0 -8px;
  border: none;
  background: none;
  border-radius: 6px;
  text-align: left;
  &.is-link {
    cursor: pointer;
    &:hover {
      background: $surface-2;
    }
  }
}
.amo-bar-row__label {
  font-size: 13px;
  color: $ink-2;
  min-width: 0;
  &.is-strong {
    font-weight: 600;
    color: $ink;
  }
}
.amo-bar-row__track {
  display: block;
  height: 8px;
  background: $line-soft;
  border-radius: 4px;
  overflow: hidden;
}
.amo-bar-row__fill {
  display: block;
  height: 100%;
  background: $c-answered;
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
  min-width: 76px;
  text-align: right;
  font-variant-numeric: tabular-nums;
  small {
    font-weight: 400;
    color: $muted;
  }
}

/* Jadvallar */
.amo-table {
  :deep(th.el-table__cell) {
    background: $surface-2;
    color: $muted;
    font-weight: 600;
    font-size: 12px;
  }
}

/* Grafik */
.amo-legend {
  display: inline-flex;
  gap: 14px;
  font-size: 12px;
  color: $muted;
}
.amo-legend__item {
  display: inline-flex;
  align-items: center;
  gap: 6px;
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
  height: 200px;
  padding-bottom: 20px;
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
    background: $surface-2;
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
  bottom: -20px;
  left: 50%;
  transform: translateX(-50%);
  font-size: 11px;
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
.amo-stage {
  display: grid;
  grid-template-columns: minmax(150px, 220px) 1fr 60px minmax(110px, 150px);
  gap: 12px;
  align-items: center;
  width: 100%;
  padding: 9px 6px;
  border: none;
  border-bottom: 1px solid $line-soft;
  background: none;
  font-size: 13px;
  text-align: left;
  &:last-child {
    border-bottom: none;
  }
  &.is-link {
    cursor: pointer;
    &:hover:not(:disabled) {
      background: $surface-2;
    }
  }
  &:disabled {
    cursor: default;
    opacity: 0.55;
  }
  &--head {
    font-size: 11px;
    font-weight: 600;
    color: $muted;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    padding-top: 0;
    border-bottom-color: $line;
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
.amo-stage--head .num {
  font-weight: 600;
  color: $muted;
}

/* ─── Moslashuvchanlik ─── */
@media (max-width: 1280px) {
  .amo-overview {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}
@media (max-width: 1100px) {
  .amo-grid-2,
  .amo-grid-2--leads {
    grid-template-columns: 1fr;
  }
}
@media (max-width: 900px) {
  .amo {
    padding: 16px;
  }
  .amo-toolbar {
    flex-direction: column;
    align-items: stretch;
    gap: 12px;
  }
  .amo-field {
    width: 100%;
    max-width: 100%;
  }
  .amo-field__row {
    width: 100%;
  }
  .amo-field__row > * {
    max-width: 100%;
  }
  .amo-range,
  .amo-user {
    width: 100% !important;
    flex: 1 1 100%;
    box-sizing: border-box;
  }
  .amo-overview {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
  .amo-bar-row {
    grid-template-columns: minmax(110px, 1.2fr) 0.8fr auto;
  }
  .amo-stage {
    grid-template-columns: 1fr 50px minmax(90px, 120px);
    & > :nth-child(2) {
      display: none;
    }
  }
}
</style>
