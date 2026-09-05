import { ogLocale, translate, type Locale } from './i18n/messages'

export const SITE_NAME = 'Kinolin Tool'
export const DEFAULT_SITE_URL = 'https://tool.kinolin.com'

export type SeoPage = {
  path: string
  index?: boolean
}

export const seoPages: Record<string, SeoPage> = {
  home: { path: '/' },
  svg: { path: '/svg' },
  edit: { path: '/edit' },
  export: { path: '/export' },
  ico: { path: '/ico' },
  privacy: { path: '/privacy' },
  notFound: { path: '/404', index: false },
}

export const INDEXABLE_ROUTE_NAMES = ['home', 'svg', 'edit', 'export', 'ico', 'privacy'] as const

export function canonicalUrl(path: string, origin: string) {
  const base = (origin || DEFAULT_SITE_URL).replace(/\/$/, '')
  const normalized = path === '/' ? '/' : path
  return `${base}${normalized}`
}

export function seoSnapshot(routeName: string, origin: string, locale: Locale = 'zh') {
  const key = routeName in seoPages ? routeName : 'notFound'
  const page = seoPages[key] ?? seoPages.notFound
  const url = canonicalUrl(page.path, origin)
  const title = translate(locale, `seo.${key}.title`)
  const description = translate(locale, `seo.${key}.description`)
  const fullTitle = key === 'home' ? title : `${title} · ${SITE_NAME}`
  const indexable = page.index !== false
  return {
    key,
    page,
    url,
    fullTitle,
    description,
    robots: indexable ? 'index, follow' : 'noindex, follow',
    jsonLd: jsonLd(description, url, key, locale, title),
    ogLocale: ogLocale(locale),
    inLanguage: locale === 'en' ? 'en' : 'zh-CN',
  }
}

function jsonLd(description: string, url: string, key: string, locale: Locale, pageTitle: string) {
  const inLanguage = locale === 'en' ? 'en' : 'zh-CN'
  const website = {
    '@type': 'WebSite',
    name: SITE_NAME,
    url: key === 'home' ? url : canonicalUrl('/', urlOrigin(url)),
    inLanguage,
  }
  const app = {
    '@type': 'WebApplication',
    name: SITE_NAME,
    applicationCategory: 'MultimediaApplication',
    operatingSystem: 'Any',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'CNY',
    },
    description,
    url: key === 'notFound' ? website.url : url,
    inLanguage,
    featureList: [
      translate(locale, 'tools.svg.title'),
      translate(locale, 'tools.edit.title'),
      translate(locale, 'tools.export.title'),
      translate(locale, 'tools.ico.title'),
    ],
  }
  if (key === 'home' || key === 'privacy') {
    return { '@context': 'https://schema.org', '@graph': [website, app] }
  }
  if (key === 'notFound') {
    return { '@context': 'https://schema.org', '@graph': [website] }
  }
  const crumbs = {
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: SITE_NAME,
        item: canonicalUrl('/', urlOrigin(url)),
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: pageTitle,
        item: url,
      },
    ],
  }
  return { '@context': 'https://schema.org', '@graph': [website, app, crumbs] }
}

function urlOrigin(url: string) {
  if (url.startsWith('http://') || url.startsWith('https://')) {
    try {
      return new URL(url).origin
    } catch {
      return ''
    }
  }
  return ''
}

function escapeAttr(value: string) {
  return value.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;')
}

function replaceMeta(html: string, attr: 'name' | 'property', key: string, content: string) {
  const re = new RegExp(`(<meta\\s+${attr}="${key}"\\s+content=")[^"]*(")`, 'is')
  if (!re.test(html)) return html
  return html.replace(re, `$1${escapeAttr(content)}$2`)
}

export function htmlWithRouteSeo(html: string, routeName: string, origin: string, locale: Locale = 'zh') {
  const seo = seoSnapshot(routeName, origin, locale)
  let next = html.replace(/<html lang="[^"]*"/, `<html lang="${seo.inLanguage}"`)
  next = next.replace(/<title>[^<]*<\/title>/, `<title>${escapeAttr(seo.fullTitle)}</title>`)
  next = replaceMeta(next, 'name', 'description', seo.description)
  next = replaceMeta(next, 'name', 'robots', seo.robots)
  next = replaceMeta(next, 'property', 'og:title', seo.fullTitle)
  next = replaceMeta(next, 'property', 'og:description', seo.description)
  next = replaceMeta(next, 'property', 'og:url', seo.url)
  next = replaceMeta(next, 'property', 'og:locale', seo.ogLocale)
  next = replaceMeta(next, 'name', 'twitter:title', seo.fullTitle)
  next = replaceMeta(next, 'name', 'twitter:description', seo.description)
  next = next.replace(
    /<link\s+rel="canonical"[^>]*>/i,
    `<link rel="canonical" href="${escapeAttr(seo.url)}" />`,
  )
  next = next.replace(
    /<script id="seo-jsonld"[^>]*>[\s\S]*?<\/script>/,
    `<script id="seo-jsonld" type="application/ld+json">${JSON.stringify(seo.jsonLd).replace(/</g, '\\u003c')}</script>`,
  )
  return next
}
