<script setup lang="ts">
import { computed, ref } from 'vue'
import { ElMessage } from 'element-plus'
import type { UploadFile, UploadFiles } from 'element-plus'
import { useFileValidate } from '@/composables/useFileValidate'
import { usePaste } from '@/composables/usePaste'
import {
  ACCEPT_ATTR,
  ACCEPT_RASTER_ATTR,
  ACCEPT_SVG_ATTR,
  type InputKind,
  type ValidateSuccess,
} from '@/types/input'

export type AcceptedFile = ValidateSuccess & { file: File }

const DEFAULT_MAX_FILES = 30

const props = defineProps<{
  acceptKind?: InputKind
  photoWarning?: boolean
  hasFile?: boolean
  multiple?: boolean
  maxFiles?: number
}>()

const emit = defineEmits<{
  accepted: [payload: AcceptedFile]
  acceptedMany: [payload: AcceptedFile[]]
}>()

const { validate } = useFileValidate()
const uploadRef = ref<{ clearFiles: () => void } | null>(null)
let manyTimer: ReturnType<typeof setTimeout> | null = null

const limit = computed(() => props.maxFiles ?? (props.multiple ? DEFAULT_MAX_FILES : 1))

const accept = computed(() => {
  if (props.acceptKind === 'raster') return ACCEPT_RASTER_ATTR
  if (props.acceptKind === 'svg') return ACCEPT_SVG_ATTR
  return ACCEPT_ATTR
})

const hint = computed(() => {
  if (props.multiple) return `可一次拖入多张，最多 ${limit.value} 张 · PNG / JPG / WebP / BMP / GIF / SVG`
  if (props.acceptKind === 'raster') return '支持 Ctrl+V 粘贴 · PNG / JPG / WebP / BMP / GIF'
  if (props.acceptKind === 'svg') return '支持 Ctrl+V 粘贴 SVG 代码 · SVG 文件'
  return '支持 Ctrl+V 粘贴 · PNG / JPG / WebP / BMP / GIF / SVG'
})

async function validateOne(file: File, notify: boolean): Promise<AcceptedFile | null> {
  const result = await validate(file, {
    expect: props.acceptKind,
    photoWarning: props.photoWarning,
  })
  if (!result.ok) {
    if (notify) ElMessage.error(result.message)
    return null
  }
  if (notify && result.warning) ElMessage.warning(result.warning)
  if (notify && result.info) ElMessage.info(result.info)
  return { ...result, file }
}

async function acceptMany(files: File[]) {
  const unique = [...new Map(files.map((file) => [`${file.name}:${file.size}:${file.lastModified}`, file])).values()]
  const notify = unique.length === 1
  const accepted: AcceptedFile[] = []
  let skipped = 0
  for (const file of unique.slice(0, limit.value)) {
    const next = await validateOne(file, notify)
    if (next) accepted.push(next)
    else skipped += 1
  }
  if (unique.length > limit.value) {
    ElMessage.warning(`一次最多 ${limit.value} 张，已截取前 ${limit.value} 张`)
  }
  if (!accepted.length) {
    if (!notify) ElMessage.error('没有可处理的图片')
    return
  }
  if (skipped) ElMessage.warning(`已跳过 ${skipped} 个不支持的文件`)
  if (props.multiple) emit('acceptedMany', accepted)
  else emit('accepted', accepted[0])
  uploadRef.value?.clearFiles()
}

async function acceptFile(file: File) {
  await acceptMany([file])
}

function onChange(uploadFile: UploadFile, files: UploadFiles) {
  if (!props.multiple) {
    const raw = uploadFile.raw
    if (!raw) return
    if (files.length > 1) ElMessage.warning('当前仅处理第一个文件')
    void acceptFile(raw)
    return
  }
  const rawFiles: File[] = []
  for (const item of files) {
    if (item.raw) rawFiles.push(item.raw)
  }
  if (manyTimer) clearTimeout(manyTimer)
  manyTimer = setTimeout(() => {
    void acceptMany(rawFiles)
  }, 40)
}

function onExceed() {
  ElMessage.warning(props.multiple ? `一次最多 ${limit.value} 张` : '当前仅处理第一个文件')
}

usePaste((file) => {
  void acceptFile(file)
})

defineExpose({ acceptFile })
</script>

<template>
  <el-upload
    v-if="!hasFile"
    ref="uploadRef"
    class="uploader"
    drag
    :multiple="multiple"
    :auto-upload="false"
    :show-file-list="false"
    :limit="limit"
    :accept="accept"
    :on-change="onChange"
    :on-exceed="onExceed"
  >
    <p class="title">{{ multiple ? '拖拽多张图片到此处，或点击选择文件' : '拖拽图片到此处，或点击选择文件' }}</p>
    <p class="hint">{{ hint }}</p>
  </el-upload>
</template>

<style scoped>
.uploader {
  width: 100%;
}

.uploader :deep(.el-upload) {
  width: 100%;
}

.uploader :deep(.el-upload-dragger) {
  width: 100%;
  min-height: 240px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 24px;
}

.title {
  margin: 0;
  color: #606266;
}

.hint {
  margin: 8px 0 0;
  font-size: 13px;
  color: #909399;
}
</style>
