export type ToolStatus = 'available' | 'soon' | 'planned'

export type ToolId = 'svg' | 'edit' | 'export'

export type ToolItem = {
  id: ToolId
  to: string
  status: ToolStatus
}

export const homeTools: ToolItem[] = [
  { id: 'svg', to: '/svg', status: 'available' },
  { id: 'edit', to: '/edit', status: 'available' },
  { id: 'export', to: '/export', status: 'available' },
]
