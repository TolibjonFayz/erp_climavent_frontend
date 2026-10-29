<template>
  <!-- Admin: xodimlarning o'qish holati — kim yo'riqnomani ko'rgan, test natijalari (isbot) -->
  <UiPanel :title="$t('trReportTitle')" :hint="$t('trReportHint')" flush>
    <template #actions>
      <span class="tr-sum">{{ $t('trReportSum', { passed: passedCount, total: rows.length }) }}</span>
      <el-button size="small" :icon="Download" :disabled="!rows.length" @click="exportExcel">Excel</el-button>
      <el-button size="small" :icon="Refresh" :loading="loading" @click="load" />
    </template>
    <el-table v-loading="loading" :data="rows" class="tr-table ui-resizable" row-key="user_id" border @header-dragend="cols.onDragEnd">
      <el-table-column type="expand" width="40" :resizable="false">
        <template #default="{ row }">
          <div class="tr-attempts">
            <div v-if="!row.attempts.length" class="tr-muted">{{ $t('trNoAttempts') }}</div>
            <div v-for="a in row.attempts" :key="a.id" class="tr-attempt">
              <span>{{ formatDateTime(a.at) }}</span>
              <b :class="a.passed ? 'ok' : 'bad'">{{ a.score_pct }}% ({{ a.correct }}/{{ a.total }})</b>
              <span class="tr-muted">{{ fmtDuration(a.duration_sec) }}</span>
              <el-button link type="primary" @click="openAttempt(a.id)">{{ $t('trSeeAnswers') }}</el-button>
            </div>
          </div>
        </template>
      </el-table-column>
      <el-table-column :label="$t('trColUser')" v-bind="cols.col('trColUser', { minWidth: 180 })" column-key="trColUser">
        <template #default="{ row }">
          <b>{{ row.name }}</b>
          <span v-if="row.is_admin" class="tr-muted"> · admin</span>
        </template>
      </el-table-column>
      <el-table-column :label="$t('trColTutorial')" v-bind="cols.col('trColTutorial', { width: 170 })" column-key="trColTutorial">
        <template #default="{ row }">
          <span v-if="row.tutorial_done_at">{{ formatDateTime(row.tutorial_done_at) }}</span>
          <span v-else class="tr-muted">{{ $t('trNotSeen') }}</span>
        </template>
      </el-table-column>
      <el-table-column :label="$t('trColAttempts')" v-bind="cols.col('trColAttempts', { width: 110 })" column-key="trColAttempts" align="center">
        <template #default="{ row }">{{ row.attempts.length }}</template>
      </el-table-column>
      <el-table-column :label="$t('trColBest')" v-bind="cols.col('trColBest', { width: 120 })" column-key="trColBest" align="center">
        <template #default="{ row }">{{ row.best_score == null ? '—' : row.best_score + '%' }}</template>
      </el-table-column>
      <el-table-column :label="$t('skStatus')" v-bind="cols.col('skStatus', { width: 200 })" column-key="skStatus">
        <template #default="{ row }">
          <span class="tr-tag" :class="statusOf(row)">{{ statusLabel(row) }}</span>
        </template>
      </el-table-column>
    </el-table>
  </UiPanel>

  <el-dialog v-model="detailOpen" :title="detailTitle" width="min(760px, 96vw)" append-to-body>
    <div v-loading="detailLoading">
      <ol v-if="detail" class="tr-detail">
        <li v-for="(it, i) in detail.items" :key="i" :class="it.ok ? 'ok' : 'bad'">
          <div class="tr-detail__q">{{ it.question }}</div>
          <div>{{ $t('trChosen') }}: <b>{{ it.chosen || $t('trNoAnswer') }}</b> {{ it.ok ? '✓' : '✗' }}</div>
          <div v-if="!it.ok" class="tr-muted">{{ $t('trCorrect') }}: {{ it.correct }}</div>
        </li>
      </ol>
    </div>
  </el-dialog>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { ElMessage } from 'element-plus'
import * as XLSX from 'xlsx'
import { Download, Refresh } from '@element-plus/icons-vue'
import UiPanel from '@/components/ui/UiPanel.vue'
import trainingApi from '@/api/training'
import { formatDate, formatDateTime } from '@/utils/format'
import { apiError } from '@/utils/skladFormat'
import { useColumnWidths } from '@/composables/useColumnWidths'

// Ustun chegarasini sudrab kenglikni o'zgartirish (brauzerda eslab qolinadi)
const cols = useColumnWidths('training-report')

