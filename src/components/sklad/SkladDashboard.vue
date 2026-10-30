<template>
  <UiPage :title="$t('skTitle')" wide class="sk-page">
    <template #subtitle>
      <!-- Rejim izohi katta banner emas — belgining o'zida (sichqoncha bilan yoki fokusda o'qiladi) -->
      <el-tooltip
        :content="store.mode === 'mirror' ? $t('skMirrorBanner') : $t('skModeLiveHint')"
        placement="bottom-start"
        :show-after="150"
      >
        <span class="sk-mode" :class="`is-${store.mode}`" tabindex="0">
          {{ store.mode === 'live' ? $t('skModeLive') : $t('skModeMirror') }}
          <el-icon class="sk-mode__info"><InfoFilled /></el-icon>
        </span>
      </el-tooltip>
      <span v-if="store.mode === 'mirror' && store.lastSyncedAt" class="sk-sub">
        {{ $t('skLastSync') }}: {{ formatDateTime(store.lastSyncedAt) }}
      </span>
    </template>

    <template #actions>
      <!-- Yordam (yo'riqnoma, test) — ikkinchi darajali; asosiy amallar: davr va kirim/chiqim -->
      <span class="sk-help">
        <OnboardingLauncher :tour="tour" />
        <!-- Test hammaga ko'rinadi (admin ham topshira oladi, unga majburiy emas) -->
        <el-button
          v-if="training"
          :type="training.passed ? 'success' : 'default'"
          :plain="training.passed"
          :icon="training.passed ? CircleCheck : EditPen"
          data-tour="sk-test"
          @click="quizOpen = true"
        >
          {{ training.passed ? $t('trPassedChip') : $t('trTestBtn') }}
        </el-button>
      </span>
      <span class="sk-main-actions">
        <el-select
          v-model="period"
          class="sk-period"
          data-tour="sk-period"
          :aria-label="$t('skPeriod')"
          @change="onPeriodChange"
        >
          <template #prefix><el-icon><Calendar /></el-icon></template>
          <el-option v-for="p in store.periods" :key="p" :label="periodLabel(p)" :value="p" />
        </el-select>
        <span class="sk-move-btns" data-tour="sk-move-btns">
          <el-button :icon="Plus" @click="openMove('in')">{{ $t('skBtnIn') }}</el-button>
          <el-button type="primary" :icon="Van" @click="openMove('out')">{{ $t('skBtnOut') }}</el-button>
        </span>
      </span>
    </template>

    <el-alert v-if="loadError" type="error" show-icon :closable="false" :title="loadError" />

    <!-- O'qitish: yo'riqnoma + test (o'tish 80%). O'tmaguncha eslatma doim turadi -->
    <div v-if="training && !training.passed && !isAdmin" class="sk-train">
      <span class="sk-train__icon">🎓</span>
      <div class="sk-train__text">
        <b>{{ training.tutorial_done_at ? $t('trBannerQuizTitle') : $t('trBannerTutorialTitle') }}</b>
        <span v-if="!training.tutorial_done_at">{{ $t('trBannerTutorialText') }}</span>
        <span v-else-if="training.attempts">
          {{ $t('trBannerRetryText', { n: training.attempts, best: training.best_score, p: training.pass_percent }) }}
        </span>
        <span v-else>{{ $t('trBannerQuizText', { p: training.pass_percent }) }}</span>
      </div>
      <el-button v-if="!training.tutorial_done_at" type="primary" size="large" @click="tour.start()">
        {{ $t('trStartTutorial') }}
      </el-button>
      <el-button v-else type="primary" size="large" @click="quizOpen = true">{{ $t('trStart') }}</el-button>
    </div>

    <!-- Ko'rsatkichlar: 4 ta asosiy raqam (keng — raqamlar kesilmaydi) -->
    <div class="sk-overview" data-tour="sk-stats">
      <div class="sk-stats">
        <UiStat
          :label="$t('skStatItems')"
          :value="fmtNum(stats.items)"
          :sub="$t('skStatGroups', { n: store.groups.length })"
          clickable
          @click="showStock('')"
        />
        <UiStat
          :label="$t('skStatClosing')"
          :value="fmtNum(stats.closing)"
          :sub="$t('skStatClosingSub2', { opening: fmtNum(stats.opening), reserve: fmtNum(stats.reserve) })"
        />
        <UiStat
          :label="$t('skStatIn')"
          tone="good"
          :value="`+${fmtNum(stats.in)}`"
          :sub="$t('skStatMoved', { n: stats.inItems })"
        />
        <UiStat
          :label="$t('skStatOut')"
          :value="`−${fmtNum(stats.out)}`"
          :sub="$t('skStatMoved', { n: stats.outItems })"
        />
      </div>

      <!-- Diqqat talab qiladiganlar — bosilsa ro'yxat shu holat bo'yicha filtrlanadi -->
      <div class="sk-attn" :class="{ 'is-ok': !attention.length }">
        <el-icon class="sk-attn__icon">
          <component :is="attention.length ? WarningFilled : CircleCheck" />
        </el-icon>
        <span class="sk-attn__label">{{ attention.length ? $t('skAttnTitle') : $t('skAttnOk') }}</span>
        <button
          v-for="a in attention"
          :key="a.status"
          type="button"
          class="sk-attn__chip"
          :class="`is-${a.status}`"
          @click="showStock(a.status)"
        >
          <b>{{ fmtNum(a.count) }}</b> {{ a.label }}
        </button>
      </div>
    </div>

    <el-tabs v-model="tab" class="sk-tabs" @tab-change="onTabChange">
      <el-tab-pane name="stock" :label="$t('skTabStock')">
        <SkladStock
          ref="stockRef"
          :items="store.items"
          :loading="loading"
          :mode="store.mode"
          :period="store.period"
          :is-admin="isAdmin"
          @open="openItem"
          @new-item="newItemOpen = true"
          @go-settings="showTab('admin')"
        />
      </el-tab-pane>
      <el-tab-pane name="movements" :label="$t('skTabMovements')">
        <SkladMovements v-if="visited.movements" :is-admin="isAdmin" @open="openItem" />
      </el-tab-pane>
      <el-tab-pane name="contracts" :label="$t('skTabContracts')">
        <SkladContracts v-if="visited.contracts" @open="openItem" />
      </el-tab-pane>
      <el-tab-pane name="analytics" :label="$t('skTabAnalytics')">
        <SkladAnalytics v-if="visited.analytics" :items="store.items" @open="openItem" />
      </el-tab-pane>
      <el-tab-pane v-if="isAdmin" name="admin" :label="$t('skTabAdmin')">
        <SkladAdmin v-if="visited.admin" />
      </el-tab-pane>
    </el-tabs>

    <SkladItemDrawer v-model="itemId" :report-row="itemRow" :is-admin="isAdmin" @move="openMoveForItem" />
    <SkladMoveDialog
      v-model="moveOpen"
      :type="moveType"
      :item-id="moveItemId"
      :practice="store.mode !== 'live'"
    />
    <SkladItemDialog v-model="newItemOpen" :groups="store.groups.map((g) => g.name)" />
    <OnboardingTour :tour="tour" />
    <TrainingQuiz
      v-model="quizOpen"
      module="sklad"
      :tutorial-done="!!training?.tutorial_done_at"
      :pass-percent="training?.pass_percent || 80"
      :per-attempt="training?.questions_per_attempt || 10"
      :topic-title="topicTitle"
      @finished="loadTraining"
      @reread="tour.start()"
    />
  </UiPage>
</template>

<script setup>
import { computed, nextTick, onMounted, reactive, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { Calendar, CircleCheck, EditPen, InfoFilled, Plus, Van, WarningFilled } from '@element-plus/icons-vue'
import UiPage from '@/components/ui/UiPage.vue'
import UiStat from '@/components/ui/UiStat.vue'
import OnboardingTour from '@/components/onboarding/OnboardingTour.vue'
import OnboardingLauncher from '@/components/onboarding/OnboardingLauncher.vue'
import TrainingQuiz from '@/components/onboarding/TrainingQuiz.vue'
import trainingApi from '@/api/training'
import { useOnboarding } from '@/composables/useOnboarding'
import { useSkladStore, stockStatus } from '@/stores/sklad'
import { useUsersStore } from '@/stores/user'
import { fmtNum, formatDateTime } from '@/utils/format'
import { apiError, periodLabel } from '@/utils/skladFormat'
import SkladStock from './SkladStock.vue'
import SkladMovements from './SkladMovements.vue'
import SkladContracts from './SkladContracts.vue'
import SkladAnalytics from './SkladAnalytics.vue'
import SkladAdmin from './SkladAdmin.vue'
import SkladItemDrawer from './SkladItemDrawer.vue'
import SkladMoveDialog from './SkladMoveDialog.vue'
import SkladItemDialog from './SkladItemDialog.vue'

const { t } = useI18n()
const store = useSkladStore()
const usersStore = useUsersStore()
const isAdmin = computed(() => !!usersStore.currentUser?.is_admin)

const period = ref('')
const loading = ref(false)
const loadError = ref('')
const tab = ref('stock')
const visited = reactive({ stock: true })
const stockRef = ref(null)

const itemId = ref(null)
const moveOpen = ref(false)
const moveType = ref('out')
const moveItemId = ref(null)
const newItemOpen = ref(false)

const itemRow = computed(() => store.items.find((i) => i.id === itemId.value) || null)

const stats = computed(() => {
  const s = { items: 0, opening: 0, in: 0, out: 0, reserve: 0, closing: 0, empty: 0, negative: 0, low: 0, inItems: 0, outItems: 0 }
  for (const it of store.items) {
    s.items++
    s.opening += it.opening
    s.in += it.in
    s.out += it.out
    s.reserve += it.reserve - it.release
    s.closing += it.closing
    if (it.in) s.inItems++
    if (it.out) s.outItems++
    const st = stockStatus(it)
    if (st === 'empty' || st === 'negative') s.empty++
    if (st === 'negative') s.negative++
    if (st === 'low') s.low++
  }
  return s
})

// Diqqat qatori: faqat noldan katta holatlar (tugagan, minusda, kam qolgan)
const attention = computed(() =>
  [
    { status: 'empty', count: stats.value.empty - stats.value.negative, label: t('skSt_empty') },
    { status: 'negative', count: stats.value.negative, label: t('skSt_negative') },
    { status: 'low', count: stats.value.low, label: t('skSt_low') },
  ].filter((a) => a.count > 0),
)

async function load(p) {
  loading.value = true
  loadError.value = ''
  try {
    await store.loadReport(p)
    period.value = store.period
  } catch (e) {
    loadError.value = apiError(e, 'skLoadError')
  } finally {
    loading.value = false
  }
}

function onPeriodChange(p) {
  store.movementsPeriod = ''
  load(p)
}

function onTabChange(name) {
  visited[name] = true
}

function showTab(name) {
  visited[name] = true
  tab.value = name
}

function showStock(status) {
  tab.value = 'stock'
  nextTick(() => stockRef.value?.setStatus(status))
}

function openItem(id) {
  itemId.value = id
}

function openMove(type) {
  moveType.value = type
  moveItemId.value = null
  moveOpen.value = true
}

function openMoveForItem({ type, itemId: id }) {
  moveType.value = type
  moveItemId.value = id
  moveOpen.value = true
}

// ─── O'qitish: yo'riqnoma oxirigacha ko'rilgach — test ───────────────
const training = ref(null)
const quizOpen = ref(false)

async function loadTraining() {
  try {
    training.value = await trainingApi.status('sklad')
  } catch {
    training.value = null // o'qitish moduli ishlamasa, ombor baribir ishlaydi
  }
}

async function onTutorialDone({ steps, durationSec }) {
  try {
    training.value = await trainingApi.tutorialDone('sklad', { steps, duration_sec: durationSec })
  } catch {
    return
  }
  // Hali o'tmagan bo'lsa — darhol testni taklif qilamiz
  if (!training.value?.passed) quizOpen.value = true
}

// Yiqilganda "qayta o'qing" ro'yxati — yo'riqnoma qadamlari nomlari bilan
const topicTitle = (topic) => tour.state.steps.find((s) => s.id === topic)?.title || topic

// ─── Yo'riqnoma ──────────────────────────────────────────────────────
// Har qadam kerakli tab/kartani o'zi ochadi — "Orqaga" bosilganda ham holat to'g'ri bo'ladi
const tour = useOnboarding('sklad')

function onStock() {
  itemId.value = null
  showTab('stock')
}

function buildSteps() {
  const step = (id, target, n, onEnter = onStock) => ({
    id,
    target,
    title: t(`skTour${n}T`),
    body: t(`skTour${n}B`),
    onEnter,
  })
  return [
    step('welcome', null, 1),
    step('stats', '[data-tour="sk-stats"]', 2),
    step('search', '[data-tour="sk-search"]', 3),
    step('groups', '[data-tour="sk-groups"]', 4),
    step('table', '[data-tour="sk-table"]', 5),
    step('item-card', '[data-tour="sk-item-card"]', 6, () => {
      showTab('stock')
      // Harakati bor birinchi mahsulot kartasini namunaga ochamiz
      const sample = store.items.find((i) => i.in || i.out) || store.items[0]
      itemId.value = sample?.id ?? null
    }),
    {
      ...step('move', '[data-tour="sk-move-btns"]', 7),
      // Matn rejimga bog'liq: Google Sheets rejimida tugmalar hech narsa saqlamaydi
      get body() {
        return t(store.mode === 'live' ? 'skTour7BLive' : 'skTour7B')
      },
    },
    step('movements', '#tab-movements', 8, () => {
      itemId.value = null
      showTab('movements')
    }),
    step('contracts', '#tab-contracts', 9, () => showTab('contracts')),
    step('analytics', '#tab-analytics', 10, () => showTab('analytics')),
    step('period', '[data-tour="sk-period"]', 11, () => {}),
    step('guide', '[data-tour="onb-launch"]', 12, () => {}),
  ]
}

onMounted(async () => {
  tour.setSteps(buildSteps(), () => (itemId.value = null), onTutorialDone)
  loadTraining()
  await load()
  // Birinchi kirishda yo'riqnoma o'zi ochiladi; keyin — "Yo'riqnoma" tugmasi orqali
  if (!tour.state.seen) setTimeout(() => tour.start(), 600)
})
</script>

<style scoped lang="scss">
.sk-mode {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 2px 8px;
  border-radius: 99px;
  font-size: 12px;
  font-weight: 600;
  &::before {
    content: '';
    width: 7px;
    height: 7px;
    border-radius: 50%;
  }
  &.is-mirror {
    background: var(--ui-link-soft);
    color: var(--ui-link);
    &::before {
      background: var(--ui-link);
    }
  }
  &.is-live {
    background: var(--ui-good-soft);
    color: var(--ui-good);
    &::before {
      background: var(--ui-good);
    }
  }
}
.sk-sub {
  margin-left: 10px;
}
/* Sarlavha qatori: tugmalar ko'p — avval izoh qatori torayadi, keyingina tugmalar pastga tushadi */
.sk-page :deep(.ui-page__title) {
  flex: 1 1 240px;
}
.sk-page :deep(.ui-page__actions) {
  margin-left: auto;
}
/* Ombordan yoshi katta xodimlar foydalanadi: filtr nomlari KATTA HARFSIZ va yiriroq */
.sk-page :deep(.ui-field__label) {
  font-size: 13px;
  text-transform: none;
  letter-spacing: 0;
  color: var(--ui-ink-2);
}
.sk-mode {
  cursor: help;
}
.sk-mode__info {
  font-size: 12px;
  opacity: 0.75;
}
.sk-help,
.sk-main-actions {
  display: inline-flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  .el-button + .el-button {
    margin-left: 0;
  }
}
.sk-help {
  padding-right: 12px;
  border-right: 1px solid var(--ui-line);
}
.sk-train {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 12px 16px;
  padding: 12px 16px;
  border: 1px solid var(--ui-warn-line);
  border-radius: var(--ui-radius);
  background: var(--ui-warn-soft);
}
.sk-train__icon {
  font-size: 24px;
}
.sk-train__text {
  display: flex;
  flex-direction: column;
  gap: 2px;
  flex: 1 1 320px;
  font-size: 15px;
  line-height: 1.45;
  color: var(--ui-ink-2);
  b {
    font-size: 16px;
    color: var(--ui-ink);
  }
}
.sk-period {
  width: 170px;
}
.sk-move-btns {
  display: inline-flex;
  flex-wrap: wrap;
  gap: 8px;
  .el-button + .el-button {
    margin-left: 0;
  }
}
.sk-overview {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.sk-stats {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
}
.sk-attn {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px 10px;
  padding: 10px 14px;
  border: 1px solid var(--ui-bad-line);
  border-radius: var(--ui-radius);
  background: var(--ui-bad-soft);
  font-size: 14px;
  &.is-ok {
    border-color: var(--ui-good-line);
    background: var(--ui-good-soft);
  }
}
.sk-attn__icon {
  font-size: 18px;
  color: var(--ui-bad);
  .is-ok & {
    color: var(--ui-good);
  }
}
.sk-attn__label {
  margin-right: 4px;
  font-weight: 600;
  color: var(--ui-ink);
}
.sk-attn__chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  min-height: 32px;
  padding: 4px 12px;
  border: 1px solid var(--ui-line);
  border-radius: 99px;
  background: var(--ui-surface);
  color: var(--ui-ink-2);
  font: inherit;
  font-size: 14px;
  cursor: pointer;
  b {
    font-variant-numeric: tabular-nums;
  }
  &.is-empty b,
  &.is-negative b {
    color: var(--ui-bad);
  }
  &.is-low b {
    color: var(--ui-warn);
  }
  &:hover {
    border-color: var(--ui-link-line);
    color: var(--ui-ink);
  }
  &:focus-visible {
    outline: 3px solid var(--ui-link-line);
    outline-offset: 2px;
  }
}
@media (max-width: 900px) {
  .sk-stats {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
  .sk-help {
    padding-right: 0;
    border-right: 0;
  }
}
.sk-tabs {
  /* Filtr paneli tab ichida "sticky" bo'lishi uchun (Element Plus bu yerda overflow:hidden qo'yadi) */
  :deep(.el-tabs__content) {
    overflow: visible;
  }
  :deep(.el-tabs__header) {
    margin-bottom: 16px;
  }
  :deep(.el-tabs__nav-wrap::after) {
    height: 1px;
    background: var(--ui-line);
  }
  :deep(.el-tabs__item) {
    font-size: 15px;
    font-weight: 600;
    height: 44px;
    padding: 0 16px;
    color: var(--ui-muted);
  }
  :deep(.el-tabs__item.is-active) {
    color: var(--ui-link);
  }
  :deep(.el-tab-pane) {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }
}
</style>
