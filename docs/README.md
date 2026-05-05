# 企业门户网站 — 项目文档

> 版本 v1.4 · 最后更新 2026-04-26

## 一、项目概述

MosaicHub Portal 是基于 Next.js + MySQL + Prisma 构建的模块化企业门户平台，提供互动反馈、意见征集、公告通知、新闻动态、评论互动等核心功能，首页模块可在管理后台灵活配置，支持亮色/暗色主题切换和多套主题配色方案。

### 技术栈

| 组件 | 技术 | 版本 |
|------|------|------|
| 前端框架 | Next.js (App Router) | ^14.2.0 |
| UI 框架 | React + TypeScript | ^18.2.0 |
| 样式 | TailwindCSS (class-based dark mode) | ^3.4.3 |
| 数据库 | MySQL | 8.x |
| ORM | Prisma | ^5.12.0 |
| 认证 | JWT (7 天有效) + bcryptjs | - |
| 图标 | Lucide React | ^0.363.0 |

### 目录结构

```
portal/
├── docs/                        # 项目文档
│   ├── README.md                # 项目文档总览（本文件）
│   ├── API.md                   # API 接口文档
│   ├── DATABASE.md              # 数据库设计文档
│   └── scripts/                 # SQL 脚本
│       ├── init.sql             # 建库建表脚本
│       └── seed.sql             # 初始数据脚本
├── prisma/
│   ├── schema.prisma            # Prisma 数据模型
│   └── seed.ts                  # 种子数据脚本
├── public/
│   └── uploads/                 # 用户上传文件存储目录
├── src/
│   ├── app/
│   │   ├── api/                 # REST API 路由
│   │   │   ├── auth/            # 认证 (login / register / profile)
│   │   │   ├── posts/           # 文章 CRUD
│   │   │   ├── comments/        # 评论
│   │   │   ├── categories/      # 分类
│   │   │   ├── petitions/       # 反馈 & 意见征集
│   │   │   ├── search/          # 搜索
│   │   │   ├── settings/        # 站点设置 (GET 公开 / PUT 管理员)
│   │   │   ├── upload/          # 文件上传
│   │   │   ├── nav-menus/       # 导航菜单 CRUD
│   │   │   ├── user-preferences/ # 用户偏好设置 (GET / PUT，如主题色)
│   │   │   └── admin/           # 管理后台 (stats / posts / users / comments)
│   │   ├── admin/               # 管理后台页面
│   │   │   └── post/[id]/       # 编辑文章页
│   │   ├── category/[slug]/     # 分类列表页
│   │   ├── login/               # 登录页
│   │   ├── register/            # 注册页
│   │   ├── post/
│   │   │   ├── [id]/            # 文章详情页
│   │   │   └── create/          # 发帖页
│   │   ├── petition/            # 反馈 / 意见征集页
│   │   ├── profile/             # 个人中心
│   │   ├── search/              # 搜索页
│   │   ├── globals.css          # 全局样式 + 暗色模式
│   │   ├── layout.tsx           # 全局布局 (ThemeProvider)
│   │   └── page.tsx             # 首页
│   ├── components/              # 公共组件
│   │   ├── Header.tsx           # 页头导航 (含暗色切换 + 主题色选择器)
│   │   ├── Footer.tsx           # 页脚
│   │   ├── FloatingSidebar.tsx  # 悬浮侧栏 (可配置分类入口)
│   │   ├── EmojiPicker.tsx      # 表情选择器
│   │   └── ThemeProvider.tsx    # 暗色模式 + 主题色上下文 (8 套预设配色)
│   └── lib/                     # 工具库
│       ├── prisma.ts            # Prisma 单例 + 连接池 + 优雅关闭
│       └── auth.ts              # JWT 签发与验证
├── .env                         # 环境配置
├── package.json                 # 项目依赖 & NPM 脚本
├── tailwind.config.ts           # Tailwind 配置 (darkMode: 'class')
└── tsconfig.json                # TypeScript 配置
```

## 二、功能清单

### 2.1 首页
- Banner 轮播（置顶文章封面图 + 自动切换）
- 多栏目新闻聚合（通过管理后台配置各模块对应分类，支持 Tab 切换）
- 图片新闻展示
- 快捷服务入口卡片

### 2.2 用户系统
- **注册**: 用户名 (3-20 字符)、密码 (≥6 字符)、真实姓名 / 邮箱 / 手机号 (选填)
- **登录**: 用户名 + 密码，JWT 令牌，7 天有效
- **个人中心**: 查看编辑资料、统计数据 (发帖/评论/反馈数)、账户安全面板
- **角色**: USER (普通用户)、ADMIN (管理员)

### 2.3 文章系统
- 四大分类浏览 (含分类描述、侧边栏导航)
- 文章列表卡片 (封面图/摘要/作者/浏览量)
- 文章详情 (面包屑导航、浏览量统计、HTML 内容渲染)
- 文章置顶
- 用户发帖 (登录后可创建文章)
- 全文搜索 (热搜词条、分类浏览)

