<template>
  <div class="ot-set">
    <UiPanel :title="$t('otSetMode')">
      <p class="ot-set__hint">{{ $t('otSetModeHint', { min: settings.sync_interval_min || 5 }) }}</p>
      <el-radio-group :model-value="settings.mode" size="large" @change="(m) => $emit('mode', m)">
        <el-radio-button value="mirror">{{ $t('otModeMirror') }}</el-radio-button>
        <el-radio-button value="live">{{ $t('otModeLive') }}</el-radio-button>
      </el-radio-group>
    </UiPanel>

    <UiPanel :title="$t('otSetSheet')">
      <dl class="ot-set__list">
        <dt>{{ $t('otSetSheet') }}</dt>
        <dd><a :href="settings.sheet_url" target="_blank" rel="noopener">Отгрузка Трекер</a></dd>
        <dt>{{ $t('otSetAuto') }}</dt>
        <dd>
          {{ settings.auto_sync && settings.mode === 'mirror' ? $t('otSetAutoOn', { min: settings.sync_interval_min }) : $t('otSetAutoOff') }}
        </dd>
        <dt>{{ $t('otSetLast') }}</dt>
        <dd v-if="last">
          <div>{{ formatDateTimeSec(last.at) }}</div>
          <div v-if="last.ok" class="is-good">{{ $t('otSyncStats', last) }}</div>
          <div v-else class="is-bad">{{ codeText(last) }}</div>
        </dd>
        <dd v-else>—</dd>
      </dl>
      <el-button v-if="settings.mode === 'mirror'" type="primary" :icon="Refresh" :loading="syncing" @click="$emit('sync')">
        {{ $t('otSyncNow') }}
      </el-button>
    </UiPanel>

    <!-- Ikki tomonlama: Apps Script o'rnatish va ulash -->
    <UiPanel :title="$t('otScriptTitle')" class="ot-set__wide">
      <div class="ot-script__status" :class="settings.script_connected ? 'is-on' : 'is-off'">
        <el-icon><component :is="settings.script_connected ? CircleCheck : WarningFilled" /></el-icon>
        {{ settings.script_connected ? $t('otScriptOn') : $t('otScriptOff') }}
      </div>

      <ol class="ot-script__steps">
        <li>
          {{ $t('otScriptStep1') }}
          <a :href="settings.sheet_url" target="_blank" rel="noopener">Отгрузка Трекер ↗</a>
        </li>
        <li>{{ $t('otScriptStep2') }}</li>
        <li>{{ $t('otScriptStep3') }}</li>
        <li>{{ $t('otScriptStep4') }}</li>
        <li>{{ $t('otScriptStep5') }}</li>
      </ol>

      <div class="ot-script__code-head">
        <b>{{ $t('otScriptCode') }}</b>
        <span class="ot-muted">{{ $t('otScriptSecretHint') }}</span>
        <el-button size="small" :icon="DocumentCopy" :disabled="!code" @click="copy">{{ $t('otScriptCopy') }}</el-button>
      </div>
      <el-input v-loading="loading" :model-value="code" type="textarea" :rows="8" readonly class="ot-script__code" />

      <div class="ot-script__url">
        <el-input v-model="url" :placeholder="'https://script.google.com/macros/s/…/exec'" clearable>
          <template #prepend>{{ $t('otScriptUrl') }}</template>
        </el-input>
        <el-button type="primary" :loading="busy === 'connect'" :disabled="!url.trim() || url.trim() === savedUrl" @click="connect">
          {{ $t('otScriptConnect') }}
        </el-button>
        <el-button v-if="savedUrl" :loading="busy === 'test'" @click="test">{{ $t('otScriptTest') }}</el-button>
        <el-popconfirm v-if="savedUrl" :title="$t('otScriptDisconnectConfirm')" width="260" @confirm="disconnect">
          <template #reference><el-button type="danger" plain>{{ $t('otScriptDisconnect') }}</el-button></template>
        </el-popconfirm>
      </div>
      <div v-if="testResult" class="is-good">{{ testResult }}</div>
      <p class="ot-muted">{{ $t('otScriptRedeploy') }}</p>
    </UiPanel>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { ElMessage } from 'element-plus'
