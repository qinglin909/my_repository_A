import * as XLSX from 'xlsx'

// 读取 Excel 为二维数组
export const readExcel = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const data = new Uint8Array(e.target.result)
      const workbook = XLSX.read(data, { type: 'array' })
      const sheet = workbook.Sheets[workbook.SheetNames[0]]
      resolve(XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' }))
    }
    reader.onerror = reject
    reader.readAsArrayBuffer(file)
  })
}

// 解析一分一段表（支持多选，自动识别文理，抓取第1列和F列）
export const parseRankExcel = async (files) => {
  let mergedPhysics = []
  let mergedHistory = []
  for (let f = 0; f < files.length; f++) {
    const file = files[f]
    const raw = await readExcel(file)
    
    let isPhysics = file.name.includes('物理')
    let isHistory = file.name.includes('历史')
    
    // 从表头找文理关键字
    for (let i = 0; i < Math.min(5, raw.length); i++) {
      const rowText = raw[i].join(' ')
      if (rowText.includes('物理')) isPhysics = true
      if (rowText.includes('历史')) isHistory = true
    }
    if (!isPhysics && !isHistory) continue 

    // 找起始数据行
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
      let scoreStr = String(row[0]).replace(/[^\d.]/g, '')
      let rankStr = String(row[5]).replace(/[^\d]/g, '') 
      let score = Number(scoreStr)
      let rank = Number(rankStr)

      if (!isNaN(score) && !isNaN(rank) && score > 0 && rank > 0) {
        parsedRanks.push({ score, rank })
      }
    }

    parsedRanks.sort((a, b) => b.score - a.score)
    if (isPhysics) mergedPhysics = mergedPhysics.concat(parsedRanks)
    if (isHistory) mergedHistory = mergedHistory.concat(parsedRanks)
  }

  mergedPhysics.sort((a, b) => b.score - a.score)
  mergedHistory.sort((a, b) => b.score - a.score)
  return { physics: mergedPhysics, history: mergedHistory }
}

// 解析成绩单（支持多选，返回文件列表而不是强行合并）
export const parseScoreExcel = async (files) => {
  const parsedFiles = []
  for (let f = 0; f < files.length; f++) {
    const file = files[f]
    const raw = await readExcel(file)
    let headerRowIndex = raw.findIndex(row => row.includes('姓名'))
    if (headerRowIndex === -1) continue

    const headers = raw[headerRowIndex]
    const nameIdx = headers.indexOf('姓名')
    const classIdx = headers.findIndex(h => h.includes('行政班') || h === '班级')
    const subIdx = headers.indexOf('选科')
    const scoreIdx = headers.indexOf('总分')
    const rankIdx = headers.findIndex(h => h.includes('校名') || h === '校排')

    const students = []
    for (let i = headerRowIndex + 1; i < raw.length; i++) {
      const row = raw[i]
      if (!row[nameIdx] || String(row[nameIdx]).trim() === '') continue
      students.push({
        className: row[classIdx] || '',
        name: row[nameIdx],
        subject: row[subIdx] || '',
        originalScore: Number(row[scoreIdx]) || 0,
        schoolRank: Number(row[rankIdx]) || 9999
      })
    }
    parsedFiles.push({ fileName: file.name, students })
  }
  return parsedFiles
}

// 查表函数（向下兼容）
export const findRank = (convertScore, table) => {
  if (!table || table.length === 0) return '无排位表'
  if (convertScore >= table[0].score) return table[0].rank

  for (let i = 0; i < table.length; i++) {
    if (convertScore >= table[i].score) {
      return table[i].rank
    }
  }
  return table[table.length - 1].rank
}