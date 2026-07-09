<template>
  <AppLayout active="tasks">
    <TaskBoard />
  </AppLayout>
</template>

<script setup>
import AppLayout from '@/components/layout/AppLayout.vue'
import TaskBoard from '@/components/tasks/TaskBoard.vue'
</script>
