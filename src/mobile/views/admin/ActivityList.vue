<script setup>
import { onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import activityApi from '@/api/activity'
import { actionLabel, actionMeta, describe, deviceText, moduleLabel } from '@/utils/activity'
import MEmpty from '../../components/MEmpty.vue'
import { smartDate } from '../../utils'

// Faoliyat jurnali: kim qachon nima qildi (saytdagi ActivityFeed'ning mobil ko'rinishi)
const props = defineProps({
  // Faqat bitta xodimning amallari (xodim kartasida)
  userId: { type: [Number, String], default: null },
  compact: { type: Boolean, default: false },
})
const { t, locale } = useI18n()

const PAGE = 30
const ACTIONS = ['login', 'create', 'update', 'delete', 'login_failed']
const rows = ref([])
const total = ref(0)
const loading = ref(false)
const listLoading = ref(false)
const finished = ref(false)
const search = ref('')
const action = ref('')

const params = (offset) => {
  const p = { limit: PAGE, offset }
  if (props.userId) p.user_id = props.userId
  if (action.value) p.action = action.value
  if (search.value.trim()) p.search = search.value.trim()
  return p
}

let seq = 0
async function reload() {
  const my = ++seq
  loading.value = true
  try {
    const res = await activityApi.list(params(0))
    if (my !== seq) return
    rows.value = res?.data || []
    total.value = res?.total || 0
    finished.value = rows.value.length >= total.value
  } catch {
    if (my === seq) finished.value = true
  } finally {
    if (my === seq) loading.value = false
  }
}
async function loadMore() {
  if (finished.value) return (listLoading.value = false)
  const my = seq
  try {
    const res = await activityApi.list(params(rows.value.length))
    if (my !== seq) return
    const seen = new Set(rows.value.map((r) => r.id))
    rows.value = rows.value.concat((res?.data || []).filter((r) => !seen.has(r.id)))
    total.value = res?.total ?? total.value
    finished.value = rows.value.length >= total.value
  } catch {
    finished.value = true
  } finally {
    listLoading.value = false
  }
}
onMounted(reload)
let timer = 0
watch(search, () => {
  clearTimeout(timer)
  timer = setTimeout(reload, 300)
})
watch(action, reload)

const who = (r) => (r.user ? `${r.user.firstname || ''} ${r.user.lastname || ''}`.trim() || r.user.username : '—')
defineExpose({ reload })
</script>

<template>
  <div class="al">
    <template v-if="!compact">
      <van-search v-model="search" shape="round" :placeholder="$t('m.search')" class="al-search" />
      <div class="m-chips">
        <button type="button" class="m-chip" :class="{ 'is-active': !action }" @click="action = ''">{{ $t('m.all') }}</button>
        <button
          v-for="a in ACTIONS"
          :key="a"
          type="button"
          class="m-chip"
          :class="{ 'is-active': action === a }"
          @click="action = action === a ? '' : a"
        >
          {{ actionLabel(t, a) }}
        </button>
      </div>
    </template>

    <div v-if="loading && !rows.length">
      <van-skeleton v-for="i in 4" :key="i" :row="2" class="m-card" />
    </div>
    <van-list
      v-else-if="rows.length"
      v-model:loading="listLoading"
      :finished="finished"
      :immediate-check="false"
      :offset="300"
      @load="loadMore"
    >
      <article v-for="r in rows" :key="r.id" class="m-card al-item">
        <span class="al-dot" :class="`is-${actionMeta(r.action).color}`"></span>
        <div class="al-main">
          <div class="al-top">
            <b v-if="!userId">{{ who(r) }}</b>
            <span class="al-time">{{ smartDate(r.createdAt, t, locale) }}</span>
          </div>
          <p class="al-text">{{ describe(t, r) }}</p>
          <small class="al-meta">
            {{ moduleLabel(t, r.module) }}<template v-if="r.user_agent"> · {{ deviceText(t, r) }}</template>
          </small>
        </div>
      </article>
    </van-list>
    <MEmpty v-else icon="records-o" :title="$t('m.nothingFound')" />
  </div>
</template>

<style scoped>
.al-search {
  padding: 4px 16px 0;
}
.al-item {
  display: flex;
  gap: 10px;
  align-items: flex-start;
}
.al-dot {
  flex-shrink: 0;
  width: 9px;
  height: 9px;
  margin-top: 6px;
  border-radius: 50%;
  background: var(--m-faint);
}
.al-dot.is-good { background: var(--m-good); }
.al-dot.is-bad { background: var(--m-bad); }
.al-dot.is-warn { background: var(--m-warn); }
.al-dot.is-link { background: var(--m-primary); }
.al-dot.is-violet { background: #7c5cff; }
.al-main {
  flex: 1;
  min-width: 0;
}
.al-top {
  display: flex;
  justify-content: space-between;
  gap: 8px;
  font-size: 14px;
  color: var(--m-ink);
}
.al-time {
  flex-shrink: 0;
  font-size: 12px;
  color: var(--m-muted);
}
.al-text {
  margin: 2px 0;
  font-size: 14px;
  color: var(--m-ink);
  word-break: break-word;
}
.al-meta {
  font-size: 12px;
  color: var(--m-muted);
}
</style>
