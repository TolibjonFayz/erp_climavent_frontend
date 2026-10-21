<template>
  <UiPage :title="$t('skTitle')" wide>
    <template #subtitle>
      <span class="sk-mode" :class="`is-${store.mode}`">
        {{ store.mode === 'live' ? $t('skModeLive') : $t('skModeMirror') }}
      </span>
      <span v-if="store.mode === 'mirror' && store.lastSyncedAt" class="sk-sub">
        {{ $t('skLastSync') }}: {{ formatDateTime(store.lastSyncedAt) }}
      </span>
    </template>

    <template #actions>
      <OnboardingLauncher :tour="tour" />
      <el-select
        v-model="period"
        class="sk-period"
        data-tour="sk-period"
        :aria-label="$t('skPeriod')"
        @change="onPeriodChange"
      >
        <el-option v-for="p in store.periods" :key="p" :label="periodLabel(p)" :value="p" />
      </el-select>
      <span class="sk-move-btns" data-tour="sk-move-btns">
        <el-button :icon="Plus" @click="openMove('in')">{{ $t('skBtnIn') }}</el-button>
        <el-button type="primary" :icon="Van" @click="openMove('out')">{{ $t('skBtnOut') }}</el-button>
      </span>
    </template>

    <el-alert
      v-if="store.mode === 'mirror'"
      type="info"
      show-icon
      :closable="false"
      :title="$t('skMirrorBanner')"
    />
    <el-alert v-if="loadError" type="error" show-icon :closable="false" :title="loadError" />

    <!-- Ko'rsatkichlar -->
    <div class="sk-stats" data-tour="sk-stats">
      <UiStat
        :label="$t('skStatItems')"
        :value="fmtNum(stats.items)"
        :sub="$t('skStatGroups', { n: store.groups.length })"
        clickable
        @click="showStock('')"
      />
      <UiStat :label="$t('skStatOpening')" :value="fmtNum(stats.opening)" :sub="$t('skUnitsHint')" />
      <UiStat
        :label="$t('skStatIn')"
        :value="fmtNum(stats.in)"
        :sub="$t('skStatMoved', { n: stats.inItems })"
        tone="good"
      />
      <UiStat
        :label="$t('skStatOut')"
        :value="fmtNum(stats.out)"
        :sub="$t('skStatMoved', { n: stats.outItems })"
      />
      <UiStat :label="$t('skStatReserve')" :value="fmtNum(stats.reserve)" :sub="$t('skStatReserveSub')" />
      <UiStat :label="$t('skStatClosing')" :value="fmtNum(stats.closing)" :sub="$t('skStatClosingSub')" />
      <UiStat
        :label="$t('skStatEmpty')"
        :value="fmtNum(stats.empty)"
        :sub="stats.negative ? $t('skStatNegative', { n: stats.negative }) : $t('skStatEmptySub')"
        :tone="stats.negative ? 'bad' : 'warn'"
        clickable
        @click="showStock('empty')"
      />
      <UiStat
        :label="$t('skStatLow')"
        :value="fmtNum(stats.low)"
        :sub="$t('skStatLowSub')"
        tone="warn"
        clickable
        @click="showStock('low')"
      />
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
  </UiPage>
</template>

<script setup>
import { computed, nextTick, onMounted, reactive, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { Plus, Van } from '@element-plus/icons-vue'
import UiPage from '@/components/ui/UiPage.vue'
import UiStat from '@/components/ui/UiStat.vue'
import OnboardingTour from '@/components/onboarding/OnboardingTour.vue'
import OnboardingLauncher from '@/components/onboarding/OnboardingLauncher.vue'
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
  tour.setSteps(buildSteps(), () => (itemId.value = null))
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
.sk-period {
  width: 150px;
}
.sk-move-btns {
  display: inline-flex;
  flex-wrap: wrap;
  gap: 8px;
  .el-button + .el-button {
    margin-left: 0;
  }
}
.sk-stats {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
}
@media (min-width: 1500px) {
  .sk-stats {
    grid-template-columns: repeat(8, minmax(0, 1fr));
  }
}
@media (max-width: 640px) {
  .sk-stats {
    grid-template-columns: repeat(2, minmax(0, 1fr));
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
  :deep(.el-tabs__item) {
    font-size: 16px;
    font-weight: 600;
    height: 48px;
    padding: 0 18px;
  }
  :deep(.el-tab-pane) {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }
}
</style>
