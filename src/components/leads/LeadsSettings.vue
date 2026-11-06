<template>
  <div v-loading="loading" class="ld-set">
    <el-alert v-if="error" type="error" show-icon :closable="false" :title="error" />

    <UiPanel :title="$t('ldTgTitle')">
      <template v-if="st">
        <ul class="ld-set__list">
          <li :class="st.token_set ? 'is-ok' : 'is-bad'">{{ $t('ldTgToken') }}: {{ st.token_set ? '✓' : $t('ldTgMissing') }}</li>
          <li :class="st.secret_set ? 'is-ok' : 'is-bad'">{{ $t('ldTgSecret') }}: {{ st.secret_set ? '✓' : $t('ldTgMissing') }}</li>
          <li v-if="st.bot" class="is-ok">
            {{ $t('ldTgBot') }}: <b>@{{ st.bot.username }}</b>
            <span v-if="st.bot.can_read_all_group_messages === false" class="is-warn">
              — {{ $t('ldTgPrivacyOn') }}
            </span>
          </li>
          <li v-if="st.webhook" :class="st.webhook.url ? 'is-ok' : 'is-bad'">
            {{ $t('ldTgWebhook') }}: {{ st.webhook.url || $t('ldTgNotConnected') }}
            <span v-if="st.webhook.pending"> · {{ $t('ldTgPending', { n: st.webhook.pending }) }}</span>
          </li>
          <li v-if="st.webhook?.last_error" class="is-bad">
            {{ $t('ldTgLastError') }}: {{ st.webhook.last_error }}
            <span v-if="st.webhook.last_error_at">({{ formatDateTime(st.webhook.last_error_at) }})</span>
          </li>
          <li>{{ $t('ldTgStaff', { n: st.staff_ids }) }}</li>
        </ul>
        <div class="ld-set__actions">
          <el-input v-model="baseUrl" class="ld-set__url" placeholder="https://…railway.app" />
          <el-button type="primary" :loading="connecting" :disabled="!st.token_set || !st.secret_set" @click="connect">
            {{ $t('ldTgConnect') }}
          </el-button>
          <el-button :loading="loading" @click="load">{{ $t('ldRefresh') }}</el-button>
        </div>
      </template>
    </UiPanel>

    <UiPanel :title="$t('ldTgHowTitle')">
      <ol class="ld-set__how">
        <li>{{ $t('ldTgHow1') }}</li>
        <li>{{ $t('ldTgHow2') }}</li>
        <li>{{ $t('ldTgHow3') }}</li>
        <li>{{ $t('ldTgHow4') }}</li>
        <li>{{ $t('ldTgHow5') }}</li>
      </ol>
    </UiPanel>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { ElMessage } from 'element-plus'
import UiPanel from '@/components/ui/UiPanel.vue'
import api from '@/api/leads'
import { formatDateTime } from '@/utils/format'
import { backendOrigin } from '@/utils/leadsFormat'

const { t } = useI18n()
const st = ref(null)
const loading = ref(false)
const connecting = ref(false)
const error = ref('')
const baseUrl = ref(backendOrigin())

const errText = (e) => {
  const m = e?.response?.data?.message
  return Array.isArray(m) ? m.join('; ') : m || t('ldLoadError')
}

async function load() {
  loading.value = true
  error.value = ''
  try {
    st.value = await api.telegramStatus()
  } catch (e) {
    error.value = errText(e)
  } finally {
    loading.value = false
  }
}

async function connect() {
  connecting.value = true
  try {
    const r = await api.telegramSetWebhook(baseUrl.value.trim())
    ElMessage.success(`${t('ldTgConnected')}: ${r.url}`)
    await load()
  } catch (e) {
    ElMessage.error(errText(e))
  } finally {
    connecting.value = false
  }
}

onMounted(load)
</script>

<style scoped>
.ld-set {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.ld-set__list {
  list-style: none;
  margin: 0 0 12px;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.is-ok {
  color: var(--ui-good, #2e9d5b);
}
.is-bad {
  color: var(--ui-bad, #d64545);
}
.is-warn {
  color: var(--ui-warn, #c98a00);
}
.ld-set__actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}
.ld-set__url {
  flex: 1 1 280px;
  max-width: 420px;
}
.ld-set__how {
  margin: 0;
  padding-left: 20px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}
</style>
