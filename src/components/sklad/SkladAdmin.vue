<template>
  <!-- Xodimlarni o'qitish: yo'riqnoma va test natijalari -->
  <TrainingReport module="sklad" />

  <!-- Ish rejimi -->
  <UiPanel :title="$t('skAdmMode')">
    <div class="sk-modes">
      <button
        v-for="m in ['mirror', 'live']"
        :key="m"
        type="button"
        class="sk-modecard"
        :class="{ on: store.mode === m }"
        @click="changeMode(m)"
      >
        <span class="sk-modecard__title">{{ m === 'live' ? $t('skModeLive') : $t('skModeMirror') }}</span>
        <span class="sk-modecard__text">{{ m === 'live' ? $t('skAdmLiveText') : $t('skAdmMirrorText') }}</span>
      </button>
    </div>
  </UiPanel>

  <!-- Google Sheets varaqlari -->
  <UiPanel :title="$t('skAdmSources')" :hint="$t('skAdmSourcesHint')" flush>
    <template #actions>
      <el-button
        type="primary"
        size="small"
        :icon="Refresh"
        :loading="syncing === 'all'"
        :disabled="store.mode === 'live'"
        @click="sync()"
      >
        {{ $t('skAdmSyncAll') }}
      </el-button>
    </template>
    <el-table :data="store.sources" size="small" class="sk-table">
      <el-table-column :label="$t('skAdmSheet')" min-width="170">
        <template #default="{ row }">
          <b>{{ row.title || `gid ${row.gid}` }}</b>
          <div class="sk-muted">{{ row.kind === 'month' ? $t('skAdmKindMonth') : $t('skAdmKindContracts') }}</div>
        </template>
      </el-table-column>
      <el-table-column :label="$t('skPeriod')" width="130">
        <template #default="{ row }">{{ row.period ? periodLabel(row.period) : '—' }}</template>
      </el-table-column>
      <el-table-column :label="$t('skLastSync')" width="150">
        <template #default="{ row }">{{ formatDateTime(row.last_synced_at) }}</template>
      </el-table-column>
      <el-table-column :label="$t('skAdmResult')" min-width="260">
        <template #default="{ row }">
          <template v-if="row.last_result">
            <span v-if="!row.last_result.ok" class="sk-bad">⚠️ {{ codeMessage(row.last_result.code, row.last_result.params, row.last_result.error) || $t('skError') }}</span>
            <span v-else-if="row.kind === 'month'">
              ✓ {{ $t('skAdmResMonth', {
                items: row.last_result.items,
                created: row.last_result.items_created,
                moves: row.last_result.movements,
              }) }}
              <el-button
                v-if="row.last_result.warnings_total"
                link
                type="warning"
                size="small"
                @click="warnings = row"
              >
                {{ $t('skAdmWarnings', { n: row.last_result.warnings_total }) }}
              </el-button>
            </span>
            <span v-else>✓ {{ $t('skAdmResContracts', { lines: row.last_result.lines, ctr: row.last_result.contracts }) }}</span>
          </template>
          <span v-else class="sk-muted">{{ $t('skAdmNever') }}</span>
        </template>
      </el-table-column>
      <el-table-column width="150" align="right">
        <template #default="{ row }">
          <el-button
            link
            type="primary"
            size="small"
            :loading="syncing === row.id"
            :disabled="store.mode === 'live'"
            @click="sync(row.id)"
          >
            {{ $t('skAdmSync') }}
          </el-button>
          <el-popconfirm :title="$t('skAdmRemoveConfirm')" @confirm="store.removeSource(row.id)">
            <template #reference>
              <el-button link type="danger" size="small" :icon="Delete" :aria-label="$t('skDelete')" />
            </template>
          </el-popconfirm>
        </template>
      </el-table-column>
    </el-table>

    <div class="sk-add">
      <el-input v-model="newLink" :placeholder="$t('skAdmLinkPh')" class="sk-add__link" />
      <el-select v-model="newKind" class="sk-add__kind">
        <el-option value="month" :label="$t('skAdmKindMonth')" />
        <el-option value="contracts" :label="$t('skAdmKindContracts')" />
      </el-select>
      <el-input v-model="newTitle" :placeholder="$t('skAdmTitlePh')" class="sk-add__title" />
      <el-button :icon="Plus" :disabled="!newLink.trim()" @click="addSource">{{ $t('skAdmAdd') }}</el-button>
    </div>
  </UiPanel>

  <!-- SAP mahsulotlar ro'yxati: ombor mahsulotlariga SAP kodi va nomini biriktirish -->
  <UiPanel :title="$t('skAdmSap')" :hint="$t('skAdmSapHint')">
    <template #actions>
      <span class="sk-muted">{{ $t('skAdmSapLinked', { n: fmtNum(sapLinked), total: fmtNum(store.items.length) }) }}</span>
    </template>
    <p class="sk-sap-text">{{ $t('skAdmSapText') }}</p>
    <div class="sk-sap-actions">
      <el-upload :show-file-list="false" :before-upload="uploadSap" accept=".xlsx,.xls,.csv">
        <el-button type="primary" :icon="Upload" :loading="!!sapStage">
          {{ sapStage ? $t(sapStage) : $t('skAdmSapUpload') }}
        </el-button>
      </el-upload>
      <template v-if="sapResult">
        <span class="sk-sap-result">
          ✓ {{ $t('skAdmSapResult', { rows: fmtNum(sapResult.sap_rows), matched: fmtNum(sapResult.matched), changed: fmtNum(sapResult.changed) }) }}
        </span>
        <el-button v-if="sapResult.unmatched_total" link type="warning" @click="sapUnmatchedOpen = true">
          {{ $t('skAdmSapUnmatched', { n: fmtNum(sapResult.unmatched_total) }) }}
        </el-button>
      </template>
    </div>
    <p v-if="sapResult && sapResult.with_code === false" class="sk-sap-note">ℹ️ {{ $t('skAdmSapNoCode') }}</p>
    <p v-if="sapResult?.ambiguous_total" class="sk-sap-note">
      ⚠️ {{ $t('skAdmSapAmbiguous', { n: fmtNum(sapResult.ambiguous_total) }) }}
      <b>{{ sapResult.ambiguous.join(', ') }}</b>
    </p>
  </UiPanel>

  <el-dialog
    v-model="sapUnmatchedOpen"
    :title="$t('skAdmSapUnmatched', { n: fmtNum(sapResult?.unmatched_total || 0) })"
    width="min(640px, 94vw)"
    append-to-body
  >
    <p class="sk-muted">{{ $t('skAdmSapUnmatchedText') }}</p>
    <ul class="sk-warn">
      <li v-for="(n, i) in sapResult?.unmatched || []" :key="i">{{ n }}</li>
    </ul>
    <p v-if="(sapResult?.unmatched_total || 0) > (sapResult?.unmatched?.length || 0)" class="sk-muted">
      {{ $t('skAdmSapMore', { n: fmtNum(sapResult.unmatched_total - sapResult.unmatched.length) }) }}
    </p>
  </el-dialog>

  <el-dialog
    :model-value="!!warnings"
    :title="warnings?.title || ''"
    width="min(640px, 94vw)"
    append-to-body
    @close="warnings = null"
  >
    <p class="sk-muted">{{ $t('skAdmWarningsText') }}</p>
    <ul class="sk-warn">
      <li v-for="(w, i) in warnings?.last_result?.warnings || []" :key="i">{{ syncWarning(w) }}</li>
    </ul>
  </el-dialog>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Delete, Plus, Refresh, Upload } from '@element-plus/icons-vue'
