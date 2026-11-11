<!-- 带文案的数字输入框（高分段校准、985/211 参考线共用） -->
<template>
  <label>
    <span v-if="label">{{ label }}</span>
    <input v-model.number="model" type="number" min="0" max="750" step="0.5" :placeholder="placeholder" />
  </label>
</template>

<script setup>
const model = defineModel({ type: [Number, String], default: '' })
defineProps({
  label: { type: String, default: '' },
  placeholder: { type: String, default: '' }
})
</script>
