<script setup>
import { computed } from 'vue'
import { TYPE_OPTIONS, money } from './constants'

const props = defineProps({
  list: { type: Array, default: () => [] },
  loading: { type: Boolean, default: false },
  activeTab: { type: String, default: 'expense' },
  expenseCount: { type: Number, default: 0 },
  incomeCount: { type: Number, default: 0 }
})
const emit = defineEmits(['update:activeTab', 'edit', 'remove', 'toggle'])

const countOf = (type) => (type === 'expense' ? props.expenseCount : props.incomeCount)
const pageTotal = computed(() =>
  props.list.reduce((sum, b) => sum + (b.active === false ? 0 : Number(b.amount || 0)), 0)
)
</script>

<template>
  <div class="bill-list app-card">
    <div class="list-head">
      <div class="list-tabs" role="tablist">
        <button
          v-for="t in TYPE_OPTIONS"
          :key="t.value"
          type="button"
          class="list-tab"
          :class="{ active: activeTab === t.value }"
          role="tab"
          :aria-selected="activeTab === t.value"
          @click="emit('update:activeTab', t.value)"
        >
          {{ t.label }}
          <em>{{ countOf(t.value) }}</em>
        </button>
      </div>
    </div>

    <p v-if="loading" class="list-empty">加载中…</p>
    <p v-else-if="!list.length" class="list-empty">
      还没有{{ activeTab === 'expense' ? '支出' : '收入' }}条目，从左边登记一条吧。
    </p>

    <transition-group v-else name="bill" tag="ul" class="list-body">
      <li v-for="bill in list" :key="bill.id" class="bill-item" :class="{ muted: bill.active === false }">
        <div class="item-main">
          <strong class="item-name">
            {{ bill.name }}
            <span v-if="bill.active === false" class="paused-tag">已停用</span>
          </strong>
          <span class="item-meta">{{ bill.category }} · {{ bill.dayOfMonth }} 日扣费</span>
          <span v-if="bill.note" class="item-note">{{ bill.note }}</span>
        </div>
        <strong class="item-amount" :class="bill.type">{{ money(bill.amount) }}</strong>
        <div class="item-ops">
          <button type="button" class="op-btn" :title="bill.active === false ? '恢复计入' : '暂时停用（不计入汇总）'" @click="emit('toggle', bill)">
            {{ bill.active === false ? '▶' : '⏸' }}
          </button>
          <button type="button" class="op-btn" title="编辑" @click="emit('edit', bill)">✏️</button>
          <button type="button" class="op-btn danger" title="删除" @click="emit('remove', bill)">🗑️</button>
        </div>
      </li>
    </transition-group>

    <div v-if="list.length" class="list-foot">
      <span>当页合计</span>
      <strong :class="activeTab">{{ money(pageTotal) }}</strong>
    </div>
  </div>
</template>
