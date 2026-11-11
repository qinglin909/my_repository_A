<template>
  <div class="htls">
    <p class="htls-intro">
      龙马负图出于河，神龟载书出于洛。<span>白点为阳、黑点为阴</span>，古人以数纪方位、配五行。
    </p>

    <div class="htls-grid">
      <!-- ================= 河图 ================= -->
      <article class="htls-card">
        <header class="htls-head">
          <h3>河 图</h3>
          <span class="htls-note">生数成数 · 五方配对</span>
        </header>
        <div class="htls-figure">
          <svg
            viewBox="0 0 360 360"
            role="img"
            aria-label="河图点阵：北一六属水、南二七属火、东三八属木、西四九属金、中五十属土"
          >
            <g
              v-for="group in heTuGroups"
              :key="group.key"
              class="dot-group"
              :class="{ dim: activeGroup && activeGroup !== group.key, lit: activeGroup === group.key }"
              @mouseenter="activeGroup = group.key"
              @mouseleave="activeGroup = ''"
            >
              <circle
                v-for="(dot, i) in group.dots"
                :key="i"
                :cx="dot.x"
                :cy="dot.y"
                r="4.6"
                :class="dot.yang ? 'dot-yang' : 'dot-yin'"
              />
            </g>
            <text
              v-for="dir in directions"
              :key="dir.char"
              :x="dir.x"
              :y="dir.y"
              class="dir-text"
              text-anchor="middle"
              dominant-baseline="central"
            >
              {{ dir.char }}
            </text>
          </svg>
        </div>
        <ul class="htls-legend">
          <li
            v-for="group in heTuGroups"
            :key="group.key"
            :class="{ on: activeGroup === group.key }"
            @mouseenter="activeGroup = group.key"
            @mouseleave="activeGroup = ''"
          >
            <b>{{ group.dir }}</b>
            <span>{{ group.label }}</span>
            <em>{{ group.element }}</em>
          </li>
        </ul>
        <p class="htls-foot">天一生水，地六成之；五组生成数各差五。</p>
      </article>

      <!-- ================= 洛书 ================= -->
      <article class="htls-card">
        <header class="htls-head">
          <h3>洛 书</h3>
          <div class="htls-switch" role="group" aria-label="洛书显示方式">
            <button
              type="button"
              :class="{ on: mode === 'dots' }"
              :aria-pressed="mode === 'dots'"
              @click="mode = 'dots'"
            >
              点数
            </button>
            <button
              type="button"
              :class="{ on: mode === 'numbers' }"
              :aria-pressed="mode === 'numbers'"
              @click="mode = 'numbers'"
            >
              数字
            </button>
          </div>
        </header>
        <div class="htls-figure luo-figure">
          <svg
            viewBox="0 0 300 300"
            role="img"
            aria-label="洛书九宫：戴九履一，左三右七，二四为肩，六八为足，五居中央"
          >
            <rect x="1" y="1" width="298" height="298" class="grid-outer" />
            <line x1="100" y1="0" x2="100" y2="300" class="grid-line" />
            <line x1="200" y1="0" x2="200" y2="300" class="grid-line" />
            <line x1="0" y1="100" x2="300" y2="100" class="grid-line" />
            <line x1="0" y1="200" x2="300" y2="200" class="grid-line" />
            <g
              v-for="cell in luoShuCells"
              :key="cell.n"
              class="luo-cell"
              :class="{ active: activeCell && activeCell.n === cell.n }"
              role="button"
              tabindex="0"
              :aria-label="`第${cell.n}宫，${cell.dir}`"
              @click="activeCell = cell"
              @keydown.enter="activeCell = cell"
              @keydown.space.prevent="activeCell = cell"
            >
              <rect
                :x="cell.c * 100 + 2"
                :y="cell.r * 100 + 2"
                width="96"
                height="96"
                class="cell-bg"
              />
              <template v-if="mode === 'dots'">
                <circle
                  v-for="(p, i) in dotPositions[cell.n]"
                  :key="i"
                  :cx="cell.c * 100 + p[0]"
                  :cy="cell.r * 100 + p[1]"
                  r="6"
                  :class="cell.n % 2 ? 'dot-yang' : 'dot-yin'"
                />
              </template>
              <text
                v-else
                :x="cell.c * 100 + 50"
                :y="cell.r * 100 + 50"
                class="cell-num"
                :class="cell.n % 2 ? 'num-yang' : 'num-yin'"
                text-anchor="middle"
                dominant-baseline="central"
              >
                {{ han[cell.n] }}
              </text>
            </g>
          </svg>
        </div>
        <p class="htls-readout">{{ cellInfo }}</p>
        <p class="htls-foot">戴九履一，左三右七，二四为肩，六八为足，五居中央。</p>
      </article>
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'

