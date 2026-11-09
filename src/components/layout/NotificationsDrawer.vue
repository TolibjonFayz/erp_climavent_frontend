<template>
  <el-drawer
    :model-value="modelValue"
    direction="rtl"
    size="380px"
    class="notif-drawer"
    @update:model-value="(v) => emit('update:modelValue', v)"
  >
    <template #header>
      <div class="notif-head">
        <span class="notif-head__title">
          {{ $t('notifTitle') }}
          <span v-if="unreadCount" class="notif-head__count">{{ unreadCount }}</span>
        </span>
        <el-button v-if="unreadCount" link type="primary" :icon="Finished" @click="markAllSeen">
          {{ $t('notifMarkAll') }}
        </el-button>
      </div>
    </template>

    <ul v-if="items.length" class="notif-list">
      <li
        v-for="n in items"
        :key="n.key"
        class="notif-item"
        :class="{ 'is-unread': n.unread, 'is-link': !!n.to }"
        role="button"
        tabindex="0"
        @click="open(n)"
        @keydown.enter="open(n)"
      >
        <span class="notif-item__icon" :class="`is-${n.type}`">
          <el-icon>
            <Promotion v-if="n.type === 'announcement'" />
            <Bell v-else-if="n.type === 'approval'" />
            <Box v-else-if="n.type === 'sklad'" />
            <List v-else />
          </el-icon>
        </span>
        <div class="notif-item__body">
          <div class="notif-item__head">
            <span class="notif-item__kind">{{ $t(KIND[n.type]) }}</span>
            <span class="notif-item__time">{{ fmtTime(n.time) }}</span>
          </div>
          <div class="notif-item__title">{{ n.title }}</div>
          <div v-if="n.text" class="notif-item__text">{{ n.text }}</div>
          <div v-if="n.author" class="notif-item__author">— {{ n.author }}</div>
        </div>
        <span v-if="n.unread" class="notif-item__dot" :aria-label="$t('notifUnread')" />
      </li>
    </ul>
    <p v-else class="notif-empty">{{ $t('notifEmpty') }}</p>
  </el-drawer>
</template>

<script setup>
import { useRouter } from 'vue-router'
import { Bell, Box, Finished, List, Promotion } from '@element-plus/icons-vue'
import { useNotifications } from '@/composables/useNotifications'
import { formatDateTime } from '@/utils/format'

defineProps({ modelValue: { type: Boolean, default: false } })
const emit = defineEmits(['update:modelValue'])

const router = useRouter()
const { items, unreadCount, markRead, markAllSeen } = useNotifications()
const KIND = {
  announcement: 'notifAnnouncement',
  task: 'notifNewTask',
  approval: 'notifApproval',
  sklad: 'notifSklad',
}

// Bosilganda — o'qilgan bo'ladi (qizil raqam kamayadi); havolasi bo'lsa o'sha sahifa ochiladi
function open(n) {
  markRead(n.key)
  if (n.to) go(n.to)
}

const fmtTime = (d) => (d ? formatDateTime(d) : '')

function go(path) {
  emit('update:modelValue', false)
  router.push(path)
}
</script>

<style scoped>
.notif-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}
.notif-head__title {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: 16px;
  font-weight: 700;
  color: var(--ui-ink);
}
.notif-head__count {
  min-width: 20px;
  padding: 0 6px;
  border-radius: 99px;
  background: var(--ui-bad, #dc2626);
  color: #fff;
  font-size: 11px;
  line-height: 20px;
  text-align: center;
}
.notif-item {
  position: relative;
  cursor: pointer;
}
.notif-item__dot {
  position: absolute;
  top: 10px;
  right: 10px;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--ui-link, #2a78d6);
}
.notif-item__icon.is-approval {
  background: #d97706;
}
.notif-item__icon.is-sklad {
  background: #0f766e;
}
.notif-item.is-unread .notif-item__head {
  padding-right: 14px;
}
.notif-item:not(.is-unread) {
  opacity: 0.75;
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
