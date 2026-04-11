<div align="center">

# Global Earthquake

**基于 CesiumJS 的全球地震 3D 可视化与分析系统**

面向全球地震活动展示、区域比较分析、教学汇报与 GitHub Pages 在线发布。

<p>
  <img alt="CesiumJS" src="https://img.shields.io/badge/CesiumJS-1.139.1-0ea5e9?style=flat-square" />
  <img alt="Data Source" src="https://img.shields.io/badge/Data-USGS%20%2B%20geoBoundaries-22c55e?style=flat-square" />
  <img alt="Runtime" src="https://img.shields.io/badge/Runtime-HTML%20%2F%20JavaScript%20%2F%20.NET-111827?style=flat-square" />
  <img alt="Deploy" src="https://img.shields.io/badge/Deploy-GitHub%20Pages-2563eb?style=flat-square" />
</p>

</div>

基于 CesiumJS 的全球地震 3D 可视化与分析系统。项目聚焦两件事：一是在三维地球上高密度、长时间尺度地展示全球地震活动，二是围绕筛选后的数据提供可用于科研汇报、课程答辩、论文附图与教学演示的分析型可视化能力。

![Global Earthquake 项目截图](docs/images/project-page.png)

## 项目定位

这不是一个只负责“把点画在地球上”的演示页面。当前版本已经将以下能力整合为一个完整工作流：

- 全球 3D 地震分布浏览
- 历史目录与最新事件的混合加载
- 基于 geoBoundaries 的国家与地区边界识别
- 全中文国家/地区筛选与对比分析
- 多模块统计图构建
- SVG / PNG / CSV / JSON 导出
- GitHub Pages 静态部署
- 本地 SQLite 数据仓同步与增量写入

## 核心特性

### 1. 三维地球场景

- 基于 `CesiumJS 1.139.1` 构建全球 3D 场景
- 地震点支持两套视觉编码：
  - 震级模式：按震级着色与抬升
  - 深度模式：按深度着色与抬升
- 支持自动旋转与手动浏览
- 支持全球、环太平洋火环、地中海-喜马拉雅带、大西洋洋中脊等相机预设
- 支持经纬网、国家/地区边界图层开关

### 2. 时间与强度筛选

- 预置时间窗口：
  - `24 小时`
  - `30 天`
  - `1 年`
  - `10 年`
  - `1949 年至今`
- 支持自定义起止年份
- 支持最低震级阈值筛选
- 当前项目默认聚焦 `M3.0+` 事件，以兼顾分析价值与渲染性能

### 3. 国家 / 地区筛选系统

- 基于 `geoBoundaries ADM0 / ADM1` 数据进行国家与子地区划分
- 全中文国家/地区名称展示
- 支持按洲分组浏览
- 支持中文、英文、ISO 代码搜索
- 支持国家聚焦与全球重置
- 支持单国家视角下的子区域分析

### 4. 区域控制中心

- 按地区事件总数、平均震级、最大震级、平均深度进行地区排序
- 支持将多个国家 / 地区 / 子区域加入对比集合
- 支持清空选择、批量选择当前列表
- 所有分析模块都由这里的选区驱动

### 5. 分析工作台

当前分析模块覆盖：

- 事件总数对比
- 平均震级对比
- 最大震级对比
- 平均深度对比
- 时间趋势对比
- 震级分布对比
- 深度结构对比
- 能量释放对比

分析面板支持三种典型工作方式：

- 单地区分析
- 多地区横向比较
- 中央弹窗深度分析与导出

### 6. 学术导出与快照

- 中央分析窗口支持导出：
  - `SVG`
  - `PNG`
  - `CSV`
  - `JSON`
- 右侧分析控制台支持导出当前分析快照
- 导出图表围绕科研表达优化，适合用于：
  - PPT
  - 课程答辩
  - 研究汇报
  - 论文附图与补充材料

### 7. 数据加载与同步

项目支持两种运行模式：

| 模式 | 数据来源 | 是否需要后端 | 适用场景 |
| --- | --- | --- | --- |
| GitHub Pages 静态模式 | `data/catalog` + `data/geoboundaries` + USGS 最新事件前端补充 | 否 | 在线展示、公开部署 |
| 本地服务模式 | SQLite + 本地 API + 静态数据 + USGS 同步 | 是 | 本地分析、数据维护、目录更新 |

本地服务模式下支持：

- SQLite 历史目录查询
- 全量历史目录同步
- 最新事件增量写入
- 静态目录导出
- 同步状态追踪

## 页面功能总览

### 左侧控制区

