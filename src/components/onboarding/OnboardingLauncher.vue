<template>
  <!-- Sarlavhadagi "Yo'riqnoma" tugmasi — yo'riqnomani istalgan payt qayta ochadi -->
  <el-button :icon="QuestionFilled" data-tour="onb-launch" @click="tour.start()">
    {{ $t('onbGuide') }}
  </el-button>
</template>

<script setup>
import { QuestionFilled } from '@element-plus/icons-vue'

defineProps({
  tour: { type: Object, required: true },
})
</script>
