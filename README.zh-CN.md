<div align="center">

# 🏢 MosaicHub Portal — 企业门户网站

**基于 Next.js 14 + MySQL + Prisma 构建的现代化模块化企业门户系统**

[![License](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](LICENSE)
[![Next.js](https://img.shields.io/badge/Next.js-14-black?logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-18-61DAFB?logo=react)](https://react.dev/)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3-06B6D4?logo=tailwindcss)](https://tailwindcss.com/)
[![Prisma](https://img.shields.io/badge/Prisma-ORM-2D3748?logo=prisma)](https://prisma.io/)
[![MySQL](https://img.shields.io/badge/MySQL-8.0-4479A1?logo=mysql&logoColor=white)](https://mysql.com/)

[English](README.md) | **简体中文**

首页布局、导航菜单、主题配色、侧栏弹窗均可在管理后台灵活配置，内置 AI 智能助手辅助内容创作与页面设计。

</div>

---

## 📸 界面预览

### 🏠 首页门户 — 模块化布局，灵活可配

![首页门户](docs/screenshots/homepage.jpg)

> 首页采用企业级门户布局，顶部集成站点品牌、搜索框、用户入口、主题切换和快捷导航。主体区域由 **轮播横幅**、**快捷入口**、**头条新闻**、**分类文章列表** 等模块组成，后台可自由控制显示/隐藏、排序、宽度、分类绑定和展示模板。

### 📰 文章详情 — 阅读、评论、互动一体化

![文章详情](docs/screenshots/post-detail.jpg)

> 文章详情页支持分类面包屑、作者信息、发布时间、浏览量、评论数展示，并内置 **收藏**、**支持**、**反对** 三类互动能力。评论区支持楼中楼回复，适合公告通知、新闻动态、意见反馈等多种内容场景。

### 🎨 用户主题色 — 每个用户独立个性化

![主题色切换](docs/screenshots/theme-picker.jpg)

> 系统内置多套主题色方案，例如经典红、科技蓝、生态绿、创意紫、暖橙色、深空灰等。主题通过 CSS 变量动态注入，并可按用户维度保存到数据库，实现不同用户登录后自动恢复自己的偏好主题。

### ⚙️ 管理后台 — 一站式运营管理

![管理后台](docs/screenshots/admin-dashboard.jpg)

> 管理中心提供 **数据概览仪表盘**（文章数、用户数、浏览量、评论数），以及 **发布文章**、**文章管理**、**评论管理**、**用户管理**、**导航管理**、**站点设置** 六大功能 Tab，支持分页搜索、分类筛选、批量操作，所有修改即时生效。

### 站点品牌配置 — 无代码修改站点信息

![站点品牌配置](docs/screenshots/site-settings.jpg)

> 后台可直接维护站点名称、站点简称、Logo 文字、Logo 副标题、站点描述、服务热线、版权信息、ICP备案号等基础信息。保存后 Header、Footer、登录页等公共组件会自动读取最新配置。

### 🧭 导航菜单管理 — 多级菜单、内外链灵活配置

![导航菜单管理](docs/screenshots/nav-management.jpg)

> 导航管理支持后台可视化维护门户顶部导航、页脚导航和多级菜单结构。管理员可以新增菜单名称、选择内置页面或手动输入外部链接，配置父级菜单、排序权重和显示状态。适合企业门户中常见的 **首页**、**互动反馈**、**建议征集**、**公告通知**、**新闻动态**、**信息查询** 等栏目管理，无需修改代码即可调整前台导航结构。

### 🛡️ 评论敏感词过滤 — 内容安全可控

![敏感词配置](docs/screenshots/sensitive-words.jpg)

> 支持在后台配置评论敏感词词库，用户提交评论时自动检测命中词，降低垃圾评论、违规内容和恶意刷屏风险。适合企业内部门户、政企信息发布、社区反馈等需要内容审核的场景。

### AI 布局设计器 — 对话式首页设计

![AI布局设计器](docs/screenshots/ai-layout-designer.jpg)

> 内置 **AI 布局设计器**，通过自然语言描述即可自动生成首页模块方案。左侧与 AI 对话，右侧实时预览模块排列，支持拖拽排序、调整宽度、修改分类绑定，满意后一键应用到首页。

### 🤖 AI 智能助手 — 多场景内容生成

![AI智能助手](docs/screenshots/ai-assistant.jpg)

> 集成 AI 助手面板，支持 **文章撰写**、**内容润色**、**HTML模块生成**、**摘要提取** 等功能，对话历史加密存储在数据库中，可随时回溯。支持 Markdown 渲染，生成内容可一键复制或直接添加到首页模块。

### 🔌 多 AI 服务商支持

![AI服务商配置](docs/screenshots/ai-provider-config.jpg)

> 支持 **OpenAI**、**Anthropic (Claude)**、**Google Gemini**、**通义千问 (Qwen)**、**DeepSeek**、**月之暗面 (Kimi)**、**智谱 (GLM)**、**百度文心一言** 及任意 **OpenAI 兼容** 接口，可自定义 API 地址、模型名称、Temperature、Max Tokens 等参数，API Key 使用 AES-256 加密存储。

### 🧱 AI HTML 页面生成 — 快速构建活动专题页

![AI HTML 页面示例 1](docs/screenshots/ai-html-page-demo-1.jpg)

> AI 可根据业务描述自动生成专题活动页、会议宣传页、公告展示页等 HTML 内容。系统通过 `SafeHtml` 沙箱 iframe 渲染，既能保证展示效果，又能隔离脚本风险，适合快速搭建营销页、培训通知、活动报名页和内部专题页。

---

## 🎯 适用场景

| 场景 | 可落地能力 |
|------|------------|
| **企业门户官网** | 新闻公告、品牌展示、部门信息、员工入口、搜索查询 |
| **政企信息公开平台** | 公告发布、意见反馈、建议征集、分类信息归档 |
| **医院/学校/园区内部门户** | 通知通告、活动专题、培训会议、资料发布 |
| **行业资讯网站** | 多分类内容发布、文章互动、评论反馈、置顶推荐 |
| **AI 辅助内容平台** | AI 写作、AI 布局、AI HTML 页面生成、多模型接入 |
| **低成本定制门户** | 快速改 Logo、改主题、改导航、改模块，降低二次开发成本 |

---

## ✨ 核心功能

### 📋 内容管理
| 功能 | 说明 |
|------|------|
| **文章发布** | 支持富文本/HTML内容、封面图上传、摘要生成、分类选择 |
| **置顶管理** | 文章可设为置顶，自定义排序权重，首页轮播自动展示 |
| **阅读统计** | 自动记录文章浏览量，管理后台可查看数据概览 |
| **评论系统** | 登录后可评论，支持嵌套回复、表情、图片附件 |
| **敏感词过滤** | 评论提交时自动检查敏感词，后台可自定义词库 |
| **全文搜索** | 按标题关键词搜索文章，支持分页展示 |

### 🧩 模块化首页
| 模块类型 | 说明 |
|----------|------|
| **轮播横幅** | 顶部大图轮播，自动展示置顶文章，支持手动切换 |
| **今日头条** | 突出显示头条新闻，红色标题醒目呈现 |
| **快捷导航** | 分类快捷入口，渐变色卡片，一键跳转 |
| **分类文章** | 按分类展示文章列表，支持 Tab 切换，4 种布局模板 |
| **图文推荐** | 网格图片展示，带封面缩略图和标题 |
| **综合快讯** | 最新文章流，简洁列表或卡片形式 |
| **图文列表** | 带封面的文章卡片，支持左图右文等布局 |
| **自定义HTML** | 自由编写 HTML 内容，可用于活动页、公告栏等 |

### 🎨 主题与个性化
| 功能 | 说明 |
|------|------|
| **8 套预设主题** | 经典红、科技蓝、生态绿、商务灰、暗夜紫、活力橙、中国风、极简黑 |
| **用户独立配色** | 每位用户可选择自己喜欢的主题色，存储在数据库 |
| **深色模式** | 一键切换亮色/暗色模式，全站自适应 |
| **CSS 变量驱动** | 主题色通过 CSS 变量动态注入，TailwindCSS 无缝集成 |

### 🔐 权限体系
| 角色 | 权限范围 |
|------|----------|
| **SUPER_ADMIN** | 全部权限，可管理用户角色、重置密码、删除用户 |
| **ADMIN** | 可按模块分配权限（发文/文章/评论/用户/导航/设置），支持分类级细粒度控制 |
| **USER** | 浏览文章、发表评论、提交反馈、管理个人资料 |

### 🤖 AI 能力
| 功能 | 说明 |
|------|------|
| **AI 聊天助手** | 侧边栏对话式交互，支持 Markdown 输出 |
| **AI 布局设计器** | 自然语言描述 → 自动生成首页模块方案 |
| **AI 发文辅助** | 自动生成标题、摘要、全文，支持内容润色 |
| **HTML 模块生成** | AI 生成自定义 HTML 模块，一键添加到首页 |
| **多服务商切换** | 9 种 AI 服务商，API Key 加密存储 |
| **对话历史** | 聊天记录加密保存，支持会话恢复 |

---

## 🛠️ 技术栈

| 层级 | 技术 | 说明 |
|------|------|------|
| **前端框架** | Next.js 14 + React 18 | App Router，服务端/客户端混合渲染 |
| **样式方案** | TailwindCSS 3 | 原子化 CSS，CSS 变量驱动动态主题 |
| **图标库** | Lucide React | 轻量矢量图标 |
| **后端接口** | Next.js API Routes | 25+ RESTful API 端点 |
| **数据库** | MySQL 8.0 + Prisma ORM | 11 张表，类型安全查询 |
| **认证方案** | JWT + bcryptjs | 无状态 Token 认证，密码 SHA-256 哈希 |
| **加密** | AES-256-CBC | 敏感配置（AI Key 等）加密存储 |
| **Markdown** | react-markdown + remark-gfm | AI 输出 Markdown 渲染 |

---

## 🚀 快速开始

### 环境要求

- **Node.js** >= 18
- **MySQL** >= 5.7
- **npm** >= 8

### 1. 克隆项目

```bash
git clone https://github.com/kou-xibin/mosaichub-portal.git
cd mosaichub-portal
```

### 2. 安装依赖

```bash
npm install
```

### 3. 配置环境变量

```bash
# 复制环境变量模板
cp .env.example .env
```

编辑 `.env` 文件：

```env
# MySQL 数据库连接（必填）
DATABASE_URL="mysql://root:yourpassword@localhost:3306/mosaichub_portal"

# JWT 密钥（必填，生产环境请使用强随机字符串）
JWT_SECRET="your-jwt-secret-key-change-this"

# AES 加密密钥（可选，用于加密 AI 配置等敏感数据）
# ENCRYPT_KEY=""
```

### 4. 初始化数据库

```bash
# 创建数据库
mysql -u root -p -e "CREATE DATABASE IF NOT EXISTS mosaichub_portal CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"

# 同步表结构
npx prisma db push

# 填充初始数据（分类、管理员账号、示例文章、导航等）
npx prisma db seed
```

### 5. 启动开发服务

```bash
npm run dev
```

访问 **http://localhost:9055** 🎉

### 默认管理员账号

| 字段 | 值 |
|------|------|
| 用户名 | `admin` |
| 密码 | `admin123` |

> ⚠️ **请在首次登录后立即修改默认密码！**

---

## 📁 项目结构

```
mosaichub-portal/
├── docs/
│   ├── screenshots/           # 项目截图
│   ├── scripts/
│   │   └── init.sql           # 建库建表脚本
│   ├── API.md                 # API 接口文档
│   ├── DATABASE.md            # 数据库设计文档
│   ├── PERMISSIONS.md         # 权限系统文档
│   └── README.md              # 详细开发文档
├── prisma/
│   ├── schema.prisma          # 数据库模型（11 张表 + 枚举）
│   ├── seed.ts                # 种子数据脚本
│   └── migrations/            # 数据库迁移脚本
├── public/
│   └── uploads/               # 用户上传文件存储
├── src/
│   ├── app/
│   │   ├── api/               # 25+ API 端点
│   │   │   ├── auth/          #   ├── 认证（登录/注册/资料/密码）
│   │   │   ├── admin/         #   ├── 管理（文章/用户/评论/统计）
│   │   │   ├── ai/            #   ├── AI（聊天/历史记录）
│   │   │   ├── posts/         #   ├── 文章（列表/详情/互动）
│   │   │   ├── comments/      #   ├── 评论（创建/敏感词过滤）
│   │   │   ├── petitions/     #   ├── 反馈（投诉/建议征集）
│   │   │   ├── categories/    #   ├── 分类（查询/创建）
│   │   │   ├── nav-menus/     #   ├── 导航菜单（CRUD）
│   │   │   ├── settings/      #   ├── 站点设置（读取/更新）
│   │   │   ├── search/        #   ├── 全文搜索
│   │   │   ├── upload/        #   ├── 文件上传（10MB/类型校验）
│   │   │   └── user-preferences/ # └── 用户偏好（主题色等）
│   │   ├── admin/             # 管理后台页面
│   │   ├── category/[slug]/   # 分类文章列表
│   │   ├── post/[id]/         # 文章详情（评论/互动）
│   │   ├── petition/          # 反馈提交页
│   │   ├── login/             # 登录页
│   │   ├── register/          # 注册页
│   │   ├── profile/           # 个人中心
│   │   ├── search/            # 搜索结果页
│   │   ├── layout.tsx         # 全局布局
│   │   ├── page.tsx           # 首页（模块化渲染）
│   │   └── globals.css        # 全局样式 + CSS 变量
│   ├── components/
│   │   ├── Header.tsx         # 顶部导航（搜索/主题/用户菜单）
│   │   ├── Footer.tsx         # 页脚（导航链接/版权信息）
│   │   ├── ThemeProvider.tsx   # 主题管理（配色/深色模式）
│   │   ├── FloatingSidebar.tsx # 悬浮侧栏（分类/弹窗图）
│   │   ├── SafeHtml.tsx       # 安全HTML渲染（沙箱iframe）
│   │   └── EmojiPicker.tsx    # 表情选择器
│   └── lib/
│       ├── prisma.ts          # Prisma 单例 + 优雅关闭
│       ├── auth.ts            # JWT / 密码 / 权限工具
│       ├── crypto.ts          # AES-256 加解密
│       └── useSiteSettings.ts # 站点设置 Hook
├── .env.example               # 环境变量模板
├── next.config.js             # Next.js 配置（安全头/图片域名）
├── tailwind.config.ts         # TailwindCSS 配置
├── package.json
└── tsconfig.json
```

---

## 🗄️ 数据库设计

系统包含 **11 张数据表**，完整的关系模型设计：

| 表名 | 说明 | 关键字段 |
|------|------|----------|
| `users` | 用户 | 角色(SUPER_ADMIN/ADMIN/USER)、模块权限JSON |
| `categories` | 文章分类 | 名称、slug、描述 |
| `posts` | 文章 | 标题、内容、封面图、置顶、阅读量、状态 |
| `comments` | 评论 | 内容、图片、嵌套回复(parentId) |
| `attachments` | 附件 | 文件路径、类型、大小 |
| `petitions` | 反馈/建议 | 类型(FEEDBACK/SUGGESTION)、状态流转、管理员回复 |
| `post_reactions` | 文章互动 | 收藏/支持/反对，每用户每文章唯一 |
| `site_settings` | 站点设置 | key-value 结构，含首页模块JSON配置 |
| `nav_menus` | 导航菜单 | 多级嵌套、排序、可见性控制 |
| `ai_chat_history` | AI对话历史 | 会话ID、加密消息内容 |
| `user_preferences` | 用户偏好 | 主题色、每用户独立存储 |

> 📖 详细数据库文档请参阅 [docs/DATABASE.md](docs/DATABASE.md)

---

## 📡 API 接口

系统提供 **25+ RESTful API** 端点，涵盖认证、内容、管理、AI 四大模块：

| 模块 | 端点 | 方法 | 说明 |
|------|------|------|------|
| **认证** | `/api/auth/login` | POST | 用户登录，返回 JWT |
| | `/api/auth/register` | POST | 用户注册 |
| | `/api/auth/profile` | GET/PUT | 获取/更新个人资料 |
| | `/api/auth/password` | PUT | 修改密码 |
| **文章** | `/api/posts` | GET/POST | 文章列表（分页/分类/置顶）/ 发布 |
| | `/api/posts/[id]` | GET | 文章详情（含评论/自动计数） |
| | `/api/posts/[id]/reactions` | GET/POST | 文章互动（收藏/支持/反对） |
| **评论** | `/api/comments` | POST | 发表评论（含敏感词过滤） |
| **搜索** | `/api/search` | GET | 全文搜索 |
| **反馈** | `/api/petitions` | GET/POST | 反馈列表/提交 |
| | `/api/petitions/[id]` | GET/PUT/DELETE | 详情/回复/删除 |
| **管理** | `/api/admin/posts` | GET | 文章管理（分页/搜索/筛选） |
| | `/api/admin/posts/[id]` | PUT/DELETE | 编辑/删除文章 |
| | `/api/admin/users` | GET/PUT/DELETE | 用户管理/角色权限/删除 |
| | `/api/admin/comments` | GET/DELETE | 评论管理 |
| | `/api/admin/stats` | GET | 数据统计概览 |
| **AI** | `/api/ai/chat` | POST | AI 对话（流式/非流式） |
| | `/api/ai/history` | GET/POST/DELETE | 对话历史管理 |
| **配置** | `/api/settings` | GET/PUT | 站点设置 |
| | `/api/categories` | GET/POST | 分类管理 |
| | `/api/nav-menus` | GET/POST | 导航菜单 |
| | `/api/upload` | POST | 文件上传（10MB限制） |
| | `/api/user-preferences` | GET/PUT | 用户偏好设置 |

> 📖 详细 API 文档请参阅 [docs/API.md](docs/API.md)

---

## 🔒 安全特性

- **JWT 无状态认证** — Token 有效期控制，敏感接口强制鉴权
- **密码哈希** — bcryptjs / SHA-256 加密存储，永不明文
- **AES-256 加密** — AI API Key 等敏感配置加密存储在数据库
- **权限校验** — 每个管理接口独立校验角色和模块权限
- **敏感词过滤** — 评论发布前自动检查，词库可后台配置
- **文件上传校验** — 10MB 大小限制 + MIME 类型白名单
- **安全响应头** — X-Frame-Options、X-Content-Type-Options、Referrer-Policy
- **HTML 沙箱** — 自定义 HTML 模块通过 iframe sandbox 隔离渲染

---

## 🤝 合作与定制开发

如果你需要基于本项目进行 **二次开发、私有化部署、界面定制、功能扩展、AI 能力集成**，欢迎联系合作。适合想快速拥有一套可运营、可管理、可扩展门户系统的个人、团队、企业和机构。

<div align="center">

### 📮 需要合作 / 定制开发 / 私有部署

**QQ：`329049159`**

**Email：`837513034@qq.com`**

![QQ二维码](docs/screenshots/erweima.png)

**扫码添加好友，备注：门户系统 / 定制开发**

> **物美价廉 · 沟通直接 · 交付实用 · 按需定制**

</div>

| 服务方向 | 内容说明 |
|----------|----------|
| **门户网站定制** | 企业官网、政企门户、医院/学校/园区信息平台、行业资讯站 |
| **后台功能扩展** | 权限细化、审批流程、数据统计、导入导出、消息通知 |
| **页面视觉定制** | 首页改版、专题页设计、主题配色、移动端适配 |
| **AI 功能接入** | DeepSeek、通义千问、Kimi、OpenAI 兼容模型、私有模型接入 |
| **部署与运维** | 服务器部署、数据库初始化、域名配置、HTTPS、备份策略 |

### 可定制内容

- **页面定制**：首页风格、专题页面、登录注册页、移动端展示
- **功能定制**：审批流程、消息通知、数据导入导出、统计报表、权限细化
- **AI 定制**：模型接入、提示词优化、AI 写作、AI 页面生成、私有知识库
- **部署服务**：服务器环境、数据库初始化、域名 HTTPS、备份恢复、上线协助
- **长期维护**：Bug 修复、功能迭代、性能优化、安全加固

---

## 👤 作者

**kou-n** — [@kou-xibin](https://gitee.com/kou-xibin)

- **Email**: `837513034@qq.com`
- **GitHub**: [kou-xibin](https://github.com/kou-xibin)
- **Gitee**: [kou-xibin/mosaichub-portal](https://gitee.com/kou-xibin/mosaichub-portal)

## 📄 开源协议

本项目基于 [Apache License 2.0](LICENSE) 开源，可自由使用、修改和分发，并提供专利授权保护。
