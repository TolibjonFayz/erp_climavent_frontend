<template>
  <!-- Raqam o'zgarganda eski qiymatdan yangisiga sanab boradi (formatini saqlab) -->
  <span>{{ shown }}</span>
</template>

<script setup>
import { useCountUp } from '@/composables/useCountUp'

const props = defineProps({
  value: { type: [String, Number], default: '' },
})
const shown = useCountUp(() => props.value)
</script>
