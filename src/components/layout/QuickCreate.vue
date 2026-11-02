<template>
  <!-- "+ Yangi": istalgan sahifadan mijoz, tashrif, KP, shartnoma, loyiha, uchrashuv yoki vazifa qo'shish -->
  <div ref="root" class="qc" :class="{ 'is-collapsed': collapsed }">
    <button
      type="button"
      class="qc-btn"
      :aria-expanded="open"
      :title="$t('qcTitle')"
      @click="open = !open"
    >
      <el-icon class="qc-btn__icon" :class="{ 'is-open': open }"><Plus /></el-icon>
      <span v-if="!collapsed" class="qc-btn__text">{{ $t('qcTitle') }}</span>
    </button>

    <Transition name="qc-pop">
      <div v-if="open" class="qc-menu" role="menu">
        <button
          v-for="item in visibleItems"
          :key="item.key"
          type="button"
          class="qc-item"
          role="menuitem"
          @click="go(item)"
        >
          <span class="qc-item__icon" :class="`is-${item.tone}`"><el-icon><component :is="item.icon" /></el-icon></span>
          <span class="qc-item__text">
            <b>{{ $t(item.label) }}</b>
            <small>{{ $t(item.hint) }}</small>
          </span>
        </button>
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Document, Files, Flag, Location, Plus, Tickets, User, Finished } from '@element-plus/icons-vue'

const props = defineProps({
  collapsed: { type: Boolean, default: false },
  // Ruxsat bor bo'limlar (sidebar bilan bir xil qoida)
  can: { type: Function, required: true },
  isAdmin: { type: Boolean, default: false },
})
const emit = defineEmits(['navigate'])

const ITEMS = [
  { key: 'customers', icon: User, tone: 'blue', label: 'qcCustomer', hint: 'qcCustomerHint', to: { path: '/', query: { new: '1' } } },
  { key: 'sites', icon: Location, tone: 'red', label: 'qcSite', hint: 'qcSiteHint', to: { path: '/sites/create' } },
  { key: 'kp', icon: Document, tone: 'ink', label: 'qcKp', hint: 'qcKpHint', to: { path: '/kp', query: { new: '1' } } },
  { key: 'dogovor', icon: Tickets, tone: 'orange', label: 'qcDogovor', hint: 'qcDogovorHint', to: { path: '/dogovor', query: { new: '1' } } },
  { key: 'loyiha', icon: Files, tone: 'violet', label: 'qcLoyiha', hint: 'qcLoyihaHint', to: { path: '/loyiha', query: { new: '1' } } },
  { key: 'competitors', icon: Flag, tone: 'red', label: 'qcEncounter', hint: 'qcEncounterHint', to: { path: '/competitors', query: { new: '1' } } },
  { key: 'tasks', icon: Finished, tone: 'green', label: 'qcTask', hint: 'qcTaskHint', admin: true, to: { path: '/tasks', query: { new: '1' } } },
]
const visibleItems = computed(() => ITEMS.filter((i) => props.can(i.key) && (!i.admin || props.isAdmin)))

const open = ref(false)
const root = ref(null)
const route = useRoute()
const router = useRouter()

function go(item) {
  open.value = false
  emit('navigate')
  router.push(item.to)
}

// Tashqariga bosilsa, Esc yoki sahifa almashsa yopiladi
const onDocClick = (e) => {
  if (open.value && root.value && !root.value.contains(e.target)) open.value = false
}
const onKey = (e) => {
  if (e.key === 'Escape') open.value = false
}
watch(() => route.fullPath, () => (open.value = false))
onMounted(() => {
  document.addEventListener('mousedown', onDocClick)
  document.addEventListener('keydown', onKey)
})
onBeforeUnmount(() => {
  document.removeEventListener('mousedown', onDocClick)
  document.removeEventListener('keydown', onKey)
})
</script>