const props = defineProps({
  module: { type: String, required: true },
})
const { t, locale } = useI18n()
const rows = ref([])
const loading = ref(false)
const detail = ref(null)
const detailOpen = ref(false)
const detailLoading = ref(false)

const passedCount = computed(() => rows.value.filter((r) => r.passed_at).length)
const detailTitle = computed(() =>
  detail.value ? `${detail.value.user} — ${formatDateTime(detail.value.at)} — ${detail.value.score_pct}%` : '',
)

async function load() {
  loading.value = true
  try {
    // Admin testdan ozod — hisobotda faqat xodimlar (admin o'zi topshirgan bo'lsa ko'rinadi)
    rows.value = (await trainingApi.report(props.module)).filter((r) => !r.is_admin || r.tutorial_done_at || r.attempts.length)
  } catch (e) {
    ElMessage.error(apiError(e))
  } finally {
    loading.value = false
  }
}
onMounted(load)

const statusOf = (r) => (r.passed_at ? 'ok' : r.attempts.length ? 'bad' : r.tutorial_done_at ? 'warn' : 'none')
function statusLabel(r) {
  if (r.passed_at) return t('trStPassed', { d: formatDate(r.passed_at) })
  if (r.attempts.length) return t('trStFailed')
  if (r.tutorial_done_at) return t('trStNoQuiz')
  return t('trStNotStarted')
}
const fmtDuration = (s) => (s == null ? '' : `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`)

async function openAttempt(id) {
  detail.value = null
  detailOpen.value = true
  detailLoading.value = true
  try {
    detail.value = await trainingApi.attempt(props.module, id, locale.value === 'ru' ? 'ru' : 'uz')
  } catch (e) {
    ElMessage.error(apiError(e))
    detailOpen.value = false
  } finally {
    detailLoading.value = false
  }
}

function exportExcel() {
  const data = []
  for (const r of rows.value) {
    const base = {
      [t('trColUser')]: r.name,
      [t('trColTutorial')]: r.tutorial_done_at ? formatDateTime(r.tutorial_done_at) : '',
      [t('skStatus')]: statusLabel(r),
    }
    if (!r.attempts.length) data.push(base)
    for (const a of r.attempts) {
      data.push({ ...base, [t('trColAttempt')]: formatDateTime(a.at), [t('trColScore')]: `${a.score_pct}% (${a.correct}/${a.total})` })
    }
  }
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(data), t('trReportTitle').slice(0, 31))
  XLSX.writeFile(wb, `${props.module}-training.xlsx`)
}
</script>

<style scoped lang="scss">
.tr-sum {
  font-size: 13px;
  color: var(--ui-ink-2);
  font-weight: 600;
}
.tr-table {
  :deep(th.el-table__cell) {
    background: var(--ui-surface-2);
    color: var(--ui-ink-2);
    font-weight: 600;
    font-size: 14px;
    text-transform: none;
  }
  :deep(th .cell),
  :deep(.cell) {
    word-break: normal;
  }
  :deep(td .cell) {
    font-size: 14px;
  }
}
.tr-muted {
  color: var(--ui-muted);
  font-size: 13px;
}
.tr-tag {
  display: inline-block;
  padding: 2px 10px;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 600;
  &.ok {
    background: var(--ui-good-soft);
    color: var(--ui-good);
  }
  &.bad {
    background: var(--ui-bad-soft);
    color: var(--ui-bad);
  }
  &.warn {
    background: var(--ui-warn-soft);
    color: var(--ui-warn-ink);
  }
  &.none {
    background: var(--ui-surface-3);
    color: var(--ui-ink-2);
  }
}
.tr-attempts {
  padding: 8px 16px 12px 56px;
}
.tr-attempt {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px 16px;
  padding: 6px 0;
  border-bottom: 1px solid var(--ui-line-soft);
  font-size: 14px;
  .ok {
    color: var(--ui-good);
  }
  .bad {
    color: var(--ui-bad);
  }
}
.tr-detail {
  margin: 0;
  padding-left: 22px;
  li {
    padding: 10px 0;
    border-bottom: 1px solid var(--ui-line-soft);
    font-size: 14px;
    line-height: 1.5;
    &.ok b {
      color: var(--ui-good);
    }
    &.bad b {
      color: var(--ui-bad);
    }
  }
}
.tr-detail__q {
  font-weight: 600;
  color: var(--ui-ink);
  margin-bottom: 2px;
}
</style>
