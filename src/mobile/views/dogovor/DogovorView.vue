<script setup>
import { computed, onActivated, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { showFailToast, showToast } from 'vant'
import { useDogovorStore } from '@/stores/dogovor'
import { formatDate, telHref } from '@/utils/format'
import MPage from '../../components/MPage.vue'
import MStats from '../../components/MStats.vue'
import MEmpty from '../../components/MEmpty.vue'
import { useSession } from '../../session'
import { DOGOVOR_STATUSES, canModifyDoc, statusOf } from '../../docRules'
import { errorText, includesText, money, moneyShort } from '../../utils'

const { t, locale } = useI18n()
const router = useRouter()
const store = useDogovorStore()
const { user, isAdmin } = useSession()

const loaded = ref(false)
async function load() {
  try {
    await store.getAllDogovors()
  } catch (e) {
    showFailToast(errorText(e, t, locale.value))
  } finally {
    loaded.value = true
  }
}
onMounted(load)
onActivated(() => loaded.value && load())

const all = computed(() => store.allDogovors || [])

const search = ref('')
const status = ref('')
const filtered = computed(() => {
  const q = search.value.trim()
  return all.value.filter(
    (d) =>
      (!status.value || d.dogovor_status === status.value) &&
      (!q ||
        [d.dogovor_number, d.client_name, d.manager_name, d.client_inn, d.client_phone, d.comment].some(
          (v) => includesText(v, q),
        )),
  )
})

const PAGE = 40
const shown = ref(PAGE)
const listLoading = ref(false)
const finished = computed(() => shown.value >= filtered.value.length)
const rows = computed(() => filtered.value.slice(0, shown.value))
watch([search, status], () => (shown.value = PAGE))
function onLoadMore() {
  shown.value += PAGE
  listLoading.value = false
}

const sumOf = (list) => list.reduce((acc, d) => acc + (Number(d.dogovor_sum) || 0), 0)
const stats = computed(() => [
  {
    key: 'all',
    label: t('dogovorStatTotal'),
    value: all.value.length,
    sub: moneyShort(sumOf(all.value), t),
    active: !status.value,
    onClick: () => (status.value = ''),
  },
  ...DOGOVOR_STATUSES.map((s) => {
    const list = all.value.filter((d) => d.dogovor_status === s.value)
    return {
      key: s.value,
      label: t(s.labelKey),
      value: list.length,
      sub: moneyShort(sumOf(list), t),
      tone: s.value === 'Shipped' ? 'good' : s.value === 'PartlyShipped' ? 'warn' : '',
      active: status.value === s.value,
      onClick: () => (status.value = status.value === s.value ? '' : s.value),
    }
  }),
])

// ─── Excel import ───
const fileInput = ref(null)
const importing = ref(false)
async function onImport(e) {
  const file = e.target.files?.[0]
  e.target.value = ''
  if (!file) return
  importing.value = true
  try {
    const res = await store.importDogovors(file)
    await store.getAllDogovors()
    showToast({
      message: t('dogovorImportSummary', {
        created: res?.imported ?? 0,
        updated: res?.updated ?? 0,
        skipped: res?.skipped ?? 0,
      }),
      wordBreak: 'break-word',
      duration: 4000,
    })
  } catch (err) {
    showFailToast({ message: errorText(err, t, locale.value), wordBreak: 'break-word' })
  } finally {
    importing.value = false
  }
}
</script>

<template>
  <MPage :title="$t('dogovortext')" :back="{ name: 'more' }" :on-refresh="load">
    <template #right>
      <button type="button" class="m-head__btn" :disabled="importing" @click="fileInput?.click()">
        <van-loading v-if="importing" size="18" />
        <van-icon v-else name="upgrade" />
      </button>
      <button type="button" class="m-head__btn" @click="router.push({ name: 'dogovor-new' })">
        <van-icon name="plus" />
      </button>
      <input ref="fileInput" type="file" accept=".xlsx,.xls" hidden @change="onImport" />
    </template>
    <template #header>
      <van-search v-model="search" shape="round" :placeholder="$t('m.searchDogovor')" class="dv-search" />
    </template>

    <p class="dv-scope">{{ isAdmin ? $t('dogovorPageSubtitle') : $t('dogovorPageSubtitleOwn') }}</p>
    <MStats :items="stats" />

    <div v-if="!loaded">
      <van-skeleton v-for="i in 5" :key="i" :row="3" class="m-card" />
    </div>
    <template v-else>
      <p v-if="filtered.length" class="dv-count">{{ $t('m.foundCount', { n: filtered.length }) }}</p>
      <van-list
        v-if="filtered.length"
        v-model:loading="listLoading"
        :finished="finished"
        :immediate-check="false"
        :offset="400"
        @load="onLoadMore"
      >
        <article
          v-for="d in rows"
          :key="d.id"
          class="m-card is-tappable dv-item"
          @click="router.push({ name: 'dogovor-detail', params: { id: d.id } })"
        >
          <div class="dv-item__top">
            <span class="dv-num m-num">№ {{ d.dogovor_number ?? '—' }}</span>
            <span class="m-tag" :class="statusOf(DOGOVOR_STATUSES, d.dogovor_status)?.tone">
              {{ statusOf(DOGOVOR_STATUSES, d.dogovor_status) ? $t(statusOf(DOGOVOR_STATUSES, d.dogovor_status).labelKey) : d.dogovor_status || '—' }}
            </span>
            <van-icon v-if="!canModifyDoc(d, user)" name="lock" class="dv-lock" />
            <span class="dv-date m-num">{{ formatDate(d.dogovor_date) }}</span>
          </div>
          <h3 class="dv-client">{{ d.client_name || '—' }}</h3>
          <div class="dv-meta">
            <span>{{ d.manager_name || '—' }}</span>
            <b class="m-num">{{ money(d.dogovor_sum, t) }}</b>
          </div>
          <div v-if="d.client_phone || d.client_inn" class="dv-sub">
            <span v-if="d.client_inn" class="m-num">{{ $t('dogovorInnLabel') }}: {{ d.client_inn }}</span>
            <a v-if="telHref(d.client_phone)" :href="telHref(d.client_phone)" class="dv-phone m-num" @click.stop>
              <van-icon name="phone-o" /> {{ d.client_phone }}
            </a>
          </div>
        </article>
      </van-list>
      <MEmpty
        v-else
        icon="records-o"
        :title="all.length ? $t('m.nothingFound') : $t('dogovorEmptyTitle')"
        :text="all.length ? $t('dogovorNoMatchDescription') : $t('dogovorEmptyDescription')"
      />
    </template>
  </MPage>
</template>

<style scoped>
.dv-search {
  padding: 0 12px 8px;
}

.dv-scope {
  padding: 12px 16px 0;
  font-size: 12px;
  color: var(--m-muted);
}

.dv-count {
  padding: 10px 16px 8px;
  font-size: 13px;
  color: var(--m-muted);
}

.dv-item__top {
  display: flex;
  align-items: center;
  gap: 8px;
}

.dv-num {
  font-size: 13px;
  font-weight: 700;
  color: var(--m-ink-2);
}

.dv-lock {
  color: var(--m-faint);
}

.dv-date {
  margin-left: auto;
  font-size: 12px;
  color: var(--m-muted);
}

.dv-client {
  margin-top: 8px;
  font-size: 16px;
  font-weight: 600;
  line-height: 1.3;
  overflow-wrap: anywhere;
}

.dv-meta {
  display: flex;
  justify-content: space-between;
  gap: 10px;
  margin-top: 6px;
  font-size: 14px;
  color: var(--m-ink-2);
}

.dv-meta b {
  white-space: nowrap;
  color: var(--m-ink);
}

.dv-sub {
  display: flex;
  justify-content: space-between;
  gap: 10px;
  margin-top: 8px;
  padding-top: 8px;
  border-top: 1px solid var(--m-line-soft);
  font-size: 13px;
  color: var(--m-muted);
}

.dv-phone {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  margin-left: auto;
  font-weight: 500;
}
</style>
