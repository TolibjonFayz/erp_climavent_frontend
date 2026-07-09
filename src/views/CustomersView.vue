<template>
  <AppLayout active="customers">
    <CustomerList />
  </AppLayout>
</template>

<script setup>
import AppLayout from '@/components/layout/AppLayout.vue'
import CustomerList from '@/components/customers/CustomerList.vue'
</script>
