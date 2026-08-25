import { onMounted, onUnmounted } from 'vue'

function isEditableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false
  return (
    target instanceof HTMLInputElement ||
    target instanceof HTMLTextAreaElement ||
    target.isContentEditable
  )
}

function fileFromClipboard(event: ClipboardEvent): File | null {
  const data = event.clipboardData
  if (!data) return null

  const imageItem = [...data.items].find((item) => item.type.startsWith('image/'))
  if (imageItem) {
    return imageItem.getAsFile()
  }

  if (isEditableTarget(event.target)) return null

  const text = data.getData('text/plain').trim()
  const start = text.toLowerCase().indexOf('<svg')
  if (start < 0) return null

  return new File([text.slice(start)], 'pasted.svg', { type: 'image/svg+xml' })
}

export function usePaste(onFile: (file: File) => void) {
  function onPaste(event: ClipboardEvent) {
    const file = fileFromClipboard(event)
    if (!file) return
    event.preventDefault()
    onFile(file)
  }

  onMounted(() => {
    window.addEventListener('paste', onPaste)
  })

  onUnmounted(() => {
    window.removeEventListener('paste', onPaste)
  })
}
