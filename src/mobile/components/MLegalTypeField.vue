<script setup>
// Mijoz turi: jismoniy / yuridik shaxs (ikki tugmali tanlov)
defineProps({
  required: { type: Boolean, default: false },
})
const model = defineModel({ type: String, default: '' })
</script>

<template>
  <van-field
    :model-value="model"
    name="mijozturi"
    :label="$t('mijozTuri')"
    label-align="top"
    :rules="required ? [{ required: true, message: $t('m.reqClientType') }] : []"
  >
    <template #input>
      <div class="lt-segment">
        <button
          v-for="opt in ['jismoniy', 'yuridik']"
          :key="opt"
          type="button"
          :class="{ 'is-active': model === opt }"
          @click="model = opt"
        >
          {{ opt === 'yuridik' ? $t('yuridikShaxs') : $t('jismoniyShaxs') }}
        </button>
      </div>
    </template>
  </van-field>
</template>

<style scoped>
.lt-segment {
  display: flex;
  width: 100%;
  padding: 3px;
  border-radius: 10px;
  background: var(--m-line-soft);
}

.lt-segment button {
  flex: 1;
  border: 0;
  background: none;
  padding: 9px 6px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  color: var(--m-muted);
}

.lt-segment button.is-active {
  background: var(--m-surface);
  color: var(--m-ink);
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
}
</style>
