<template>
  <section class="vip-card" aria-labelledby="vip-title">
    <div class="vip-head">
      <span class="vip-badge">会员专区</span>
      <h2 id="vip-title">{{ product.title }}</h2>
      <p>{{ product.description }}</p>
    </div>

    <div class="plan-grid" role="radiogroup" aria-label="选择 VIP 套餐">
      <button
        v-for="plan in product.plans"
        :key="plan.id"
        type="button"
        class="plan"
        :class="{ active: plan.id === selectedId }"
        role="radio"
        :aria-checked="plan.id === selectedId"
        @click="select(plan.id)"
      >
        <span v-if="plan.badge" class="plan-badge">{{ plan.badge }}</span>
        <span class="plan-label">{{ plan.label }}</span>
        <span v-if="plan.unitPriceCents" class="plan-unit">{{ formatYuan(plan.unitPriceCents) }}<i>/月</i></span>
        <span v-else class="plan-unit">一次性</span>
        <span class="plan-total">合计 {{ formatYuan(plan.totalCents) }}</span>
      </button>
    </div>

    <div class="vip-foot">
      <div class="price-block">
        <span class="price">{{ formatYuan(selected.totalCents) }}</span>
        <span class="price-note">{{ selected.summary }}</span>
      </div>
      <button type="button" class="buy-btn" @click="onBuy">立即开通「{{ selected.label }}」</button>
    </div>

    <p v-if="tip" class="tip" role="status">{{ tip }}</p>
  </section>
</template>

<script setup>
import { computed, ref } from 'vue'
import { VIP_PRODUCT, formatYuan, getPlan } from '@/data/vipPlans'

const product = VIP_PRODUCT
const selectedId = ref(product.plans[0].id)
const tip = ref('')

const selected = computed(() => getPlan(selectedId.value))

const select = (id) => {
  selectedId.value = id
  tip.value = ''
}

// 目前项目还没有支付/下单接口，这里只做选择确认，避免误导用户已完成付款。
const onBuy = () => {
  tip.value = `已选择「${selected.value.label}」，合计 ${formatYuan(selected.value.totalCents)}。支付通道尚未接入，请联系客服完成开通。`
}
</script>

<style scoped>
.vip-card {
  max-width: 1200px;
  margin: 0 auto 26px;
  padding: 24px clamp(16px, 3vw, 28px);
  border: 1px solid #fde3c8;
  border-radius: 20px;
  background: linear-gradient(135deg, #fff8ef 0%, #ffffff 46%, #f6f9ff 100%);
  box-shadow: 0 12px 30px #1018280d;
}
.vip-head { margin-bottom: 18px; }
.vip-badge {
  display: inline-block;
  padding: 4px 10px;
  border-radius: 999px;
  background: #b45309;
  color: #fff;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: .04em;
}
.vip-head h2 { margin: 10px 0 6px; color: #172033; font-size: 22px; }
.vip-head p { margin: 0; color: #667085; font-size: 14px; }
.plan-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 12px;
}
.plan {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 14px 12px;
  border: 2px solid #eaecf0;
  border-radius: 14px;
  background: #fff;
  text-align: left;
  cursor: pointer;
  transition: border-color .15s ease, box-shadow .15s ease, transform .15s ease;
}
.plan:hover { transform: translateY(-2px); box-shadow: 0 8px 20px #10182810; }
.plan.active { border-color: #d97706; box-shadow: 0 8px 22px #d9770626; }
.plan-badge {
  position: absolute;
  top: -9px;
  right: 10px;
  padding: 2px 8px;
  border-radius: 999px;
  background: #f04438;
  color: #fff;
  font-size: 11px;
  font-weight: 700;
}
.plan-label { color: #1d2939; font-size: 16px; font-weight: 800; }
.plan-unit { color: #b45309; font-size: 15px; font-weight: 700; }
.plan-unit i { font-size: 12px; font-style: normal; font-weight: 500; }
.plan-total { color: #667085; font-size: 12px; }
.vip-foot {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  margin-top: 18px;
  padding-top: 16px;
  border-top: 1px dashed #f2d6b3;
}
.price-block { display: flex; align-items: baseline; gap: 10px; }
.price { color: #e5484d; font-size: 30px; font-weight: 900; }
.price-note { color: #667085; font-size: 13px; }
.buy-btn {
  min-height: 46px;
  padding: 0 24px;
  border: 0;
  border-radius: 12px;
  background: #d97706;
  color: #fff;
  font-size: 15px;
  font-weight: 800;
  cursor: pointer;
}
.buy-btn:hover { background: #b45309; }
.tip { margin: 12px 0 0; color: #b45309; font-size: 13px; line-height: 1.6; }
@media (max-width: 600px) {
  .vip-card { padding: 18px 14px; border-radius: 16px; }
  .vip-head h2 { font-size: 19px; }
  .plan-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; }
  .plan { padding: 12px 10px; }
  .price { font-size: 26px; }
  .buy-btn { width: 100%; }
}
</style>
