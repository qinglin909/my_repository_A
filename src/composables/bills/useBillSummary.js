import { computed } from 'vue'

export function useBillSummary(records, activeTab) {
  const activeRecords = computed(() => records.value.filter((record) => record.active !== false))
  const sumOf = (type) => activeRecords.value
    .filter((record) => record.type === type)
    .reduce((sum, record) => sum + Number(record.amount || 0), 0)
  const countOf = (type) => activeRecords.value.filter((record) => record.type === type).length

  const incomeTotal = computed(() => sumOf('income'))
  const expenseTotal = computed(() => sumOf('expense'))
  const incomeCount = computed(() => countOf('income'))
  const expenseCount = computed(() => countOf('expense'))
  const balance = computed(() => incomeTotal.value - expenseTotal.value)
  const currentList = computed(() =>
    records.value.filter((record) => record.type === activeTab.value).sort((a, b) => b.amount - a.amount)
  )

  const expenseByCategory = computed(() => {
    const totals = new Map()
    for (const record of activeRecords.value) {
      if (record.type !== 'expense') continue
      totals.set(record.category, (totals.get(record.category) || 0) + Number(record.amount || 0))
    }
    return [...totals.entries()]
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
  })

  const donutSegments = computed(() => {
    const total = expenseByCategory.value.reduce((sum, segment) => sum + segment.value, 0)
    if (!total) return []

    const center = 120
    const outerRadius = 88
    const innerRadius = 55
    const point = (radius, angle) => `${center + radius * Math.cos(angle)} ${center + radius * Math.sin(angle)}`
    let angle = -Math.PI / 2

    return expenseByCategory.value.map((segment) => {
      const share = segment.value / total
      const spans = share >= 0.9999
        ? [[angle, angle + Math.PI], [angle + Math.PI, angle + Math.PI * 2]]
        : [[angle, angle + share * Math.PI * 2]]
      const path = spans.map(([start, end]) => {
        const largeArc = end - start > Math.PI ? 1 : 0
        return `M ${point(outerRadius, start)} A ${outerRadius} ${outerRadius} 0 ${largeArc} 1 ${point(outerRadius, end)} `
          + `L ${point(innerRadius, end)} A ${innerRadius} ${innerRadius} 0 ${largeArc} 0 ${point(innerRadius, start)} Z`
      }).join(' ')
      angle += share * Math.PI * 2
      return { name: segment.name, value: segment.value, share, path }
    })
  })

  const barRows = computed(() => {
    const rows = [
      { label: '月收入', value: incomeTotal.value, color: '#2fb380' },
      { label: '月支出', value: expenseTotal.value, color: '#c2454d' },
      { label: '月结余', value: balance.value, color: balance.value >= 0 ? '#3a5a8c' : '#c2454d' }
    ]
    const max = Math.max(...rows.map((row) => Math.abs(row.value)), 1)
    return rows.map((row) => ({ ...row, width: Math.max(Math.abs(row.value) / max * 196, row.value ? 4 : 0) }))
  })

  return {
    incomeTotal, expenseTotal, incomeCount, expenseCount,
    balance, currentList, donutSegments, barRows
  }
}
