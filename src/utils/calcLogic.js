import * as XLSX from 'xlsx'

export const readExcel = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const data = new Uint8Array(e.target.result)
      const workbook = XLSX.read(data, { type: 'array' })
      resolve(workbook) 
    }
    reader.onerror = reject
    reader.readAsArrayBuffer(file)
  })
}

export const parseRankExcel = async (files) => {
  let mergedPhysics = []
  let mergedHistory = []
  for (let f = 0; f < files.length; f++) {
    const workbook = await readExcel(files[f])
    const sheet = workbook.Sheets[workbook.SheetNames[0]]
    const raw = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' })
    
    const fileLabel = `${files[f].name} ${raw.slice(0, 5).flat().join(' ')}`
    let isPhysics = fileLabel.includes('物理')
    let isHistory = fileLabel.includes('历史')
    
    let dataStartIndex = 0
    for (let i = 0; i < raw.length; i++) {
      let firstCell = String(raw[i][0]).replace(/[^\d]/g, '')
      if (!isNaN(Number(firstCell)) && Number(firstCell) > 0) {
        dataStartIndex = i
        break
      }
    }

    const parsedRanks = []
    for (let i = dataStartIndex; i < raw.length; i++) {
      const row = raw[i]
      let score = Number(String(row[0]).replace(/[^\d.]/g, ''))
      let rank = Number(String(row[5]).replace(/[^\d]/g, '')) 
      if (!isNaN(score) && !isNaN(rank) && score > 0 && rank > 0) {
        parsedRanks.push({ score, rank })
      }
    }
    parsedRanks.sort((a, b) => b.score - a.score)
    if (isPhysics) mergedPhysics = mergedPhysics.concat(parsedRanks)
    if (isHistory) mergedHistory = mergedHistory.concat(parsedRanks)
  }
  const normalizeRanks = (items) => {
    const byScore = new Map()
    for (const item of items) byScore.set(item.score, item)
    return [...byScore.values()].sort((a, b) => b.score - a.score)
  }
  return { physics: normalizeRanks(mergedPhysics), history: normalizeRanks(mergedHistory) }
}

export const parseScoreExcel = async (files) => {
  const parsedFiles = []
  for (let f = 0; f < files.length; f++) {
    const workbook = await readExcel(files[f])
    const sheet = workbook.Sheets[workbook.SheetNames[0]]
    const raw = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' })
    
    const normalizeHeader = (value) => String(value ?? '').trim().replace(/[\s　()（）:：]/g, '')
    let headerRowIndex = raw.findIndex(row => row.some(cell => normalizeHeader(cell) === '姓名'))
    if (headerRowIndex === -1) throw new Error(`${files[f].name}：找不到“姓名”表头`)

    const headers = raw[headerRowIndex].map(normalizeHeader)
    const nameIdx = headers.findIndex(value => value === '姓名')
    const classIdx = headers.findIndex(value => /行政班|班级/.test(value))
    const subIdx = headers.findIndex(value => /选科|选考|科类|文理|首选|类别/.test(value))
    const scoreIdx = headers.findIndex(value => /总分|总成绩|联考分|考试成绩/.test(value))
    const rankIdx = headers.findIndex(value => /校排|校名次|校内排名|排名|名次/.test(value))
    if (scoreIdx === -1) throw new Error(`${files[f].name}：找不到“总分/成绩”列`)

    const parseNumber = (value) => {
      if (typeof value === 'number') return Number.isFinite(value) ? value : null
      const normalized = String(value ?? '').replace(/[,，\s名位]/g, '').trim()
      if (!normalized) return null
      const parsed = Number(normalized)
      return Number.isFinite(parsed) ? parsed : null
    }

    const students = []
    for (let i = headerRowIndex + 1; i < raw.length; i++) {
      const row = raw[i]
      if (!row[nameIdx] || String(row[nameIdx]).trim() === '') continue
      students.push({
        className: classIdx >= 0 ? row[classIdx] || '' : '',
        name: String(row[nameIdx]).trim(),
        subject: subIdx >= 0 ? row[subIdx] || '' : '',
        originalScore: parseNumber(row[scoreIdx]),
        schoolRank: rankIdx >= 0 ? parseNumber(row[rankIdx]) : null
      })
    }
    parsedFiles.push({ fileName: files[f].name, students })
  }
  return parsedFiles
}

// 🎯 精准查表
export const findRank = (convertScore, table) => {
  if (!table || table.length === 0) return '无排位表'
  const sorted = [...table].filter(item => Number.isFinite(Number(item.score)) && Number.isFinite(Number(item.rank)))
    .sort((a, b) => Number(b.score) - Number(a.score))
  if (sorted.length === 0) return '无有效排位数据'
  if (convertScore > Number(sorted[0].score)) return `高于排位表最高分(${sorted[0].score})`
  for (const item of sorted) {
    if (convertScore >= Number(item.score)) return item.rank
  }
  return `低于排位表最低分(${sorted[sorted.length - 1].score})`
}

