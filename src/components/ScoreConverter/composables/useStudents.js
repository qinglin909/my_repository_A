// 成绩表解析与批量换算：状态依赖全部通过参数传入，避免反向 import 其他 composable
import { computed, watch } from 'vue'
import { parseScoreExcel } from '@/utils/calcLogic.js'
import { SEGMENT_LABELS, convertScore, describeConversion, lookupRank } from '@/utils/scoreConvert.js'
import { state } from '../store.js'
import { fmt, inferSubjectFromText } from '../helpers.js'

export function useStudents({ topAnchorOptions, tierOf }) {
  // 识别顺序：选科列 → 班级名 → 文件名（含"物理/历史"）→ 页面上选的兜底科类
  const resolveSubject = (student) =>
    inferSubjectFromText(student.subject) ||
    inferSubjectFromText(student.className) ||
    student.fileSubject ||
    state.fallbackSubject

  const buildRows = (source) => {
    let unresolved = 0
    const rows = source.map((student) => {
      const detected = inferSubjectFromText(student.subject) ||
        inferSubjectFromText(student.className) ||
        student.fileSubject
      if (!detected) unresolved += 1
      const resolved = detected || state.fallbackSubject
      const rule = state.rules[resolved]
      const result = convertScore(student.originalScore, rule, topAnchorOptions(resolved))
      const table = state.rankTables[resolved]
      return {
        ...student,
        resolvedSubject: resolved,
        convertedScore: result ? result.rounded : '—',
        convertedExact: result ? fmt(result.converted) : '—',
        diffText: result ? fmt(result.diff) : '—',
        progressText: result && result.progress !== null && result.progress !== undefined
          ? Number(result.progress).toFixed(4)
          : '—',
        segmentLabel: result ? SEGMENT_LABELS[result.segment] : '分数异常',
        tierLabel: result ? tierOf(result, resolved) : '分数异常',
        rank: result ? lookupRank(result.rounded, table) : '—',
        rankCovered: result && table.length ? result.rounded >= Number(table[table.length - 1].score) : false,
        explain: result ? describeConversion(result, rule, topAnchorOptions(resolved)) : '分数异常，无法换算'
      }
    })
    state.unresolvedCount = unresolved
    const uncovered = rows.filter((row) => row.rankCovered === false)
    state.lowCoverage = {
      count: uncovered.length,
      min: uncovered.length ? Math.min(...uncovered.map((row) => Number(row.originalScore))) : null
    }
    state.students = rows
  }

  const rebuild = () => {
    if (state.sourceStudents.length) buildRows(state.sourceStudents)
  }

  const filteredStudents = computed(() => {
    const query = state.keyword.trim().toLocaleLowerCase()
    if (!query) return state.students
    return state.students.filter((item) =>
      `${item.name || ''} ${item.className || ''}`.toLocaleLowerCase().includes(query)
    )
  })

  const handleUpload = async (event) => {
    const files = event.target.files
    if (!files || files.length === 0) return
    state.uploading = true
    state.errorMessage = ''
    try {
      const parsed = await parseScoreExcel(files)
      const all = parsed.flatMap((file) => file.students.map((student) => ({
        ...student,
        fileSubject: inferSubjectFromText(file.fileName)
      })))
      if (all.length === 0) throw new Error('没有解析到考生记录，请检查表头是否包含「姓名」和「总分」。')
      state.sourceStudents = all
      buildRows(all)
    } catch (error) {
      state.errorMessage = error.message || '成绩表解析失败'
      state.students = []
    } finally {
      state.uploading = false
      event.target.value = ''
    }
  }

  watch(() => state.fallbackSubject, () => rebuild())

  return { buildRows, rebuild, filteredStudents, handleUpload, resolveSubject }
}
