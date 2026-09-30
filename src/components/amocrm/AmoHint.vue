<template>
  <!-- Yozuv + sichqoncha borganda tushuntirish -->
  <el-tooltip
    :content="hint"
    placement="top"
    :show-after="150"
    :disabled="!hint"
    popper-class="amo-hint-popper"
  >
    <span class="amo-hint" :class="{ 'has-hint': hint }" tabindex="0">
      <slot>{{ label }}</slot>
      <el-icon v-if="hint" class="amo-hint__icon"><QuestionFilled /></el-icon>
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

<style lang="scss" scoped>
.amo-hint {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  &.has-hint {
    cursor: help;
  }
  &:focus-visible {
    outline: 2px solid #2a78d6;
    outline-offset: 2px;
    border-radius: 3px;
  }
}
.amo-hint__icon {
  font-size: 12px;
  color: #9ca3af;
  flex-shrink: 0;
}
</style>

<style>
.amo-hint-popper {
  max-width: 320px;
  line-height: 1.45;
}
</style>