/* ---------- 状态 ---------- */
const activeGroup = ref('')    // 河图悬停组
const mode = ref('dots')       // 洛书显示模式：'dots' | 'numbers'
const activeCell = ref(null)   // 洛书激活格
const han = ['', '一', '二', '三', '四', '五', '六', '七', '八', '九']

/* ---------- 河图点阵生成 ---------- */
/**
 * 沿横/竖方向排列 n 个圆点
 * @param {number} n 点数
 * @param {number} cx 中心 x
 * @param {number} cy 中心 y
 * @param {boolean} vertical 是否竖直排列
 * @param {boolean} yang 是否阳点（白）
 * @param {number} gap 点间距
 */
function lineDots(n, cx, cy, vertical, yang, gap = 13) {
  const start = (-(n - 1) / 2) * gap
  return Array.from({ length: n }, (_, i) => ({
    x: vertical ? cx : cx + start + i * gap,
    y: vertical ? cy + start + i * gap : cy,
    yang
  }))
}

/* 河图五组：北一六水、南二七火、东三八木、西四九金、中五十土 */
const heTuGroups = [
  {
    key: 'north',
    dir: '北',
    label: '一 · 六',
    element: '水',
    dots: [
      ...lineDots(1, 180, 235, false, true),
      ...lineDots(6, 180, 280, false, false)
    ]
  },
  {
    key: 'south',
    dir: '南',
    label: '二 · 七',
    element: '火',
    dots: [
      ...lineDots(2, 180, 125, false, false),
      ...lineDots(7, 180, 80, false, true)
    ]
  },
  {
    key: 'east',
    dir: '东',
    label: '三 · 八',
    element: '木',
    dots: [
      ...lineDots(3, 125, 180, true, true),
      ...lineDots(8, 80, 180, true, false)
    ]
  },
  {
    key: 'west',
    dir: '西',
    label: '四 · 九',
    element: '金',
    dots: [
      ...lineDots(4, 235, 180, true, false),
      ...lineDots(9, 280, 180, true, true)
    ]
  },
  {
    key: 'center',
    dir: '中',
    label: '五 · 十',
    element: '土',
    dots: [
      { x: 180, y: 180, yang: true },
      { x: 167, y: 180, yang: true },
      { x: 193, y: 180, yang: true },
      { x: 180, y: 167, yang: true },
      { x: 180, y: 193, yang: true },
      ...[154, 167, 180, 193, 206].flatMap((x) => [
        { x, y: 152, yang: false },
        { x, y: 208, yang: false }
      ])
    ]
  }
]

/* 方位标注（上南下北、左东右西） */
const directions = [
  { char: '南', x: 180, y: 22 },
  { char: '北', x: 180, y: 338 },
  { char: '东', x: 24, y: 180 },
  { char: '西', x: 336, y: 180 }
]

/* ---------- 洛书九宫点位 ---------- */
/* 每格 100×100 的宫内点位（示意画法，奇偶分色与古图一致） */
const dotPositions = {
  1: [[50, 50]],
  2: [[50, 34], [50, 66]],
  3: [[32, 32], [50, 50], [68, 68]],
  4: [[34, 34], [66, 34], [34, 66], [66, 66]],
  5: [[50, 50], [32, 32], [68, 32], [32, 68], [68, 68]],
  6: [[34, 28], [66, 28], [34, 50], [66, 50], [34, 72], [66, 72]],
  7: [[34, 26], [66, 26], [34, 50], [50, 50], [66, 50], [34, 74], [66, 74]],
  8: [[30, 30], [70, 30], [30, 70], [70, 70], [50, 26], [50, 74], [26, 50], [74, 50]],
  9: [[28, 28], [50, 28], [72, 28], [28, 50], [50, 50], [72, 50], [28, 72], [50, 72], [72, 72]]
}