import UiPanel from '@/components/ui/UiPanel.vue'
import TrainingReport from '@/components/onboarding/TrainingReport.vue'
import { useSkladStore } from '@/stores/sklad'
import { fmtNum, formatDateTime } from '@/utils/format'
import { apiError, codeMessage, compactSheetFile, periodLabel, syncWarning } from '@/utils/skladFormat'

const { t } = useI18n()
const store = useSkladStore()
const syncing = ref(null)
const warnings = ref(null)
const newLink = ref('')
const newKind = ref('month')
const newTitle = ref('')

onMounted(() => store.loadSources().catch(() => {}))

// ─── SAP ro'yxati ───
const sapStage = ref('') // '' | 'skAdmSapReading' | 'skAdmSapSending'
const sapResult = ref(null)
const sapUnmatchedOpen = ref(false)
const sapLinked = computed(() => store.items.filter((i) => i.sap_code || i.sap_name).length)

async function uploadSap(file) {
  try {
    // Katta (rasmli) faylni avval brauzerning o'zida ixchamlaymiz
    sapStage.value = 'skAdmSapReading'
    let compact
    try {
      compact = await compactSheetFile(file)
    } catch {
      ElMessage.error(t('skAdmSapBadFile'))
      return false
    }
    sapStage.value = 'skAdmSapSending'
    sapResult.value = await store.sapImport(compact)
    ElMessage.success(t('skSaved'))
  } catch (e) {
    ElMessage.error(apiError(e))
  } finally {
    sapStage.value = ''
  }
  return false // el-upload o'zi yubormasin
}

