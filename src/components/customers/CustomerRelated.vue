<template>
  <section class="cr" v-loading="loading">
    <div class="cr-stats">
      <UiStat
        :label="$t('crKp')"
        :value="fmtNum(summary.kp_count)"
        :sub="money(summary.kp_sum)"
      />
      <UiStat
        :label="$t('crDogovor')"
        tone="good"
        money
        :value="fmtNum(summary.dogovor_count)"
        :sub="money(summary.dogovor_sum)"
      />
      <UiStat
        :label="$t('crConversion')"
        :hint="$t('crConversionHint')"
        tone="warn"
        :value="conversion"
        :sub="$t('crConversionSub')"
      />
      <UiStat
        :label="$t('crLastActivity')"
        money
        :value="summary.last_activity ? formatDate(summary.last_activity) : '—'"
        :sub="$t('crVisits', { n: summary.visit_count })"
      />
    </div>

    <UiPanel :title="$t('crTitle')" :hint="$t('crHint')" flush>
      <el-tabs v-model="tab" class="cr-tabs">
        <el-tab-pane :label="`${$t('crKp')} · ${data.kp.length}`" name="kp">
          <el-table :data="data.kp" size="small" :empty-text="$t('crEmpty')" @row-click="openKp">
            <el-table-column :label="$t('crNumber')" width="110">
              <template #default="{ row }">№{{ row.kp_number ?? '—' }}</template>
            </el-table-column>
            <el-table-column :label="$t('crDate')" width="110">
              <template #default="{ row }">{{ formatDate(row.kp_date) }}</template>
            </el-table-column>
            <el-table-column :label="$t('crStatus')" width="130">
              <template #default="{ row }">{{ kpStatus(row.kp_status) }}</template>
            </el-table-column>
            <el-table-column :label="$t('crSum')" min-width="150" align="right">
              <template #default="{ row }">{{ money(row.kp_sum) }}</template>
            </el-table-column>
            <el-table-column prop="manager_name" :label="$t('crManager')" min-width="160" />
            <el-table-column :label="$t('crMatchedBy')" width="120">
              <template #default="{ row }"><MatchTag :by="row.matched_by" /></template>
            </el-table-column>
          </el-table>
        </el-tab-pane>

        <el-tab-pane :label="`${$t('crDogovor')} · ${data.dogovor.length}`" name="dogovor">
          <el-table
            :data="data.dogovor"
            size="small"
            :empty-text="$t('crEmpty')"
            @row-click="openDogovor"
          >
            <el-table-column :label="$t('crNumber')" width="110">
              <template #default="{ row }">№{{ row.dogovor_number ?? '—' }}</template>
            </el-table-column>
            <el-table-column :label="$t('crDate')" width="110">
              <template #default="{ row }">{{ formatDate(row.dogovor_date) }}</template>
            </el-table-column>
            <el-table-column :label="$t('crStatus')" width="150">
              <template #default="{ row }">{{ dogovorStatus(row.dogovor_status) }}</template>
            </el-table-column>
            <el-table-column :label="$t('crSum')" min-width="150" align="right">
              <template #default="{ row }">{{ money(row.dogovor_sum) }}</template>
            </el-table-column>
            <el-table-column prop="manager_name" :label="$t('crManager')" min-width="160" />
            <el-table-column :label="$t('crMatchedBy')" width="120">
              <template #default="{ row }"><MatchTag :by="row.matched_by" /></template>
            </el-table-column>
          </el-table>
        </el-tab-pane>

        <el-tab-pane :label="`${$t('crLoyiha')} · ${data.loyiha.length}`" name="loyiha">
          <el-table
            :data="data.loyiha"
            size="small"
            :empty-text="$t('crEmpty')"
            @row-click="(r) => router.push(`/loyiha/${r.id}`)"
          >
            <el-table-column :label="$t('crNumber')" width="110">
              <template #default="{ row }">{{ formatLoyihaId(row.order_number) }}</template>
            </el-table-column>
            <el-table-column :label="$t('crDate')" width="110">
              <template #default="{ row }">{{ formatDate(row.given_date) }}</template>
            </el-table-column>
            <el-table-column :label="$t('crStatus')" width="130">
              <template #default="{ row }">{{ loyihaStatus(row.status) }}</template>
            </el-table-column>
            <el-table-column prop="system_info" :label="$t('crSystem')" min-width="180" />
            <el-table-column prop="manager_name" :label="$t('crManager')" min-width="160" />
          </el-table>
        </el-tab-pane>

        <el-tab-pane :label="`${$t('crSites')} · ${data.sites.length}`" name="sites">
          <el-table
            :data="data.sites"
            size="small"
            :empty-text="$t('crEmpty')"
            @row-click="(r) => router.push(`/sites/${r.come_and_go_father_id}`)"
          >
            <el-table-column :label="$t('crDate')" width="150">
              <template #default="{ row }">{{ formatDateTime(row.when_gone || row.createdAt) }}</template>
            </el-table-column>
            <el-table-column prop="whereto" :label="$t('crWhere')" min-width="160" />
            <el-table-column :label="$t('crCompany')" min-width="200">
              <template #default="{ row }">{{ row.company_name || row.client_name }}</template>
            </el-table-column>
          </el-table>
        </el-tab-pane>
      </el-tabs>
    </UiPanel>
  </section>
