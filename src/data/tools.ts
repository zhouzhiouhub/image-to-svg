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
        id: 'export',
        to: '/svg/export',
        title: 'SVG 转位图',
        description: '把 SVG 导出为 PNG、JPEG 或 WebP，可调倍率、质量和背景。',
        status: 'available',
        statusLabel: '可用',
      },
      {
        id: 'format',
        to: '/format',
        title: '图片格式转换',
        description: '在 PNG、JPEG、WebP 等常见格式之间互转，按目标场景选择体积与透明通道。',
        status: 'soon',
        statusLabel: '即将推出',
      },
      {
        id: 'resize',
        to: '/resize',
        title: '图片尺寸调整',
        description: '按像素、比例缩放或裁剪后导出，方便适配头像、封面和不同平台规格。',
        status: 'soon',
        statusLabel: '即将推出',
      },
      {
        id: 'app',
        to: '/app',
        title: '桌面应用',
        description: '后续会把这套工具打包成可下载应用，方便需要离线、批量使用的人安装。',
        status: 'planned',
        statusLabel: '规划中',
      },
    ],
  },
]
