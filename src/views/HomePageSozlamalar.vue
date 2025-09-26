<template>
  <div class="home-page-sozlamalar">
    <LeftMenuSozlamalar />
    <Sozlamalar />
  </div>
</template>

<script setup>
import LeftMenuSozlamalar from '@/components/Sozlamalar/LeftMenuSozlamalar.vue'
import Sozlamalar from '@/components/Sozlamalar/Sozlamalar.vue'
</script>

<style lang="scss" scoped>
.home-page-sozlamalar {
  display: flex;
  height: 100vh;
  width: 100%;
}
</style>
