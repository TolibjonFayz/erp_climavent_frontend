<template>
  <AppLayout active="attendance">
    <AttendanceTable />
  </AppLayout>
</template>

<script setup>
import AppLayout from '@/components/layout/AppLayout.vue'
import AttendanceTable from '@/components/attendance/AttendanceTable.vue'
</script>
