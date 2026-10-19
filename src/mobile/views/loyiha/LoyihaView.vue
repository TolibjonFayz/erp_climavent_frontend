<script setup>
import { computed, onActivated, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { showFailToast } from 'vant'
import { useLoyihaStore } from '@/stores/loyiha'
import { formatLoyihaId, formatNumber } from '@/utils/loyihaFormat'
import MPage from '../../components/MPage.vue'
import MStats from '../../components/MStats.vue'
import MEmpty from '../../components/MEmpty.vue'
import { errorText, includesText } from '../../utils'
import { difficultyTone } from './loyihaUi'

const { t, locale } = useI18n()
const router = useRouter()
const store = useLoyihaStore()

const loaded = ref(false)
async function load() {
  try {
    await Promise.all([store.getAllLoyihas(), store.checkStorage()])
  } catch (e) {
    showFailToast(errorText(e, t, locale.value))
  } finally {
    loaded.value = true
  }
}
onMounted(load)
onActivated(() => loaded.value && load())

const all = computed(() => store.allLoyihas || [])
const search = ref('')
const status = ref('')

const filtered = computed(() => {
  const q = search.value.trim()
  return all.value.filter(
    (r) =>
      (!status.value || (status.value === 'done' ? r.status === 'done' : r.status !== 'done')) &&
      (!q ||
        includesText(r.order_number, q) ||
        includesText(formatLoyihaId(r.order_number), q) ||
        [r.manager_name, r.other_source, r.system_info, r.contact_phone, r.contact_address, r.comment, r.kp_number, r.dogovor_number].some(
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

const stats = computed(() => {
  const done = all.value.filter((r) => r.status === 'done').length
  const area = all.value.reduce((acc, r) => acc + (Number(r.area) || 0), 0)
  return [
    { key: 'all', label: t('loyihaStatTotal'), value: all.value.length, active: !status.value, onClick: () => (status.value = '') },
    {
      key: 'progress',
      label: t('loyihaStatusInProgress'),
      value: all.value.length - done,
      tone: 'warn',
      active: status.value === 'in_progress',
      onClick: () => (status.value = status.value === 'in_progress' ? '' : 'in_progress'),
    },
    {
      key: 'done',
      label: t('loyihaStatusDone'),
      value: done,
      tone: 'good',
      active: status.value === 'done',
      onClick: () => (status.value = status.value === 'done' ? '' : 'done'),
    },
    { key: 'area', label: t('loyihaStatArea'), value: `${formatNumber(area)} m²` },
  ]
})

const hasFile = (r, section) => (r.files || []).some((f) => f.section === section)
</script>

<template>
  <MPage :title="$t('loyihatext')" :back="{ name: 'more' }" :on-refresh="load">
    <template #right>
      <button type="button" class="m-head__btn" @click="router.push({ name: 'loyiha-new' })">
        <van-icon name="plus" />
      </button>
    </template>
    <template #header>
      <van-search v-model="search" shape="round" :placeholder="$t('m.searchLoyiha')" class="lv-search" />
    </template>

    <div v-if="loaded && !store.storageReady" class="lv-warn">
      <van-icon name="warning-o" /> {{ $t('loyihaStorageNotReady') }}
    </div>
    <MStats :items="stats" />

    <div v-if="!loaded">
      <van-skeleton v-for="i in 5" :key="i" :row="3" class="m-card" />
    </div>
    <template v-else>
      <p v-if="filtered.length" class="lv-count">{{ $t('m.foundCount', { n: filtered.length }) }}</p>
      <van-list
        v-if="filtered.length"
        v-model:loading="listLoading"
        :finished="finished"
        :immediate-check="false"
        :offset="400"
        @load="onLoadMore"
      >
        <article
          v-for="r in rows"
          :key="r.id"
          class="m-card is-tappable lv-item"
          @click="router.push({ name: 'loyiha-detail', params: { id: r.id } })"
        >
          <div class="lv-item__top">
            <span class="lv-id m-num">#{{ formatLoyihaId(r.order_number) }}</span>
            <span class="m-tag" :class="r.status === 'done' ? 'is-good' : 'is-warn'">
              {{ r.status === 'done' ? $t('loyihaStatusDone') : $t('loyihaStatusInProgress') }}
            </span>
            <span v-if="r.difficulty" class="m-tag" :class="difficultyTone(r.difficulty)">
              {{ $t('m.levelN', { n: r.difficulty }) }}
            </span>
            <span class="lv-files">
              <van-icon name="lock" :class="{ 'is-on': hasFile(r, 'archive') }" />
              <van-icon name="description-o" :class="{ 'is-on': hasFile(r, 'working') }" />
            </span>
          </div>
          <h3 class="lv-title">{{ r.system_info || r.contact_address || '—' }}</h3>
          <p class="lv-meta">
            <span>{{ r.manager_name || r.other_source || '—' }}</span>
            <b v-if="r.area != null" class="m-num">{{ formatNumber(r.area) }} m²</b>
          </p>
          <p v-if="r.contact_address && r.system_info" class="lv-addr">
            <van-icon name="location-o" /> {{ r.contact_address }}
          </p>
        </article>
      </van-list>
      <MEmpty
        v-else
        icon="cluster-o"
        :title="all.length ? $t('m.nothingFound') : $t('loyihaEmptyTitle')"
        :text="all.length ? '' : $t('loyihaEmptyDescription')"
      />
    </template>
  </MPage>
</template>

<style scoped>
.lv-search {
  padding: 0 12px 8px;
}

.lv-warn {
  display: flex;
  gap: 8px;
  margin: 12px 12px 0;
  padding: 10px 12px;
  border-radius: 10px;
  background: var(--m-warn-soft);
  color: var(--m-warn);
  font-size: 13px;
}

.lv-count {
  padding: 10px 16px 8px;
  font-size: 13px;
  color: var(--m-muted);
}

.lv-item__top {
  display: flex;
  align-items: center;
  gap: 6px;
}

.lv-id {
  font-size: 13px;
  font-weight: 700;
  color: var(--m-ink-2);
}

.lv-files {
  margin-left: auto;
  display: flex;
  gap: 6px;
  font-size: 15px;
  color: var(--m-line);
}

.lv-files .is-on {
  color: var(--m-primary);
}

.lv-title {
  margin-top: 8px;
  font-size: 16px;
  font-weight: 600;
  line-height: 1.3;
  overflow-wrap: anywhere;
}

.lv-meta {
  display: flex;
  justify-content: space-between;
  gap: 10px;
  margin-top: 6px;
  font-size: 14px;
  color: var(--m-ink-2);
}

.lv-addr {
  display: flex;
  gap: 4px;
  margin-top: 6px;
  font-size: 13px;
  color: var(--m-muted);
}
</style>
