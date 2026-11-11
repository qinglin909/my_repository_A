// 导出 Excel：汇总、换算依据、按班级分表
import * as XLSX from 'xlsx'
import { SUBJECTS, SUBJECT_LABELS, conversionPairs, ruleDiffs } from '@/utils/scoreConvert.js'
import { state } from '../store.js'

export function useExport() {
  const exportExcel = () => {
    if (!state.students.length) return
    try {
      const workbook = XLSX.utils.book_new()
      const toRow = (item) => ({
        校排: item.schoolRank || '',
        姓名: item.name,
        班级: item.className || '',
        科类: SUBJECT_LABELS[item.resolvedSubject],
        原始分: item.originalScore,
        换算分: item.convertedScore,
        换算精确值: item.convertedExact,
        线差: item.diffText,
        进度: item.progressText,
        所在区间: item.segmentLabel,
        层次: item.tierLabel,
        全省排位参考: item.rank,
        计算过程: item.explain
      })
      const schoolName = '换算结果'
      const safeSheetName = (name, fallback) => {
        const cleaned = String(name || fallback).replace(/[\\/:*?"<>\[\]]/g, '').trim().slice(0, 28)
        return cleaned || fallback
      }

      XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(state.students.map(toRow)), safeSheetName(schoolName, '汇总'))

      // 换算依据：把公式与每条线、每段的分差写进一张表，成绩单交给别人也解释得清
      const basis = [
        { 科类: '通用', 项目: '换算公式', 说明: '换算分 = ROUNDDOWN(原始分) + 该分数的线差，再四舍五入取整' },
        { 科类: '通用', 项目: '线差定义', 说明: '线差 = 省控线 − 学校预估线；分数越高线差越接近特控线线差' },
        { 科类: '通用', 项目: '每分分差', 说明: '每分分差 = 相邻两条线的线差之差 ÷ 两条线的学校预估线之差' }
      ]
      for (const key of SUBJECTS) {
        const rule = state.rules[key]
        const subjectDiffs = ruleDiffs(rule)
        basis.push({ 科类: SUBJECT_LABELS[key], 项目: '特控线', 学校预估线: rule.currTk, 省控线: rule.lastTk, 线差: Number(subjectDiffs.tk.toFixed(2)) })
        basis.push({ 科类: SUBJECT_LABELS[key], 项目: '本科线', 学校预估线: rule.currBk, 省控线: rule.lastBk, 线差: Number(subjectDiffs.bk.toFixed(2)) })
        basis.push({ 科类: SUBJECT_LABELS[key], 项目: '专科线', 学校预估线: rule.currZk, 省控线: rule.lastZk, 线差: Number(subjectDiffs.zk.toFixed(2)) })
        for (const pair of conversionPairs(rule)) {
          basis.push({
            科类: SUBJECT_LABELS[key],
            项目: pair.label,
            分差: pair.scoreGap,
            线差之差: Number(pair.diffGap.toFixed(2)),
            每分分差: pair.perPoint === null ? '' : Number(pair.perPoint.toFixed(6))
          })
        }
      }
      XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(basis), '换算依据')

      // 按班级分 sheet 导出分数条
      const byClass = new Map()
      for (const item of state.students) {
        const key = item.className || '未分班'
        if (!byClass.has(key)) byClass.set(key, [])
        byClass.get(key).push(item)
      }
      if (byClass.size > 1) {
        let index = 1
        for (const [className, items] of byClass) {
          XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(items.map(toRow)), safeSheetName(className, `班级${index}`))
          index += 1
        }
      }

      XLSX.writeFile(workbook, `成绩换算_${new Date().toISOString().slice(0, 10)}.xlsx`)
    } catch (error) {
      state.errorMessage = `导出失败：${error.message}`
    }
  }

  return { exportExcel }
}
