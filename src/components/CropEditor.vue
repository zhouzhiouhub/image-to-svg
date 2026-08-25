<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { clampCrop, type CropRect } from '@/utils/cropImage'
import { t } from '@/i18n'

const props = defineProps<{
  src: string
  imageWidth: number
  imageHeight: number
  aspect?: number | null
}>()

type DragMode = 'create' | 'move' | 'nw' | 'ne' | 'sw' | 'se'

const crop = defineModel<CropRect>('crop', { required: true })

const frame = ref<HTMLElement | null>(null)
const image = ref<HTMLImageElement | null>(null)
const display = ref({ left: 0, top: 0, width: 1, height: 1 })
let drag: {
  mode: DragMode
  startX: number
  startY: number
  origin: CropRect
} | null = null

const scale = computed(() => display.value.width / Math.max(1, props.imageWidth))
const boxStyle = computed(() => ({
  left: `${display.value.left + crop.value.x * scale.value}px`,
  top: `${display.value.top + crop.value.y * scale.value}px`,
  width: `${crop.value.width * scale.value}px`,
  height: `${crop.value.height * scale.value}px`,
}))

function measure() {
  const wrap = frame.value
  const img = image.value
  if (!wrap || !img || !img.naturalWidth) return
  const wrapBox = wrap.getBoundingClientRect()
  const imgBox = img.getBoundingClientRect()
  display.value = {
    left: imgBox.left - wrapBox.left,
    top: imgBox.top - wrapBox.top,
    width: imgBox.width,
    height: imgBox.height,
  }
}

function toImage(event: PointerEvent) {
  const wrap = frame.value
  if (!wrap) return { x: 0, y: 0 }
  const box = wrap.getBoundingClientRect()
  const x = (event.clientX - box.left - display.value.left) / scale.value
  const y = (event.clientY - box.top - display.value.top) / scale.value
  return { x, y }
}

function applyAspect(next: CropRect, lockX: boolean) {
  const ratio = props.aspect
  if (!ratio || ratio <= 0) return next
  if (lockX) {
    next.height = Math.max(1, Math.round(next.width / ratio))
  } else {
    next.width = Math.max(1, Math.round(next.height * ratio))
  }
  return next
}

function flipNegative(next: CropRect) {
  if (next.width < 0) {
    next.x += next.width
    next.width = -next.width
  }
  if (next.height < 0) {
    next.y += next.height
    next.height = -next.height
  }
  return next
}

function bindDrag(event: PointerEvent) {
  window.addEventListener('pointermove', onPointerMove)
  window.addEventListener('pointerup', onPointerUp)
  window.addEventListener('pointercancel', onPointerUp)
  ;(event.currentTarget as HTMLElement).setPointerCapture(event.pointerId)
}

function onPointerDown(event: PointerEvent, mode: DragMode) {
  event.preventDefault()
  event.stopPropagation()
  const point = toImage(event)
  drag = {
    mode,
    startX: point.x,
    startY: point.y,
    origin: { ...crop.value },
  }
  bindDrag(event)
}

function onCreateDown(event: PointerEvent) {
  const point = toImage(event)
  crop.value = clampCrop(
    { x: point.x, y: point.y, width: 1, height: 1 },
    props.imageWidth,
    props.imageHeight,
  )
  onPointerDown(event, 'create')
}

function onPointerMove(event: PointerEvent) {
  if (!drag) return
  const point = toImage(event)
  const dx = point.x - drag.startX
  const dy = point.y - drag.startY
  let next = { ...drag.origin }

  if (drag.mode === 'create') {
    next = {
      x: Math.min(drag.startX, point.x),
      y: Math.min(drag.startY, point.y),
      width: Math.abs(point.x - drag.startX),
      height: Math.abs(point.y - drag.startY),
    }
    next = applyAspect(next, Math.abs(point.x - drag.startX) >= Math.abs(point.y - drag.startY))
  } else if (drag.mode === 'move') {
    next.x += dx
    next.y += dy
  } else {
    if (drag.mode.includes('w')) {
      next.x += dx
      next.width -= dx
    }
    if (drag.mode.includes('e')) next.width += dx
    if (drag.mode.includes('n')) {
      next.y += dy
      next.height -= dy
    }
    if (drag.mode.includes('s')) next.height += dy
    next = flipNegative(next)
    next = applyAspect(next, drag.mode.includes('e') || drag.mode.includes('w'))
  }

  crop.value = clampCrop(next, props.imageWidth, props.imageHeight)
}

function onPointerUp() {
  drag = null
  window.removeEventListener('pointermove', onPointerMove)
  window.removeEventListener('pointerup', onPointerUp)
  window.removeEventListener('pointercancel', onPointerUp)
}

watch(
  () => [props.src, props.imageWidth, props.imageHeight],
  () => {
    requestAnimationFrame(measure)
  },
)

onMounted(() => {
  window.addEventListener('resize', measure)
})

onUnmounted(() => {
  onPointerUp()
  window.removeEventListener('resize', measure)
})
</script>

<template>
  <div ref="frame" class="stage">
    <img
      ref="image"
      :src="src"
      :alt="t('crop.alt')"
      draggable="false"
      @load="measure"
    />
    <div class="hit" @pointerdown="onCreateDown" />
    <div class="box" :style="boxStyle" @pointerdown="onPointerDown($event, 'move')">
      <span class="handle nw" @pointerdown="onPointerDown($event, 'nw')" />
      <span class="handle ne" @pointerdown="onPointerDown($event, 'ne')" />
      <span class="handle sw" @pointerdown="onPointerDown($event, 'sw')" />
      <span class="handle se" @pointerdown="onPointerDown($event, 'se')" />
    </div>
  </div>
</template>

<style scoped>
.stage {
  position: relative;
  width: 100%;
  min-height: 280px;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  user-select: none;
  touch-action: none;
}

.stage img {
  max-width: 100%;
  max-height: 360px;
  object-fit: contain;
}

.hit {
  position: absolute;
  inset: 0;
  z-index: 1;
  cursor: crosshair;
}

.box {
  position: absolute;
  z-index: 2;
  box-sizing: border-box;
  border: 2px solid #409eff;
  background: rgb(64 158 255 / 12%);
  box-shadow: 0 0 0 9999px rgb(0 0 0 / 40%);
  cursor: move;
}

.handle {
  position: absolute;
  z-index: 3;
  width: 10px;
  height: 10px;
  background: #fff;
  border: 1px solid #409eff;
}

.nw {
  top: -6px;
  left: -6px;
  cursor: nwse-resize;
}

.ne {
  top: -6px;
  right: -6px;
  cursor: nesw-resize;
}

.sw {
  bottom: -6px;
  left: -6px;
  cursor: nesw-resize;
}

.se {
  bottom: -6px;
  right: -6px;
  cursor: nwse-resize;
}
</style>
