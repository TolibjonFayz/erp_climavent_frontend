<template>
  <div class="single-obyekt-page">
    <Sidebar :activePath="'obyekt'" />
    <UploadMedia />
  </div>
</template>

<script setup>
import UploadMedia from '@/components/SingleObyekt/UploadMedia.vue'
import Sidebar from '@/components/Sidebar.vue'
</script>

<style lang="scss" scoped></style>
