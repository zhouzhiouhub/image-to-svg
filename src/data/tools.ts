export type ToolStatus = 'available' | 'soon' | 'planned'

export type ToolItem = {
  id: string
  to: string
  title: string
  description: string
  status: ToolStatus
  statusLabel: string
}

export type ToolGroup = {
  title: string
  intro?: string
  tools: ToolItem[]
}

export const toolGroups: ToolGroup[] = [
  {
    title: '图片转 SVG',
    intro: '两种做法效果不同，请按需要选择。',
    tools: [
      {
        id: 'preserve',
        to: '/svg/preserve',
        title: '原样转 SVG',
        description: '把 PNG、JPG 原样封进 SVG，颜色和透明与原图一致。适合只要外观一样、不需要路径编辑的场景。',
        status: 'available',
        statusLabel: '可用',
      },
      {
        id: 'vector',
        to: '/svg/vector',
        title: '矢量描摹',
        description: '把位图描成可缩放的矢量路径，适合图标和线稿。复杂渐变会被拆成色块，可能和原图有差别。',
        status: 'available',
        statusLabel: '可用',
      },
    ],
  },
  {
    title: '其他工具',
    tools: [
      {
        id: 'format',
        to: '/format',
        title: '图片格式转换',
        description: '在 PNG、JPEG、WebP 等常见格式之间互转。可一次处理多张并打包 zip。',
        status: 'available',
        statusLabel: '可用',
      },
      {
        id: 'resize',
        to: '/resize',
        title: '图片尺寸调整',
        description: '按像素、比例缩放或裁剪后导出，方便适配头像、封面和不同平台规格。',
        status: 'available',
        statusLabel: '可用',
      },
      {
        id: 'compress',
        to: '/compress',
        title: '图片压缩',
        description: '在浏览器本地压缩图片，默认尽量保留画质和原格式；压完更大则保留原文件。可一次处理多张。',
        status: 'available',
        statusLabel: '可用',
      },
      {
        id: 'rotate',
        to: '/rotate',
        title: '旋转与翻转',
        description: '将图片向左或向右旋转 90°，或水平、垂直翻转后导出。',
        status: 'available',
        statusLabel: '可用',
      },
      {
        id: 'crop',
        to: '/crop',
        title: '图片裁剪',
        description: '在原图上框选区域后导出，可锁定 1:1、4:3、16:9 比例。',
        status: 'available',
        statusLabel: '可用',
      },
    ],
  },
]
