<script setup>
import { computed, reactive, ref } from 'vue'
import { PRESETS, TYPE_OPTIONS, categoriesOf } from './constants'

const props = defineProps({
  saving: { type: Boolean, default: false },
  loading: { type: Boolean, default: false }
})
const emit = defineEmits(['submit', 'cancel'])

const editingId = ref('')
const form = reactive({
  type: 'expense',
  name: '',
  amount: null,
  category: categoriesOf('expense')[0],
  dayOfMonth: 1,
  note: ''
})

const categoryOptions = computed(() => categoriesOf(form.type))
const editing = computed(() => Boolean(editingId.value))

function switchType(type) {
  form.type = type
  form.category = categoriesOf(type)[0]
}

function applyPreset(preset) {
  Object.assign(form, preset)
}

function submit() {
  if (!form.name.trim() || form.amount === null || form.amount <= 0 || props.saving) return
  emit('submit', {
    id: editingId.value,
    payload: {
      name: form.name.trim(),
      amount: Number(form.amount),
      category: form.category,
      type: form.type,
      dayOfMonth: Number(form.dayOfMonth),
      note: form.note.trim()
    }
  })
}

function fillFrom(bill) {
  editingId.value = String(bill.id)
  form.type = bill.type
  form.name = bill.name
  form.amount = bill.amount
  form.category = bill.category
  form.dayOfMonth = bill.dayOfMonth
  form.note = bill.note || ''
}

function reset() {
  editingId.value = ''
  form.name = ''
  form.amount = null
  form.dayOfMonth = 1
  form.note = ''
  form.category = categoriesOf(form.type)[0]
}

function cancelEdit() {
  reset()
  emit('cancel')
}

defineExpose({ fillFrom, reset })
</script>

<template>
  <form class="bill-form app-card" @submit.prevent="submit">
    <div class="form-head">
      <h2>{{ editing ? '编辑条目' : '登记新条目' }}</h2>
      <button v-if="editing" type="button" class="text-btn" @click="cancelEdit">取消编辑</button>
    </div>

    <div class="type-toggle" role="tablist">
      <button
        v-for="t in TYPE_OPTIONS"
        :key="t.value"
        type="button"
        class="type-btn"
        :class="{ active: form.type === t.value, [t.value]: true }"
        role="tab"
        :aria-selected="form.type === t.value"
        @click="switchType(t.value)"
      >
        {{ t.label }}
      </button>
    </div>

    <label class="field">
      <span>名称</span>
      <input v-model="form.name" :placeholder="form.type === 'expense' ? '例：宽带 / 电话卡 / 视频会员' : '例：工资 / 房租收入'" maxlength="40" required />
    </label>

    <div class="field-row">
      <label class="field">
        <span>金额（元 / 月）</span>
        <input v-model.number="form.amount" type="number" min="0.01" step="0.01" placeholder="79" required />
      </label>
      <label class="field day-field">
        <span>扣费日</span>
        <input v-model.number="form.dayOfMonth" type="number" min="1" max="31" step="1" required />
      </label>
    </div>

    <label class="field">
      <span>类别</span>
      <select v-model="form.category">
        <option v-for="c in categoryOptions" :key="c" :value="c">{{ c }}</option>
      </select>
    </label>

    <label class="field">
      <span>备注（选填）</span>
      <input v-model="form.note" placeholder="例：合约到 2027-03，届时可重新比价" maxlength="60" />
    </label>

    <div v-if="form.type === 'expense' && !editing" class="quick-chips">
      <span class="chips-label">快速填：</span>
      <button v-for="p in PRESETS" :key="p.name" type="button" class="chip" @click="applyPreset(p)">
        {{ p.name }} ¥{{ p.amount }}
      </button>
    </div>

    <div class="form-foot">
      <span class="tip-hint">{{ editing ? '改完保存即可生效' : '金额按每月固定值登记' }}</span>
      <button type="submit" class="solid-btn" :disabled="saving || loading">
        {{ saving ? '保存中…' : editing ? '保存修改' : '登记' }}
      </button>
    </div>
  </form>
</template>
