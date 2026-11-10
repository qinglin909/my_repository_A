// 分数换算核心算法（纯函数，便于单独校验）。
//
// 口径：以「学校预估分数线」和「省控线」的线差为锚点，在相邻两条线之间做线性插值。
//  线差 = 省控线 − 学校预估线（负值表示学校预估线高于省控线）
//  本科线与特控线之间：线差从「本科线差」线性过渡到「特控线差」
//  专科线与本科线之间：线差从「专科线差」线性过渡到「本科线差」
//  特控线以上：沿用特控线差；专科线以下：沿用专科线差
// 这样两个锚点一定精确命中：学校本科线换算后等于省控本科线，特控线同理。

export const SUBJECTS = ['physics', 'history']

export const SUBJECT_LABELS = {
  physics: '物理类',
  history: '历史类'
}

export const LINE_LABELS = {
  tk: '特控线',
  bk: '本科线',
  zk: '专科线'
}

const toNumber = (value, fallback) => {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

export const normalizeRule = (rule = {}) => ({
  currTk: toNumber(rule.currTk, 528.5),
  lastTk: toNumber(rule.lastTk, 539),
  currBk: toNumber(rule.currBk, 449),
  lastBk: toNumber(rule.lastBk, 425),
  currZk: toNumber(rule.currZk, 200),
  lastZk: toNumber(rule.lastZk, 200)
})

// 三条线各自的线差：省控线 − 学校预估线
export const ruleDiffs = (rawRule) => {
  const rule = normalizeRule(rawRule)
  return {
    tk: rule.lastTk - rule.currTk,
    bk: rule.lastBk - rule.currBk,
    zk: rule.lastZk - rule.currZk
  }
}

export const ruleLooksValid = (rawRule) => {
  const rule = normalizeRule(rawRule)
  const values = Object.values(rule)
  if (!values.every((value) => Number.isFinite(value) && value > 0 && value <= 750)) return false
  return rule.currTk > rule.currBk && rule.currBk > rule.currZk
}

// 换算依据表：相邻两条线之间的「分差 / 线差之差 / 每分分差」
export const conversionPairs = (rawRule) => {
  const rule = normalizeRule(rawRule)
  const diffs = ruleDiffs(rule)
  const cap = { tk: 'Tk', bk: 'Bk', zk: 'Zk' }
  const build = (upperKey, lowerKey) => {
    const scoreGap = rule[`curr${cap[upperKey]}`] - rule[`curr${cap[lowerKey]}`]
    const diffGap = diffs[upperKey] - diffs[lowerKey]
    return {
      id: `${upperKey}-${lowerKey}`,
      label: `${LINE_LABELS[upperKey]} ↔ ${LINE_LABELS[lowerKey]}`,
      upperScore: rule[`curr${cap[upperKey]}`],
      lowerScore: rule[`curr${cap[lowerKey]}`],
      scoreGap,
      // 与学校表格口径一致：线差之差取绝对值，「每分分差」= 线差之差 ÷ 分差
      diffGap: Math.abs(diffGap),
      perPoint: scoreGap === 0 ? null : Math.abs(diffGap) / scoreGap
    }
  }
  return [build('tk', 'bk'), build('bk', 'zk')]
}

/**
 * 把原始分换算成参考分（按交接文档的口径）。
 * - 原始分先向下取整（ROUNDDOWN），再取该分数的分差
 * - 特控线以上：特控线线差；若设置了「最高分校准」，在特控线与本次最高分之间线性过渡
 * - 两条线之间：线差线性过渡
 * - 专科线以下：不做换算（保持原始分）
 * @returns {{score:number, converted:number, rounded:number, diff:number, segment:string}|null}
 */
export const convertScore = (score, rawRule, options = {}) => {
  const rule = normalizeRule(rawRule)
  if (!ruleLooksValid(rule)) return null
  const raw = Number(score)
  if (!Number.isFinite(raw)) return null

  const value = Math.floor(raw)
  const diffs = ruleDiffs(rule)
  const maxScore = Number(options.maxScore)
  const targetMaxScore = Number(options.targetMaxScore)
  const hasTopAnchor =
    Number.isFinite(maxScore) && Number.isFinite(targetMaxScore) &&
    maxScore > rule.currTk && targetMaxScore > 0 && targetMaxScore <= 750

  let diff
  let segment

  if (value >= rule.currTk) {
    const baseDiff = diffs.tk
    if (hasTopAnchor) {
      const topDiff = targetMaxScore - maxScore
      const progress = Math.min(1, Math.max(0, (value - rule.currTk) / (maxScore - rule.currTk)))
      diff = baseDiff + (topDiff - baseDiff) * progress
    } else {
      diff = baseDiff
    }
    segment = 'tk'
  } else if (value >= rule.currBk) {
    const span = rule.currTk - rule.currBk
    const progress = span === 0 ? 0 : (value - rule.currBk) / span
    diff = diffs.bk + (diffs.tk - diffs.bk) * progress
    segment = 'tk-bk'
  } else if (value >= rule.currZk) {
    const span = rule.currBk - rule.currZk
    const progress = span === 0 ? 0 : (value - rule.currZk) / span
    diff = diffs.zk + (diffs.bk - diffs.zk) * progress
    segment = 'bk-zk'
  } else {
    // 文档口径：专科线以下不做换算
    diff = 0
    segment = 'below-zk'
  }

  const converted = value + diff
  return {
    score: value,
    converted,
    rounded: Math.round(converted),
    diff,
    segment
  }
}

export const SEGMENT_LABELS = {
  tk: '特控线以上',
  'tk-bk': '特控线与本科线之间',
  'bk-zk': '本科线与专科线之间',
  'below-zk': '专科线以下'
}

// 查一分一段表得到全省排位
export const lookupRank = (convertedScore, table) => {
  if (!Array.isArray(table) || table.length === 0) return '—'
  const result = findRankValue(convertedScore, table)
  return result
}

const findRankValue = (score, table) => {
  const sorted = [...table]
    .filter((item) => Number.isFinite(Number(item.score)) && Number.isFinite(Number(item.rank)))
    .sort((a, b) => Number(b.score) - Number(a.score))
  if (sorted.length === 0) return '—'
  if (score > Number(sorted[0].score)) return `高于表内最高分（${sorted[0].score}）`
  for (const item of sorted) {
    if (score >= Number(item.score)) return item.rank
  }
  return `低于表内最低分（${sorted[sorted.length - 1].score}）`
}
