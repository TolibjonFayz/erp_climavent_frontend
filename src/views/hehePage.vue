<template>
  <div>
    <Hehe
      access-token="pk.eyJ1IjoidG9saWJqb25mYXl6IiwiYSI6ImNtY2x6amdkczBoZG0ya3NkYTI2NW8waWMifQ.yM3o-yj1ZPUGJG-gWREK6Q"
      :initial-center="{ lng: -74.006, lat: 40.7128 }"
      :initial-zoom="12"
      @location-selected="onLocationSelected"
      @current-location="onCurrentLocation"
    />
  </div>
</template>

<script setup>
import Hehe from '@/components/Home/hehe.vue'
</script>

<style lang="scss" scoped></style>
