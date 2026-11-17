function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

export function exportAsMarkdown(note, editor) {
  if (!note || !editor) return

  const text = editor.innerHTML
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<h([1-6])>/gi, (_, level) => '#'.repeat(Number(level)) + ' ')
    .replace(/<\/h[1-6]>/gi, '\n\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')

  const content = `# ${note.title}\n\n${text}`
  const filename = `${note.title || '未命名文档'}.md`
  downloadBlob(new Blob([content], { type: 'text/markdown;charset=utf-8' }), filename)
}

export function exportAsPDF() {
  window.print()
}

export function downloadChartImage(chartElement, chartType) {
  const svgElement = chartElement?.querySelector('svg')
  if (!svgElement) return

  const { width: measuredWidth, height: measuredHeight } = svgElement.getBoundingClientRect()
  const width = measuredWidth || 800
  const height = measuredHeight || 600
  const svgBlob = new Blob(
    [new XMLSerializer().serializeToString(svgElement)],
    { type: 'image/svg+xml;charset=utf-8' }
  )
  const url = URL.createObjectURL(svgBlob)
  const canvas = document.createElement('canvas')
  const scale = 2
  canvas.width = width * scale
  canvas.height = height * scale

  const context = canvas.getContext('2d')
  if (!context) {
    URL.revokeObjectURL(url)
    return
  }

  context.fillStyle = '#ffffff'
  context.fillRect(0, 0, canvas.width, canvas.height)
  context.scale(scale, scale)

  const image = new Image()
  image.onload = () => {
    context.drawImage(image, 0, 0, width, height)
    URL.revokeObjectURL(url)
    canvas.toBlob((blob) => {
      if (!blob) return
      const filename = `${chartType === 'flow' ? '流程图' : '时序图'}_${Date.now()}.png`
      downloadBlob(blob, filename)
    }, 'image/png')
  }
  image.onerror = () => URL.revokeObjectURL(url)
  image.src = url
}
