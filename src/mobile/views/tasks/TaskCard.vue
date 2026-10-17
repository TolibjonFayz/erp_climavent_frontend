<script setup>
import { useI18n } from 'vue-i18n'
import { formatDate } from '@/utils/format'
import { formatDateRelative } from '@/composables/useDateFormatter'
import {
  isDueToday,
  isOverdue,
  nextStatus,
  personName,
  priorityLabelKey,
  priorityTone,
  statusLabelKey,
} from './taskRules'
import { avatarColor, initials } from '../../utils'

const props = defineProps({
  task: { type: Object, required: true },
  isAdmin: { type: Boolean, default: false },
  isApprover: { type: Boolean, default: false },
  approverName: { type: String, default: '' },
})
const emit = defineEmits(['open', 'advance', 'move', 'approve', 'reject', 'cancel', 'menu'])
const { t } = useI18n()

const advanceLabel = (status) => (status === 'todo' ? t('startTask') : t('completeTask'))
</script>

<template>
  <article
    class="m-card tc"
    :class="[`is-${task.priority}`, { 'is-pending': !!task.pending_status, 'is-done': task.status === 'done' }]"
    @click="emit('open', task)"
  >
    <div class="tc__top">
      <span class="m-tag" :class="priorityTone(task.priority)">{{ $t(priorityLabelKey(task.priority)) }}</span>
      <span v-if="task.deadline" class="tc__deadline" :class="{ 'is-bad': isOverdue(task), 'is-warn': isDueToday(task) }">
        <van-icon name="calendar-o" />
        {{ formatDate(task.deadline) }}
        <b v-if="isOverdue(task)">· {{ $t('overdue') }}</b>
        <b v-else-if="isDueToday(task)">· {{ $t('dueToday') }}</b>
      </span>
      <button v-if="isAdmin" type="button" class="tc__menu" @click.stop="emit('menu', task)">
        <van-icon name="ellipsis" />
      </button>
    </div>

    <h3 class="tc__title">{{ task.title }}</h3>
    <p v-if="task.description" class="tc__desc">{{ task.description }}</p>

    <div v-if="isAdmin && task.assignee" class="tc__assignee">
      <span class="m-avatar is-sm" :style="{ background: avatarColor(personName(task.assignee)) }">
        {{ initials(personName(task.assignee)) }}
      </span>
      {{ personName(task.assignee) }}
    </div>

    <div v-if="task.pending_status" class="tc__note is-warn">
      <p class="tc__note-line">
        <van-icon name="clock-o" />
        <b>{{ $t('taskApprovalPending') }}</b> → {{ $t(statusLabelKey(task.pending_status)) }}
      </p>
      <p class="tc__note-meta">{{ $t('taskApproverLabel') }}: {{ approverName }}</p>
      <p v-if="task.approval_note" class="tc__note-quote">“{{ task.approval_note }}”</p>
    </div>
    <div v-else-if="task.approval_result === 'rejected'" class="tc__note is-bad">
      <p class="tc__note-line">
        <van-icon name="close" />
        <b>{{ $t('taskWasRejected') }}</b>
      </p>
      <p v-if="task.approval_reject_reason" class="tc__note-quote">“{{ task.approval_reject_reason }}”</p>
    </div>

    <footer class="tc__foot" @click.stop>
      <span class="tc__created">{{ formatDateRelative(task.createdAt) }}</span>
      <div class="tc__actions">
        <template v-if="task.pending_status && isApprover">
          <van-button size="small" plain type="danger" @click="emit('reject', task)">
            {{ $t('taskReject') }}
          </van-button>
          <van-button size="small" type="success" @click="emit('approve', task)">
            {{ $t('taskApprove') }}
          </van-button>
        </template>
        <van-button v-else-if="task.pending_status" size="small" @click="emit('cancel', task)">
          {{ $t('taskCancelRequest') }}
        </van-button>
        <template v-else>
          <van-button v-if="task.status !== 'todo'" size="small" @click="emit('move', task, 'todo')">
            {{ task.status === 'done' ? $t('reopenTask') : $t('taskBackToTodo') }}
          </van-button>
          <van-button
            v-if="nextStatus(task.status)"
            size="small"
            :type="task.status === 'todo' ? 'primary' : 'success'"
            @click="emit('advance', task)"
          >
            {{ advanceLabel(task.status) }}
          </van-button>
        </template>
      </div>
    </footer>
  </article>
</template>

<style scoped>
.tc {
  position: relative;
  overflow: hidden;
}

.tc::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 4px;
  background: var(--m-line);
}

.tc.is-high::before {
  background: var(--m-bad);
}

.tc.is-medium::before {
  background: #f59e0b;
}

.tc.is-low::before {
  background: #94a3b8;
}

.tc__top {
  display: flex;
  align-items: center;
  gap: 8px;
}

.tc__deadline {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: var(--m-muted);
}

.tc__deadline.is-bad {
  color: var(--m-bad);
}

.tc__deadline.is-warn {
  color: var(--m-warn);
}

.tc__menu {
  margin-left: auto;
  width: 32px;
  height: 32px;
  margin-right: -6px;
  border: 0;
  border-radius: 50%;
  background: none;
  font-size: 18px;
  color: var(--m-muted);
  display: grid;
  place-items: center;
}

.tc__menu:active {
  background: var(--m-line-soft);
}

.tc__title {
  margin-top: 10px;
  font-size: 16px;
  font-weight: 600;
  line-height: 1.35;
  overflow-wrap: anywhere;
}

.tc.is-done .tc__title {
  text-decoration: line-through;
  color: var(--m-muted);
}

.tc__desc {
  margin-top: 4px;
  font-size: 14px;
  line-height: 1.45;
  color: var(--m-ink-2);
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
  white-space: pre-line;
}

.tc__assignee {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 10px;
  font-size: 13px;
  color: var(--m-ink-2);
}

.tc__assignee .m-avatar {
  width: 24px;
  height: 24px;
  font-size: 10px;
}

.tc__note {
  margin-top: 10px;
  padding: 10px 12px;
  border-radius: 10px;
  font-size: 13px;
  line-height: 1.4;
}

.tc__note.is-warn {
  background: var(--m-warn-soft);
  color: var(--m-warn);
}

.tc__note.is-bad {
  background: var(--m-bad-soft);
  color: var(--m-bad);
}

.tc__note-line {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
}

.tc__note-meta {
  margin-top: 2px;
  opacity: 0.85;
}

.tc__note-quote {
  margin-top: 4px;
  font-style: italic;
  color: var(--m-ink-2);
}

.tc__foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-top: 12px;
  padding-top: 10px;
  border-top: 1px solid var(--m-line-soft);
}

.tc__created {
  font-size: 12px;
  color: var(--m-faint);
}

.tc__actions {
  display: flex;
  gap: 6px;
}

.tc__actions .van-button {
  border-radius: 9px;
  padding: 0 12px;
}
</style>
