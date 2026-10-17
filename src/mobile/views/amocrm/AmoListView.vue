<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { showFailToast } from 'vant'
import { useAmocrmStore } from '@/stores/amocrm'
import {
  TALKED,
  callStatusKey,
  countryName,
  fmtDuration,
  fmtNum,
  formatDate,
  formatDateTime,
  telHref,
} from '@/components/amocrm/amoFormat'
import MPage from '../../components/MPage.vue'
import MEmpty from '../../components/MEmpty.vue'
import RecordPlayer from './RecordPlayer.vue'
import { openExternal } from '../../native'
import { errorText } from '../../utils'
import { drillRequest, drillStats } from './drill'

const { t, locale } = useI18n()
const router = useRouter()
const amoStore = useAmocrmStore()

const req = drillRequest.value
const stats = drillStats.value
const isCalls = req?.type === 'calls'
const isMissed = isCalls && req?.params?.kind === 'in_missed'
const amoUrl = stats?.amo_url || ''

const users = new Map((stats?.users || []).map((u) => [u.id, u.name]))
const userName = (id) => (id ? users.get(Number(id)) || `#${id}` : t('amoUnknownManager'))
const stages = new Map()
for (const p of stats?.leads?.pipelines || []) for (const s of p.statuses) stages.set(`${p.id}:${s.id}`, s)
const reasons = new Map((stats?.leads?.loss_reasons || []).map((r) => [r.id, r.name]))

const groupByPhone = ref(!!req?.groupByPhone)
const onlyNotCalledBack = ref(!!req?.onlyNotCalledBack)

const LIMIT = 30
const items = ref([])
const page = ref(0)
const total = ref(0)
const mode = ref(isCalls ? 'call' : 'lead')
const loading = ref(false)
const finished = ref(false)
const failed = ref('')

function params(p) {
  const out = { ...(req?.params || {}), page: p, limit: LIMIT }
  if (isCalls) {
    if (groupByPhone.value) out.group = 'phone'
    if (isMissed && onlyNotCalledBack.value) out.not_called_back = 'true'
  }
  return out
}

async function loadMore() {
  if (!req) return
  loading.value = true
  failed.value = ''
  try {
    const next = page.value + 1
    const res = isCalls ? await amoStore.listCalls(params(next)) : await amoStore.listLeads(params(next))
    items.value = next === 1 ? res.items || [] : [...items.value, ...(res.items || [])]
    total.value = res.total || 0
    mode.value = res.mode || mode.value
    page.value = next
    finished.value = items.value.length >= total.value || !(res.items || []).length
  } catch (e) {
    failed.value = errorText(e, t, locale.value)
    finished.value = true
  } finally {
    loading.value = false
  }
}

async function reload() {
  page.value = 0
  items.value = []
  finished.value = false
  await loadMore()
}

function toggleGroup() {
  groupByPhone.value = !groupByPhone.value
  reload()
}
function toggleNcb() {
  onlyNotCalledBack.value = !onlyNotCalledBack.value
  reload()
}

onMounted(() => {
  if (!req) router.replace({ name: 'amocrm' })
  else loadMore()
})

const statusText = (row) => t(callStatusKey(row.direction, row.call_status))
const isTalked = (row) => row.call_status === TALKED
function callbackText(row) {
  if (!row.callback_at) return t('amoCallbackNone')
  const who = row.callback_direction === 'out' ? t('amoCallbackWeCalled') : t('amoCallbackTheyCalled')
  return `${who} ${formatDateTime(row.callback_at)}`
}
const entityUrl = (row) =>
  amoUrl && row.entity_id ? `${amoUrl}/${row.entity_type}/detail/${row.entity_id}` : ''
const leadUrl = (row) => (amoUrl ? `${amoUrl}/leads/detail/${row.id}` : '')
const stageOf = (row) => stages.get(`${row.pipeline_id}:${row.status_id}`)
const fmtMoney = (n) => `${fmtNum(Math.round(n || 0))} ${t('amoCurrency')}`

const subtitle = computed(() =>
  total.value ? `${req?.subtitle || ''} · ${fmtNum(total.value)}` : req?.subtitle || '',
)
</script>

