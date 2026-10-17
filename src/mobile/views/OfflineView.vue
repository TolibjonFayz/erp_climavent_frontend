<script setup>
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import MEmpty from '../components/MEmpty.vue'

const route = useRoute()
const router = useRouter()
const retrying = ref(false)

async function retry() {
  retrying.value = true
  try {
    await router.replace(route.query.to || '/')
  } finally {
    retrying.value = false
  }
}
</script>

<template>
  <div class="offline">
    <MEmpty icon="warning-o" :title="$t('m.offlineTitle')" :text="$t('m.offlineText')">
      <van-button type="primary" round class="offline__btn" :loading="retrying" @click="retry">
        {{ $t('m.retry') }}
      </van-button>
    </MEmpty>
  </div>
</template>

<style scoped>
.offline {
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  background: var(--m-surface);
  padding-top: var(--sat);
}

.offline__btn {
  margin-top: 20px;
  min-width: 160px;
}
</style>
