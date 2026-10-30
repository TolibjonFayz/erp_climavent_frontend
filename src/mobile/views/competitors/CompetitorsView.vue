<script setup>
import { computed, onActivated, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { showConfirmDialog, showFailToast, showSuccessToast } from 'vant'
import competitorsApi from '@/api/competitors'
import { formatDate } from '@/utils/format'
import { OUTCOMES, outcomeOf, winRate } from '@/components/competitors/competitorFormat'
import MPage from '../../components/MPage.vue'
import MStats from '../../components/MStats.vue'
import MEmpty from '../../components/MEmpty.vue'
import MSheet from '../../components/MSheet.vue'
import { showActionSheet } from '../../actionSheet'
import { useSession } from '../../session'
import { errorText, includesText, money } from '../../utils'

// Raqiblar (mobil): saytdagi bo'lim bilan bir xil API va qoidalar — katalog umumiy,
// uchrashuvlarni kiritgan xodim va admin ko'radi/o'zgartiradi
const { t, locale } = useI18n()
const router = useRouter()
const { user, isAdmin } = useSession()

const loaded = ref(false)
const competitors = ref([])
const encounters = ref([])

async function load() {
  try {
    const [list, enc] = await Promise.all([competitorsApi.list(), competitorsApi.encounters()])
    competitors.value = list || []
    encounters.value = enc || []
  } catch (e) {
    showFailToast(errorText(e, t, locale.value))
  } finally {
    loaded.value = true
  }
}
onMounted(load)
// Forma sahifasidan qaytganda yangilanadi
onActivated(() => loaded.value && load())

// ─── Bo'limlar va filtr ───
const tab = ref('encounters')
const search = ref('')
const outcome = ref('')

const totals = computed(() =>
  competitors.value.reduce(
    (s, c) => ({
      total: s.total + c.stats.total,
      won: s.won + c.stats.won,
      lost: s.lost + c.stats.lost,
    }),
    { total: 0, won: 0, lost: 0 },
  ),
)
const rate = computed(() => winRate(totals.value))

const stats = computed(() => [
  {
    key: 'all',
    label: t('cmpStatEncounters'),
    value: totals.value.total,
    active: tab.value === 'encounters' && !outcome.value,
    onClick: () => setOutcome(''),
  },
  {
    key: 'rate',
    label: t('cmpStatWinRate'),
    value: rate.value === null ? '—' : `${rate.value}%`,
    tone: rate.value === null ? '' : rate.value >= 50 ? 'good' : 'bad',
  },
  {
    key: 'won',
    label: t('cmpOutcome_won'),
    value: totals.value.won,
    tone: 'good',
    active: outcome.value === 'won',
    onClick: () => setOutcome('won'),
  },
  {
    key: 'lost',
    label: t('cmpOutcome_lost'),
    value: totals.value.lost,
    tone: 'bad',
    active: outcome.value === 'lost',
    onClick: () => setOutcome('lost'),
  },
])

function setOutcome(v) {
  tab.value = 'encounters'
  outcome.value = outcome.value === v ? '' : v
}

const filteredCompetitors = computed(() =>
  competitors.value.filter((c) => includesText(`${c.name} ${c.brands || ''}`, search.value)),
)
const filteredEncounters = computed(() =>
  encounters.value.filter(
    (e) =>
      (!outcome.value || e.outcome === outcome.value) &&
      includesText(
        `${e.competitor?.name || ''} ${e.partner?.fullname || e.client_name || ''} ${e.kp_number || ''} ${e.note || ''}`,
        search.value,
      ),
  ),
)

const clientOf = (e) => e.partner?.fullname || e.client_name || '—'
const gapOf = (e) =>
  e.their_price != null && e.our_price != null && Number(e.our_price) > 0
    ? Math.round(((Number(e.our_price) - Number(e.their_price)) / Number(e.our_price)) * 100)
    : null
const canModify = (e) => isAdmin.value || Number(e.created_by) === Number(user.value?.id)
const canEditCompetitor = (c) => isAdmin.value || Number(c.created_by) === Number(user.value?.id)

// ─── Qo'shish menyusi ───
function openAddMenu() {
  showActionSheet({
    actions: [
      { name: t('cmpEncAdd'), key: 'enc', disabled: !competitors.value.length },
      { name: t('cmpAdd'), key: 'comp' },
    ],
    cancelText: t('cancel'),
  })
    .then((a) =>
      router.push(a.key === 'comp' ? { name: 'competitor-new' } : { name: 'encounter-new' }),
    )
    .catch(() => {})
}

// ─── Tafsilotlar ───
const competitor = ref(null)
const competitorOpen = computed({
  get: () => !!competitor.value,
  set: (v) => !v && (competitor.value = null),
})
const encounter = ref(null)
const encounterOpen = computed({
  get: () => !!encounter.value,
  set: (v) => !v && (encounter.value = null),
})
const competitorEncounters = computed(() =>
  competitor.value ? encounters.value.filter((e) => e.competitor_id === competitor.value.id) : [],
)

function go(to) {
  competitor.value = null
  encounter.value = null
  router.push(to)
}

async function removeEncounter(e) {
  try {
    await showConfirmDialog({
      message: t('cmpDeleteEncConfirm'),
      confirmButtonText: t('deleteConfirm'),
      cancelButtonText: t('cancel'),
    })
  } catch {
    return
  }
  try {
    await competitorsApi.removeEncounter(e.id)
    showSuccessToast(t('cmpSaved'))
    encounter.value = null
    await load()
  } catch (err) {
    showFailToast(errorText(err, t, locale.value))
  }
}
</script>

<template>
  <MPage :title="$t('raqib')" :back="{ name: 'more' }" :on-refresh="load">
    <template #right>
      <button type="button" class="m-head__btn" :aria-label="$t('m.add')" @click="openAddMenu">
        <van-icon name="plus" />
      </button>
    </template>
    <template #header>
      <van-search v-model="search" shape="round" :placeholder="$t('m.search')" class="cv-search" />
      <div class="cv-seg">
        <button type="button" :class="{ 'is-active': tab === 'encounters' }" @click="tab = 'encounters'">
          {{ $t('cmpTabEncounters') }} · {{ filteredEncounters.length }}
        </button>
        <button type="button" :class="{ 'is-active': tab === 'list' }" @click="tab = 'list'">
          {{ $t('cmpTabCompetitors') }} · {{ filteredCompetitors.length }}
        </button>
      </div>
    </template>

    <MStats :items="stats" />

    <div v-if="!loaded">
      <van-skeleton v-for="i in 4" :key="i" :row="3" class="m-card" />
    </div>

    <!-- Uchrashuvlar -->
    <template v-else-if="tab === 'encounters'">
      <article
        v-for="e in filteredEncounters"
        :key="e.id"
        class="m-card is-tappable cv-item"
        @click="encounter = e"
      >
        <div class="cv-item__top">
          <span class="m-tag" :class="`is-${outcomeOf(e.outcome).tag === 'success' ? 'good' : outcomeOf(e.outcome).tag === 'danger' ? 'bad' : 'warn'}`">
            {{ $t(outcomeOf(e.outcome).labelKey) }}
          </span>
          <span v-if="e.reason" class="cv-reason">{{ $t(`cmpReason_${e.reason}`) }}</span>
          <span class="cv-date m-num">{{ formatDate(e.encounter_date) }}</span>
        </div>
        <h3 class="cv-title">{{ e.competitor?.name || '—' }}</h3>
        <div class="cv-meta">
          <span>{{ clientOf(e) }}</span>
          <b v-if="gapOf(e) !== null" class="m-num" :class="gapOf(e) > 0 ? 'is-bad' : 'is-good'">
            {{ gapOf(e) > 0 ? '+' : '' }}{{ gapOf(e) }}%
          </b>
        </div>
      </article>
      <MEmpty
        v-if="!filteredEncounters.length"
        icon="flag-o"
        :title="encounters.length ? $t('m.nothingFound') : $t('cmpNoEncounters')"
        :text="competitors.length ? '' : $t('cmpEmpty')"
      >
        <van-button
          type="primary"
          round
          class="cv-empty-btn"
          @click="router.push(competitors.length ? { name: 'encounter-new' } : { name: 'competitor-new' })"
        >
          {{ competitors.length ? $t('cmpEncAdd') : $t('cmpAdd') }}
        </van-button>
      </MEmpty>
    </template>

    <!-- Raqiblar katalogi -->
    <template v-else>
      <article
        v-for="c in filteredCompetitors"
        :key="c.id"
        class="m-card is-tappable cv-item"
        @click="competitor = c"
      >
        <h3 class="cv-title">{{ c.name }}</h3>
        <p v-if="c.brands" class="cv-sub">{{ c.brands }}</p>
        <div class="cv-meta">
          <span>
            {{ $t('cmpStatEncounters') }}: <b class="m-num">{{ c.stats.total }}</b> ·
            <span class="is-good m-num">{{ c.stats.won }}</span> /
            <span class="is-bad m-num">{{ c.stats.lost }}</span>
          </span>
          <b
            v-if="c.stats.avg_price_gap_pct !== null"
            class="m-num"
            :class="c.stats.avg_price_gap_pct > 0 ? 'is-bad' : 'is-good'"
          >
            {{ c.stats.avg_price_gap_pct > 0 ? '+' : '' }}{{ c.stats.avg_price_gap_pct }}%
          </b>
        </div>
      </article>
      <MEmpty v-if="!filteredCompetitors.length" icon="shield-o" :title="competitors.length ? $t('m.nothingFound') : $t('cmpEmpty')">
        <van-button type="primary" round class="cv-empty-btn" @click="router.push({ name: 'competitor-new' })">
          {{ $t('cmpAdd') }}
        </van-button>
      </MEmpty>
    </template>

    <!-- Uchrashuv tafsiloti -->
    <MSheet v-model="encounterOpen" :title="encounter?.competitor?.name || ''">
      <template v-if="encounter">
        <van-cell-group inset>
          <van-cell :title="$t('cmpOutcome')">
            <template #value>
              <span class="m-tag" :class="`is-${outcomeOf(encounter.outcome).tag === 'success' ? 'good' : outcomeOf(encounter.outcome).tag === 'danger' ? 'bad' : 'warn'}`">
                {{ $t(outcomeOf(encounter.outcome).labelKey) }}
              </span>
            </template>
          </van-cell>
          <van-cell v-if="encounter.reason" :title="$t('cmpReason')" :value="$t(`cmpReason_${encounter.reason}`)" />
          <van-cell :title="$t('cmpDate')" :value="formatDate(encounter.encounter_date)" value-class="m-num" />
          <van-cell
            :title="$t('cmpClient')"
            :value="clientOf(encounter)"
            :is-link="!!encounter.partner"
            @click="encounter.partner && go({ name: 'customer-detail', params: { id: encounter.partner.id } })"
          />
          <van-cell v-if="encounter.kp_number" :title="$t('cmpKpNumber')" :value="`№${encounter.kp_number}`" value-class="m-num" />
          <van-cell :title="$t('cmpTheirPrice')" :value="money(encounter.their_price, t)" value-class="m-num" />
          <van-cell :title="$t('cmpOurPrice')" :value="money(encounter.our_price, t)" value-class="m-num" />
        </van-cell-group>
        <p v-if="encounter.note" class="m-card cv-text">{{ encounter.note }}</p>
        <p v-if="isAdmin && encounter.creator" class="cv-author">
          {{ $t('cmpAuthor') }}: {{ encounter.creator.firstname }} {{ encounter.creator.lastname || '' }}
        </p>
      </template>
      <template v-if="encounter && canModify(encounter)" #footer>
        <van-button plain type="danger" icon="delete-o" @click="removeEncounter(encounter)">{{ $t('deleteConfirm') }}</van-button>
        <van-button type="primary" icon="edit" @click="go({ name: 'encounter-edit', params: { id: encounter.id } })">
          {{ $t('edit') }}
        </van-button>
      </template>
    </MSheet>

    <!-- Raqib tafsiloti -->
    <MSheet v-model="competitorOpen" :title="competitor?.name || ''">
      <template v-if="competitor">
        <van-cell-group inset>
          <van-cell v-if="competitor.brands" :title="$t('cmpBrands')" :label="competitor.brands" />
          <van-cell v-if="competitor.website" :title="$t('cmpWebsite')" :value="competitor.website" />
          <van-cell v-if="competitor.phone" :title="$t('telefon')" :value="competitor.phone" />
          <van-cell v-if="competitor.strengths" :title="$t('cmpStrengths')" :label="competitor.strengths" />
          <van-cell v-if="competitor.weaknesses" :title="$t('cmpWeaknesses')" :label="competitor.weaknesses" />
          <van-cell v-if="competitor.note" :title="$t('cmpNote')" :label="competitor.note" />
          <van-cell
            :title="$t('cmpStatEncounters')"
            :value="$t('cmpStatWonLost', { won: competitor.stats.won, lost: competitor.stats.lost })"
          />
        </van-cell-group>
        <div class="m-section"><span class="m-section__title">{{ $t('cmpTabEncounters') }}</span></div>
        <article
          v-for="e in competitorEncounters"
          :key="e.id"
          class="m-card is-tappable cv-item"
          @click="competitor = null; encounter = e"
        >
          <div class="cv-item__top">
            <span class="m-tag" :class="`is-${outcomeOf(e.outcome).tag === 'success' ? 'good' : outcomeOf(e.outcome).tag === 'danger' ? 'bad' : 'warn'}`">
              {{ $t(outcomeOf(e.outcome).labelKey) }}
            </span>
            <span class="cv-date m-num">{{ formatDate(e.encounter_date) }}</span>
          </div>
          <div class="cv-meta"><span>{{ clientOf(e) }}</span></div>
        </article>
        <p v-if="!competitorEncounters.length" class="cv-author">{{ $t('cmpNoEncounters') }}</p>
      </template>
      <template v-if="competitor" #footer>
        <van-button v-if="canEditCompetitor(competitor)" icon="edit" @click="go({ name: 'competitor-edit', params: { id: competitor.id } })">
          {{ $t('edit') }}
        </van-button>
        <van-button type="primary" icon="plus" @click="go({ name: 'encounter-new', query: { competitor_id: competitor.id } })">
          {{ $t('cmpEncAdd') }}
        </van-button>
      </template>
    </MSheet>
  </MPage>
</template>

<style scoped>
.cv-search {
  padding: 0 12px 8px;
}
.cv-seg {
  display: flex;
  margin: 0 12px 8px;
  padding: 3px;
  border-radius: 12px;
  background: var(--m-line-soft);
}
.cv-seg button {
  flex: 1;
  border: 0;
  background: none;
  padding: 9px 4px;
  border-radius: 9px;
  font-size: 14px;
  font-weight: 500;
  color: var(--m-muted);
}
.cv-seg button.is-active {
  background: var(--m-surface);
  color: var(--m-ink);
  font-weight: 600;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
}
.cv-item__top {
  display: flex;
  align-items: center;
  gap: 8px;
}
.cv-reason {
  font-size: 12px;
  color: var(--m-muted);
}
.cv-date {
  margin-left: auto;
  font-size: 12px;
  color: var(--m-muted);
}
.cv-title {
  margin-top: 6px;
  font-size: 16px;
  font-weight: 600;
  line-height: 1.3;
  overflow-wrap: anywhere;
}
.cv-sub {
  margin-top: 2px;
  font-size: 13px;
  color: var(--m-muted);
}
.cv-meta {
  display: flex;
  justify-content: space-between;
  gap: 10px;
  margin-top: 6px;
  font-size: 14px;
  color: var(--m-ink-2);
}
.is-good {
  color: var(--m-good);
}
.is-bad {
  color: var(--m-bad);
}
.cv-text {
  font-size: 14px;
  line-height: 1.5;
  white-space: pre-wrap;
}
.cv-author {
  margin: 10px 16px 0;
  font-size: 13px;
  color: var(--m-muted);
}
.cv-empty-btn {
  margin-top: 16px;
}
</style>
