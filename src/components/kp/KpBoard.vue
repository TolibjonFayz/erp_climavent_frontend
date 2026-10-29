<template>
  <div class="kb">
    <section
      v-for="col in columns"
      :key="col.value"
      class="kb-col"
      :class="[`is-${col.tone}`, { 'is-over': overCol === col.value }]"
      @dragover.prevent
      @dragenter.prevent="overCol = col.value"
      @dragleave="onLeave($event, col.value)"
      @drop.prevent="onDrop(col.value)"
    >
      <header class="kb-col__head">
        <span class="kb-dot"></span>
        <h3>{{ $t(col.labelKey) }}</h3>
        <span class="kb-count">{{ col.items.length }}</span>
        <span class="kb-sum">{{ fmtMoney(col.sum) }}</span>
      </header>

      <div class="kb-col__body">
        <article
          v-for="kp in col.shown"
          :key="kp.id || kp._id"
          class="kb-card"
          :class="{ 'is-locked': !canModify(kp) }"
          :draggable="canModify(kp)"
          @dragstart="onDragStart(kp)"
          @dragend="onDragEnd"
          @click="canModify(kp) && emit('edit', kp)"
        >
          <div class="kb-card__top">
            <span class="kb-card__num">№ {{ kp.kp_number ?? '—' }}</span>
            <span class="kb-card__date">{{ formatDate(kp.kp_date || kp.kpDate) }}</span>
            <el-icon v-if="!canModify(kp)" class="kb-card__lock"><Lock /></el-icon>
          </div>
          <h4 class="kb-card__title">{{ kp.client_name || kp.client || '—' }}</h4>
          <p class="kb-card__mgr">{{ kp.manager_name || kp.manager || '—' }}</p>
          <p v-if="kp.comment" class="kb-card__comment">{{ kp.comment }}</p>
          <div class="kb-card__foot">
            <span class="kb-card__money">{{ fmtMoney(kp.kp_sum || kp.sum) }}</span>
            <span v-if="kp.closed_date" class="kb-card__closed">
              {{ formatDate(kp.closed_date) }}
            </span>
          </div>
        </article>

        <div v-if="!col.items.length" class="kb-empty">{{ $t('kpBoardEmpty') }}</div>
        <p v-else-if="col.items.length > col.shown.length" class="kb-more">
          {{ $t('kpBoardMore', { n: col.items.length - col.shown.length }) }}
        </p>
      </div>
    </section>
  </div>
</template>

<script setup>
// KP doskasi: Open → Negotiation → Closed. Kartani sudrab holatini o'zgartirish
// (faqat tahrirlash ruxsati bor KP'lar sudraladi — 2 kunlik cheklov KP.vue'dagi canModify'da).
import { computed, ref } from 'vue'
import { Lock } from '@element-plus/icons-vue'

const props = defineProps({
  kps: { type: Array, default: () => [] },
  canModify: { type: Function, required: true },
  fmtMoney: { type: Function, required: true },
  formatDate: { type: Function, required: true },
  limit: { type: Number, default: 40 },
})
const emit = defineEmits(['move', 'edit'])

const STAGES = [
  { value: 'Open', labelKey: 'kpStatusOpen', tone: 'open' },
  { value: 'Negotiation', labelKey: 'kpStatusNegotiation', tone: 'nego' },
  { value: 'Closed', labelKey: 'kpStatusClosed', tone: 'closed' },
]

const statusOf = (kp) => kp.kp_status || kp.status || 'Open'
const sumOf = (kp) => Number(kp.kp_sum || kp.sum) || 0

const columns = computed(() =>
  STAGES.map((s) => {
    const items = props.kps.filter((kp) => statusOf(kp) === s.value)
    return {
      ...s,
      items,
      shown: items.slice(0, props.limit),
      sum: items.reduce((acc, kp) => acc + sumOf(kp), 0),
    }
  }),
)

