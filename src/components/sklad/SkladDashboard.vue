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
      <el-button :icon="Plus" data-tour="sk-in" @click="openMove('in')">{{ $t('skBtnIn') }}</el-button>
      <el-button type="primary" :icon="Van" data-tour="sk-out" @click="openMove('out')">
        {{ $t('skBtnOut') }}
      </el-button>
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
          @open="openItem"
          @signal="tour.signal"
          @new-item="newItemOpen = true"
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
      :practice="practice"
      @practiced="tour.signal('sk:practice')"
    />
    <SkladItemDialog v-model="newItemOpen" :groups="store.groups.map((g) => g.name)" />
    <OnboardingTour :tour="tour" :badge="badge" />
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
import { periodLabel } from '@/utils/skladFormat'
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
    loadError.value = e?.response?.data?.message || t('skLoadError')
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
  tour.signal(`sk:tab-${name}`)
}

function showStock(status) {
  tab.value = 'stock'
  nextTick(() => stockRef.value?.setStatus(status))
}

function openItem(id) {
  itemId.value = id
  tour.signal('sk:open-item')
}

// Google Sheets rejimida (yoki yo'riqnoma mashqi paytida) dialog saqlamaydi
const practice = computed(
  () => store.mode !== 'live' || tour.current.value?.waitFor === 'sk:practice',
)

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

// ─── Gamifikatsiyalangan yo'riqnoma ──────────────────────────────────
const tour = useOnboarding('sklad')
const badge = computed(() => ({
  icon: '🏅',
  title: t('skTourBadgeTitle'),
  text: t('skTourBadgeText'),
}))

function buildSteps() {
  return [
    { id: 'welcome', icon: '👋', title: t('skTour1T'), body: t('skTour1B'), xp: 10 },
    { id: 'stats', target: '[data-tour="sk-stats"]', icon: '📊', title: t('skTour2T'), body: t('skTour2B'), xp: 10 },
    {
      id: 'search',
      target: '[data-tour="sk-search"]',
      icon: '🔎',
      title: t('skTour3T'),
      body: t('skTour3B'),
      task: t('skTour3Task'),
      waitFor: 'sk:search',
      xp: 20,
      onEnter: () => (tab.value = 'stock'),
    },
    {
      id: 'group',
      target: '[data-tour="sk-groups"]',
      icon: '🗂️',
      title: t('skTour4T'),
      body: t('skTour4B'),
      task: t('skTour4Task'),
      waitFor: 'sk:group',
      xp: 20,
      onEnter: () => (tab.value = 'stock'),
    },
    {
      id: 'open-item',
      target: '[data-tour="sk-table"]',
      icon: '📦',
      title: t('skTour5T'),
      body: t('skTour5B'),
      task: t('skTour5Task'),
      waitFor: 'sk:open-item',
      xp: 30,
      onEnter: () => (tab.value = 'stock'),
    },
    {
      id: 'item-card',
      target: '[data-tour="sk-item-card"]',
      icon: '🗂️',
      title: t('skTour5bT'),
      body: t('skTour5bB'),
      xp: 10,
    },
    {
      id: 'movements',
      target: '#tab-movements',
      icon: '🧾',
      title: t('skTour6T'),
      body: t('skTour6B'),
      task: t('skTour6Task'),
      waitFor: 'sk:tab-movements',
      xp: 20,
      onEnter: () => (itemId.value = null),
    },
    {
      id: 'practice',
      target: '[data-tour="sk-out"]',
      icon: '🚚',
      title: t('skTour7T'),
      body: t('skTour7B'),
      task: t('skTour7Task'),
      waitFor: 'sk:practice',
      xp: 50,
    },
    {
      id: 'analytics',
      target: '#tab-analytics',
      icon: '📈',
      title: t('skTour8T'),
      body: t('skTour8B'),
      task: t('skTour8Task'),
      waitFor: 'sk:tab-analytics',
      xp: 20,
      onEnter: () => (moveOpen.value = false),
    },
    { id: 'period', target: '[data-tour="sk-period"]', icon: '🗓️', title: t('skTour9T'), body: t('skTour9B'), xp: 10 },
    { id: 'learn', target: '[data-tour="onb-launch"]', icon: '🎓', title: t('skTour10T'), body: t('skTour10B'), xp: 10 },
  ]
}

onMounted(async () => {
  tour.setSteps(buildSteps())
  await load()
  // Birinchi kirishda yo'riqnoma o'zi boshlanadi
  if (tour.isFirstVisit.value) setTimeout(() => tour.start(true), 600)
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
  :deep(.el-tabs__header) {
    margin-bottom: 16px;
  }
  :deep(.el-tabs__item) {
    font-size: 14px;
    font-weight: 600;
    height: 44px;
  }
  :deep(.el-tab-pane) {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }
}
</style>
