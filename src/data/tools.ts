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
    title: '工具',
    tools: [
      {
        id: 'svg',
        to: '/svg',
        title: '图片转 SVG',
        description: '原样封装或矢量描摹。两种效果不同：前者外观一致，后者可当路径编辑。',
        status: 'available',
        statusLabel: '可用',
      },
      {
        id: 'edit',
        to: '/edit',
        title: '调整画面',
        description: '旋转、翻转、框选裁剪，再按像素或比例改尺寸。导出保持原图格式。',
        status: 'available',
        statusLabel: '可用',
      },
      {
        id: 'export',
        to: '/export',
        title: '转格式 / 压缩',
        description: '换成 PNG、JPEG、WebP，或按原格式压缩。可一次处理多张并打包 zip。',
        status: 'available',
        statusLabel: '可用',
      },
    ],
  },
]
