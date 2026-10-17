<script setup>
defineProps({
  icon: { type: String, default: 'description' },
  title: { type: String, default: '' },
  text: { type: String, default: '' },
})
</script>

<template>
  <div class="m-empty">
    <van-icon :name="icon" class="m-empty__icon" />
    <p v-if="title" class="m-empty__title">{{ title }}</p>
    <p v-if="text">{{ text }}</p>
    <slot />
  </div>
</template>
