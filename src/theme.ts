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
  const isDark = next === 'dark'
  root.classList.toggle('dark', isDark)
  document.body?.classList.toggle('dark', isDark)
  if (root.style.colorScheme !== next) root.style.colorScheme = next
  const expected = isDark ? '#0f0f0f' : '#ffffff'
  const meta = document.head.querySelector('meta[name="theme-color"]')
  if (meta && meta.getAttribute('content') !== expected) meta.setAttribute('content', expected)
}

export function setTheme(next: Theme) {
  theme.value = next
  if (typeof localStorage !== 'undefined') localStorage.setItem(THEME_KEY, next)
  applyTheme(next)
}

export function initTheme() {
  const next = detectTheme()
  theme.value = next
  const root = typeof document === 'undefined' ? null : document.documentElement
  const alreadyDark = !!root?.classList.contains('dark')
  if (next === 'dark' && alreadyDark) return
  if (next === 'light' && !alreadyDark) return
  applyTheme(next)
}

export function useTheme() {
  return {
    theme,
    isDark: computed(() => theme.value === 'dark'),
    setTheme,
  }
}
