import { zh } from './zh'
import { en } from './en'

export type Locale = 'zh' | 'en'

export const LOCALES: Locale[] = ['zh', 'en']
export const DEFAULT_LOCALE: Locale = 'zh'
export const STORAGE_KEY = 'kinolin-locale'
export const GITHUB_URL = 'https://github.com/zhouzhiouhub/image-to-svg'

export const messages = { zh, en } as const

type Vars = Record<string, string | number>

function lookup(source: unknown, path: string): string | undefined {
  let cur: unknown = source
  for (const part of path.split('.')) {
    if (!cur || typeof cur !== 'object' || !(part in cur)) return undefined
    cur = (cur as Record<string, unknown>)[part]
  }
  return typeof cur === 'string' ? cur : undefined
}

export function isLocale(value: string | null | undefined): value is Locale {
  return value === 'zh' || value === 'en'
}

export function htmlLang(locale: Locale) {
  return locale === 'en' ? 'en' : 'zh-CN'
}

export function ogLocale(locale: Locale) {
  return locale === 'en' ? 'en_US' : 'zh_CN'
}

export function translate(locale: Locale, key: string, vars?: Vars) {
  const raw = lookup(messages[locale], key) ?? lookup(messages.zh, key) ?? key
  if (!vars) return raw
  return raw.replace(/\{(\w+)\}/g, (_, name: string) => String(vars[name] ?? `{${name}}`))
}

export function detectLocale(search = ''): Locale {
  const fromQuery = new URLSearchParams(search).get('lang')
  if (isLocale(fromQuery)) return fromQuery
  if (typeof localStorage !== 'undefined') {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (isLocale(stored)) return stored
  }
  if (typeof navigator !== 'undefined' && navigator.language.toLowerCase().startsWith('en')) return 'en'
  return DEFAULT_LOCALE
}
