<template>
  <span class="rp" :class="{ 'is-open': src }">
    <template v-if="status === 'gone'">
      <el-tooltip :content="$t('amoHintRecGone')" placement="top">
        <span class="rp-gone">{{ $t('amoRecStatus_gone') }}</span>
      </el-tooltip>
    </template>
    <template v-else>
      <audio
        v-if="src"
        ref="audioEl"
        class="rp-audio"
        :src="src"
        controls
        autoplay
        preload="auto"
        @play="onPlay"
        @error="onError"
      ></audio>
      <el-tooltip v-else :content="$t('amoRecPlay')" placement="top">
        <el-button
          circle
          size="small"
          type="primary"
          plain
          :icon="VideoPlay"
          :loading="loading === 'play'"
          :aria-label="$t('amoRecPlay')"
          @click="play"
        />
      </el-tooltip>
      <el-tooltip :content="$t('amoRecDownload')" placement="top">
        <el-button
          circle
          size="small"
          :icon="Download"
          :loading="loading === 'download'"
          :aria-label="$t('amoRecDownload')"
          @click="download"
        />
      </el-tooltip>
      <el-tooltip :content="$t(`amoRecStatus_${status || 'pending'}`)" placement="top">
        <i class="rp-dot" :class="status === 'archived' ? 'is-ok' : 'is-wait'"></i>
      </el-tooltip>
    </template>
  </span>
</template>

<script>
// Bir vaqtda faqat bitta yozuv o'ynasin
let current = null
</script>

<script setup>
import { onBeforeUnmount, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { ElMessage } from 'element-plus'
import { Download, VideoPlay } from '@element-plus/icons-vue'
import { useAmocrmStore } from '@/stores/amocrm'

const props = defineProps({
  // amo_calls.record_hash
  hash: { type: String, required: true },
  // archived | failed | gone | invalid | null (hali urinilmagan)
  status: { type: String, default: null },
})

const { t } = useI18n()
const amoStore = useAmocrmStore()
const src = ref('')
const loading = ref('')
const audioEl = ref(null)

async function play() {
  loading.value = 'play'
  try {
    const res = await amoStore.getRecordingUrl(props.hash)
    src.value = res.url
  } catch (err) {
    ElMessage.error(err?.response?.data?.message || err?.message)
  } finally {
    loading.value = ''
  }
}

async function download() {
  loading.value = 'download'
  try {
    const res = await amoStore.getRecordingUrl(props.hash, true)
    // Arxivdagisi fayl nomi bilan yuklanadi; telefoniyadagisi yangi oynada ochiladi
    const a = document.createElement('a')
    a.href = res.url
    a.rel = 'noopener'
    if (!res.archived) a.target = '_blank'
    document.body.appendChild(a)
    a.click()
    a.remove()
  } catch (err) {
    ElMessage.error(err?.response?.data?.message || err?.message)
  } finally {
    loading.value = ''
  }
}

function onPlay() {
  if (current && current !== audioEl.value) current.pause()
  current = audioEl.value
}

function onError() {
  ElMessage.warning(t('amoRecLoadError'))
  src.value = ''
}

onBeforeUnmount(() => {
  if (current === audioEl.value) current = null
})
</script>

<style scoped>
.rp {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}
.rp :deep(.el-button + .el-button) {
  margin-left: 0;
}
.rp-audio {
  height: 32px;
  width: 240px;
  max-width: 100%;
}
.rp-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  flex-shrink: 0;
}
.rp-dot.is-ok {
  background: #15803d;
}
.rp-dot.is-wait {
  background: #d1d5db;
}
.rp-gone {
  font-size: 12px;
  color: #9ca3af;
  text-decoration: line-through;
}
</style>
