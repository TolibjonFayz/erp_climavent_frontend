<template>
  <!-- Yozuv + sichqoncha borganda tushuntirish -->
  <el-tooltip
    :content="hint"
    placement="top"
    :show-after="150"
    :disabled="!hint"
    popper-class="ui-hint-popper"
  >
    <span class="ui-hint" :class="{ 'has-hint': hint }" :tabindex="hint ? 0 : undefined">
      <slot>{{ label }}</slot>
      <el-icon v-if="hint" class="ui-hint__icon"><QuestionFilled /></el-icon>
    </span>
  </el-tooltip>
</template>

<script setup>
import { QuestionFilled } from '@element-plus/icons-vue'

defineProps({
  label: { type: String, default: '' },
  hint: { type: String, default: '' },
})
</script>

<style scoped>
.ui-hint {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}
.ui-hint.has-hint {
  cursor: help;
}
.ui-hint:focus-visible {
  outline: 2px solid var(--ui-link);
  outline-offset: 2px;
  border-radius: 3px;
}
.ui-hint__icon {
  font-size: 12px;
  color: var(--ui-faint);
  flex-shrink: 0;
}
</style>

<style>
.ui-hint-popper {
  max-width: 320px;
  line-height: 1.45;
  white-space: pre-line;
}
</style>
