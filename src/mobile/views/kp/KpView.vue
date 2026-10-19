<script setup>
import { computed, onActivated, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { showConfirmDialog, showFailToast, showSuccessToast, showToast } from 'vant'
import { useKPsStore } from '@/stores/kp'
import { formatDate } from '@/utils/format'
import { KP_COMMENT_FILTER_OPTIONS, commentMatchesFilter } from '@/constants/kpComments'
import MPage from '../../components/MPage.vue'
import MStats from '../../components/MStats.vue'
import MEmpty from '../../components/MEmpty.vue'
import MSheet from '../../components/MSheet.vue'
import MSelectSheet from '../../components/MSelectSheet.vue'
import { useSession } from '../../session'
import { KP_STATUSES, canModifyDoc, statusOf } from '../../docRules'
import { errorText, includesText, money, moneyShort } from '../../utils'

const { t, locale } = useI18n()
const router = useRouter()
const kpStore = useKPsStore()
const { user, isAdmin } = useSession()

const loaded = ref(false)
async function load() {
  try {
    await kpStore.getAllKPs()
  } catch (e) {
    showFailToast(errorText(e, t, locale.value))
  } finally {
    loaded.value = true
  }
}
onMounted(load)
onActivated(() => loaded.value && load())

const all = computed(() => kpStore.allKPs || [])
const statusOfRow = (kp) => kp.kp_status || kp.status

// ─── Filtrlar ───
const search = ref('')
const status = ref('')
const comment = ref('')
const commentSheet = ref(false)

const filtered = computed(() => {
  const q = search.value.trim()
  return all.value.filter(
    (kp) =>
      (!status.value || statusOfRow(kp) === status.value) &&
      commentMatchesFilter(kp.comment, comment.value) &&
      (!q ||
        [kp.client_name, kp.manager_name, kp.kp_number, kp.comment].some((v) =>
          includesText(v, q),
        )),
  )
})

const PAGE = 40
const shown = ref(PAGE)
const listLoading = ref(false)
const finished = computed(() => shown.value >= filtered.value.length)
const rows = computed(() => filtered.value.slice(0, shown.value))
watch([search, status, comment], () => (shown.value = PAGE))
function onLoadMore() {
  shown.value += PAGE
  listLoading.value = false
}

// ─── Ko'rsatkichlar (bosilsa — holat filtri) ───
const sumOf = (list) => list.reduce((acc, kp) => acc + (Number(kp.kp_sum) || 0), 0)
const stats = computed(() => [
  {
    key: 'all',
    label: t('kpStatTotal'),
    value: all.value.length,
    sub: moneyShort(sumOf(all.value), t),
    active: !status.value,
    onClick: () => (status.value = ''),
  },
  ...KP_STATUSES.map((s) => {
    const list = all.value.filter((kp) => statusOfRow(kp) === s.value)
    return {
      key: s.value,
      label: t(s.labelKey),
      value: list.length,
      sub: moneyShort(sumOf(list), t),
      tone: s.value === 'Closed' ? 'good' : s.value === 'Negotiation' ? 'warn' : '',
      active: status.value === s.value,
      onClick: () => (status.value = status.value === s.value ? '' : s.value),
    }
  }),
])

const commentOptions = computed(() => [
  { value: '', label: t('kpAllComments') },
  ...KP_COMMENT_FILTER_OPTIONS.map((c) => ({ value: c, label: c })),
])

const canModify = (kp) => canModifyDoc(kp, user.value)

// ─── Batafsil ───
const detail = ref(null)
const detailOpen = computed({
  get: () => !!detail.value,
  set: (v) => !v && (detail.value = null),
})

async function remove(kp) {
  try {
    await showConfirmDialog({
      message: t('kpDeleteConfirm'),
      confirmButtonText: t('deleteConfirm'),
      cancelButtonText: t('cancel'),
    })
  } catch {
    return
  }
  try {
    await kpStore.deleteKP(kp.id)
    showSuccessToast(t('kpMessageDeleted'))
    detail.value = null
    await load()
  } catch (e) {
    showFailToast(errorText(e, t, locale.value))
  }
}

function edit(kp) {
  detail.value = null
  router.push({ name: 'kp-edit', params: { id: kp.id } })
}

// ─── Excel import ───
const fileInput = ref(null)
const importing = ref(false)
async function onImport(e) {
  const file = e.target.files?.[0]
  e.target.value = ''
  if (!file) return
  importing.value = true
  try {
    const res = await kpStore.importKPs(file)
    await kpStore.getAllKPs()
    showToast({
      message: t('kpImportSummary', {
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
  <MPage :title="$t('kp')" :back="{ name: 'more' }" :on-refresh="load">
    <template #right>
      <button type="button" class="m-head__btn" :disabled="importing" @click="fileInput?.click()">
        <van-loading v-if="importing" size="18" />
        <van-icon v-else name="upgrade" />
      </button>
      <button type="button" class="m-head__btn" @click="router.push({ name: 'kp-new' })">
        <van-icon name="plus" />
      </button>
      <input ref="fileInput" type="file" accept=".xlsx,.xls" hidden @change="onImport" />
    </template>
    <template #header>
      <van-search v-model="search" shape="round" :placeholder="$t('m.searchKp')" class="kv-search" />
      <div class="m-chips">
        <button
          type="button"
          class="m-chip"
          :class="{ 'is-active': !!comment }"
          @click="commentSheet = true"
        >
          <van-icon name="comment-o" />
          <span class="kv-chip-text">{{ comment || $t('kpAllComments') }}</span>
        </button>
      </div>
    </template>

    <p class="kv-scope">{{ isAdmin ? $t('kpPageSubtitle') : $t('kpPageSubtitleOwn') }}</p>
    <MStats :items="stats" />

    <div v-if="!loaded">
      <van-skeleton v-for="i in 5" :key="i" :row="3" class="m-card" />
    </div>
    <template v-else>
      <p v-if="filtered.length" class="kv-count">{{ $t('m.foundCount', { n: filtered.length }) }}</p>
      <van-list
        v-if="filtered.length"
        v-model:loading="listLoading"
        :finished="finished"
        :immediate-check="false"
        :offset="400"
        @load="onLoadMore"
      >
        <article v-for="kp in rows" :key="kp.id" class="m-card is-tappable kv-item" @click="detail = kp">
          <div class="kv-item__top">
            <span class="kv-num m-num">№ {{ kp.kp_number ?? '—' }}</span>
            <span class="m-tag" :class="statusOf(KP_STATUSES, statusOfRow(kp))?.tone">
              {{ $t(statusOf(KP_STATUSES, statusOfRow(kp))?.labelKey || 'kpStatusOpen') }}
            </span>
            <van-icon v-if="!canModify(kp)" name="lock" class="kv-lock" />
            <span class="kv-date m-num">{{ formatDate(kp.kp_date) }}</span>
          </div>
          <h3 class="kv-client">{{ kp.client_name || '—' }}</h3>
          <div class="kv-meta">
            <span>{{ kp.manager_name || '—' }}</span>
            <b class="m-num">{{ money(kp.kp_sum, t) }}</b>
          </div>
          <p v-if="kp.comment" class="kv-comment">{{ kp.comment }}</p>
        </article>
      </van-list>
      <MEmpty
        v-else
        icon="description-o"
        :title="all.length ? $t('m.nothingFound') : $t('kpEmptyTitle')"
        :text="all.length ? $t('kpNoMatchDescription') : $t('kpEmptyDescription')"
      >
        <van-button v-if="!all.length" type="primary" round class="kv-empty-btn" @click="router.push({ name: 'kp-new' })">
          {{ $t('kpEmptyAction') }}
        </van-button>
      </MEmpty>
    </template>

    <!-- Batafsil -->
    <MSheet v-model="detailOpen" :title="detail ? `KP № ${detail.kp_number ?? '—'}` : ''">
      <template v-if="detail">
        <van-cell-group inset>
          <van-cell :title="$t('kpStatusLabel')">
            <template #value>
              <span class="m-tag" :class="statusOf(KP_STATUSES, statusOfRow(detail))?.tone">
                {{ $t(statusOf(KP_STATUSES, statusOfRow(detail))?.labelKey || 'kpStatusOpen') }}
              </span>
            </template>
          </van-cell>
          <van-cell :title="$t('kpClientLabel')" :value="detail.client_name || '—'" />
          <van-cell :title="$t('kpManagerLabel')" :value="detail.manager_name || '—'" />
          <van-cell :title="$t('kpSumLabel')" :value="money(detail.kp_sum, t)" value-class="m-num" />
          <van-cell :title="$t('kpDateLabel')" :value="formatDate(detail.kp_date)" value-class="m-num" />
          <van-cell :title="$t('kpNextDateLabel')" :value="formatDate(detail.dogovor_next)" value-class="m-num" />
          <van-cell :title="$t('kpClosedDateLabel')" :value="formatDate(detail.closed_date)" value-class="m-num" />
        </van-cell-group>
        <div v-if="detail.comment" class="m-section"><span class="m-section__title">{{ $t('kpCommentLabel') }}</span></div>
        <p v-if="detail.comment" class="m-card kv-text">{{ detail.comment }}</p>
        <template v-if="isAdmin && detail.admin_comment">
          <div class="m-section"><span class="m-section__title">{{ $t('kpAdminCommentLabel') }}</span></div>
          <p class="m-card kv-text is-admin">{{ detail.admin_comment }}</p>
        </template>
        <p v-if="!canModify(detail)" class="kv-locked">
          <van-icon name="lock" /> {{ $t('m.docLocked') }}
        </p>
      </template>
      <template v-if="detail && canModify(detail)" #footer>
        <van-button plain type="danger" icon="delete-o" @click="remove(detail)">{{ $t('deleteConfirm') }}</van-button>
        <van-button type="primary" icon="edit" @click="edit(detail)">{{ $t('edit') }}</van-button>
      </template>
    </MSheet>

    <MSelectSheet
      v-model="commentSheet"
      :title="$t('kpCommentLabel')"
      :options="commentOptions"
      :selected="comment"
      searchable
      @select="(v) => (comment = v)"
    />
  </MPage>
</template>

<style scoped>
.kv-search {
  padding: 0 12px 8px;
}

.kv-chip-text {
  max-width: 260px;
  overflow: hidden;
  text-overflow: ellipsis;
}

.kv-scope {
  padding: 12px 16px 0;
  font-size: 12px;
  color: var(--m-muted);
  line-height: 1.4;
}

.kv-count {
  padding: 10px 16px 8px;
  font-size: 13px;
  color: var(--m-muted);
}

.kv-item__top {
  display: flex;
  align-items: center;
  gap: 8px;
}

.kv-num {
  font-size: 13px;
  font-weight: 700;
  color: var(--m-ink-2);
}

.kv-lock {
  color: var(--m-faint);
}

.kv-date {
  margin-left: auto;
  font-size: 12px;
  color: var(--m-muted);
}

.kv-client {
  margin-top: 8px;
  font-size: 16px;
  font-weight: 600;
  line-height: 1.3;
  overflow-wrap: anywhere;
}

.kv-meta {
  display: flex;
  justify-content: space-between;
  gap: 10px;
  margin-top: 6px;
  font-size: 14px;
  color: var(--m-ink-2);
}

.kv-meta b {
  white-space: nowrap;
  color: var(--m-ink);
}

.kv-comment {
  margin-top: 8px;
  padding-top: 8px;
  border-top: 1px solid var(--m-line-soft);
  font-size: 13px;
  color: var(--m-muted);
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.kv-text {
  font-size: 14px;
  line-height: 1.5;
  white-space: pre-wrap;
}

.kv-text.is-admin {
  background: var(--m-warn-soft);
  color: var(--m-warn);
}

.kv-locked {
  display: flex;
  align-items: center;
  gap: 6px;
  margin: 14px 16px 0;
  font-size: 13px;
  color: var(--m-muted);
}

.kv-empty-btn {
  margin-top: 16px;
}
</style>