### 2.4 评论系统
- 登录后可发表评论
- **表情选择器** (72 个常用 Emoji)
- 支持上传图片附件
- 支持嵌套回复 (楼中楼)
- 评论按时间倒序排列

### 2.5 互动反馈 & 意见征集
- 互动反馈 (FEEDBACK) — 红色主题
- 意见征集 (SUGGESTION) — 橙色主题
- 支持上传图片和附件 (文档/PDF 等)
- **隐私保护**: 普通用户仅可查看自己提交的内容，管理员可查看全部
- 状态流转: 待处理 → 处理中 → 已回复 → 已关闭
- 管理员可回复

### 2.6 文件上传
- 上传至 `public/uploads/` 目录
- 支持图片 (JPEG/PNG/GIF/WebP) 和文档 (PDF/DOC/DOCX)
- 单文件限制 10 MB
- 防重名 (时间戳 + 随机字符串)

### 2.7 管理后台
- 数据统计面板 (文章数 / 用户数 / 浏览量 / 评论数)
- 文章管理 (列表 / 发布 / 编辑 / 置顶切换 / 删除)
- 用户管理 (列表 / 统计 / 重置密码)
- 评论管理 (列表 / 删除)
- 反馈管理 (列表 / 回复 / 状态流转)
- 导航管理 (增删改 / 排序 / 父子菜单)
- 站点设置 (首页模块配置、弹窗图片上传)
- 仅 ADMIN 角色可访问

### 2.8 导航菜单
- 支持两级菜单结构 (顶级 + 子菜单)
- 管理后台可动态增删改排序
- 前端 Header 自动从数据库加载

### 2.9 站点设置（高可配置）
- key-value 配置存储，管理后台可视化编辑
- **站点信息**: 站点名称、简称、Logo文字、副标题、客服热线、版权、备案号
- **首页模块**: 左右栏各 Tab 可自由分配分类
- **悬浮侧栏**: 左右悬浮按钮可指定分类
- **弹窗图片**: 左侧悬浮按钮点击后弹出的图片
- 导航、页脚、热搜、分类浏览均自动从分类表动态生成，新增分类无需改代码

### 2.10 暗色模式
- 全局亮色 / 暗色切换 (Header 顶栏按钮)
- 基于 `class` 策略 (`html.dark`)，支持 localStorage 持久化
- 自动检测系统偏好 (`prefers-color-scheme`)

### 2.11 主题配色系统
- 8 套预设主题：经典红 / 科技蓝 / 生态绿 / 创意紫 / 暖橙色 / 湖水青 / 品红色 / 深空灰
- 每个用户独立的主题色偏好，存储在 `user_preferences` 表
- Header 顶栏“颜色”按钮快速切换，切换后全站立即生效
- 基于 CSS 变量动态主题，支持 Tailwind 透明度修饰符
- 未登录用户使用 localStorage 缓存，登录后自动从数据库加载个人偏好

## 三、环境配置

### 3.1 环境变量 (.env)

```env
DATABASE_URL="mysql://root:password@localhost:3306/portal_db"
JWT_SECRET="your-jwt-secret-key-2024"
```

> **连接池配置**: 可在 `DATABASE_URL` 末尾追加 `?connection_limit=10&pool_timeout=10` 调整池大小。

### 3.2 默认管理员账号

| 字段 | 值 |
|------|------|
| 用户名 | admin |
| 密码 | admin123 |
| 角色 | ADMIN |

### 3.3 NPM 脚本

| 命令 | 说明 |
|------|------|
| `npm run dev` | 启动开发服务 (端口 9055) |
| `npm run build` | 生产构建 |
| `npm run start` | 启动生产服务 |
| `npm run db:generate` | 重新生成 Prisma Client |
| `npm run db:push` | 同步数据库表结构 |
| `npm run db:seed` | 填充种子数据 |

## 四、部署指南

### 4.1 开发环境

```bash
# 1. 安装依赖
npm install

# 2. 建库 (MySQL)
mysql -u root -p -e "CREATE DATABASE IF NOT EXISTS portal_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"

# 3. 同步表结构
npx prisma db push

# 4. 生成 Prisma Client
npx prisma generate

# 5. 填充初始数据
npx prisma db seed

# 6. 启动开发服务 (端口 9055)
npm run dev
```

访问 http://localhost:9055

### 4.2 生产环境

```bash
npm run build
npm run start
```

### 4.3 纯 SQL 初始化 (可选)

如不使用 Prisma 种子脚本，可直接执行 SQL：

```bash
mysql -u root -prace < docs/scripts/init.sql
mysql -u root -prace < docs/scripts/seed.sql
```

## 五、端口说明

| 服务 | 端口 |
|------|------|
| Next.js 开发服务 | 9055 |
| MySQL 数据库 | 3306 |

## 六、关联文档

| 文档 | 说明 |
|------|------|
| [API.md](./API.md) | 全部 REST API 接口文档 |
| [DATABASE.md](./DATABASE.md) | 数据库设计 & ER 关系 |
| [scripts/init.sql](./scripts/init.sql) | 建库建表 SQL |
| [scripts/seed.sql](./scripts/seed.sql) | 初始数据 SQL |