async function sync(id) {
  syncing.value = id || 'all'
  try {
    const res = await store.sync(id)
    const failed = res.results.filter((r) => !r.ok)
    if (failed.length) ElMessage.warning(t('skAdmSyncPartial', { n: failed.length }))
    else ElMessage.success(t('skAdmSyncDone'))
  } catch (e) {
    ElMessage.error(apiError(e))
  } finally {
    syncing.value = null
  }
}

async function changeMode(mode) {
  if (mode === store.mode) return
  try {
    await ElMessageBox.confirm(
      mode === 'live' ? t('skAdmToLive') : t('skAdmToMirror'),
      mode === 'live' ? t('skModeLive') : t('skModeMirror'),
      { type: 'warning', confirmButtonText: t('skConfirm'), cancelButtonText: t('skCancel') },
    )
  } catch {
    return
  }
  try {
    await store.setMode(mode)
    ElMessage.success(t('skSaved'))
  } catch (e) {
    ElMessage.error(apiError(e))
  }
}

async function addSource() {
  try {
    await store.addSource({ link: newLink.value.trim(), kind: newKind.value, title: newTitle.value.trim() || undefined })
    newLink.value = ''
    newTitle.value = ''
    ElMessage.success(t('skSaved'))
  } catch (e) {
    ElMessage.error(apiError(e))
  }
}
</script>

<style scoped lang="scss">
.sk-modes {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: 12px;
}
.sk-modecard {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 14px 16px;
  border: 1.5px solid var(--ui-line);
  border-radius: var(--ui-radius);
  background: var(--ui-surface);
  text-align: left;
  font: inherit;
  cursor: pointer;
  color: var(--ui-ink-2);
  &.on {
    border-color: var(--ui-link);
    background: var(--ui-link-soft);
  }
  &:focus-visible {
    outline: 2px solid var(--ui-link);
    outline-offset: 2px;
  }
}
.sk-modecard__title {
  font-weight: 700;
  color: var(--ui-ink);
}
.sk-modecard__text {
  font-size: 13px;
  line-height: 1.45;
}
.sk-table :deep(th.el-table__cell) {
  background: var(--ui-surface-2);
  color: var(--ui-muted);
  font-weight: 600;
  font-size: 12px;
}
.sk-muted {
  font-size: 12px;
  color: var(--ui-muted);
}
.sk-bad {
  color: var(--ui-bad);
}
.sk-add {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  padding: 12px 16px;
  border-top: 1px solid var(--ui-line-soft);
}
.sk-add__link {
  flex: 1 1 320px;
}
.sk-add__kind {
  width: 170px;
}
.sk-add__title {
  width: 170px;
}
.sk-sap-text {
  margin: 0 0 12px;
  font-size: 13px;
  line-height: 1.55;
  color: var(--ui-ink-2);
}
.sk-sap-actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 12px;
}
.sk-sap-note {
  margin: 10px 0 0;
  font-size: 13px;
  line-height: 1.5;
  color: var(--ui-ink-2);
}
.sk-sap-result {
  font-size: 13px;
  color: var(--ui-good);
}
.sk-warn {
  max-height: 50vh;
  overflow: auto;
  padding-left: 18px;
  font-size: 13px;
  line-height: 1.6;
}
</style>
