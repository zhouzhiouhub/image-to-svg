export {}

declare module 'vue-router' {
  interface RouteMeta {
    title?: string
    description?: string
    statusLabel?: string
    tool?: 'preserve' | 'vector'
  }
}
