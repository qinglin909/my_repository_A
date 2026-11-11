<!-- 单条批次线：学校预估线 / 省控线 / 线差 -->
<template>
  <fieldset>
    <legend>{{ label }}</legend>
    <label>
      <span>学校预估线</span>
      <input v-model.number="curr" type="number" min="0" max="750" step="0.5" />
    </label>
    <label>
      <span>省控线</span>
      <input v-model.number="last" type="number" min="0" max="750" step="0.5" />
    </label>
    <p class="diff" :class="tone">线差 {{ fmt(diff) }}</p>
  </fieldset>
</template>

<script setup>
import { computed } from 'vue'
import { fmt, diffClass } from './helpers.js'

const props = defineProps({
  label: { type: String, required: true },
  currKey: { type: String, required: true },
  lastKey: { type: String, required: true },
  rule: { type: Object, required: true },
  diff: { type: [Number, String], default: '' }
})

const curr = computed({
  get: () => props.rule[props.currKey],
  set: (value) => { props.rule[props.currKey] = value }
})
const last = computed({
  get: () => props.rule[props.lastKey],
  set: (value) => { props.rule[props.lastKey] = value }
})
const tone = computed(() => diffClass(props.diff))
</script>
