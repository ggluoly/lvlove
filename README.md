# lvlin

一个由 React、Vite 和 GitHub Pages 驱动的静态个人影像档案。照片在构建时生成数据和多尺寸缩略图，网站不需要后端、数据库或第三方图片服务。

## 本地运行

前提：安装 Node.js 24 或更高版本。

```powershell
npm install
npm run generate:photos
npm run dev
```

执行生产构建、类型检查和测试：

```powershell
npm run typecheck
npm run test
npm run build
```

## 照片管理

### 日常新增照片

将原图平铺放到 `public/photos/`，并使用以下文件名规则：

```text
YYYYMMDDNNN.ext
```

- `YYYY`：四位年份。
- `MM`：两位月份。
- `DD`：两位日期。
- `NNN`：当天三位顺序号，从 `001` 开始。
- 支持 `.jpg`、`.jpeg`、`.png`、`.webp`、`.avif`。

示例：

```text
public/photos/20260925001.jpg
public/photos/20260925002.jpg
public/photos/20261001001.avif
```

运行 `npm run generate:photos` 后会：

1. 优先读取 EXIF `DateTimeOriginal`，否则读取规范文件名；仅在两者都不可用时才使用 Git 提交时间或文件修改时间。
2. 生成 `public/photos.json`。
3. 在 `public/photo-assets/` 生成 32px 占位图与 480、960、1440 宽的 AVIF/WebP 缩略图。

`photos.json` 与 `photo-assets/` 均为构建产物，已被 `.gitignore` 忽略，不需要提交。首次导入产生的 `photos.import-metadata.json` 会保留原始图片解析出的精确拍摄时间和日期来源，应随代码提交。

### 首次导入当前素材

项目保留了 `20260927/` 下的原始素材。首次导入已经完成；如需从其他来源目录导入，可以执行：

```powershell
$env:PHOTO_IMPORT_SOURCE = "来源目录"
npm run import:photos
```

脚本只会复制图片到 `public/photos/`，不会修改、删除或重命名来源目录中的文件。导入映射会输出到 `reports/import-manifest.json`，用于核验原始路径、规范名称、日期来源和内容哈希。

### 标题、地点、分类与标签

在仓库根目录的 `photos.metadata.json` 中，以规范文件名为键补充展示信息：

```json
{
  "20260925001.jpg": {
    "title": "晚餐后的街道",
    "location": "重庆",
    "album": "Life",
    "tags": ["night", "family"]
  }
}
```

没有元数据的照片默认使用文件名作为标题，分类为 `未分类`。相册分类不从目录名猜测。

## GitHub Pages 部署

1. 在 GitHub 创建一个新仓库并推送本项目。
2. 在仓库的 **Settings -> Pages** 中，将 **Build and deployment / Source** 设为 **GitHub Actions**。
3. 确认默认分支名称为 `main`；向该分支推送会触发 `.github/workflows/deploy.yml`。
4. Actions 会安装依赖、生成照片数据、运行类型检查和测试、构建站点并部署。
5. 部署完成后，项目页通常访问地址为：

```text
https://<GitHub 用户名>.github.io/<仓库名>/
```

工作流通过 `actions/configure-pages` 自动将正确的 Pages 基础路径传给 Vite。所有动态照片资源使用 `import.meta.env.BASE_URL` 拼接，因此可在仓库子路径下正常加载。

如果仓库名为 `<用户名>.github.io`，或使用自定义域名，Pages 会使用根路径 `/`，工作流同样会自动处理。

## 更新流程

日常新增照片或修改元数据后，只需：

```powershell
git add public/photos photos.metadata.json photos.import-metadata.json
git commit -m "Update lvlin archive"
git push
```

GitHub Actions 将自动构建和发布。首次导入的原始目录 `20260927/` 仅作为来源备份，不会被网站扫描。

## 常见问题

### 页面显示“档案暂时无法读取”

本地开发时先运行 `npm run generate:photos`。GitHub Actions 会自动执行此步骤。

### 新增照片没有出现在网站中

确认文件在 `public/photos/` 顶层，扩展名受支持，并且文件名符合 `YYYYMMDDNNN.ext`。构建脚本会在遇到非法文件名时失败并说明具体文件。

### GitHub Pages 图片 404

不要在 React 组件中手写 `/photos/...` 这类根路径 URL；请使用项目的 `assetUrl` 工具。构建和部署由工作流处理子路径。

### 首次构建耗时较长

首次需要为每张原图生成 AVIF 和 WebP 多尺寸缩略图。后续源图片不变时会复用已生成的派生资源。
