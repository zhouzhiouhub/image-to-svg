<script setup lang="ts">
import { ElMessage } from 'element-plus'
import type { UploadFile, UploadFiles } from 'element-plus'
import { useFileValidate } from '@/composables/useFileValidate'
import { usePaste } from '@/composables/usePaste'
import { ACCEPT_ATTR, type ValidateSuccess } from '@/types/input'

export type AcceptedFile = ValidateSuccess & { file: File }

const emit = defineEmits<{
  accepted: [payload: AcceptedFile]
}>()

const { validate } = useFileValidate()

async function acceptFile(file: File) {
  const result = await validate(file)
  if (!result.ok) {
    ElMessage.error(result.message)
    return
  }
  if (result.warning) ElMessage.warning(result.warning)
  if (result.info) ElMessage.info(result.info)
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
    class="uploader"
    drag
    :auto-upload="false"
    :show-file-list="false"
    :limit="1"
    :accept="ACCEPT_ATTR"
    :on-change="onChange"
    :on-exceed="onExceed"
  >
    <p class="title">拖拽图片到此处，或点击选择文件</p>
    <p class="hint">支持 Ctrl+V 粘贴 · PNG / JPG / WebP / BMP / GIF / SVG</p>
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
