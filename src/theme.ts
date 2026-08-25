import { computed, ref } from 'vue'

export type Theme = 'light' | 'dark'

export const THEME_KEY = 'kinolin-theme'

const theme = ref<Theme>('light')

function isTheme(value: string | null | undefined): value is Theme {
  return value === 'light' || value === 'dark'
}

export function detectTheme(): Theme {
  if (typeof localStorage !== 'undefined') {
    const stored = localStorage.getItem(THEME_KEY)
    if (isTheme(stored)) return stored
  }
  if (typeof matchMedia === 'function' && matchMedia('(prefers-color-scheme: dark)').matches) {
    return 'dark'
  }
  return 'light'
}

export function applyTheme(next: Theme) {
  if (typeof document === 'undefined') return
  const root = document.documentElement
  root.classList.toggle('dark', next === 'dark')
  root.style.colorScheme = next
  document.body?.classList.toggle('dark', next === 'dark')
  const meta = document.head.querySelector('meta[name="theme-color"]')
  if (meta) meta.setAttribute('content', next === 'dark' ? '#0f0f0f' : '#ffffff')
}

export function setTheme(next: Theme) {
  theme.value = next
  if (typeof localStorage !== 'undefined') localStorage.setItem(THEME_KEY, next)
  applyTheme(next)
}

export function initTheme() {
  setTheme(detectTheme())
}

export function useTheme() {
  return {
    theme,
    isDark: computed(() => theme.value === 'dark'),
    setTheme,
  }
}

if (typeof window !== 'undefined') {
  initTheme()
}