/* 洛书九宫（上南下北、左东右西），配后天八卦方位与五行 */
const luoShuCells = [
  { n: 4, r: 0, c: 0, dir: '东南', gua: '巽', element: '木', verse: '二四为肩' },
  { n: 9, r: 0, c: 1, dir: '南',   gua: '离', element: '火', verse: '戴九' },
  { n: 2, r: 0, c: 2, dir: '西南', gua: '坤', element: '土', verse: '二四为肩' },
  { n: 3, r: 1, c: 0, dir: '东',   gua: '震', element: '木', verse: '左三' },
  { n: 5, r: 1, c: 1, dir: '中宫', gua: '中', element: '土', verse: '五居中央' },
  { n: 7, r: 1, c: 2, dir: '西',   gua: '兑', element: '金', verse: '右七' },
  { n: 8, r: 2, c: 0, dir: '东北', gua: '艮', element: '土', verse: '六八为足' },
  { n: 1, r: 2, c: 1, dir: '北',   gua: '坎', element: '水', verse: '履一' },
  { n: 6, r: 2, c: 2, dir: '西北', gua: '乾', element: '金', verse: '六八为足' }
]

/* 底部解读文字 */
const cellInfo = computed(() => {
  const c = activeCell.value
  return c
    ? `${han[c.n]} · ${c.dir} · ${c.gua}${c.element} · ${c.verse}`
    : '纵横斜三数之和皆十五 · 点选一宫查看方位'
})
</script>

<style scoped>
/* ================= 基础变量 ================= */
.htls {
  --paper: #302a22;
  --smoke: #71695d;
  --red: #a93632;
  --gold: #9a7425;
  --gold-line: rgba(139, 105, 36, 0.24);
  width: 100%;
  color: var(--paper);
  font-family: "Noto Serif SC", "Songti SC", "SimSun", serif;
}

/* ================= 顶部导语 ================= */
.htls-intro {
  margin: 0 0 18px;
  color: var(--smoke);
  font-size: 12px;
  line-height: 1.9;
  letter-spacing: 0.08em;
  text-align: center;
}
.htls-intro span {
  color: var(--red);
}

/* ================= 双图网格 ================= */
.htls-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
  max-width: 760px;   /* 与主页内容区宽度呼应 */
  margin: 0 auto;
}

/* ================= 卡片 ================= */
.htls-card {
  position: relative;
  display: flex;
  flex-direction: column;
  padding: 16px 18px 14px;
  background: rgba(255, 253, 248, 0.72);
  border: 1px solid var(--gold-line);
  border-radius: 4px;
  box-shadow: 0 4px 16px rgba(74, 54, 25, 0.045);
  transition: border-color 0.25s, background 0.25s, transform 0.25s, box-shadow 0.25s;
}
.htls-card:hover {
  transform: translateY(-2px);
  border-color: var(--red);
  box-shadow: 0 10px 24px rgba(74, 54, 25, 0.12);
}
/* 金色小方块装饰 */
.htls-card::before,
.htls-card::after {
  content: '';
  position: absolute;
  width: 5px;
  height: 5px;
  background: var(--gold);
  opacity: 0.55;
}
.htls-card::before {
  top: 5px;
  left: 5px;
}
.htls-card::after {
  right: 5px;
  bottom: 5px;
}

/* ================= 卡片头部 ================= */
.htls-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  margin-bottom: 10px;
  padding-bottom: 9px;
  border-bottom: 1px solid var(--gold-line);
}
.htls-head h3 {
  margin: 0;
  color: var(--red);
  font-size: 16px;
  font-weight: 600;
  letter-spacing: 0.3em;
  padding-left: 0.3em;
}
.htls-note {
  color: var(--smoke);
  font-size: 10px;
  letter-spacing: 0.1em;
}

/* ================= 图形区 ================= */
.htls-figure {
  display: flex;
  justify-content: center;
  padding: 2px 0 8px;
}
.htls-figure svg {
  width: 100%;
  max-width: 280px;
  height: auto;
  margin: 0 auto;
}
.luo-figure svg {
  max-width: 240px;
}

