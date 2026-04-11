# global_earthquake

基于 CesiumJS 的全球地震三维可视化项目。仓库同时支持两种运行方式：

- 本地服务模式：使用 `.localserver` 提供 `/api/*` 与 SQLite 数据仓。
- GitHub Pages 模式：直接读取仓库内的静态历史目录与本地 `geoBoundaries` 数据，不依赖后端。

## GitHub Pages 部署

GitHub Pages 只能托管静态站点，不能直接运行当前项目里的 C# / SQLite 本地服务。因此 Pages 发布时只同步前端与静态数据：

- `index.html`
- `app.js`
- `styles.css`
- `Cesium-1.139.1/Build/Cesium`
- `data/catalog`
- `data/geoboundaries`
- `.nojekyll`

仓库已包含自动发布工作流：

- [deploy-pages.yml](./.github/workflows/deploy-pages.yml)
- [build-pages-package.ps1](./scripts/build-pages-package.ps1)

首次启用 GitHub Pages：

1. 打开仓库 `Settings -> Pages`
2. 将 `Source` 设为 `GitHub Actions`
3. 推送到 `main`，或手动运行 `Deploy GitHub Pages` 工作流

本地预打包检查：

```powershell
.\scripts\build-pages-package.ps1 -OutputDir _site
```

## Pages 模式下可用能力

- 读取 `data/catalog` 内的静态历史地震目录
- 读取 `data/geoboundaries` 的 ADM0 / ADM1 边界做国家与子地区划分
- 页面加载后直接向 USGS 拉取最新事件做前端补充

## Pages 模式下不可用能力

- `.localserver` 的 `/api/*` 接口
- 本地 SQLite 增量写入与后台补库
- 任何依赖本地 .NET 进程的功能

## 更新静态数据

更新静态历史目录：

```powershell
dotnet run --project .\.localserver\StaticServer.csproj -- --export-static-catalog --output=.\data\catalog
```

更新 geoBoundaries 本地数据：

```powershell
py .\scripts\build_geoboundaries_data.py
```

## 本地运行

启动本地服务：

```powershell
.\start-localserver.ps1
```

如果只想验证静态页面，也可以直接使用仓库自带的简易静态服务器：

```powershell
.\serve.ps1
```
