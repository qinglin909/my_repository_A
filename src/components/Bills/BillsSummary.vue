<script setup>
import { money } from './constants'

defineProps({
  incomeTotal: { type: Number, default: 0 },
  expenseTotal: { type: Number, default: 0 },
  incomeCount: { type: Number, default: 0 },
  expenseCount: { type: Number, default: 0 },
  balance: { type: Number, default: 0 }
})
</script>

<template>
  <div class="summary-grid">
    <div class="summary-card app-card tone-income">
      <span class="summary-label">每月收入</span>
      <strong class="summary-value">{{ money(incomeTotal) }}</strong>
      <small>{{ incomeCount }} 项 · 年化 {{ money(incomeTotal * 12) }}</small>
    </div>
    <div class="summary-card app-card tone-expense">
      <span class="summary-label">每月支出</span>
      <strong class="summary-value">{{ money(expenseTotal) }}</strong>
      <small>{{ expenseCount }} 项 · 年化 {{ money(expenseTotal * 12) }}</small>
    </div>
    <div class="summary-card app-card" :class="balance >= 0 ? 'tone-balance' : 'tone-expense'">
      <span class="summary-label">每月结余</span>
      <strong class="summary-value">{{ money(balance) }}</strong>
      <small>{{ balance >= 0 ? '收大于支，攒起来了' : '支大于收，留意一下' }}</small>
    </div>
    <div class="summary-card app-card tone-daily">
      <span class="summary-label">日均支出</span>
      <strong class="summary-value">{{ money(expenseTotal / 30) }}</strong>
      <small>按每月 30 天折算</small>
    </div>
  </div>
</template>
