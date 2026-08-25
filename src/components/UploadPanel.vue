<script setup lang="ts">
import { computed, ref } from 'vue'
import { ElMessage } from 'element-plus'
import type { UploadFile, UploadFiles } from 'element-plus'
import { useFileValidate } from '@/composables/useFileValidate'
import { usePaste } from '@/composables/usePaste'
import { t } from '@/i18n'
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
  if (props.multiple) return t('upload.hintMany', { n: limit.value })
  if (props.acceptKind === 'raster') return t('upload.hintRaster')
  if (props.acceptKind === 'svg') return t('upload.hintSvg')
  return t('upload.hint')
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
    ElMessage.warning(t('upload.maxSlice', { n: limit.value }))
  }
  if (!accepted.length) {
    if (!notify) ElMessage.error(t('upload.none'))
    return
  }
  if (skipped) ElMessage.warning(t('upload.skipped', { n: skipped }))
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
    if (files.length > 1) ElMessage.warning(t('upload.firstOnly'))
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
  ElMessage.warning(props.multiple ? t('upload.maxOnly', { n: limit.value }) : t('upload.firstOnly'))
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
    <p class="title">{{ multiple ? t('upload.titleMany') : t('upload.title') }}</p>
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
  background-color: var(--app-surface);
  border-color: var(--app-dashed);
}

.title {
  margin: 0;
  color: var(--app-muted);
}

.hint {
  margin: 8px 0 0;
  font-size: 13px;
  color: var(--app-faint);
}
</style>
