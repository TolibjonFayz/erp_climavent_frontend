<script setup>
import { computed, onActivated, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useComeAndGoesStore } from '@/stores/comeandgoes'
import { countByPeriod, fmtNum, formatSpan } from '@/utils/format'
import MPage from '../../components/MPage.vue'
import MStats from '../../components/MStats.vue'
import MEmpty from '../../components/MEmpty.vue'
import { smartDate } from '../../utils'
import { toSiteRow, whereTone } from './siteData'

const { t, locale } = useI18n()
const router = useRouter()
const store = useComeAndGoesStore()

const loading = ref(false)
const loaded = ref(false)

async function load() {
  loading.value = true
  try {
    await store.getComeAndGoesOfUser(Number(localStorage.getItem('userid')))
  } catch {
    /* ro'yxat bo'sh qoladi */
  } finally {
    loading.value = false
    loaded.value = true
  }
}
onMounted(load)
onActivated(() => loaded.value && load())

const rows = computed(() =>
  (Array.isArray(store.allComeAndGoesofUser) ? store.allComeAndGoesofUser : [])
    .map(toSiteRow)
    .sort((a, b) => new Date(b.gone || b.created || 0) - new Date(a.gone || a.created || 0)),
)

// ─── Filtrlar ───
const search = ref('')
const where = ref('')
const whereOptions = computed(() => {
  const m = {}
  for (const r of rows.value) if (r.whereto) m[r.whereto] = (m[r.whereto] || 0) + 1
  return Object.entries(m)
    .sort((a, b) => b[1] - a[1])
    .map(([value, count]) => ({ value, count }))
})

const filtered = computed(() => {
  const q = search.value.trim().toLowerCase()
  return rows.value.filter((r) => {
    if (where.value && r.whereto !== where.value) return false
    if (!q) return true
    return [r.whereto, r.company, r.location, r.contract, r.contractNumber].some((v) =>
      String(v).toLowerCase().includes(q),
    )
  })
})

const PAGE = 40
const shown = ref(PAGE)
const listLoading = ref(false)
const finished = computed(() => shown.value >= filtered.value.length)
const visible = computed(() => filtered.value.slice(0, shown.value))
watch([search, where], () => (shown.value = PAGE))
function onLoadMore() {
  shown.value += PAGE
  listLoading.value = false
}

const added = computed(() => countByPeriod(rows.value, (r) => r.gone || r.created))
const stats = computed(() => [
  { key: 'today', label: t('m.today'), value: fmtNum(added.value.today), tone: 'good' },
  { key: 'week', label: t('m.addedWeek'), value: fmtNum(added.value.week) },
  { key: 'month', label: t('m.addedMonth'), value: fmtNum(added.value.month) },
  {
    key: 'contract',
    label: t('m.withDocument'),
    value: fmtNum(rows.value.filter((r) => r.contract).length),
  },
  { key: 'total', label: t('m.total'), value: fmtNum(rows.value.length) },
])

const timeOf = (iso) => {
  if (!iso) return ''
  const d = new Date(iso)
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

const openNew = () => router.push({ name: 'site-new' })
</script>

<template>
  <MPage :title="$t('m.tabSites')" large tabbar :on-refresh="load">
    <template #right>
      <button type="button" class="m-head__btn" @click="openNew">
        <van-icon name="plus" />
      </button>
    </template>
    <template #header>
      <van-search
        v-model="search"
        shape="round"
        :placeholder="$t('m.searchSites')"
        class="sl-search"
      />
      <div v-if="whereOptions.length" class="m-chips">
        <button type="button" class="m-chip" :class="{ 'is-active': !where }" @click="where = ''">
          {{ $t('m.all') }} <span class="m-chip__count">{{ rows.length }}</span>
        </button>
        <button
          v-for="w in whereOptions"
          :key="w.value"
          type="button"
          class="m-chip"
          :class="{ 'is-active': where === w.value }"
          @click="where = w.value"
        >
          {{ w.value }} <span class="m-chip__count">{{ w.count }}</span>
        </button>
      </div>
    </template>

    <MStats :items="stats" />

    <div v-if="loading && !loaded">
      <van-skeleton v-for="i in 5" :key="i" :row="3" class="m-card" />
    </div>

    <template v-else>
      <van-list
        v-if="filtered.length"
        v-model:loading="listLoading"
        :finished="finished"
        :immediate-check="false"
        :offset="400"
        class="sl-list"
        @load="onLoadMore"
      >
        <article
          v-for="r in visible"
          :key="r.id"
          class="m-card is-tappable sl-item"
          @click="router.push({ name: 'site-detail', params: { id: r.id } })"
        >
          <div class="sl-item__top">
            <span class="m-tag" :class="whereTone(r.whereto)">{{ r.whereto || '—' }}</span>
            <span v-if="r.contract" class="m-tag">
              {{ r.contract }}<template v-if="r.contractNumber"> №{{ r.contractNumber }}</template>
            </span>
            <span v-if="r.extra" class="m-tag is-blue">+{{ r.extra }}</span>
            <span class="sl-item__date">{{ smartDate(r.gone || r.created, t, locale, false) }}</span>
          </div>
          <h3 class="sl-item__title">{{ r.company || r.whereto || '—' }}</h3>
          <p v-if="r.location" class="sl-item__loc">
            <van-icon name="location-o" />
            <span>{{ r.location }}</span>
          </p>
          <div class="sl-item__time">
            <span>
              <van-icon name="clock-o" />
              {{ timeOf(r.gone) || '—' }}
              <template v-if="r.came"> → {{ timeOf(r.came) }}</template>
            </span>
            <span v-if="r.came" class="m-faint">{{ formatSpan(r.gone, r.came, t) }}</span>
          </div>
        </article>
      </van-list>

      <MEmpty
        v-else
        icon="location-o"
        :title="rows.length ? $t('m.nothingFound') : $t('m.noSites')"
        :text="rows.length ? $t('m.tryOtherFilter') : $t('m.noSitesText')"
      >
        <van-button v-if="!rows.length" type="primary" round class="sl-empty-btn" @click="openNew">
          {{ $t('m.newSite') }}
        </van-button>
      </MEmpty>
    </template>
  </MPage>
</template>

<style scoped>
.sl-search {
  padding: 0 12px 8px;
}

.sl-list {
  padding-top: 8px;
}

.sl-item__top {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
}

.sl-item__date {
  margin-left: auto;
  font-size: 12px;
  color: var(--m-muted);
}

.sl-item__title {
  margin-top: 10px;
  font-size: 16px;
  font-weight: 600;
  line-height: 1.3;
  overflow-wrap: anywhere;
}

.sl-item__loc {
  display: flex;
  gap: 6px;
  margin-top: 6px;
  font-size: 13px;
  color: var(--m-ink-2);
  line-height: 1.4;
}

.sl-item__loc .van-icon {
  margin-top: 2px;
  color: var(--m-muted);
}

.sl-item__loc span {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.sl-item__time {
  display: flex;
  justify-content: space-between;
  gap: 8px;
  margin-top: 10px;
  padding-top: 10px;
  border-top: 1px solid var(--m-line-soft);
  font-size: 13px;
  color: var(--m-ink-2);
}

.sl-item__time .van-icon {
  color: var(--m-muted);
  margin-right: 2px;
}

.sl-empty-btn {
  margin-top: 16px;
}
</style>
