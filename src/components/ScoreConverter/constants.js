// 成绩换算工作台：本地存储 key、provide key 与静态表单配置
export const STORAGE_KEY = 'score_converter_v2'
export const RANK_STORAGE_KEY = 'score_converter_rank_v1'

export const SCORE_CONVERTER_KEY = Symbol('score-converter')

export const lineFields = [
  { key: 'tk', curr: 'currTk', last: 'lastTk' },
  { key: 'bk', curr: 'currBk', last: 'lastBk' },
  { key: 'zk', curr: 'currZk', last: 'lastZk' }
]
