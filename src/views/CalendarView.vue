<template>
  <!-- 悬浮触发器容器 -->
  <div class="calendar-hover-wrapper">
    <!-- 鼠标悬浮的提示区 (平时只显示这个) -->
    <div class="hover-trigger">
      <span>大明日历</span>
    </div>

    <!-- 日历卡片本体 (平时隐藏在右侧，悬浮显示) -->
    <div class="calendar-card">
      <header class="cal-header">
        <div class="title-wrap">
          <h1>大明日历</h1>
          <p class="sub">公历 · 农历 · 宜忌</p>
        </div>
        <div class="today-info" v-if="selectedDate">
          <div class="solar-day">{{ selectedDate.solarText }}</div>
          <div class="lunar-day">{{ selectedDate.lunarText }}</div>
        </div>
      </header>

      <!-- 月份控制 -->
      <div class="month-control">
        <button @click.stop="prevMonth">◀</button>
        <span>{{ currentYear }}年{{ currentMonth }}月</span>
        <button @click.stop="nextMonth">▶</button>
      </div>

      <!-- 七曜表头 (日、月、火、水、木、金、土) -->
      <div class="week-header">
        <span v-for="day in weekDays" :key="day">{{ day }}</span>
      </div>

      <!-- 日历网格 -->
      <div class="days-grid">
        <div 
          v-for="(day, index) in calendarDays" 
          :key="index"
          class="day-cell"
          :class="{ 
            'not-current-month': !day.isCurrentMonth,
            'is-today': day.isToday,
            'is-selected': day.dateStr === activeDateStr
          }"
          @click.stop="selectDate(day)"
        >
          <span class="num">{{ day.day }}</span>
          <span class="lunar" v-if="day.lunarDay">{{ day.lunarDay }}</span>
        </div>
      </div>

      <!-- 选中日期的宜忌详情 -->
      <div class="detail-box" v-if="selectedDate">
        <div class="detail-row">
          <span class="label">干支：</span>
          <span class="val">{{ selectedDate.ganzhiText }}</span>
        </div>
        <div class="detail-row">
          <span class="label">宜：</span>
          <span class="val yi">{{ selectedDate.yiText || '诸事不宜' }}</span>
        </div>
        <div class="detail-row">
          <span class="label">忌：</span>
          <span class="val ji">{{ selectedDate.jiText || '诸事不宜' }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { Solar } from 'lunar-javascript'
import { formatDateKey as formatDate } from '@/utils/date'

// 定义七曜表头（对应：日、一、二、三、四、五、六）
const weekDays = ['日', '月', '火', '水', '木', '金', '土']

const now = new Date()
const currentYear = ref(now.getFullYear())
const currentMonth = ref(now.getMonth() + 1) // 1-12

// 当前选中的日期字符串 (YYYY-MM-DD)
const activeDateStr = ref(formatDate(now))


// 获取选中日期的详细黄历信息
const selectedDate = computed(() => {
  if (!activeDateStr.value) return null
  const [y, m, d] = activeDateStr.value.split('-').map(Number)
  const solar = Solar.fromYmd(y, m, d)
  const lunar = solar.getLunar()
  
  return {
    solarText: `${solar.getYear()}年${solar.getMonth()}月${solar.getDay()}日`,
    lunarText: `农历 ${lunar.getMonthInChinese()}月${lunar.getDayInChinese()}`,
    ganzhiText: `${lunar.getYearInGanZhi()}年 ${lunar.getMonthInGanZhi()}月 ${lunar.getDayInGanZhi()}日`,
    yiText: lunar.getDayYi().join('、'),
    jiText: lunar.getDayJi().join('、')
  }
})

// 计算当前月份的日历网格数据
const calendarDays = computed(() => {
  const days = []
  const firstDay = new Date(currentYear.value, currentMonth.value - 1, 1)
  const lastDay = new Date(currentYear.value, currentMonth.value, 0)
  
  // 获取1号是星期几（0-6，0是周日）
  let startWeekDay = firstDay.getDay()
  
  // 补齐上个月的日期
  const prevMonthLastDay = new Date(currentYear.value, currentMonth.value - 1, 0).getDate()
  for (let i = startWeekDay - 1; i >= 0; i--) {
    const d = prevMonthLastDay - i
    const date = new Date(currentYear.value, currentMonth.value - 2, d)
    days.push(createDayObj(date, false))
  }
  
  // 当前月的日期
  for (let i = 1; i <= lastDay.getDate(); i++) {
    const date = new Date(currentYear.value, currentMonth.value - 1, i)
    days.push(createDayObj(date, true))
  }
  
  // 补齐下个月的日期，凑满42个格子（6行）
  const remaining = 42 - days.length
  for (let i = 1; i <= remaining; i++) {
    const date = new Date(currentYear.value, currentMonth.value, i)
    days.push(createDayObj(date, false))
  }
  
  return days
})

// 构造单个日期的数据对象
function createDayObj(date, isCurrentMonth) {
  const solar = Solar.fromYmd(date.getFullYear(), date.getMonth() + 1, date.getDate())
  const lunar = solar.getLunar()
  const dateStr = formatDate(date)
  
  return {
    date,
    dateStr,
    day: date.getDate(),
    isCurrentMonth,
    isToday: dateStr === formatDate(new Date()),
    lunarDay: lunar.getDayInChinese() === '初一' ? lunar.getMonthInChinese() + '月' : lunar.getDayInChinese()
  }
}

// 点击选择日期
const selectDate = (day) => {
  activeDateStr.value = day.dateStr
  if (!day.isCurrentMonth) {
    currentYear.value = day.date.getFullYear()
    currentMonth.value = day.date.getMonth() + 1
  }
}

// 月份切换
const prevMonth = () => {
  if (currentMonth.value === 1) {
    currentMonth.value = 12
    currentYear.value--
  } else {
    currentMonth.value--
  }
}

const nextMonth = () => {
  if (currentMonth.value === 12) {
    currentMonth.value = 1
    currentYear.value++
  } else {
    currentMonth.value++
  }
}
</script>

<style scoped>
/* 外部容器固定在右侧 */
.calendar-hover-wrapper {
  position: fixed;
  top: 105px; 
  right: 0;
  z-index: 999;
  display: flex;
  align-items: flex-start;
  transform: translateX(260px);
  transition: transform 0.4s cubic-bezier(0.25, 0.8, 0.25, 1);
}

/* 鼠标悬浮时滑出 */
.calendar-hover-wrapper:hover {
  transform: translateX(0);
}

/* 平时贴在屏幕边缘的竖条按钮 */
.hover-trigger {
  width: 32px;
  height: 90px;
  background: #fff;
  border: 1px solid rgba(0, 0, 0, 0.06);
  border-right: none;
  border-radius: 12px 0 0 12px;
  box-shadow: -2px 0 10px rgba(0, 0, 0, 0.05);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: #8b2e1f;
  font-weight: bold;
  font-size: 13px;
  writing-mode: vertical-lr;
  letter-spacing: 2px;
}

/* 卡片本体 */
.calendar-card {
  width: 260px; 
  background: #fff;
  border-radius: 12px 0 0 12px;
  box-shadow: -4px 0 24px rgba(0, 0, 0, 0.1);
  padding: 12px;
  border: 1px solid rgba(0,0,0,0.06);
  border-right: none;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

/* 头部信息 */
.cal-header { display: flex; justify-content: space-between; align-items: flex-start; }
.cal-header h1 { font-size: 14px; margin: 0; color: #8b2e1f; letter-spacing: 1px; }
.cal-header .sub { font-size: 10px; color: #999; margin-top: 2px; }
.today-info { text-align: right; }
.today-info .solar-day { font-size: 12px; font-weight: 600; color: #333; }
.today-info .lunar-day { font-size: 10px; color: #8b2e1f; margin-top: 1px; }

/* 月份控制 */
.month-control { display: flex; justify-content: space-between; align-items: center; font-weight: 600; color: #333; font-size: 12px; margin-top: 2px; }
.month-control button { background: none; border: none; cursor: pointer; color: #666; font-size: 10px; padding: 2px 6px; }
.month-control button:hover { color: #8b2e1f; }

/* 七曜表头 */
.week-header { display: grid; grid-template-columns: repeat(7, 1fr); text-align: center; font-size: 10px; color: #999; padding-bottom: 4px; border-bottom: 1px solid #f0f0f0; }

/* 日历网格 */
.days-grid { display: grid; grid-template-columns: repeat(7, 1fr); gap: 1px; }
.day-cell { aspect-ratio: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; border-radius: 4px; cursor: pointer; transition: all 0.2s; position: relative; }
.day-cell:hover { background: #f6f1e7; }
.day-cell .num { font-size: 11px; color: #333; font-weight: 500; }
.day-cell .lunar { font-size: 8px; color: #999; transform: scale(0.85); margin-top: -1px; }
.day-cell.not-current-month .num, .day-cell.not-current-month .lunar { opacity: 0.25; }
.day-cell.is-today { border: 1px solid #8b2e1f; }
.day-cell.is-today .num { color: #8b2e1f; }
.day-cell.is-selected { background: #8b2e1f !important; }
.day-cell.is-selected .num, .day-cell.is-selected .lunar { color: #fff !important; }

/* 底部详情 */
.detail-box { background: #faf7f2; border-radius: 6px; padding: 8px; font-size: 10px; display: flex; flex-direction: column; gap: 3px; margin-top: 2px; }
.detail-row { display: flex; line-height: 1.3; }
.detail-row .label { color: #999; width: 30px; flex-shrink: 0; }
.detail-row .val { color: #333; flex: 1; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
.val.yi { color: #1a7f37; }
.val.ji { color: #c9302c; }

/* 手机端隐藏悬浮日历 */
@media (max-width: 768px) {
  .calendar-hover-wrapper {
    display: none;
  }
}
</style>