// 🎯 解析院校表 (D列26年排位, F列25年排位)
export const parseUnivExcel = async (file) => {
  const workbook = await readExcel(file)
  let physicsData = []
  let historyData = []

  workbook.SheetNames.forEach(sheetName => {
    const sheet = workbook.Sheets[sheetName]
    const raw = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' })
    let headerRowIndex = raw.findIndex(row => row.includes('院校名称'))
    if (headerRowIndex === -1) return

    const parsedData = []
    for (let i = headerRowIndex + 1; i < raw.length; i++) {
      const row = raw[i]
      if (!row[0] || String(row[0]).includes('院校名称')) continue
      let r2026 = Number(String(row[3]).replace(/[^\d]/g, ''))
      let r2025 = Number(String(row[5]).replace(/[^\d]/g, ''))
      if (!isNaN(r2026) && r2026 > 0) {
        parsedData.push({ name: row[0], tag: row[1] || '未知', rank2026: r2026, rank2025: isNaN(r2025) ? '-' : r2025 })
      }
    }
    parsedData.sort((a, b) => a.rank2026 - b.rank2026)
    if (sheetName.includes('物理')) physicsData = parsedData
    if (sheetName.includes('历史')) historyData = parsedData
  })
  return { physics: physicsData, history: historyData }
}

// 🎯 解析一分一段表：优先「最低排位/位次」，其次「累计人数」；只有「人数」时按分数累加。
// 返回 columns 记录每个科类实际使用的两列表头，界面会显示出来供核对。
export const parseRankTableExcel = async (files) => {
  const result = { physics: [], history: [], columns: { physics: null, history: null } }
  for (const file of files) {
    const workbook = await readExcel(file)
    for (const sheetName of workbook.SheetNames) {
      const sheet = workbook.Sheets[sheetName]
      const raw = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' })
      if (!raw.length) continue
      const label = `${file.name} ${sheetName}`
      const subject = /物理/.test(label) ? 'physics' : /历史/.test(label) ? 'history' : null
      if (!subject) continue

      const normalize = (value) => String(value ?? '').replace(/[\s　()（）:：]/g, '')
      const rankPatterns = [
        [/最低排位|排位|位次/, true],
        [/累计/, true],
        [/排名|名次/, true],
        [/人数/, false]
      ]
      // 分数列表头：不能把「分数段人数」当成分数列
      const isScoreHeader = (value) =>
        Boolean(value) && !/人数|累计|排位|位次/.test(value) && /文化总分|总分|成绩|分数/.test(value)

      let headerIndex = -1
      let scoreIdx = -1
      let rankIdx = -1
      let isCumulative = true
      let scoreLabel = ''
      let rankLabel = ''

      // 表头可能是多行合并：分数列与排位列分别在不同行出现，这里逐行累积
      for (let i = 0; i < Math.min(raw.length, 30); i++) {
        const candidate = raw[i].map(normalize)
        const scoreIndex = candidate.findIndex(isScoreHeader)
        if (scoreIndex >= 0) {
          scoreIdx = scoreIndex
          scoreLabel = candidate[scoreIndex]
        }
        let rankIndex = -1
        let cumulative = true
        for (const [pattern, flag] of rankPatterns) {
          const index = candidate.findIndex((value) => pattern.test(value))
          if (index >= 0) {
            rankIndex = index
            cumulative = flag
            rankLabel = candidate[index]
            break
          }
        }
        if (rankIndex >= 0) {
          rankIdx = rankIndex
          isCumulative = cumulative
        }
        if (scoreIdx >= 0 && rankIdx >= 0) {
          headerIndex = i
          break
        }
      }
      if (headerIndex === -1) continue

      const rows = []
      for (let i = headerIndex + 1; i < raw.length; i++) {
        const row = raw[i]
        const score = Number(String(row[scoreIdx] ?? '').replace(/[^\d.]/g, ''))
        const value = Number(String(row[rankIdx] ?? '').replace(/[^\d]/g, ''))
        if (Number.isFinite(score) && Number.isFinite(value) && score > 0 && value > 0) {
          rows.push({ score, value })
        }
      }
      rows.sort((a, b) => b.score - a.score)

      let running = 0
      for (const row of rows) {
        if (isCumulative) {
          result[subject].push({ score: row.score, rank: row.value })
        } else {
          running += row.value
          result[subject].push({ score: row.score, rank: running })
        }
      }
      result.columns[subject] = {
        score: scoreLabel || `第${scoreIdx + 1}列`,
        rank: rankLabel || `第${rankIdx + 1}列`,
        cumulative: isCumulative
      }
    }
  }

  const normalizeTable = (items) => {
    const byScore = new Map()
    for (const item of items) byScore.set(item.score, item)
    return [...byScore.values()].sort((a, b) => b.score - a.score)
  }
  result.physics = normalizeTable(result.physics)
  result.history = normalizeTable(result.history)
  return result
}