import { CircleCheck, DocumentCopy, Refresh, WarningFilled } from '@element-plus/icons-vue'
import UiPanel from '@/components/ui/UiPanel.vue'
import api from '@/api/otgruzka'
import { formatDateTimeSec } from '@/utils/format'
import { otError } from '@/utils/otgruzkaFormat'
import { buildOtgruzkaScript, otgruzkaHookUrl } from '@/utils/otgruzkaScript'

const props = defineProps({
  settings: { type: Object, required: true },
  syncing: Boolean,
})
const emit = defineEmits(['sync', 'mode', 'changed'])
const { t } = useI18n()
const last = computed(() => props.settings.last_sync)
const codeText = (r) => otError({ code: r.code, params: r.params, message: r.error }, 'otErr_OT_SYNC_FAILED')

const loading = ref(false)
const busy = ref('')
const secret = ref('')
const savedUrl = ref('')
const url = ref('')
const testResult = ref('')
const code = computed(() => (secret.value ? buildOtgruzkaScript({ secret: secret.value, hookUrl: otgruzkaHookUrl() }) : ''))

async function load() {
  loading.value = true
  try {
    const s = await api.getScript()
    secret.value = s.secret
    savedUrl.value = s.script_url || ''
    url.value = savedUrl.value
  } catch (e) {
    ElMessage.error(otError(e))
  } finally {
    loading.value = false
  }
}

async function copy() {
  try {
    await navigator.clipboard.writeText(code.value)
  } catch {
    // Eski brauzerlar: vaqtinchalik textarea orqali
    const ta = document.createElement('textarea')
    ta.value = code.value
    document.body.appendChild(ta)
    ta.select()
    document.execCommand('copy')
    ta.remove()
  }
  ElMessage.success(t('otScriptCopied'))
}

async function save(value, key) {
  busy.value = key
  testResult.value = ''
  try {
    const s = await api.setScript(value)
    savedUrl.value = s.script_url || ''
    url.value = savedUrl.value
    emit('changed')
    ElMessage.success(t('otSaved'))
  } catch (e) {
    ElMessage.error(otError(e))
  } finally {
    busy.value = ''
  }
}
const connect = () => save(url.value.trim(), 'connect')
const disconnect = () => save(null, 'disconnect')

async function test() {
  busy.value = 'test'
  testResult.value = ''
  try {
    const r = await api.testScript()
    testResult.value = t('otScriptOk', { sheet: r.sheet, row: r.header_row })
  } catch (e) {
    ElMessage.error(otError(e))
  } finally {
    busy.value = ''
  }
}

onMounted(load)
</script>

<style scoped>
.ot-set {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(340px, 1fr));
  gap: 16px;
}
.ot-set__wide {
  grid-column: 1 / -1;
}
.ot-set__hint {
  margin: 0 0 14px;
  line-height: 1.5;
  color: var(--ui-ink-2);
}
.ot-set__list {
  display: grid;
  grid-template-columns: max-content 1fr;
  gap: 8px 16px;
  margin: 0 0 16px;
}
.ot-set__list dt {
  color: var(--ui-muted);
}
.ot-set__list dd {
  margin: 0;
}
.ot-script__status {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 12px;
  border-radius: var(--ui-radius);
  font-weight: 600;
}
.ot-script__status.is-on {
  background: var(--ui-good-soft);
  color: var(--ui-good);
}
.ot-script__status.is-off {
  background: var(--ui-warn-soft);
  color: var(--ui-warn-ink);
}
.ot-script__steps {
  margin: 14px 0;
  padding-left: 22px;
  line-height: 1.7;
  color: var(--ui-ink-2);
}
.ot-script__code-head {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
  margin-bottom: 6px;
}
.ot-script__code-head .el-button {
  margin-left: auto;
}
.ot-script__code :deep(textarea) {
  font-family: ui-monospace, SFMono-Regular, Consolas, monospace;
  font-size: 12px;
}
.ot-script__url {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin: 14px 0 8px;
}
.ot-script__url .el-input {
  flex: 1 1 420px;
}
.ot-script__url .el-button + .el-button {
  margin-left: 0;
}
.ot-muted {
  font-size: 13px;
  color: var(--ui-muted);
}
.is-good {
  color: var(--ui-good);
}
.is-bad {
  color: var(--ui-bad);
}
</style>