/* ---- 点阵样式 ---- */
.dot-yang {
  fill: #fffdf8;
  stroke: var(--paper);
  stroke-width: 1.5;
}
.dot-yin {
  fill: var(--paper);
}
.dot-group {
  transition: opacity 0.2s;
  cursor: default;
}
.dot-group.dim {
  opacity: 0.18;
}
.dot-group.lit .dot-yang {
  stroke: var(--red);
  stroke-width: 2;
}
.dot-group.lit .dot-yin {
  fill: var(--red);
}
.dir-text {
  fill: var(--gold);
  font-size: 13px;
  font-family: inherit;
}

/* ================= 河图图例 ================= */
.htls-legend {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 6px;
  list-style: none;
  margin: 2px 0 10px;
  padding: 0;
}
.htls-legend li {
  display: flex;
  align-items: baseline;
  gap: 5px;
  padding: 4px 8px;
  border: 1px solid var(--gold-line);
  border-radius: 2px;
  background: rgba(255, 253, 248, 0.6);
  color: var(--smoke);
  font-size: 10.5px;
  cursor: default;
  transition: border-color 0.2s, background 0.2s, color 0.2s;
}
.htls-legend li b {
  color: var(--red);
  font-weight: 600;
}
.htls-legend li em {
  color: var(--gold);
  font-style: normal;
}
.htls-legend li.on {
  border-color: var(--red);
  background: #fffdf8;
  color: var(--paper);
}

/* ================= 底部注脚 ================= */
.htls-foot {
  margin: auto 0 0;
  padding-top: 8px;
  border-top: 1px dashed var(--gold-line);
  color: var(--smoke);
  font-size: 10.5px;
  line-height: 1.75;
  letter-spacing: 0.04em;
  text-align: center;
}

/* ================= 洛书切换按钮 ================= */
.htls-switch {
  display: flex;
  gap: 4px;
}
.htls-switch button {
  padding: 3px 10px;
  border: 1px solid var(--gold-line);
  border-radius: 2px;
  background: transparent;
  color: var(--smoke);
  font-family: inherit;
  font-size: 10.5px;
  cursor: pointer;
  transition: border-color 0.2s, background 0.2s, color 0.2s;
}
.htls-switch button.on {
  border-color: var(--red);
  background: var(--red);
  color: #fff;
}

/* ---- 洛书九宫格 ---- */
.grid-outer {
  fill: none;
  stroke: var(--gold);
  stroke-width: 1.5;
}
.grid-line {
  stroke: rgba(139, 105, 36, 0.32);
  stroke-width: 1;
}
.luo-cell {
  cursor: pointer;
}
.cell-bg {
  fill: transparent;
  stroke: none;
  transition: fill 0.2s;
}
.luo-cell:hover .cell-bg {
  fill: rgba(154, 116, 37, 0.07);
}
.luo-cell.active .cell-bg {
  fill: rgba(169, 54, 50, 0.09);
  stroke: var(--red);
  stroke-width: 1;
  stroke-dasharray: 3 3;
}
.luo-cell:focus-visible {
  outline: none;
}
.luo-cell:focus-visible .cell-bg {
  stroke: var(--red);
  stroke-width: 1.5;
}
.cell-num {
  font-size: 38px;
  font-family: inherit;
}
.num-yang {
  fill: var(--red);
}
.num-yin {
  fill: var(--paper);
}

/* ================= 洛书解读文字 ================= */
.htls-readout {
  min-height: 22px;
  margin: 2px 0 8px;
  color: var(--red);
  font-size: 11.5px;
  letter-spacing: 0.1em;
  text-align: center;
}

/* ================= 响应式 ================= */
@media (max-width: 760px) {
  .htls-grid {
    grid-template-columns: 1fr;
  }
  .htls-intro {
    font-size: 11px;
  }
  .htls-figure svg {
    max-width: 260px;
  }
  .luo-figure svg {
    max-width: 220px;
  }
  /* 移动端激活边框更明显 */
  .luo-cell:hover .cell-bg,
  .luo-cell.active .cell-bg {
    stroke-width: 2;
  }
}

/* ================= 减少动效 ================= */
@media (prefers-reduced-motion: reduce) {
  .dot-group,
  .htls-legend li,
  .cell-bg,
  .htls-switch button,
  .htls-card {
    transition: none;
  }
}
</style>