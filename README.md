# MosaicHub Portal

[![License](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](LICENSE)
[![GitHub](https://img.shields.io/badge/GitHub-kou--xibin-black?logo=github)](https://github.com/kou-xibin)

基于 Next.js + MySQL + Prisma 的模块化企业门户系统，首页布局、导航菜单、侧栏均可在管理后台灵活配置。

## 功能特性

- **模块化首页**: 可视化配置首页模块（轮播横幅、分类列表、快捷导航、综合快讯、图文列表、自定义HTML等），支持增删、排序、显隐，多种布局模板可选
- **动态分类管理**: 后台可新增分类，模块编辑时可直接创建新分类并自动关联
- **用户注册/登录**: 完整的用户认证系统（JWT）
- **文章管理**: 多分类文章发布、置顶、封面图、阅读量统计
- **评论系统**: 登录后可评论，支持嵌套回复
- **导航管理**: 可配置多级导航菜单，支持内链与外链
- **站点设置**: Logo、站名、悬浮侧栏、弹窗图片等均可在后台动态配置
- **主题配色**: 8 套预设主题色（经典红/科技蓝/生态绿等），每个用户独立配色，存储在数据库，Header 顶栏一键切换
- **权限系统**: 超级管理员 / 管理员 / 普通用户三级角色，模块级权限控制（发文、文章、评论、用户、菜单、设置）
- **AI 智能助手**: 支持多种 AI 提供商，可生成 HTML 模块、设计首页布局、撰写内容
- **管理后台**: 完整的管理中心，统一管理文章、用户、评论、导航、首页模块和站点设置，操作即时保存，自定义确认弹窗

## 技术栈

- **前端**: Next.js 14 + React 18 + TailwindCSS
- **后端**: Next.js API Routes
- **数据库**: MySQL + Prisma ORM
- **认证**: JWT + bcryptjs
- **图标**: Lucide React

## 快速开始

### 1. 安装依赖

```bash
cd portal
npm install
```

### 2. 配置数据库

编辑 `.env` 文件，修改 MySQL 连接信息：

```
DATABASE_URL="mysql://root:password@localhost:3306/portal_db"
```

### 3. 创建数据库

```bash
# 创建 MySQL 数据库
mysql -u root -p -e "CREATE DATABASE IF NOT EXISTS portal_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"

# 同步数据库表结构
npx prisma db push

# 填充初始数据
npx prisma db seed
```

### 4. 启动开发服务

```bash
npm run dev
```

访问 http://localhost:9055

### 默认管理员账号

- 用户名: `admin`
- 密码: `admin123`

## 项目结构

```
portal/
├── docs/
│   └── scripts/
│       ├── init.sql       # 建库建表（增量，IF NOT EXISTS）
│       ├── seed.sql       # 种子数据（分类、管理员、示例文章、导航、设置）
│       └── setup.sql      # 一键初始化（DROP → CREATE → SEED）
├── prisma/
│   ├── schema.prisma      # 数据库模型（11 张表 + 枚举）
│   ├── seed.ts            # Prisma 种子脚本
│   └── migrations/
│       └── add_permissions.sql  # SUPER_ADMIN 角色 & 权限字段迁移
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── auth/          # 登录 / 注册 / 个人资料 / 修改密码
│   │   │   ├── admin/         # 管理接口（文章CRUD、用户、评论、统计）
│   │   │   ├── categories/    # 分类 GET + POST（新建分类）
│   │   │   ├── posts/         # 文章列表 & 详情（含互动）
│   │   │   ├── comments/      # 评论
│   │   │   ├── petitions/     # 反馈 & 意见征集
│   │   │   ├── nav-menus/     # 导航菜单 CRUD
│   │   │   ├── settings/      # 站点设置 GET + PUT
│   │   │   ├── search/        # 全文搜索
│   │   │   ├── upload/        # 文件上传
│   │   │   └── user-preferences/ # 用户偏好 (GET + PUT，主题色等)
│   │   ├── admin/             # 管理后台页面
│   │   ├── category/[slug]/   # 分类文章列表页
│   │   ├── post/[id]/         # 文章详情页
│   │   ├── login/             # 登录页
│   │   ├── register/          # 注册页
│   │   ├── profile/           # 个人中心
│   │   ├── search/            # 搜索结果页
│   │   ├── layout.tsx         # 全局布局（Header + Footer + 悬浮侧栏）
│   │   └── page.tsx           # 首页（模块化渲染）
│   ├── components/            # 公共组件
│   └── lib/                   # 工具库（prisma、auth、jwt）
├── .env                       # 环境变量
├── package.json
└── tailwind.config.ts
```

## 数据库表

| 表名 | 说明 |
|---|---|
| `users` | 用户（含 SUPER_ADMIN / ADMIN / USER 角色，模块权限） |
| `categories` | 文章分类（支持后台动态新增） |
| `posts` | 文章（置顶、封面、摘要、阅读量） |
| `comments` | 评论（支持嵌套回复、图片） |
| `attachments` | 附件 |
| `petitions` | 反馈 & 意见征集 |
| `post_reactions` | 文章互动（收藏/支持/反对） |
| `site_settings` | 站点设置（key-value，含首页模块JSON） |
| `nav_menus` | 导航菜单（支持多级） |
| `ai_chat_history` | AI 对话历史（加密存储） |
| `user_preferences` | 用户偏好设置（主题色等，每用户独立） |

## 作者

**kou-n** ([@kou-xibin](https://github.com/kou-xibin))

## 开源协议

本项目基于 [Apache License 2.0](LICENSE) 开源，可自由使用、修改和分发，并提供专利授权保护。