</template>

<script setup>
import { computed, h, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { ElTag } from 'element-plus'
import partnersApi from '@/api/partners'
import UiPanel from '@/components/ui/UiPanel.vue'
import UiStat from '@/components/ui/UiStat.vue'
import { fmtNum, formatDate, formatDateTime } from '@/utils/format'
import { formatLoyihaId, LOYIHA_STATUS_OPTIONS } from '@/utils/loyihaFormat'

// Mijoz kartasi 360°: bu mijozning KP, shartnoma, loyiha va obyekt tashriflari.
// Backend INN > telefon > nom bo'yicha topadi (KP/shartnoma 1C'dan nom matni bilan keladi).
const props = defineProps({ partnerId: { type: [String, Number], required: true } })

const router = useRouter()
const { t } = useI18n()

const loading = ref(false)
const tab = ref('dogovor')
const data = ref({ kp: [], dogovor: [], loyiha: [], sites: [], summary: {} })
const summary = computed(() => data.value.summary || {})

// Shartnomaga aylangan KP ulushi — mijoz bo'yicha taxminiy (KP va shartnoma alohida tizimdan)
const conversion = computed(() => {
  const { kp_count: kp, dogovor_count: dg } = summary.value
  if (!kp) return '—'
  return `${Math.min(100, Math.round((dg / kp) * 100))}%`
})

const money = (v) => (v ? `${fmtNum(Math.round(Number(v)))} ${t('amoCurrency')}` : '—')

const KP_STATUS = { Open: 'kpStatusOpen', Negotiation: 'kpStatusNegotiation', Closed: 'kpStatusClosed' }
const DOGOVOR_STATUS = {
  Open: 'dogovorStatusOpen',
  Shipped: 'dogovorStatusShipped',
  PartlyShipped: 'dogovorStatusPartlyShipped',
  Closed: 'dogovorStatusClosed',
}
const kpStatus = (s) => (KP_STATUS[s] ? t(KP_STATUS[s]) : s || '—')
const dogovorStatus = (s) => (DOGOVOR_STATUS[s] ? t(DOGOVOR_STATUS[s]) : s || '—')
const loyihaStatus = (s) => {
  const opt = LOYIHA_STATUS_OPTIONS.find((o) => o.value === s)
  return opt ? t(opt.labelKey) : s || '—'
}

// Qaysi belgi bo'yicha topilgani — nom bo'yicha topilganini foydalanuvchi tekshirib ko'rsin
const MATCH = { inn: ['crByInn', 'success'], phone: ['crByPhone', 'primary'], name: ['crByName', 'info'] }
const MatchTag = (p) => {
  const [key, type] = MATCH[p.by] || ['crByName', 'info']
  return h(ElTag, { size: 'small', type, effect: 'plain' }, () => t(key))
}
MatchTag.props = ['by']

const openKp = (r) => router.push({ path: '/kp', query: { n: String(r.kp_number ?? '') } })
const openDogovor = (r) =>
  router.push({
    path: '/dogovor',
    query: { n: String(r.dogovor_number ?? ''), d: r.dogovor_date ? formatDate(r.dogovor_date) : undefined },
  })

async function load() {
  loading.value = true
  try {
    const res = await partnersApi.getRelated(props.partnerId)
    data.value = { kp: [], dogovor: [], loyiha: [], sites: [], summary: {}, ...res }
    // Birinchi bo'lib ma'lumoti bor tabni ochamiz
    tab.value = ['dogovor', 'kp', 'loyiha', 'sites'].find((k) => data.value[k].length) || 'dogovor'
  } catch {
    // 360° qo'shimcha ma'lumot — xato bo'lsa asosiy karta ishlayveradi
    data.value = { kp: [], dogovor: [], loyiha: [], sites: [], summary: {} }
  } finally {
    loading.value = false
  }
}

onMounted(load)
watch(() => props.partnerId, load)
// Mijoz nomi/INN/telefoni tahrirlansa, bog'lanishlar qayta hisoblanadi
defineExpose({ reload: load })
</script>

<style scoped>
.cr {
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-top: 16px;
}
.cr-stats {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
}
.cr-tabs {
  padding: 0 16px 8px;
}
.cr-tabs :deep(.el-table__row) {
  cursor: pointer;
}
@media (max-width: 900px) {
  .cr-stats {
    grid-template-columns: 1fr 1fr;
  }
}
</style>
