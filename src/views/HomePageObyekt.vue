<template>
  <div class="home-page-obyekt">
    <LeftMenuObyekt />
    <Obyektlar />
  </div>
</template>

<script setup>
import LeftMenuObyekt from '@/components/Home/LeftMenuObyekt.vue'
import Obyektlar from '@/components/Home/Obyektlar.vue'
</script>

<style lang="scss" scoped>
.home-page-obyekt {
  display: flex;
  height: 100vh;
  width: 100%;
}
</style>
