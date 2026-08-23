# 数智-红途

数智-红途是一个聚焦江西省红色旅游资源的红色文旅智能导览平台。当前版本以网页原型为主，围绕江西全省 44 个红色点位，根据用户的出发县区、出发日期、游览天数、学习主题、体验偏好和实践目的，生成可解释、可调整的红色旅游路线。

线上演示地址：

https://shujing-hongtu-jiangxi.eddiemarxfrancelyon.chatgpt.site

> 说明：当前线上站点为 ChatGPT Site 发布版本，访问权限可能受站点设置影响。若无法访问，可以使用项目根目录下的 `数智-红途-离线完整版.html` 直接打开演示。

## 项目定位

当前版本主要展示：

- 江西红色文旅点位资源库
- 智能路线生成与推荐
- 路线地图展示
- 点位详情查看
- 路线顺序调整、替换、删除
- 本地浏览器保存路线
- 单文件离线版演示

后续产品方向计划从 toC 游客导览，逐步升级为面向政府文旅部门、红色文旅企业和培训基地的 toB 路线设计与优化平台，重点扩展路线方案、课程培训方案、小程序执行、预约入口和行后总结等能力。

## 点位数据

项目当前收录 44 个江西红色文旅点位，覆盖区域包括：

- 井冈山
- 于都
- 瑞金
- 南昌
- 安源
- 上饶
- 兴国
- 宁都
- 寻乌
- 庐山

每个点位包含：

- 点位名称
- 所属区域与县区
- 宣传图片
- 经纬度
- 建议停留时间
- 固定闭馆日
- 是否核心历史节点
- 红色文化主题评分
- 体验方式评分
- 简介文案

点位图片位于 `public/landmarks/`，图片核验记录见 `docs/44-point-image-audit.md`。

## 核心功能

### 1. 智能路线生成

用户选择出发县区、出发日期、游览天数、实践目的、内容主题和体验偏好后，系统会根据预设路线骨架、点位评分、开放日和估算通行时间生成多条差异化路线。

### 2. 推荐结果解释

每条路线会展示：

- 路线名称
- 推荐理由
- 综合匹配分
- 内容维度匹配度
- 每日行程安排
- 江西省路线地图

### 3. 路线编辑

用户可以对生成路线进行轻量调整：

- 上移或下移点位顺序
- 替换非核心点位
- 删除非核心点位
- 保存路线到当前浏览器

核心历史节点默认不可删除，用于保证路线叙事完整性。

### 4. 点位图鉴

点位图鉴展示 44 个点位，可按区域筛选。点击点位卡片后，可以查看点位简介、建议停留时间、节点属性和内容维度评分。

### 5. 离线完整版

项目支持导出单文件 HTML：

```text
数智-红途-离线完整版.html
```

该文件内嵌页面样式、功能代码和 44 张点位图片，可直接双击打开，不依赖本地开发服务器。

## 技术栈

- React 19
- Next.js 16
- Vite 8
- Vinext
- TypeScript
- Tailwind CSS 4
- Cloudflare / ChatGPT Sites 发布结构

## 目录结构

```text
.
├── app/
│   ├── page.tsx              # 页面内容、点位数据、路线算法和交互逻辑
│   ├── globals.css           # 全局样式
│   ├── layout.tsx            # 页面元信息与根布局
│   ├── jiangxi-map.ts        # 江西省地图基础数据
│   └── jiangxi-counties.ts   # 江西省县级行政区地图数据
├── public/
│   └── landmarks/            # 44 张点位宣传图
├── docs/
│   └── 44-point-image-audit.md
├── standalone/               # 单文件 HTML 导出工具
├── tests/                    # 离线版和渲染测试
├── scripts/                  # 构建、导出、本地启动辅助脚本
├── worker/                   # Cloudflare Worker / Vinext 入口
├── .openai/hosting.json      # ChatGPT Sites 项目配置
└── 本地运行说明.md
```

## 本地运行

### Windows / PowerShell

在项目根目录执行：

```powershell
.\scripts\dev-local.ps1
```

如果依赖已经安装，只想快速启动：

```powershell
.\scripts\dev-local.ps1 -SkipInstall
```

如需指定端口：

```powershell
.\scripts\dev-local.ps1 -Port 5174
```

### macOS / Linux

```bash
npm install
npm run dev:local
```

启动后访问终端输出的本地地址，默认通常为：

```text
http://127.0.0.1:5173/
```

## 常用命令

```bash
# 本地开发
npm run dev:local

# 构建部署版本
npm run build

# 重新生成单文件离线 HTML
npm run export:html

# 运行测试
npm test
```

Windows 环境推荐优先使用：

```powershell
.\scripts\dev-local.ps1
```

## 协作流程

建议协作者使用 Git 分支协作：

```bash
git pull
git checkout -b feature/your-feature-name
```

完成修改后：

```bash
git add .
git commit -m "描述本次修改"
git push
```

如果使用 GitHub 或 Gitee 远程仓库，建议将 ChatGPT Site 发布远程 `origin` 保留不动，另行添加协作远程，例如：

```bash
git remote add github https://github.com/your-name/shujing-hongtu.git
git remote add gitee https://gitee.com/your-name/shujing-hongtu.git
```

然后推送到对应远程：

```bash
git push -u github main
# 或
git push -u gitee main
```

## 后续规划

项目后续可以继续扩展为 toB 红色文旅路线设计平台，重点方向包括：

- 面向政府文旅部门的区域精品路线设计
- 面向红色文旅企业的路线产品组合
- 面向培训基地的课程培训方案
- 景点预约入口维护
- 小程序端路线执行
- 行后学习报告和活动总结
- 路线复盘与二次优化
- 云端方案库和多用户协作

## 注意事项

- 当前开放时间、通行时间等数据主要用于演示，正式使用前需要以景区官方信息为准。
- 当前路线保存使用浏览器本地存储，清理浏览器数据后可能丢失。
- `数智-红途-离线完整版.html` 是演示用产物，主要方便无开发环境时直接展示。
- `node_modules/`、构建产物和临时文件不应提交到远程仓库。
