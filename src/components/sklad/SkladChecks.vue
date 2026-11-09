<template>
  <!-- Yangi shartnomalar: ombor mahsulotlar borligini tekshirib, "Tekshirildi" deb belgilaydi -->
  <div v-loading="loading" class="sk-chk">
    <el-alert v-if="error" type="error" show-icon :closable="false" :title="error" />
    <div v-if="!loading && !list.length && !error" class="sk-chk__empty">
      <el-icon><CircleCheck /></el-icon>
      <span>{{ $t('skChkEmpty') }}</span>
    </div>

    <article v-for="c in list" :key="c.id" class="sk-chk__card">
      <header class="sk-chk__head">
        <div class="sk-chk__title">
          <router-link :to="{ path: '/otgruzka', query: { id: c.id } }" class="sk-link"><b>№ {{ c.dogovor_number || '—' }}</b></router-link>
          <span class="sk-chk__client">{{ c.client_name }}</span>
          <div class="sk-muted">
            {{ c.dogovor_date ? formatDate(c.dogovor_date) : '' }}
            <template v-if="c.manager_name"> · {{ c.manager_name }}</template>
            · {{ $t('skChkSince', { time: formatDateTime(c.requested_at) }) }}
          </div>
        </div>
        <span v-if="c.items.length" class="sk-tag" :class="`c-${orderStatus(c)}`">
          {{ $t('skRdOrderReady', { ready: c.summary.ready_positions, total: c.summary.positions }) }}
        </span>
        <span v-else class="sk-tag c-unknown">{{ $t('skChkNoItems') }}</span>
      </header>

      <table v-if="c.items.length" class="sk-chk__table">
        <thead>
          <tr>
            <th>{{ $t('skColName') }}</th>
            <th class="is-r">{{ $t('skRdNeed') }}</th>
            <th class="is-r">{{ $t('skRdFree') }}</th>
            <th class="is-r">{{ $t('skRdReserved') }}</th>
            <th>{{ $t('skStatus') }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(it, i) in c.items" :key="i">
            <td>
              <span class="sk-name">{{ it.name }}</span>
              <div v-if="c.rows[i]?.item" class="sk-muted">
                {{ $t('skRdMatched') }}:
                <el-button link type="primary" size="small" @click="$emit('open', c.rows[i].item.id)">
                  {{ c.rows[i].item.sap_name || c.rows[i].item.name }}
                </el-button>
                <span v-if="c.rows[i].approx" :title="$t('skRdApprox')">≈</span>
              </div>
            </td>
            <td class="is-r">{{ fmtQty(it.qty) }} {{ it.unit || '' }}</td>
            <td class="is-r">{{ c.rows[i]?.balance == null ? '—' : fmtQty(c.rows[i].balance) }}</td>
            <td class="is-r">{{ c.rows[i]?.reserved ? fmtQty(c.rows[i].reserved) : '—' }}</td>
            <td>
              <span class="sk-tag" :class="`c-${c.rows[i]?.status || 'unknown'}`">{{ $t(`skChk_${c.rows[i]?.status || 'unknown'}`) }}</span>
            </td>
          </tr>
        </tbody>
      </table>

      <footer class="sk-chk__foot">
        <el-input v-model="notes[c.id]" :placeholder="$t('skChkNotePh')" maxlength="2000" clearable />
        <!-- Adashib bosilmasin — avval tasdiqlash so'raladi -->
        <el-popconfirm
          :title="$t('skChkConfirm', { n: c.dogovor_number || '—' })"
          :confirm-button-text="$t('skChkConfirmYes')"
          :cancel-button-text="$t('skChkConfirmNo')"
          width="260"
          @confirm="markDone(c)"
        >
          <template #reference>
            <el-button type="primary" :icon="Check" :loading="saving === c.id">{{ $t('skChkDone') }}</el-button>
          </template>
        </el-popconfirm>
      </footer>
    </article>
  </div>
</template>

<script setup>
import { onMounted, reactive, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { ElMessage } from 'element-plus'
import { Check, CircleCheck } from '@element-plus/icons-vue'
import otgruzkaApi from '@/api/otgruzka'
import { formatDate, formatDateTime } from '@/utils/format'
import { fmtQty } from '@/utils/skladFormat'
import { otError } from '@/utils/otgruzkaFormat'
import { useNotifications } from '@/composables/useNotifications'

const emit = defineEmits(['open', 'count'])
const { t } = useI18n()
const loading = ref(false)
const error = ref('')
const list = ref([])
const notes = reactive({})
const saving = ref(null)
const { refresh: refreshNotifications } = useNotifications()

async function load() {
  loading.value = true
  error.value = ''
  try {
    list.value = await otgruzkaApi.skladChecks()
    emit('count', list.value.length)
  } catch (e) {
    error.value = otError(e)
  } finally {
    loading.value = false
  }
}
onMounted(load)
defineExpose({ load })

function orderStatus(c) {
  const s = c.summary
  if (s.positions && s.ready_positions === s.positions) return 'ready'
  return s.pct > 0 ? 'partial' : 'none'
}

async function markDone(c) {
  saving.value = c.id
  try {
    await otgruzkaApi.skladCheck(c.id, { note: notes[c.id]?.trim() || undefined })
    list.value = list.value.filter((x) => x.id !== c.id)
    emit('count', list.value.length)
    refreshNotifications() // qo'ng'iroqdagi raqam ham darhol kamaysin
    ElMessage.success(t('skChkSaved'))
  } catch (e) {
    ElMessage.error(otError(e))
  } finally {
    saving.value = null
  }
}
</script>

<style scoped lang="scss">
.sk-chk {
  display: flex;
  flex-direction: column;
  gap: 12px;
  min-height: 120px;
}
.sk-chk__empty {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 32px 16px;
  color: var(--ui-good);
  font-weight: 600;
  border: 1px dashed var(--ui-line);
  border-radius: var(--ui-radius);
}
.sk-chk__card {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 14px 16px;
  border: 1px solid var(--ui-warn-line);
  border-left: 4px solid var(--ui-warn);
  border-radius: var(--ui-radius);
  background: var(--ui-surface);
}
.sk-chk__head {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 10px;
  flex-wrap: wrap;
}
.sk-chk__title {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 4px 10px;
  min-width: 0;
  .sk-muted {
    flex-basis: 100%;
  }
}
.sk-chk__client {
  font-weight: 600;
  color: var(--ui-ink);
}
.sk-link {
  color: var(--ui-link);
  text-decoration: none;
}
.sk-muted {
  font-size: 12px;
  color: var(--ui-muted);
}
.sk-name {
  color: var(--ui-ink);
}
.sk-chk__table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
  th,
  td {
    padding: 6px;
    border-bottom: 1px solid var(--ui-line-soft);
    text-align: left;
    vertical-align: top;
  }
  th {
    font-weight: 600;
    color: var(--ui-muted);
  }
  .is-r {
    text-align: right;
    white-space: nowrap;
  }
}
@media (max-width: 640px) {
  .sk-chk__table {
    th:nth-child(4),
    td:nth-child(4) {
      display: none;
    }
  }
}
.sk-chk__foot {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  .el-input {
    flex: 1 1 220px;
  }
}
.sk-tag {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 99px;
  font-size: 12px;
  font-weight: 600;
  white-space: nowrap;
  background: var(--ui-surface-2);
  color: var(--ui-muted);
  &.c-ready {
    background: var(--ui-good-soft);
    color: var(--ui-good);
  }
  &.c-partial {
    background: var(--ui-warn-soft);
    color: var(--ui-warn-ink);
  }
  &.c-none {
    background: var(--ui-bad-soft);
    color: var(--ui-bad);
  }
}
</style>
