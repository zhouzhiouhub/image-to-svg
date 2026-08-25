import { fileURLToPath, URL } from 'node:url'
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { defineConfig, type Plugin } from 'vite'
import vue from '@vitejs/plugin-vue'
import wasm from 'vite-plugin-wasm'
import AutoImport from 'unplugin-auto-import/vite'
import Components from 'unplugin-vue-components/vite'
import { ElementPlusResolver } from 'unplugin-vue-components/resolvers'
import { htmlWithRouteSeo, INDEXABLE_ROUTE_NAMES, seoPages } from './src/seoPages.ts'

const SITE_URL = (process.env.VITE_SITE_URL ?? '').replace(/\/$/, '')

function inlineEntryCssPlugin(): Plugin {
  return {
    name: 'inline-entry-css',
    apply: 'build',
    enforce: 'post',
    transformIndexHtml: {
      order: 'post',
      handler(html, ctx) {
        if (!ctx.bundle) return html
        const assets = Object.values(ctx.bundle)
        return html.replace(/<link\s+rel="stylesheet"[^>]*href="([^"]+)"[^>]*>/gi, (tag, href: string) => {
          const fileName = href.replace(/[?#].*$/, '').replace(/^.*\/(assets\/)/, '$1')
          const asset = assets.find((item) => item.type === 'asset' && item.fileName.replace(/\\/g, '/') === fileName)
          if (!asset || asset.type !== 'asset') return tag
          const css = typeof asset.source === 'string' ? asset.source : new TextDecoder().decode(asset.source)
          return `<style>${css.replace(/<\/style/gi, '<\\/style')}</style>`
        })
      },
    },
  }
}

function seoFilesPlugin(): Plugin {
  return {
    name: 'kinolin-seo-files',
    closeBundle() {
      const dist = resolve(fileURLToPath(new URL('./dist', import.meta.url)))
      const indexPath = resolve(dist, 'index.html')
      const html = readFileSync(indexPath, 'utf8')
      for (const name of INDEXABLE_ROUTE_NAMES) {
        const page = seoPages[name]
        const next = htmlWithRouteSeo(html, name, SITE_URL)
        if (name === 'home') {
          writeFileSync(indexPath, next)
          continue
        }
        const dir = resolve(dist, page.path.replace(/^\//, ''))
        mkdirSync(dir, { recursive: true })
        writeFileSync(resolve(dir, 'index.html'), next)
      }
      if (!SITE_URL) return
      const lastmod = new Date().toISOString().slice(0, 10)
      const urls = INDEXABLE_ROUTE_NAMES.map((name) => {
        const path = seoPages[name].path
        const loc = path === '/' ? `${SITE_URL}/` : `${SITE_URL}${path}`
        const priority = name === 'home' ? '1.0' : '0.8'
        return `  <url>\n    <loc>${loc}</loc>\n    <lastmod>${lastmod}</lastmod>\n    <changefreq>weekly</changefreq>\n    <priority>${priority}</priority>\n  </url>`
      }).join('\n')
      writeFileSync(
        resolve(dist, 'sitemap.xml'),
        `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`,
      )
      writeFileSync(resolve(dist, 'robots.txt'), `User-agent: *\nAllow: /\n\nSitemap: ${SITE_URL}/sitemap.xml\n`)
    },
  }
}

export default defineConfig({
  base: process.env.VITE_BASE ?? '/',
  plugins: [
    vue(),
    wasm(),
    AutoImport({
      resolvers: [ElementPlusResolver({ importStyle: 'css' })],
    }),
    Components({
      resolvers: [ElementPlusResolver({ importStyle: 'css' })],
    }),
    inlineEntryCssPlugin(),
    seoFilesPlugin(),
  ],
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  assetsInclude: ['**/*.wasm'],
  worker: {
    format: 'es',
    plugins: () => [wasm()],
  },
  build: {
    target: 'es2022',
    assetsInlineLimit: 0,
    sourcemap: false,
    outDir: 'dist',
    emptyOutDir: true,
  },
})
