<!-- 换算结果格里的一格：标签 + 数值 -->
<template>
  <div :class="{ 'result-main': primary }">
    <span>{{ label }}</span>
    <strong :class="{ small }">{{ value }}</strong>
  </div>
</template>

<script setup>
defineProps({
  label: { type: String, required: true },
  value: { type: [String, Number], default: '—' },
  small: { type: Boolean, default: false },
  primary: { type: Boolean, default: false }
})
</script>
