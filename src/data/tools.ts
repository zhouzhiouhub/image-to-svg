export type ToolStatus = 'available' | 'soon' | 'planned'

export type ToolItem = {
  id: string
  to: string
  title: string
  description: string
  status: ToolStatus
  statusLabel: string
}

export const tools: ToolItem[] = [
  {
    id: 'svg',
    to: '/svg',
    title: '位图 ↔ SVG',
    description: '把 PNG、JPG、WebP 转成 SVG，或把 SVG 导出为位图。适合图标、Logo 和网页内联。',
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
]
