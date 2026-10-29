<template>
  <div class="cc" v-loading="loading">
    <p v-if="!phoneKeys.length" class="cc-empty">{{ $t('ccNoPhone') }}</p>
    <template v-else>
      <div class="cc-summary">
        <span>{{ $t('ccTotal', { n: fmtNum(calls.length) }) }}</span>
        <span>· {{ $t('ccTalked', { n: fmtNum(talked) }) }}</span>
        <span v-if="calls[0]">· {{ $t('ccLast', { d: formatDateTime(calls[0].amo_created_at) }) }}</span>
        <span v-if="truncated" class="cc-more">· {{ $t('ccTruncated', { n: LIMIT }) }}</span>
      </div>
      <el-table :data="calls" size="small" :empty-text="$t('crEmpty')">
        <el-table-column :label="$t('crDate')" width="150">
          <template #default="{ row }">{{ formatDateTime(row.amo_created_at) }}</template>
        </el-table-column>
        <el-table-column :label="$t('amoColDirection')" width="120">
          <template #default="{ row }">
            <el-tag size="small" :type="row.direction === 'in' ? 'primary' : 'info'" effect="plain">
              {{ $t(row.direction === 'in' ? 'amoDirIn' : 'amoDirOut') }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column :label="$t('amoColResult')" min-width="170">
          <template #default="{ row }">{{ $t(callStatusKey(row.direction, row.call_status)) }}</template>
        </el-table-column>
        <el-table-column :label="$t('amoColDuration')" width="110">
          <template #default="{ row }">{{ fmtDuration(row.duration, t) }}</template>
        </el-table-column>
        <el-table-column prop="phone" :label="$t('telefon')" width="150" />
        <el-table-column :label="$t('amoColRecord')" min-width="300">
          <template #default="{ row }">
            <AmoRecordPlayer
              v-if="row.record_hash"
              :key="row.record_hash"
              :hash="row.record_hash"
              :status="row.record_status"
              :duration="Number(row.duration) || 0"
            />
          </template>
        </el-table-column>
      </el-table>
    </template>
  </div>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import amocrmApi from '@/api/amocrm'
import AmoRecordPlayer from '@/components/amocrm/AmoRecordPlayer.vue'
import {
  TALKED,
  callStatusKey,
  fmtDuration,
  fmtNum,
  formatDateTime,
  ymd,
} from '@/components/amocrm/amoFormat'

// Mijozning amoCRM qo'ng'iroqlari — uning telefon raqam(lar)i bo'yicha (faqat admin/Boss:
// amocrm/* backend'da AdminOrBossGuard ortida). Yozuvlar R2 arxividan tinglanadi.
const props = defineProps({ phones: { type: Array, default: () => [] } })

const { t } = useI18n()
const LIMIT = 200
// amoCRM integratsiyasi va qo'ng'iroqlar tarixi shu sanadan oldin bo'lmaydi
const HISTORY_FROM = '2020-01-01'

const loading = ref(false)
const calls = ref([])
const truncated = ref(false)

// Oxirgi 9 raqam — backend amo_calls.phone_key bilan bir xil
const phoneKeys = computed(() => [
  ...new Set(
    props.phones
      .map((p) => String(p || '').replace(/\D/g, ''))
      .filter((d) => d.length >= 9)
      .map((d) => d.slice(-9)),
  ),
])
const talked = computed(() => calls.value.filter((c) => Number(c.call_status) === TALKED).length)

async function load() {
  if (!phoneKeys.value.length) {
    calls.value = []
    return
  }
  loading.value = true
  try {
    const pages = await Promise.all(
      phoneKeys.value.map((phone) =>
        amocrmApi.listCalls({
          phone,
          from: HISTORY_FROM,
          to: ymd(new Date()),
          // "Mijoz emas" deb belgilangan raqam ham bo'lsa — kartada baribir ko'rinsin
          scope: 'all',
          limit: LIMIT,
        }),
      ),
    )
    const byId = new Map()
    for (const page of pages) for (const c of page?.items || []) byId.set(c.id, c)
    calls.value = [...byId.values()].sort(
      (a, b) => new Date(b.amo_created_at) - new Date(a.amo_created_at),
    )
    truncated.value = pages.some((p) => (p?.total || 0) > LIMIT)
  } catch {
    calls.value = []
  } finally {
    loading.value = false
  }
}

onMounted(load)
watch(phoneKeys, load)
</script>

<style scoped>
.cc-summary {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  padding: 10px 4px;
  font-size: 13px;
  color: var(--ui-muted);
}
.cc-more {
  color: var(--ui-warn, #b45309);
}
.cc-empty {
  padding: 24px 0;
  text-align: center;
  font-size: 13px;
  color: var(--ui-muted);
}
</style>