<template>
  <MPage :title="req?.title || ''" :subtitle="subtitle" :back="{ name: 'amocrm' }" :on-refresh="reload">
    <template v-if="isCalls" #header>
      <div class="m-chips">
        <button type="button" class="m-chip" :class="{ 'is-active': groupByPhone }" @click="toggleGroup">
          <van-icon name="phone-o" /> {{ $t('m.groupByPhone') }}
        </button>
        <button v-if="isMissed" type="button" class="m-chip is-bad" :class="{ 'is-active': onlyNotCalledBack }" @click="toggleNcb">
          {{ $t('amoNotCalledBack') }}
        </button>
      </div>
    </template>

    <van-list
      v-model:loading="loading"
      :finished="finished"
      :immediate-check="false"
      :offset="300"
      class="al-list"
      @load="loadMore"
    >
      <!-- Raqam bo'yicha -->
      <template v-if="mode === 'phone'">
        <article v-for="row in items" :key="row.phone_key || row.phone" class="m-card al-item">
          <div class="al-item__top">
            <a v-if="telHref(row.phone)" :href="telHref(row.phone)" class="al-phone m-num">{{ row.phone }}</a>
            <span v-else class="al-phone m-num">{{ row.phone || '—' }}</span>
            <span class="m-tag">{{ $t('m.callsN', { n: row.calls }) }}</span>
          </div>
          <p v-if="row.contact_name" class="al-contact">{{ row.contact_name }}</p>
          <p class="al-meta">{{ $t('amoColLastCall') }}: {{ formatDateTime(row.last_at) }}</p>
          <p v-if="isMissed" class="al-callback" :class="row.callback_at ? 'is-good' : 'is-bad'">
            {{ callbackText(row) }}
          </p>
          <div class="al-actions">
            <a v-if="telHref(row.phone)" :href="telHref(row.phone)" class="al-act is-call"><van-icon name="phone" /> {{ $t('m.callBack') }}</a>
            <button v-if="entityUrl(row)" type="button" class="al-act" @click="openExternal(entityUrl(row))">
              <van-icon name="link-o" /> amoCRM
            </button>
          </div>
        </article>
      </template>

      <!-- Qo'ng'iroqlar -->
      <template v-else-if="mode === 'call'">
        <article v-for="row in items" :key="row.id" class="m-card al-item">
          <div class="al-item__top">
            <span class="al-dir" :class="row.direction === 'in' ? 'is-in' : 'is-out'">
              <van-icon :name="row.direction === 'in' ? 'down' : 'back-top'" />
            </span>
            <a v-if="telHref(row.phone)" :href="telHref(row.phone)" class="al-phone m-num">{{ row.phone }}</a>
            <span v-else class="al-phone m-num">{{ row.phone || '—' }}</span>
            <span class="al-date m-num">{{ formatDateTime(row.amo_created_at) }}</span>
          </div>
          <p v-if="row.contact_name" class="al-contact">{{ row.contact_name }}</p>
          <div class="al-tags">
            <span class="m-tag" :class="isTalked(row) ? 'is-good' : 'is-warn'">{{ statusText(row) }}</span>
            <span v-if="row.duration" class="m-tag">{{ fmtDuration(row.duration, t) }}</span>
            <span v-if="row.country && row.country !== 'UZ'" class="m-tag is-blue">{{ countryName(row.country, locale, t) }}</span>
          </div>
          <p class="al-meta">{{ userName(row.responsible_user_id) }}</p>
          <p v-if="isMissed" class="al-callback" :class="row.callback_at ? 'is-good' : 'is-bad'">
            {{ callbackText(row) }}
          </p>
          <RecordPlayer v-if="row.record_hash" :hash="row.record_hash" :status="row.record_status" :duration="row.duration || 0" />
          <div v-if="entityUrl(row)" class="al-actions">
            <button type="button" class="al-act" @click="openExternal(entityUrl(row))">
              <van-icon name="link-o" /> amoCRM
            </button>
          </div>
        </article>
      </template>

      <!-- Lidlar -->
      <template v-else>
        <article v-for="row in items" :key="row.id" class="m-card al-item" @click="leadUrl(row) && openExternal(leadUrl(row))">
          <div class="al-item__top">
            <b class="al-lead">{{ row.name || `#${row.id}` }}</b>
            <span class="al-price m-num">{{ fmtMoney(row.price) }}</span>
          </div>
          <div class="al-tags">
            <span class="m-tag" :style="stageOf(row)?.color ? { background: stageOf(row).color + '55' } : {}">
              {{ stageOf(row)?.name || row.status_id }}
            </span>
            <span v-if="row.status_id === 143" class="m-tag is-bad">
              {{ row.loss_reason_id ? reasons.get(row.loss_reason_id) || `#${row.loss_reason_id}` : $t('amoLossReasonNone') }}
            </span>
          </div>
          <p class="al-meta">{{ userName(row.responsible_user_id) }} · {{ formatDate(row.amo_created_at) }}</p>
        </article>
      </template>

      <template #finished>
        <span v-if="items.length">{{ $t('m.endOfList') }}</span>
      </template>
    </van-list>

    <MEmpty v-if="finished && !items.length && !failed" icon="search" :title="$t('m.nothingFound')" />
    <MEmpty v-if="failed && !items.length" icon="warning-o" :title="$t('m.loadFailed')" :text="failed">
      <van-button round type="primary" @click="reload">{{ $t('m.retry') }}</van-button>
    </MEmpty>
  </MPage>
</template>

<style scoped>
.al-list {
  padding-top: 12px;
}

.al-item__top {
  display: flex;
  align-items: center;
  gap: 8px;
}

.al-dir {
  flex: 0 0 auto;
  width: 26px;
  height: 26px;
  border-radius: 50%;
  display: grid;
  place-items: center;
  font-size: 14px;
}

.al-dir.is-in {
  background: var(--m-primary-soft);
  color: var(--m-primary);
}

.al-dir.is-out {
  background: var(--m-good-soft);
  color: var(--m-good);
}

.al-phone {
  font-size: 16px;
  font-weight: 600;
  color: var(--m-ink);
}

a.al-phone {
  color: var(--m-primary);
}

.al-date {
  margin-left: auto;
  font-size: 12px;
  color: var(--m-muted);
}

.al-contact {
  margin-top: 4px;
  font-size: 14px;
  color: var(--m-ink-2);
}

.al-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 8px;
}

.al-meta {
  margin-top: 6px;
  font-size: 13px;
  color: var(--m-muted);
}

.al-callback {
  margin-top: 6px;
  font-size: 13px;
  font-weight: 500;
}

.al-callback.is-good {
  color: var(--m-good);
}

.al-callback.is-bad {
  color: var(--m-bad);
}

.al-actions {
  display: flex;
  gap: 8px;
  margin-top: 10px;
}

.al-act {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 34px;
  padding: 0 12px;
  border: 1px solid var(--m-line);
  border-radius: 10px;
  background: var(--m-surface);
  font-size: 13px;
  font-weight: 500;
  color: var(--m-ink-2);
}

.al-act.is-call {
  background: var(--m-good);
  border-color: var(--m-good);
  color: #fff;
}

.al-lead {
  flex: 1;
  font-size: 15px;
  line-height: 1.3;
}

.al-price {
  font-size: 14px;
  font-weight: 600;
  white-space: nowrap;
}
</style>
