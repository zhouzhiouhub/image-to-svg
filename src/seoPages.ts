export const SITE_NAME = 'Kinolin Tool'

export const DEFAULT_DESCRIPTION =
  '免费在浏览器本地把 PNG、JPG 转成 SVG，也可裁剪、旋转、改尺寸，以及转换 PNG / JPEG / WebP 并压缩。图片不上传服务器。'

const OG_TITLE_HOME = 'Kinolin Tool - 本地图片转 SVG、裁剪与压缩'

export type SeoPage = {
  title: string
  description: string
  path: string
  index?: boolean
}

export const seoPages: Record<string, SeoPage> = {
  home: {
    title: OG_TITLE_HOME,
    description: DEFAULT_DESCRIPTION,
    path: '/',
  },
  svg: {
    title: '图片转 SVG',
    description:
      '把 PNG、JPG 转成 SVG：原样封装保持外观，或矢量描摹得到可编辑路径。全部在浏览器本地完成，图片不上传。',
    path: '/svg',
  },
  edit: {
    title: '调整画面',
    description:
      '在浏览器里旋转、翻转、框选裁剪图片，再按像素或比例改尺寸。导出保持原图格式，不上传服务器。',
    path: '/edit',
  },
  export: {
    title: '转格式 / 压缩',
    description:
      '将图片转为 PNG、JPEG 或 WebP，或按原格式压缩体积。支持一次处理多张并打包 zip，图片不离开浏览器。',
    path: '/export',
  },
  notFound: {
    title: '页面不存在',
    description: '没有这个页面。可以返回首页，或使用图片转 SVG、调整画面、转格式压缩。',
    path: '/404',
    index: false,
  },
}

export const INDEXABLE_ROUTE_NAMES = ['home', 'svg', 'edit', 'export'] as const

export function canonicalUrl(path: string, origin: string) {
  const base = origin.replace(/\/$/, '')
  const normalized = path === '/' ? '/' : path
  return base ? `${base}${normalized}` : normalized
}

export function seoSnapshot(routeName: string, origin: string) {
  const key = routeName in seoPages ? routeName : 'notFound'
  const page = seoPages[key] ?? seoPages.notFound
  const url = canonicalUrl(page.path, origin)
  const fullTitle = key === 'home' ? page.title : `${page.title} · ${SITE_NAME}`
  const indexable = page.index !== false
  return {
    key,
    page,
    url,
    fullTitle,
    description: page.description,
    robots: indexable ? 'index, follow' : 'noindex, follow',
    jsonLd: jsonLd(page, url, key),
  }
}

function jsonLd(page: SeoPage, url: string, key: string) {
  const website = {
    '@type': 'WebSite',
    name: SITE_NAME,
    url: key === 'home' ? url : canonicalUrl('/', urlOrigin(url)),
    inLanguage: 'zh-CN',
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
    description: page.description,
    url: key === 'notFound' ? website.url : url,
    inLanguage: 'zh-CN',
    featureList: ['图片转 SVG', '裁剪旋转改尺寸', '格式转换与压缩'],
  }
  if (key === 'home') {
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
        name: page.title,
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

export function htmlWithRouteSeo(html: string, routeName: string, origin: string) {
  const seo = seoSnapshot(routeName, origin)
  let next = html.replace(/<title>[^<]*<\/title>/, `<title>${escapeAttr(seo.fullTitle)}</title>`)
  next = replaceMeta(next, 'name', 'description', seo.description)
  next = replaceMeta(next, 'name', 'robots', seo.robots)
  next = replaceMeta(next, 'property', 'og:title', seo.fullTitle)
  next = replaceMeta(next, 'property', 'og:description', seo.description)
  next = replaceMeta(next, 'property', 'og:url', seo.url)
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
