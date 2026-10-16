<template>
  <div class="rec">
    <p class="rec-caption">{{ $t('amoRecCaption') }}</p>

    <el-alert
      v-if="summary && !summary.r2_configured"
      type="warning"
      :closable="false"
      show-icon
      :title="$t('amoRecNotConfigured')"
      class="rec-alert"
    />

    <!-- ═══ Arxiv holati ═══ -->
    <section v-if="summary" class="rec-summary">
      <div class="rec-tiles">
        <div v-for="tile in tiles" :key="tile.key" class="rec-tile" :class="`is-${tile.tone}`">
          <span class="rec-tile__label"><AmoHint :label="tile.label" :hint="tile.hint" /></span>
          <span class="rec-tile__value">{{ fmtNum(tile.value) }}</span>
          <span class="rec-tile__sub">{{ tile.sub || ' ' }}</span>
        </div>
      </div>

      <div class="rec-meta">
        <span v-if="summary.archiving" class="rec-busy">
          <el-icon class="is-loading"><Loading /></el-icon> {{ $t('amoRecArchiving') }}
        </span>
        <span v-if="summary.oldest_call">
          {{ $t('amoRecOldest', { date: formatDate(summary.oldest_call) }) }}
        </span>
        <span v-if="summary.older_than_year.total">
          {{
            $t('amoRecOld', {
              total: fmtNum(summary.older_than_year.total),
              archived: fmtNum(summary.older_than_year.archived),
              lost: fmtNum(summary.older_than_year.lost),
            })
          }}
        </span>
      </div>

      <div class="rec-history">
        <el-button
          size="small"
          :icon="Clock"
          :loading="historyBusy"
          :disabled="historyBusy"
          @click="startHistory"
        >
          {{ $t('amoRecHistoryBtn') }}
        </el-button>
        <AmoHint :hint="$t('amoRecHistoryHint')" />
        <span v-if="summary.history?.last_run_at" class="rec-muted">
          {{
            $t('amoRecHistoryLast', {
              date: formatDateTime(summary.history.last_run_at),
              n: fmtNum(summary.history.items),
            })
          }}
        </span>
      </div>

      <details v-if="summary.problems?.length" class="rec-problems">
        <summary>{{ $t('amoRecProblems') }}</summary>
        <ul>
          <li v-for="(p, i) in summary.problems" :key="i">
            <b>{{ $t(`amoRecStatus_${p.status}`) }} · {{ fmtNum(p.count) }}</b>
            <code>{{ p.error || '—' }}</code>
          </li>
        </ul>
      </details>
    </section>

    <!-- ═══ Ro'yxat ═══ -->
    <div class="rec-toolbar">
      <el-radio-group v-model="direction" size="small" @change="reload">
        <el-radio-button value="all">{{ $t('amoRecDirAll') }}</el-radio-button>
        <el-radio-button value="in">{{ $t('amoDirIn') }}</el-radio-button>
        <el-radio-button value="out">{{ $t('amoDirOut') }}</el-radio-button>
      </el-radio-group>
      <el-input
        v-model="phone"
        size="small"
        clearable
        :prefix-icon="Search"
        :placeholder="$t('amoRecSearchPhone')"
        class="rec-search"
        @input="onSearch"
        @clear="reload"
      />
      <span class="rec-muted"
        >{{ $t('amoDrillTotal') }}: <b>{{ fmtNum(total) }}</b></span
      >
    </div>

    <el-table
      v-loading="loading"
      :data="items"
      size="small"
      stripe
      class="rec-table"
      :empty-text="$t('amoRecEmpty')"
    >
      <el-table-column :label="$t('amoColDate')" min-width="130">
        <template #default="{ row }">{{ formatDateTime(row.amo_created_at) }}</template>
      </el-table-column>
      <el-table-column :label="$t('amoColDirection')" min-width="95">
        <template #default="{ row }">
          <el-tag size="small" :type="row.direction === 'in' ? 'primary' : 'info'" effect="plain">
            {{ $t(row.direction === 'in' ? 'amoDirIn' : 'amoDirOut') }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column :label="$t('amoColPhone')" min-width="140">
        <template #default="{ row }">
          <a v-if="row.phone" :href="telHref(row.phone)" class="rec-link">{{ row.phone }}</a>
          <span v-else>—</span>
          <div v-if="row.country && row.country !== 'UZ'" class="rec-country">
            {{ countryName(row.country, locale, t) }}
          </div>
        </template>
      </el-table-column>
      <el-table-column :label="$t('amoColContact')" min-width="140">
        <template #default="{ row }">
          <a
            v-if="amoUrl && row.entity_id"
            :href="`${amoUrl}/${row.entity_type}/detail/${row.entity_id}`"
            target="_blank"
            rel="noopener"
            class="rec-link"
          >
            {{ row.contact_name || `#${row.entity_id}` }}
          </a>
          <span v-else>{{ row.contact_name || '—' }}</span>
        </template>
      </el-table-column>
      <el-table-column :label="$t('amoManager')" min-width="130">
        <template #default="{ row }">{{ userName(row.responsible_user_id) }}</template>
      </el-table-column>
      <el-table-column :label="$t('amoColDuration')" min-width="110" align="right">
        <template #default="{ row }">{{ fmtDuration(row.duration, t) }}</template>
      </el-table-column>
      <el-table-column :label="$t('amoColRecord')" min-width="330">
        <template #default="{ row }">
          <AmoRecordPlayer
            :key="row.record_hash"
            :hash="row.record_hash"
            :status="row.record_status"
            :duration="Number(row.duration) || 0"
          />
        </template>
      </el-table-column>
    </el-table>

    <el-pagination
      v-if="total > pageSize"
      class="rec-pager"
      layout="prev, pager, next"
      :total="total"
      :page-size="pageSize"
      :current-page="page"
      small
      @current-change="goPage"
    />
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { ElMessage } from 'element-plus'
import { Clock, Loading, Search } from '@element-plus/icons-vue'
import { useAmocrmStore } from '@/stores/amocrm'
import AmoHint from '@/components/ui/UiHint.vue'
import AmoRecordPlayer from './AmoRecordPlayer.vue'
import {
  countryName,
  fmtBytes,
  fmtDuration,
  fmtNum,
  formatDate,
  formatDateTime,
  telHref,
} from './amoFormat'

const props = defineProps({
  // Statistikadagi umumiy filtrlar: from, to, responsible_user_id, scope
  params: { type: Object, required: true },
  users: { type: Array, default: () => [] },
  amoUrl: { type: String, default: '' },
})

const { t, locale } = useI18n()
const amoStore = useAmocrmStore()

const userMap = computed(() => new Map(props.users.map((u) => [u.id, u.name])))
const userName = (id) => (id ? userMap.value.get(Number(id)) || `#${id}` : t('amoUnknownManager'))

// ─── Arxiv holati ─────────────────────────────────────────
const summary = ref(null)
const historyBusy = ref(false)
let pollTimer = null

async function loadSummary() {
  try {
    summary.value = await amoStore.getRecordingsSummary()
  } catch (err) {
    ElMessage.error(err?.response?.data?.message || err?.message)
  }
}

const tiles = computed(() => {
  const s = summary.value
  return [
    {
      key: 'archived',
      tone: 'good',
      label: t('amoRecArchived'),
      hint: t('amoHintRecArchived'),
      value: s.archived,
      sub: fmtBytes(s.archived_size),
    },
    {
      key: 'pending',
      tone: 'plain',
      label: t('amoRecPending'),
      hint: t('amoHintRecPending'),
      value: s.pending,
    },
    {
      key: 'failed',
      tone: s.failed ? 'warn' : 'plain',
      label: t('amoRecFailed'),
      hint: t('amoHintRecFailed'),
      value: s.failed,
    },
    {
      key: 'gone',
      tone: s.gone ? 'bad' : 'plain',
      label: t('amoRecGone'),
      hint: t('amoHintRecGone'),
      value: s.gone,
    },
    {
      key: 'invalid',
      tone: s.invalid ? 'bad' : 'plain',
      label: t('amoRecInvalid'),
      hint: t('amoHintRecInvalid'),
      value: s.invalid,
    },
  ]
})

async function startHistory() {
  try {
    const res = await amoStore.runHistorySync()
    if (!res?.started) {
      ElMessage.warning(t(res?.reason === 'already_running' ? 'amoSyncBusy' : 'amoNotConfigured'))
      return
    }
    ElMessage.info(t('amoRecHistoryStarted'))
    historyBusy.value = true
    pollHistory()
  } catch (err) {
    ElMessage.error(err?.response?.data?.message || err?.message)
  }
}

// Tarix tortilayotganda va arxivlanayotganda holat yangilanib turadi
function pollHistory() {
  clearTimeout(pollTimer)
  pollTimer = setTimeout(async () => {
    try {
      const status = await amoStore.getSyncStatus()
      await loadSummary()
      if (status?.running || summary.value?.archiving) return pollHistory()
    } catch {
      /* keyingi urinishda */
    }
    historyBusy.value = false
    reload()
  }, 5000)
}

onBeforeUnmount(() => clearTimeout(pollTimer))

// ─── Ro'yxat ──────────────────────────────────────────────
const pageSize = 50
const page = ref(1)
const total = ref(0)
const items = ref([])
const loading = ref(false)
const direction = ref('all')
const phone = ref('')

async function load() {
  loading.value = true
  try {
    const res = await amoStore.listCalls({
      ...props.params,
      kind: direction.value,
      has_record: 'true',
      phone: phone.value.replace(/[^0-9]/g, '') || undefined,
      page: page.value,
      limit: pageSize,
    })
    items.value = res.items || []
    total.value = res.total || 0
  } catch (err) {
    items.value = []
    total.value = 0
    ElMessage.error(err?.response?.data?.message || err?.message)
  } finally {
    loading.value = false
  }
}

function reload() {
  page.value = 1
  load()
}

function goPage(p) {
  page.value = p
  load()
}

let searchTimer = null
function onSearch() {
  clearTimeout(searchTimer)
  searchTimer = setTimeout(reload, 400)
}

watch(() => JSON.stringify(props.params), reload)

loadSummary()
reload()
</script>

<style lang="scss" scoped>
$muted: #6b7280;
$line: #e5e7eb;

.rec-caption {
  margin: 0 0 12px;
  font-size: 13px;
  color: $muted;
  line-height: 1.5;
  max-width: 900px;
}
.rec-alert {
  margin-bottom: 12px;
}
.rec-summary {
  border: 1px solid $line;
  border-radius: 10px;
  padding: 14px 16px;
  margin-bottom: 16px;
}
.rec-tiles {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 10px;
}
.rec-tile {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 10px 12px;
  border-radius: 8px;
  background: #f8fafc;
  min-width: 0;

  &__label {
    font-size: 12px;
    color: $muted;
  }
  &__value {
    font-size: 20px;
    font-weight: 700;
    color: #111827;
    font-variant-numeric: tabular-nums;
  }
  &__sub {
    font-size: 12px;
    color: $muted;
  }
  &.is-good .rec-tile__value {
    color: #15803d;
  }
  &.is-warn .rec-tile__value {
    color: #b45309;
  }
  &.is-bad .rec-tile__value {
    color: #b91c1c;
  }
}
.rec-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 6px 16px;
  margin-top: 10px;
  font-size: 12px;
  color: $muted;
}
.rec-busy {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  color: #2a78d6;
}
.rec-history {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 10px;
}
.rec-muted {
  font-size: 12px;
  color: $muted;
}
.rec-problems {
  margin-top: 10px;
  font-size: 12px;
  color: $muted;

  summary {
    cursor: pointer;
  }
  ul {
    margin: 6px 0 0;
    padding-left: 18px;
  }
  li {
    margin-bottom: 4px;
  }
  code {
    display: block;
    word-break: break-all;
    color: #374151;
  }
}
.rec-toolbar {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px;
  margin-bottom: 10px;
}
.rec-search {
  width: 220px;
}
.rec-link {
  color: #2a78d6;
  text-decoration: none;

  &:hover {
    text-decoration: underline;
  }
}
.rec-country {
  font-size: 11px;
  color: $muted;
}
.rec-pager {
  margin-top: 12px;
  justify-content: center;
}

@media (max-width: 900px) {
  .rec-tiles {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
  .rec-search {
    width: 100%;
  }
}
</style>