const dragged = ref(null)
const overCol = ref('')
const onDragStart = (kp) => {
  dragged.value = kp
}
const onDragEnd = () => {
  dragged.value = null
  overCol.value = ''
}
const onLeave = (e, value) => {
  if (!e.currentTarget.contains(e.relatedTarget) && overCol.value === value) overCol.value = ''
}
const onDrop = (value) => {
  const kp = dragged.value
  onDragEnd()
  if (kp && statusOf(kp) !== value) emit('move', kp, value)
}
</script>

<style scoped>
.kb {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 16px;
  align-items: start;
}
.kb-col {
  --kb-c: var(--ui-acc-yellow);
  --kb-on: #1f1b14;
  min-width: 0;
  padding: 6px;
  background: var(--ui-surface-3);
  border: 1px solid var(--ui-line);
  border-radius: var(--ui-radius-lg);
  transition:
    border-color 0.15s,
    background 0.15s;
}
.kb-col.is-nego {
  --kb-c: var(--ui-acc-red);
  --kb-on: #fff;
}
.kb-col.is-closed {
  --kb-c: var(--ui-acc-green);
  --kb-on: #fff;
}
.kb-col.is-over {
  border-color: var(--kb-c);
  background: var(--ui-surface-2);
}
.kb-col__head {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 12px 8px;
}
.kb-col__head h3 {
  margin: 0;
  font-size: 15px;
  font-weight: 700;
  color: var(--ui-ink);
}
.kb-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: var(--kb-c);
  flex-shrink: 0;
}
.kb-count {
  min-width: 24px;
  padding: 0 8px;
  font-size: 12px;
  font-weight: 700;
  line-height: 22px;
  text-align: center;
  color: var(--ui-muted);
  background: var(--ui-surface);
  border-radius: 999px;
  font-variant-numeric: tabular-nums;
}
.kb-sum {
  margin-left: auto;
  font-size: 12px;
  color: var(--ui-muted);
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}
.kb-col__body {
  display: flex;
  flex-direction: column;
  gap: 10px;
  max-height: 68vh;
  min-height: 120px;
  padding: 4px 6px 8px;
  overflow-y: auto;
}

.kb-card {
  padding: 14px 16px;
  color: var(--kb-on);
  background: var(--kb-c);
  border-radius: 18px;
  cursor: grab;
  transition:
    transform 0.15s,
    box-shadow 0.15s;
}
.kb-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--ui-shadow-hover);
}
.kb-card:active {
  cursor: grabbing;
}
.kb-card.is-locked {
  cursor: default;
  opacity: 0.85;
}
.kb-card__top {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  opacity: 0.8;
}
.kb-card__date {
  margin-left: auto;
  font-variant-numeric: tabular-nums;
}
.kb-card__lock {
  font-size: 13px;
}
.kb-card__title {
  margin: 8px 0 2px;
  font-size: 16px;
  font-weight: 700;
  line-height: 1.3;
  letter-spacing: -0.01em;
  word-break: break-word;
}
.kb-card__mgr {
  margin: 0;
  font-size: 12px;
  opacity: 0.75;
}
.kb-card__comment {
  display: -webkit-box;
  margin: 8px 0 0;
  overflow: hidden;
  font-size: 12px;
  line-height: 1.45;
  opacity: 0.85;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}
.kb-card__foot {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 8px;
  margin-top: 12px;
}
.kb-card__money {
  font-size: 20px;
  font-weight: 700;
  letter-spacing: -0.02em;
  font-variant-numeric: tabular-nums;
}
.kb-card__closed {
  font-size: 12px;
  opacity: 0.8;
}
.kb-empty {
  padding: 28px 8px;
  font-size: 13px;
  text-align: center;
  color: var(--ui-faint);
  border: 1px dashed var(--ui-line-strong);
  border-radius: 14px;
}
.kb-more {
  margin: 0;
  font-size: 12px;
  text-align: center;
  color: var(--ui-muted);
}

@media (max-width: 1100px) {
  .kb {
    grid-template-columns: minmax(0, 1fr);
  }
}
</style>
