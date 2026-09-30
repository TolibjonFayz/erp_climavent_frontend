<template>
  <!-- Ma'lumot ro'yxati: chapda yorliq, o'ngda qiymat (punktir ajratkich bilan) -->
  <dl class="ui-info">
    <div v-for="item in items" :key="item.key" class="ui-info__row">
      <dt><UiHint :label="item.label" :hint="item.hint" /></dt>
      <dd>
        <slot :name="`value-${item.key}`" :item="item">
          <a v-if="item.href && hasValue(item.value)" :href="item.href" class="ui-info__link">
            {{ item.value }}
          </a>
          <el-tag
            v-else-if="item.tag && hasValue(item.value)"
            :type="item.tag"
            size="small"
            effect="plain"
          >
            {{ item.value }}
          </el-tag>
          <span v-else-if="hasValue(item.value)">{{ item.value }}</span>
          <span v-else class="ui-info__empty">{{ empty }}</span>
        </slot>
      </dd>
    </div>
  </dl>
</template>

<script setup>
import UiHint from './UiHint.vue'

defineProps({
  // [{ key, label, value, hint?, href?, tag? }]
  items: { type: Array, required: true },
  empty: { type: String, default: '—' },
})

const hasValue = (v) => v !== null && v !== undefined && v !== ''
</script>

<style scoped>
.ui-info {
  margin: 0;
}
.ui-info__row {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: 16px;
  padding: 9px 0;
  border-bottom: 1px dashed var(--ui-line);
  font-size: 13px;
}
.ui-info__row:first-child {
  padding-top: 0;
}
.ui-info__row:last-child {
  border-bottom: none;
  padding-bottom: 0;
}
.ui-info dt {
  color: var(--ui-muted);
  flex-shrink: 0;
}
.ui-info dd {
  margin: 0;
  min-width: 0;
  text-align: right;
  font-weight: 600;
  color: var(--ui-ink);
  overflow-wrap: anywhere;
}
.ui-info__link {
  color: var(--ui-link);
  text-decoration: none;
  font-variant-numeric: tabular-nums;
}
.ui-info__link:hover {
  text-decoration: underline;
}
.ui-info__empty {
  font-weight: 400;
  color: var(--ui-faint);
}
</style>
