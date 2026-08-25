import { computed, ref } from 'vue'
import {
  DEFAULT_LOCALE,
  STORAGE_KEY,
  detectLocale,
  htmlLang,
  translate,
  type Locale,
} from './messages'

export {
  GITHUB_URL,
  LOCALES,
  htmlLang,
  ogLocale,
  translate,
  type Locale,
} from './messages'

const locale = ref<Locale>(DEFAULT_LOCALE)

export function t(key: string, vars?: Record<string, string | number>) {
  return translate(locale.value, key, vars)
}

export function applyDocumentLang(next: Locale) {
  if (typeof document === 'undefined') return
  document.documentElement.lang = htmlLang(next)
}

export function setLocale(next: Locale) {
  locale.value = next
  if (typeof localStorage !== 'undefined') localStorage.setItem(STORAGE_KEY, next)
  applyDocumentLang(next)
}

export function initLocale(search = typeof window === 'undefined' ? '' : window.location.search) {
  setLocale(detectLocale(search))
}

export function useI18n() {
  return {
    locale,
    isEn: computed(() => locale.value === 'en'),
    t,
    setLocale,
  }
}

export function currentLocale() {
  return locale.value
}

if (typeof window !== 'undefined') {
  initLocale()
}
