import type { RouteLocationNormalized } from 'vue-router'
import { currentLocale, htmlLang } from './i18n'
import { SITE_NAME, seoSnapshot } from './seoPages'

export {
  SITE_NAME,
  seoPages,
  INDEXABLE_ROUTE_NAMES,
  canonicalUrl,
  seoSnapshot,
  htmlWithRouteSeo,
} from './seoPages'

function siteOrigin() {
  const fromEnv = import.meta.env.VITE_SITE_URL?.replace(/\/$/, '')
  if (fromEnv) return fromEnv
  if (typeof window !== 'undefined' && window.location?.origin) return window.location.origin
  return ''
}

function upsertMeta(selector: string, attrs: Record<string, string>) {
  let el = document.head.querySelector(selector)
  if (!el) {
    el = document.createElement('meta')
    document.head.appendChild(el)
  }
  for (const [key, value] of Object.entries(attrs)) {
    el.setAttribute(key, value)
  }
}

function upsertLink(rel: string, href: string) {
  let el = document.head.querySelector(`link[rel="${rel}"]`) as HTMLLinkElement | null
  if (!el) {
    el = document.createElement('link')
    el.rel = rel
    document.head.appendChild(el)
  }
  el.href = href
}

export function applyRouteSeo(to: RouteLocationNormalized) {
  const name = typeof to.name === 'string' ? to.name : 'notFound'
  const locale = currentLocale()
  const seo = seoSnapshot(name, siteOrigin(), locale)

  document.documentElement.lang = htmlLang(locale)
  document.title = seo.fullTitle
  upsertMeta('meta[name="description"]', { name: 'description', content: seo.description })
  upsertMeta('meta[name="robots"]', { name: 'robots', content: seo.robots })
  upsertMeta('meta[property="og:title"]', { property: 'og:title', content: seo.fullTitle })
  upsertMeta('meta[property="og:description"]', { property: 'og:description', content: seo.description })
  upsertMeta('meta[property="og:url"]', { property: 'og:url', content: seo.url })
  upsertMeta('meta[property="og:type"]', { property: 'og:type', content: 'website' })
  upsertMeta('meta[property="og:locale"]', { property: 'og:locale', content: seo.ogLocale })
  upsertMeta('meta[property="og:site_name"]', { property: 'og:site_name', content: SITE_NAME })
  upsertMeta('meta[name="twitter:card"]', { name: 'twitter:card', content: 'summary' })
  upsertMeta('meta[name="twitter:title"]', { name: 'twitter:title', content: seo.fullTitle })
  upsertMeta('meta[name="twitter:description"]', { name: 'twitter:description', content: seo.description })
  upsertLink('canonical', seo.url)

  const ld = document.getElementById('seo-jsonld')
  if (ld) ld.textContent = JSON.stringify(seo.jsonLd)
}
