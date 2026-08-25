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

const props = defineProps<{
  acceptKind?: InputKind
  photoWarning?: boolean
}>()

const emit = defineEmits<{
  accepted: [payload: AcceptedFile]
}>()

const { validate } = useFileValidate()
const uploaded = ref(false)

const accept = computed(() => {
  if (props.acceptKind === 'raster') return ACCEPT_RASTER_ATTR
  if (props.acceptKind === 'svg') return ACCEPT_SVG_ATTR
  return ACCEPT_ATTR
})

const hint = computed(() => {
  if (props.acceptKind === 'raster') return '支持 Ctrl+V 粘贴 · PNG / JPG / WebP / BMP / GIF'
  if (props.acceptKind === 'svg') return '支持 Ctrl+V 粘贴 SVG 代码 · SVG 文件'
  return '支持 Ctrl+V 粘贴 · PNG / JPG / WebP / BMP / GIF / SVG'
})

async function acceptFile(file: File) {
  const result = await validate(file, {
    expect: props.acceptKind,
    photoWarning: props.photoWarning,
  })
  if (!result.ok) {
    ElMessage.error(result.message)
    return
  }
  if (result.warning) ElMessage.warning(result.warning)
  if (result.info) ElMessage.info(result.info)
  uploaded.value = true
  emit('accepted', { ...result, file })
}

function onChange(uploadFile: UploadFile, files: UploadFiles) {
  const raw = uploadFile.raw
  if (!raw) return
  if (files.length > 1) {
    ElMessage.warning('当前仅处理第一个文件')
  }
  void acceptFile(raw)
}

function onExceed() {
  ElMessage.warning('当前仅处理第一个文件')
}

usePaste((file) => {
  void acceptFile(file)
})

defineExpose({ acceptFile })
</script>

<template>
  <el-upload
    v-if="!uploaded"
    class="uploader"
    drag
    :auto-upload="false"
    :show-file-list="false"
    :limit="1"
    :accept="accept"
    :on-change="onChange"
    :on-exceed="onExceed"
  >
    <p class="title">拖拽图片到此处，或点击选择文件</p>
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
