<template>
  <el-drawer
    :model-value="modelValue"
    :title="$t('notifTitle')"
    direction="rtl"
    size="380px"
    class="notif-drawer"
    @update:model-value="(v) => emit('update:modelValue', v)"
    @closed="markAllSeen"
  >
    <button
      v-if="pendingApprovals"
      type="button"
      class="notif-approvals"
      @click="go('/tasks')"
    >
      <el-icon><Bell /></el-icon>
      <span>{{ $t('notifApprovals', { n: pendingApprovals }) }}</span>
      <el-icon class="notif-approvals__arrow"><ArrowRight /></el-icon>
    </button>

    <ul v-if="items.length" class="notif-list">
      <li
        v-for="n in items"
        :key="n.key"
        class="notif-item"
        :class="{ 'is-unread': n.unread, 'is-link': !!n.to }"
        @click="n.to && go(n.to)"
      >
        <span class="notif-item__icon" :class="`is-${n.type}`">
          <el-icon><Promotion v-if="n.type === 'announcement'" /><List v-else /></el-icon>
        </span>
        <div class="notif-item__body">
          <div class="notif-item__head">
            <span class="notif-item__kind">
              {{ $t(n.type === 'announcement' ? 'notifAnnouncement' : 'notifNewTask') }}
            </span>
            <span class="notif-item__time">{{ fmtTime(n.time) }}</span>
          </div>
          <div class="notif-item__title">{{ n.title }}</div>
          <div v-if="n.text" class="notif-item__text">{{ n.text }}</div>
          <div v-if="n.author" class="notif-item__author">— {{ n.author }}</div>
        </div>
      </li>
    </ul>
    <p v-else-if="!pendingApprovals" class="notif-empty">{{ $t('notifEmpty') }}</p>
  </el-drawer>
</template>

<script setup>
import { useRouter } from 'vue-router'
import { ArrowRight, Bell, List, Promotion } from '@element-plus/icons-vue'
import { useNotifications } from '@/composables/useNotifications'
import { formatDateTime } from '@/utils/format'

defineProps({ modelValue: { type: Boolean, default: false } })
const emit = defineEmits(['update:modelValue'])

const router = useRouter()
const { items, pendingApprovals, markAllSeen } = useNotifications()

const fmtTime = (d) => (d ? formatDateTime(d) : '')

function go(path) {
  emit('update:modelValue', false)
  router.push(path)
}
</script>

<style scoped>
.notif-approvals {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  margin-bottom: 14px;
  padding: 10px 12px;
  font: inherit;
  font-size: 13px;
  font-weight: 600;
  color: var(--ui-warn, #b45309);
  text-align: left;
  background: rgba(240, 160, 32, 0.1);
  border: 1px solid rgba(240, 160, 32, 0.35);
  border-radius: 8px;
  cursor: pointer;
}
.notif-approvals__arrow {
  margin-left: auto;
}
.notif-list {
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.notif-item {
  display: flex;
  gap: 10px;
  padding: 10px 12px;
  border: 1px solid var(--ui-line);
  border-radius: 10px;
  background: var(--ui-surface);
}
.notif-item.is-link {
  cursor: pointer;
}
.notif-item.is-link:hover {
  border-color: var(--ui-link-line, #93c5fd);
}
.notif-item.is-unread {
  border-left: 3px solid var(--ui-link, #2a78d6);
  background: var(--ui-surface-2);
}
.notif-item__icon {
  display: inline-flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 30px;
  border-radius: 8px;
  color: #fff;
}
.notif-item__icon.is-announcement {
  background: #8b5cf6;
}
.notif-item__icon.is-task {
  background: #2a78d6;
}
.notif-item__body {
  min-width: 0;
  flex: 1;
}
.notif-item__head {
  display: flex;
  justify-content: space-between;
  gap: 8px;
  font-size: 11px;
  color: var(--ui-muted);
}
.notif-item__kind {
  font-weight: 600;
}
.notif-item__title {
  margin-top: 2px;
  font-size: 14px;
  font-weight: 600;
  color: var(--ui-ink);
  overflow-wrap: anywhere;
}
.notif-item__text {
  margin-top: 4px;
  font-size: 13px;
  line-height: 1.45;
  color: var(--ui-ink-2);
  white-space: pre-line;
  overflow-wrap: anywhere;
}
.notif-item__author {
  margin-top: 4px;
  font-size: 12px;
  color: var(--ui-muted);
}
.notif-empty {
  padding: 32px 0;
  text-align: center;
  font-size: 13px;
  color: var(--ui-muted);
}
</style>
