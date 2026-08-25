# Kinolin Tool

浏览器里的本地图片工具：把 PNG / JPG 转成 SVG，也可以裁剪、旋转、改尺寸，以及转换 PNG / JPEG / WebP 并压缩。

图片只在本机处理，不上传服务器。打开页面即可使用，适合图标、线稿、截图和需要批量转格式的日常处理。

仓库：<https://github.com/zhouzhiouhub/image-to-svg>

## 能做什么

| 页面 | 功能 |
|---|---|
| `/svg` 图片转 SVG | **原样封装**：像素封进 SVG，外观与透明度和原图一致。**矢量描摹**：描成可缩放路径，适合图标和线稿；可调黑白 / 多色、层数、去噪。 |
| `/edit` 调整画面 | 旋转、翻转、框选裁剪，再按像素或比例改尺寸。导出保持原图格式。 |
| `/export` 转格式 / 压缩 | 转为 PNG、JPEG、WebP，或按原格式压缩。可一次处理多张并打包 zip。 |
| `/privacy` 隐私与安全 | 说明图片不离开设备，以及本机操作记录如何保存。 |

输入支持拖拽、点击选择、`Ctrl+V` 粘贴。格式包括 PNG、JPG、WebP、BMP、GIF、SVG。

其它说明：

- 单文件不超过 20 MB，最长边不超过 4096 px
- 转格式一次最多 30 张
- 最近结果保存在本机 IndexedDB（最多 12 条），清除站点数据或在页面里清空后才会消失
- 顶栏可切换中 / 英、浅色 / 深色

## 本地开发

需要 Node.js 22+ 与 [pnpm](https://pnpm.io/) 10。

```bash
pnpm install
pnpm dev
```

默认打开 <http://localhost:5173/>。

```bash
pnpm typecheck   # 类型检查
pnpm build       # 产出 dist/
pnpm preview     # 预览构建结果
```

可选环境变量见 `.env.example`：

| 变量 | 用途 |
|---|---|
| `VITE_BASE` | 资源前缀，默认 `/` |
| `VITE_APP_TITLE` | 页面标题（可选） |
| `VITE_SITE_URL` | 站点公开地址。构建时写入 sitemap、绝对 canonical 与 Open Graph URL |

复制为 `.env.local` 后按需填写，不要提交密钥。本项目不需要后端 API。

## 部署

静态站点，构建产物在 `dist/`。当前配置面向 [Cloudflare Workers 静态资源](https://developers.cloudflare.com/workers/static-assets/)：

```bash
pnpm build
pnpm deploy        # wrangler deploy
pnpm cf:preview    # 本地 wrangler 预览
```

`wrangler.jsonc` 使用：

- `html_handling: drop-trailing-slash`
- `not_found_handling: 404-page`

构建时会为 `/`、`/svg`、`/edit`、`/export`、`/privacy` 各写一份带 SEO 的 `index.html`。因此 **不要** 在 `public/_redirects` 里加 `/* /index.html 200`：在 Cloudflare 上会与 HTML 处理规则形成重定向环。

`public/_redirects` 只保留旧路径的 301（例如 `/format` → `/export`）。`public/_headers` 提供 CSP、WASM MIME 与缓存策略。

若站点有公开域名，构建前设置 `VITE_SITE_URL`（不要末尾斜杠），以便生成 `sitemap.xml` 与 `robots.txt`。

## 技术栈

Vue 3、TypeScript、Vite、Vue Router、Element Plus。描摹使用 `imagetracerjs` 与 `esm-potrace-wasm`，在浏览器 Worker 中运行。

`reference/` 仅作背景阅读，不参与本应用构建。

## 许可

源码公开，便于核对是否包含网络上传。使用与分发以本仓库为准。