<style scoped>
.qc {
  position: relative;
  margin: 14px 14px 4px;
}
.qc.is-collapsed {
  margin: 14px 12px 4px;
}
.qc-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  width: 100%;
  height: 42px;
  border: 1px dashed var(--ui-line-strong);
  border-radius: 12px;
  background: var(--ui-surface);
  color: var(--ui-ink);
  font: inherit;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition:
    background-color var(--ui-dur-2) var(--ui-ease),
    border-color var(--ui-dur-2) var(--ui-ease),
    color var(--ui-dur-2) var(--ui-ease),
    scale var(--ui-dur-1) var(--ui-ease);
}
.qc-btn:hover,
.qc-btn[aria-expanded='true'] {
  border-style: solid;
  border-color: var(--ui-link);
  color: var(--ui-link);
  background: var(--ui-link-soft);
}
.qc-btn__icon {
  font-size: 18px;
  transition: rotate var(--ui-dur-3) var(--ui-ease-out);
}
.qc-btn__icon.is-open {
  rotate: 45deg;
}

.qc-menu {
  position: absolute;
  top: calc(100% + 8px);
  left: 0;
  z-index: 1100;
  width: 100%;
  min-width: 240px;
  padding: 6px;
  border: 1px solid var(--ui-line);
  border-radius: 14px;
  background: var(--ui-surface);
  box-shadow: 0 18px 40px rgba(15, 23, 42, 0.16);
  transform-origin: top left;
}
.qc.is-collapsed .qc-menu {
  top: 0;
  left: calc(100% + 10px);
}
.qc-item {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  padding: 9px 10px;
  border: 0;
  border-radius: 10px;
  background: transparent;
  color: var(--ui-ink);
  font: inherit;
  text-align: left;
  cursor: pointer;
}
.qc-item:hover,
.qc-item:focus-visible {
  background: var(--ui-surface-2);
  outline: none;
}
.qc-item__icon {
  display: grid;
  place-items: center;
  flex-shrink: 0;
  width: 32px;
  height: 32px;
  border-radius: 9px;
  font-size: 16px;
  color: #fff;
}
.qc-item__icon.is-blue { background: #409eff; }
.qc-item__icon.is-red { background: #e5484d; }
.qc-item__icon.is-ink { background: #334155; }
.qc-item__icon.is-orange { background: #f08c2b; }
.qc-item__icon.is-violet { background: #7c5cff; }
.qc-item__icon.is-green { background: #2f9e6b; }
.qc-item__text {
  display: flex;
  flex-direction: column;
  min-width: 0;
}
.qc-item__text b {
  font-size: 14px;
  font-weight: 600;
}
.qc-item__text small {
  font-size: 12px;
  color: var(--ui-muted);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* Menyu yumshoq ochiladi: biroz kattalashib, paydo bo'ladi; elementlari ketma-ket */
.qc-pop-enter-active {
  transition:
    opacity var(--ui-dur-2) var(--ui-ease),
    transform var(--ui-dur-3) var(--ui-ease-out);
}
.qc-pop-leave-active {
  transition:
    opacity 120ms var(--ui-ease),
    transform 120ms var(--ui-ease);
}
.qc-pop-enter-from,
.qc-pop-leave-to {
  opacity: 0;
  transform: translateY(-6px) scale(0.97);
}
.qc-pop-enter-active .qc-item {
  animation: ui-rise 320ms var(--ui-ease-out) backwards;
}
.qc-pop-enter-active .qc-item:nth-child(2) { animation-delay: 25ms; }
.qc-pop-enter-active .qc-item:nth-child(3) { animation-delay: 50ms; }
.qc-pop-enter-active .qc-item:nth-child(4) { animation-delay: 75ms; }
.qc-pop-enter-active .qc-item:nth-child(5) { animation-delay: 100ms; }
.qc-pop-enter-active .qc-item:nth-child(6) { animation-delay: 125ms; }
.qc-pop-enter-active .qc-item:nth-child(7) { animation-delay: 150ms; }
</style>
