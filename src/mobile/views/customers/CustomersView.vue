<script setup>
import { computed, onActivated, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { usePartnersStore } from '@/stores/partners'
import { formatLocationName } from '@/utils/partners'
import { countByPeriod, digitsOf, fmtNum, telHref } from '@/utils/format'
import MPage from '../../components/MPage.vue'
import MStats from '../../components/MStats.vue'
import MEmpty from '../../components/MEmpty.vue'
import MSheet from '../../components/MSheet.vue'
import { PARTNER_GROUPS } from './groups'
import { avatarColor, initials, smartDate } from '../../utils'

const { t, locale } = useI18n()
const router = useRouter()
const partnersStore = usePartnersStore()

const loading = ref(false)
const loaded = ref(false)
const all = computed(() =>
  Array.isArray(partnersStore.allPartnersofUser) ? partnersStore.allPartnersofUser : [],
)

async function load() {
  loading.value = true
  try {
    await partnersStore.getAllPartnersOfUser(Number(localStorage.getItem('userid')))
  } finally {
    loading.value = false
    loaded.value = true
  }
}
onMounted(load)
// Boshqa sahifadan qaytganda jimgina yangilaymiz
onActivated(() => loaded.value && load())

// ─── Filtrlar ───
const group = ref('all')
const search = ref('')
const legalType = ref('')
const region = ref('')
const filterOpen = ref(false)

const countBy = computed(() => {
  const m = {}
  for (const p of all.value) m[p.partner_type] = (m[p.partner_type] || 0) + 1
  return m
})
const groups = computed(() => [
  { value: 'all', label: t('custAll'), count: all.value.length },
  ...PARTNER_GROUPS.map((g) => ({
    value: g.value,
    label: t(g.labelKey),
    count: countBy.value[g.value] || 0,
  })).filter((g) => g.count || g.value === group.value),
])

const legalTypes = computed(() =>
  [...new Set(all.value.map((p) => p.mijozturi).filter(Boolean))].sort(),
)
const regions = computed(() =>
  [...new Set(all.value.map((p) => p.viloyat).filter(Boolean))]
    .map((v) => ({ value: v, label: formatLocationName(v) }))
    .sort((a, b) => a.label.localeCompare(b.label)),
)
const extraFilters = computed(() => (legalType.value ? 1 : 0) + (region.value ? 1 : 0))

const filtered = computed(() => {
  const q = search.value.trim().toLowerCase()
  const qDigits = digitsOf(q)
  return all.value
    .filter((p) => {
      if (group.value !== 'all' && p.partner_type !== group.value) return false
      if (legalType.value && p.mijozturi !== legalType.value) return false
      if (region.value && p.viloyat !== region.value) return false
      if (!q) return true
      if (
        String(p.fullname || '')
          .toLowerCase()
          .includes(q)
      )
        return true
      if (qDigits.length >= 3) {
        return [p.phone_number, p.additional_phone_number, p.inn].some((v) =>
          digitsOf(v).includes(qDigits),
        )
      }
      return false
    })
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
})

// Ro'yxat bo'laklab chiziladi (uzun ro'yxatda tez ishlashi uchun)
const PAGE = 40
const shown = ref(PAGE)
const finished = computed(() => shown.value >= filtered.value.length)
const rows = computed(() => filtered.value.slice(0, shown.value))
const listLoading = ref(false)
function onLoadMore() {
  shown.value += PAGE
  listLoading.value = false
}
watch([group, search, legalType, region], () => (shown.value = PAGE))

const added = computed(() => countByPeriod(all.value))
const stats = computed(() => [
  { key: 'total', label: t('m.total'), value: fmtNum(all.value.length) },
  { key: 'today', label: t('m.addedToday'), value: fmtNum(added.value.today), tone: 'good' },
  { key: 'week', label: t('m.addedWeek'), value: fmtNum(added.value.week) },
  { key: 'month', label: t('m.addedMonth'), value: fmtNum(added.value.month) },
])

const regionLine = (p) =>
  [p.viloyat, p.shahar_tuman].filter(Boolean).map(formatLocationName).join(', ')
const isLegal = (p) => /yuridik|юридическ/i.test(p.mijozturi || '')

function resetExtra() {
  legalType.value = ''
  region.value = ''
}

function openNew() {
  router.push({ name: 'customer-new', query: group.value !== 'all' ? { group: group.value } : {} })
}
</script>

<template>
  <MPage :title="$t('m.tabCustomers')" large tabbar :on-refresh="load">
    <template #right>
      <button type="button" class="m-head__btn" @click="filterOpen = true">
        <van-badge :content="extraFilters || ''" :offset="[2, 2]">
          <van-icon name="filter-o" />
        </van-badge>
      </button>
      <button type="button" class="m-head__btn" @click="openNew">
        <van-icon name="plus" />
      </button>
    </template>
    <template #header>
      <van-search
        v-model="search"
        shape="round"
        :placeholder="$t('m.searchCustomers')"
        class="cl-search"
      />
      <div class="m-chips">
        <button
          v-for="g in groups"
          :key="g.value"
          type="button"
          class="m-chip"
          :class="{ 'is-active': group === g.value }"
          @click="group = g.value"
        >
          {{ g.label }} <span class="m-chip__count">{{ g.count }}</span>
        </button>
      </div>
    </template>

    <MStats :items="stats" />

    <div v-if="loading && !loaded" class="cl-skeleton">
      <van-skeleton v-for="i in 6" :key="i" avatar :row="2" class="m-card" />
    </div>

    <template v-else>
      <p v-if="filtered.length" class="cl-count">
        {{ $t('m.foundCount', { n: fmtNum(filtered.length) }) }}
      </p>
      <van-list
        v-if="filtered.length"
        v-model:loading="listLoading"
        :finished="finished"
        :immediate-check="false"
        :offset="400"
        @load="onLoadMore"
      >
        <article
          v-for="p in rows"
          :key="p.id"
          class="m-card is-tappable cl-item"
          @click="router.push({ name: 'customer-detail', params: { id: p.id } })"
        >
          <div class="m-avatar" :style="{ background: avatarColor(p.fullname) }">
            {{ initials(p.fullname) }}
          </div>
          <div class="cl-item__main">
            <h3 class="cl-item__name">{{ p.fullname || '—' }}</h3>
            <div class="cl-item__tags">
              <span class="m-tag" :class="isLegal(p) ? 'is-good' : 'is-warn'">
                {{ p.mijozturi || '—' }}
              </span>
              <span v-if="group === 'all'" class="m-tag">
                {{ $t(PARTNER_GROUPS.find((g) => g.value === p.partner_type)?.labelKey || 'boshqa') }}
              </span>
            </div>
            <p class="cl-item__meta">
              <span class="m-num">{{ p.phone_number || '—' }}</span>
              <template v-if="regionLine(p)"> · {{ regionLine(p) }}</template>
            </p>
            <p class="cl-item__date">{{ smartDate(p.createdAt, t, locale) }}</p>
          </div>
          <a
            v-if="telHref(p.phone_number)"
            :href="telHref(p.phone_number)"
            class="cl-item__call"
            :aria-label="$t('m.call')"
            @click.stop
          >
            <van-icon name="phone" />
          </a>
        </article>
      </van-list>

      <MEmpty
        v-else
        icon="friends-o"
        :title="all.length ? $t('m.nothingFound') : $t('m.noCustomers')"
        :text="all.length ? $t('m.tryOtherFilter') : $t('m.noCustomersText')"
      >
        <van-button v-if="!all.length" type="primary" round class="cl-empty-btn" @click="openNew">
          {{ $t('m.addCustomer') }}
        </van-button>
      </MEmpty>
    </template>

    <MSheet v-model="filterOpen" :title="$t('m.filters')">
      <div class="m-section"><span class="m-section__title">{{ $t('mijozTuri') }}</span></div>
      <div class="m-chips is-wrap">
        <button
          type="button"
          class="m-chip"
          :class="{ 'is-active': !legalType }"
          @click="legalType = ''"
        >
          {{ $t('custAll') }}
        </button>
        <button
          v-for="lt in legalTypes"
          :key="lt"
          type="button"
          class="m-chip"
          :class="{ 'is-active': legalType === lt }"
          @click="legalType = lt"
        >
          {{ lt }}
        </button>
      </div>
      <div class="m-section"><span class="m-section__title">{{ $t('viloyat') }}</span></div>
      <van-radio-group v-model="region">
        <van-cell-group inset>
          <van-cell :title="$t('custAll')" clickable @click="region = ''">
            <template #right-icon><van-radio name="" /></template>
          </van-cell>
          <van-cell
            v-for="r in regions"
            :key="r.value"
            :title="r.label"
            clickable
            @click="region = r.value"
          >
            <template #right-icon><van-radio :name="r.value" /></template>
          </van-cell>
        </van-cell-group>
      </van-radio-group>
      <template #footer>
        <van-button @click="resetExtra">{{ $t('m.reset') }}</van-button>
        <van-button type="primary" @click="filterOpen = false">
          {{ $t('m.showResults', { n: filtered.length }) }}
        </van-button>
      </template>
    </MSheet>
  </MPage>
</template>

<style scoped>
.cl-search {
  padding: 0 12px 8px;
}

.cl-count {
  padding: 10px 16px 8px;
  font-size: 13px;
  color: var(--m-muted);
}

.cl-item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
}

.cl-item__main {
  flex: 1;
  min-width: 0;
}

.cl-item__name {
  font-size: 16px;
  font-weight: 600;
  line-height: 1.3;
  overflow-wrap: anywhere;
}

.cl-item__tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin: 6px 0;
}

.cl-item__meta {
  font-size: 13px;
  color: var(--m-ink-2);
  line-height: 1.4;
}

.cl-item__date {
  font-size: 12px;
  color: var(--m-faint);
  margin-top: 4px;
}

.cl-item__call {
  flex: 0 0 auto;
  width: 42px;
  height: 42px;
  border-radius: 50%;
  background: var(--m-good-soft);
  color: var(--m-good);
  display: grid;
  place-items: center;
  font-size: 20px;
  align-self: center;
}

.cl-item__call:active {
  background: #d1fadf;
}

.m-chips.is-wrap {
  flex-wrap: wrap;
}

.cl-empty-btn {
  margin-top: 16px;
}
</style>
