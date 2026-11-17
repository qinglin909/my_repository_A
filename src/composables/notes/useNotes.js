import { computed, onMounted, onUnmounted, ref } from 'vue'
import { STORAGE_KEYS, readJSON, writeJSON } from '@/utils/storage'
import { isCloudReady, listRows, upsertRows, deleteRow } from '@/utils/cloudDb'

const rowToNote = (row) => ({
  id: row.id,
  title: row.title,
  content: row.content,
  updatedAt: row.updated_at_ms || 0
})

const noteToRow = (note) => ({
  id: String(note.id),
  title: note.title || '',
  content: note.content || '',
  updated_at_ms: note.updatedAt || 0
})

export function useNotes() {
  const notes = ref([])
  const currentNoteId = ref(null)
  const cloudOn = ref(false)
  const currentNote = computed(() => notes.value.find((note) => note.id === currentNoteId.value) || null)
  let saveTimer = null

  async function loadNotes() {
    cloudOn.value = await isCloudReady()

    if (cloudOn.value) {
      const result = await listRows('notes')
      if (result.ok && Array.isArray(result.data)) {
        notes.value = result.data.map(rowToNote).sort((a, b) => b.updatedAt - a.updatedAt)
      } else {
        notes.value = readJSON(STORAGE_KEYS.NOTES) || []
      }
    } else {
      notes.value = readJSON(STORAGE_KEYS.NOTES) || []
    }

    currentNoteId.value = notes.value[0]?.id ?? null
  }

  function saveNotes() {
    if (currentNote.value) currentNote.value.updatedAt = Date.now()
    writeJSON(STORAGE_KEYS.NOTES, notes.value)
    if (!cloudOn.value) return

    if (saveTimer) clearTimeout(saveTimer)
    saveTimer = setTimeout(() => {
      upsertRows('notes', notes.value.map(noteToRow), { onConflict: 'id' })
    }, 600)
  }

  function createNote() {
    const note = { id: Date.now(), title: '无标题文档', content: '<p><br></p>', updatedAt: Date.now() }
    notes.value.unshift(note)
    currentNoteId.value = note.id
    saveNotes()
  }

  function deleteNote(id) {
    if (!window.confirm('确定要删除这篇文档吗？删除后不可恢复。')) return

    notes.value = notes.value.filter((note) => note.id !== id)
    if (currentNoteId.value === id) currentNoteId.value = notes.value[0]?.id ?? null
    saveNotes()
    if (cloudOn.value) deleteRow('notes', String(id))
  }

  function selectNote(id) {
    currentNoteId.value = id
  }

  onMounted(() => {
    loadNotes()
    window.addEventListener('cloud-auth-changed', loadNotes)
  })

  onUnmounted(() => {
    window.removeEventListener('cloud-auth-changed', loadNotes)
    if (saveTimer) clearTimeout(saveTimer)
  })

  return { notes, currentNoteId, currentNote, cloudOn, loadNotes, saveNotes, createNote, deleteNote, selectNote }
}