- 时间跨度控制
- 最低震级控制
- 国家/地区筛选
- 视觉编码切换
- 3D 抬升模式切换
- 相机预设
- 图层控制与图例

### 中央场景区

- 3D 地球主视图
- 顶部数据概览栏
- 操作历史记录面板
- 最新状态与同步反馈

### 右侧分析区

- 学术分析控制台
- SQLite 同步状态摘要
- 核心统计快照
- 最新 / 最强事件摘要
- 区域控制中心
- 比较分析工作台
- 中央弹窗导出入口

## 数据来源与技术栈

### 数据来源

- `USGS Earthquake Catalog / GeoJSON`
- `geoBoundaries` 全球行政边界数据
- 本地静态历史目录 `data/catalog`
- 本地边界目录 `data/geoboundaries`

### 技术栈

- `CesiumJS 1.139.1`
- 原生 `HTML / CSS / JavaScript`
- `.NET` 本地服务
- `SQLite` 本地数据仓
- `PowerShell` 构建与部署脚本
- `Python` 边界数据处理脚本

## 运行方式

### 方式一：静态页面预览

适合验证前端界面、GitHub Pages 产物与静态数据读取。

```powershell
.\serve.ps1
```

默认地址：

```text
http://127.0.0.1:8123
```

### 方式二：本地完整服务模式

适合进行 SQLite 同步、目录维护与本地全功能联调。

```powershell
.\start-localserver.ps1
```

该模式会：

- 编译 `.localserver`
- 启动本地 API
- 提供静态页面
- 连接本地 SQLite 数据仓

## GitHub Pages 部署

项目已经兼容 GitHub Pages 静态部署。Pages 模式下不会启动本地 .NET 服务，而是直接读取仓库中的静态数据。

### Pages 发布内容

- `index.html`
- `app.js`
- `styles.css`
- `Cesium-1.139.1/Build/Cesium`
- `data/catalog`
- `data/geoboundaries`
- `.nojekyll`

### 本地打包

```powershell
.\scripts\build-pages-package.ps1 -OutputDir _site
```

### GitHub Pages 启用步骤

1. 打开仓库 `Settings -> Pages`
2. 将 `Source` 设为 `GitHub Actions`
3. 推送到默认分支，或手动运行 Pages 工作流

## 数据维护

### 导出静态历史目录

```powershell
dotnet run --project .\.localserver\StaticServer.csproj -- --export-static-catalog --output=.\data\catalog
```

### 重建 geoBoundaries 数据

```powershell
py .\scripts\build_geoboundaries_data.py
```

该脚本用于整理本地 `ADM0 / ADM1` 边界、名称与清洗后的行政区数据。

## 目录结构

```text
.
├─ index.html                     # 主页面结构
├─ app.js                         # 核心交互、渲染、分析与导出逻辑
├─ styles.css                     # 页面与分析系统样式
├─ data/
│  ├─ catalog/                    # 静态历史地震目录分批数据
│  └─ geoboundaries/              # ADM0 / ADM1 边界数据与清单
├─ .localserver/                  # 本地 .NET + SQLite 服务
├─ scripts/
│  ├─ build-pages-package.ps1     # GitHub Pages 打包脚本
│  └─ build_geoboundaries_data.py # 边界数据处理脚本
├─ Cesium-1.139.1/                # Cesium 运行时
└─ docs/images/                   # README 配图等文档资源
```

## 当前版本亮点

- 1949 年至今全球地震目录可直接浏览
- 地图边界与国家/地区筛选已经切换到本地 `geoBoundaries`
- 国家与地区名称已统一走中文展示链路
- 分析系统已经从单纯信息卡片升级为可导出图表工作台
- 支持静态部署与本地数据仓双模式运行
- 具备明显的教学展示、科研汇报与项目演示价值

## 适用场景

- 全球地震活动时空分布展示
- 国家 / 地区尺度的灾害对比分析
- 教学课程演示与答辩展示
- 学术汇报配图与导出
- GitHub Pages 在线项目展示

## 后续可继续扩展的方向

- 更多专题分析模块
- 更强的导出模板与批量导出
- 时间动画回放
- 板块边界与构造背景图层
- 更细粒度的地区统计与专题报告生成

## 致谢

- USGS Earthquake Catalog
- geoBoundaries
- CesiumJS

---

如果你希望把这个项目继续推进到“研究级地震分析平台”，下一步最值得做的是：完善分析窗口交互、增强导出模板、补充专题统计模块，并持续维护静态目录与本地 SQLite 数据仓的一致性。
