<div align="center">

# 🏢 MosaicHub Portal｜企业门户系统

**A modern, modular enterprise portal and AI-powered CMS built with Next.js 14, React, MySQL and Prisma.**

**一套基于 Next.js 14 + MySQL + Prisma 的现代化企业门户、信息发布与 AI CMS 系统。**

[![License](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](LICENSE)
[![Next.js](https://img.shields.io/badge/Next.js-14-black?logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-18-61DAFB?logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3-06B6D4?logo=tailwindcss)](https://tailwindcss.com/)
[![Prisma](https://img.shields.io/badge/Prisma-ORM-2D3748?logo=prisma)](https://prisma.io/)
[![MySQL](https://img.shields.io/badge/MySQL-8.0-4479A1?logo=mysql&logoColor=white)](https://mysql.com/)
[![i18n](https://img.shields.io/badge/i18n-中文%20%2F%20English-green)](#中文快速了解)

**English + 中文简介** | [完整中文文档](README.zh-CN.md)

MosaicHub Portal helps teams build configurable company portals, internal news systems, public information platforms and AI-assisted content websites with a complete admin dashboard.

中文用户可直接阅读本页的中文简介与快速说明；如需完整中文安装部署、功能介绍和二次开发说明，请查看 [README.zh-CN.md](README.zh-CN.md)。

</div>

---

## 中文快速了解

MosaicHub Portal 是一套可私有化部署、可二次开发、可灵活配置的门户系统，适合企业官网、政企信息公开平台、医院/学校/园区内部门户、行业资讯站、内部知识库和 AI 辅助内容平台。

| 模块 | 中文说明 |
|------|----------|
| **模块化首页** | 轮播图、快捷入口、头条新闻、分类文章、图文推荐、自定义 HTML 模块均可后台配置 |
| **内容管理** | 支持文章发布、封面图、摘要、分类、置顶、评论、敏感词过滤和全文搜索 |
| **管理后台** | 文章、评论、用户、导航菜单、站点设置、主题配色、数据统计一站式管理 |
| **AI 能力** | 支持 AI 写作、内容润色、摘要生成、首页布局设计、HTML 页面生成和多模型接入 |
| **中英文切换** | 前台核心界面支持中文 / English 切换，并保护文章标题、正文、评论等业务数据不被误翻译 |
| **定制开发** | 支持门户定制、后台扩展、页面美化、AI 接入、私有部署、长期维护 |

> 如果你需要中文完整说明，请查看：[README.zh-CN.md](README.zh-CN.md)

---

## Why MosaicHub Portal?

- **Modular homepage builder**: banners, quick links, category feeds, image cards, headline blocks and custom HTML modules.
- **Powerful admin dashboard**: manage posts, comments, users, navigation menus, site settings and analytics in one place.
- **AI-ready CMS**: AI assistant, AI homepage layout designer, AI writing helper and custom HTML page generation.
- **Flexible branding**: configure site name, logo text, footer, service hotline, ICP record and theme colors without code changes.
- **Bilingual UI**: built-in Chinese / English language switching for core frontend pages and shared components.
- **Enterprise access control**: `SUPER_ADMIN`, `ADMIN` and `USER` roles with module-level permissions.
- **Production-oriented security**: JWT authentication, password hashing, encrypted AI keys, upload validation and HTML sandbox rendering.

---

## Screenshots

### Home Portal

![Home Portal](docs/screenshots/homepage.jpg)

The homepage contains configurable portal modules such as hero carousel, quick navigation cards, featured headlines and category-based content blocks. Admins can reorder modules, adjust layout width, bind categories and change display templates from the dashboard.

### Article Detail and User Interaction

![Article Detail](docs/screenshots/post-detail.jpg)

Article pages support category breadcrumbs, author metadata, publish time, view count, nested comments, favorites, likes and dislikes. It is suitable for news, announcements, feedback posts and knowledge articles.

### User Theme Presets

![Theme Picker](docs/screenshots/theme-picker.jpg)

Users can choose from multiple preset themes such as classic red, technology blue, eco green, creative purple and deep gray. Theme colors are applied through CSS variables and can be persisted per user.

### Admin Dashboard

![Admin Dashboard](docs/screenshots/admin-dashboard.jpg)

The admin center provides analytics cards and management tabs for publishing posts, managing articles, comments, users, navigation menus and global site settings.

### Site Branding Settings

![Site Settings](docs/screenshots/site-settings.jpg)

Admins can update site name, short name, logo text, logo subtitle, site description, service hotline, copyright text and ICP record directly from the dashboard.

### Navigation Menu Management

![Navigation Menu Management](docs/screenshots/nav-management.jpg)

Navigation menus support parent-child hierarchy, custom sorting, visibility control, internal page selection and external URL input. This allows non-developers to adjust top navigation and footer links without code changes.

### Sensitive Word Filtering

![Sensitive Words](docs/screenshots/sensitive-words.jpg)

The comment system includes configurable sensitive word filtering to reduce spam, abuse and inappropriate content.

### AI Layout Designer

![AI Layout Designer](docs/screenshots/ai-layout-designer.jpg)

The AI layout designer turns natural language requirements into homepage module plans. The left panel is an AI conversation area, while the right panel previews and edits the generated layout.

### AI Assistant

![AI Assistant](docs/screenshots/ai-assistant.jpg)

The built-in AI assistant supports content drafting, rewriting, summarization, HTML module generation and Markdown rendering.

### Multiple AI Provider Support

![AI Provider Configuration](docs/screenshots/ai-provider-config.jpg)

MosaicHub Portal supports OpenAI, Anthropic Claude, Google Gemini, Qwen, DeepSeek, Kimi, GLM, Baidu ERNIE and any OpenAI-compatible endpoint. API keys can be encrypted before being stored in the database.

### AI-generated HTML Page

![AI HTML Page Demo](docs/screenshots/ai-html-page-demo-1.jpg)

AI can generate custom HTML pages for events, training notices, landing pages, campaigns and internal announcements. The system renders custom HTML inside a sandboxed iframe for safer isolation.

---

## Use Cases

| Scenario | What you can build |
|----------|--------------------|
| **Enterprise portal** | Company news, internal announcements, department pages, search and employee entry points |
| **Government or public information site** | Notices, public feedback, suggestion collection and categorized information publishing |
| **Hospital / school / campus portal** | Training notices, event pages, knowledge articles and internal communication |
| **Industry news website** | Multi-category articles, featured posts, user interaction and search |
| **AI-assisted CMS** | AI writing, AI layout generation, AI HTML modules and multi-model integration |
| **Custom low-cost portal** | Quickly customize logo, theme, navigation, homepage blocks and admin features |

---

## Features

### Content Management

| Feature | Description |
|---------|-------------|
| **Post publishing** | Rich text / HTML content, cover images, summaries and category selection |
| **Pinned posts** | Highlight important articles and display them in the homepage carousel |
| **View analytics** | Track post views and show dashboard statistics |
| **Comments** | Nested replies, emoji support and optional image attachments |
| **Sensitive word filter** | Validate comment content before publishing |
| **Search** | Keyword-based post search with pagination |

### Modular Homepage

| Module | Description |
|--------|-------------|
| **Hero carousel** | Large banner carousel for pinned or featured content |
| **Quick navigation** | Gradient cards for category or service entry points |
| **Headline block** | Highlight important news or announcements |
| **Category articles** | Category-based article lists with multiple layout templates |
| **Image recommendations** | Grid-style image cards for promoted articles |
| **News stream** | Compact latest-news blocks |
| **Custom HTML** | Embed custom HTML sections, landing pages or announcement panels |

### Theme and Personalization

| Feature | Description |
|---------|-------------|
| **Theme presets** | Multiple built-in color themes |
| **Per-user theme** | User-specific theme preference stored in the database |
| **Dark mode** | Class-based dark mode with local preference |
| **CSS variables** | Dynamic theme injection integrated with TailwindCSS |

### Bilingual UI / 中文支持

| Feature | Description |
|---------|-------------|
| **Chinese / English switch** | Header language switcher with persistent preference |
| **UI text translation** | Core frontend pages, shared components and common dynamic prompts support bilingual display |
| **Business data protection** | Post titles, post content, comments, category names and user data are marked to avoid unwanted auto-translation |
| **中文文档** | Default README includes Chinese highlights, and [README.zh-CN.md](README.zh-CN.md) provides full Chinese documentation |

### Role-based Access Control

| Role | Permissions |
|------|-------------|
| **SUPER_ADMIN** | Full access, user role management, password reset and user deletion |
| **ADMIN** | Configurable module permissions and category-level publishing permissions |
| **USER** | Browse posts, comment, submit feedback and manage personal profile |

### AI Capabilities

| Capability | Description |
|------------|-------------|
| **AI assistant** | Sidebar chat assistant with Markdown output |
| **AI layout designer** | Generate homepage layout plans from natural language prompts |
| **AI writing helper** | Generate titles, summaries, articles and rewritten content |
| **HTML module generation** | Generate custom HTML content for homepage modules or landing pages |
| **Multi-provider support** | OpenAI, DeepSeek, Qwen, Kimi, GLM, Gemini, Claude and compatible APIs |
| **Chat history** | Encrypted conversation history stored by session |

---

## Tech Stack

| Layer | Technology | Notes |
|-------|------------|-------|
| **Frontend** | Next.js 14 + React 18 | App Router, SSR and client components |
| **Language** | TypeScript | Type-safe development |
| **Styling** | TailwindCSS 3 | Utility-first CSS and dynamic CSS variables |
| **Icons** | Lucide React | Lightweight icon system |
| **Backend** | Next.js API Routes | RESTful API endpoints |
| **Database** | MySQL + Prisma ORM | Type-safe relational data access |
| **Auth** | JWT + bcryptjs | Stateless authentication and password hashing |
| **Encryption** | AES-256-CBC | Encrypt sensitive AI configuration |
| **Markdown** | react-markdown + remark-gfm | Render AI-generated Markdown output |

---

## Quick Start

### Requirements

- **Node.js** >= 18
- **MySQL** >= 5.7
- **npm** >= 8

### 1. Clone the repository

```bash
git clone https://github.com/Anibl-1/mosaichub-portal.git
cd mosaichub-portal
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

```bash
cp .env.example .env
```

Edit `.env`:

```env
DATABASE_URL="mysql://root:yourpassword@localhost:3306/mosaichub_portal"
JWT_SECRET="your-jwt-secret-key-change-this"
# ENCRYPT_KEY=""
```

### 4. Initialize the database

```bash
mysql -u root -p -e "CREATE DATABASE IF NOT EXISTS mosaichub_portal CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
npx prisma db push
npx prisma db seed
```

### 5. Start the development server

```bash
npm run dev
```

Open:

```text
http://localhost:9055
```

### Default admin account

| Field | Value |
|-------|-------|
| Username | `admin` |
| Password | `admin123` |

> Change the default password immediately after your first login.

---

## Project Structure

```text
mosaichub-portal/
├── docs/
│   ├── screenshots/              # Project screenshots
│   ├── scripts/                  # SQL scripts
│   ├── API.md                    # API documentation
│   ├── DATABASE.md               # Database documentation
│   └── README.md                 # Detailed Chinese developer documentation
├── prisma/
│   ├── schema.prisma             # Prisma database schema
│   └── seed.ts                   # Seed data
├── public/
│   └── uploads/                  # Uploaded files
├── src/
│   ├── app/
│   │   ├── api/                  # REST API routes
│   │   ├── admin/                # Admin dashboard
│   │   ├── category/[slug]/      # Category pages
│   │   ├── post/[id]/            # Article detail pages
│   │   ├── petition/             # Feedback pages
│   │   ├── login/                # Login page
│   │   ├── register/             # Register page
│   │   ├── profile/              # User profile
│   │   ├── search/               # Search results
│   │   ├── layout.tsx            # Root layout
│   │   └── page.tsx              # Homepage renderer
│   ├── components/
│   │   ├── Header.tsx
│   │   ├── Footer.tsx
│   │   ├── LanguageProvider.tsx
│   │   ├── ThemeProvider.tsx
│   │   ├── FloatingSidebar.tsx
│   │   ├── SafeHtml.tsx
│   │   └── EmojiPicker.tsx
│   └── lib/
│       ├── prisma.ts
│       ├── auth.ts
│       ├── crypto.ts
│       ├── i18n.ts
│       └── useSiteSettings.ts
├── .env.example
├── next.config.js
├── tailwind.config.ts
├── package.json
└── tsconfig.json
```

---

## Database Overview

The system includes relational tables for users, categories, posts, comments, attachments, petitions, post reactions, site settings, navigation menus, AI chat history and user preferences.

See [docs/DATABASE.md](docs/DATABASE.md) for details.

---

## API Overview

MosaicHub Portal provides REST APIs for authentication, posts, comments, petitions, admin management, AI chat, AI history, site settings, categories, navigation menus, uploads and user preferences.

See [docs/API.md](docs/API.md) for detailed API documentation.

---

## Security

- **JWT authentication** for protected APIs
- **Password hashing** with bcryptjs / SHA-256 strategy
- **AES-256 encryption** for sensitive AI API keys
- **Role and permission checks** on admin endpoints
- **Sensitive word filtering** before comment publishing
- **Upload validation** with size and MIME-type restrictions
- **Security headers** configured in Next.js
- **Sandboxed HTML rendering** for custom HTML modules

---

## GitHub Topics and SEO Keywords

Recommended GitHub topics:

```text
nextjs
react
typescript
prisma
mysql
cms
admin-dashboard
enterprise-portal
ai-assistant
tailwindcss
```

Search keywords:

```text
Next.js enterprise portal, React CMS, AI CMS, Prisma MySQL admin dashboard,
enterprise website system, internal company portal, AI writing assistant,
DeepSeek CMS, Tailwind admin panel, modular homepage builder
```

---

## Custom Development and Cooperation

Need customization, private deployment, UI redesign, feature extension or AI integration?

中文服务：支持企业门户、政企门户、医院/学校/园区门户、行业资讯站、内部知识库等场景的二次开发、私有化部署、UI 美化和 AI 能力接入。

<div align="center">

### Contact

**QQ: `329049159`**

**Email: `837513034@qq.com`**

![QQ QR Code](docs/screenshots/erweima.png)

**Add me and note: MosaicHub Portal / Custom Development**

> Affordable pricing · Direct communication · Practical delivery · Custom development

</div>

| Service | Description |
|---------|-------------|
| **Portal customization** | Enterprise websites, government portals, hospital / school portals and industry information sites |
| **Admin extension** | Workflow approval, notification, analytics, import/export and advanced permissions |
| **UI customization** | Homepage redesign, landing pages, theme colors and mobile adaptation |
| **AI integration** | DeepSeek, Qwen, Kimi, OpenAI-compatible APIs and private model integration |
| **Deployment support** | Server setup, database initialization, domain, HTTPS and backup strategy |

---

## Author

**kou-n**

- **Email**: `837513034@qq.com`
- **GitHub**: [Anibl-1/mosaichub-portal](https://github.com/Anibl-1/mosaichub-portal)
- **Gitee**: [kou-xibin/mosaichub-portal](https://gitee.com/kou-xibin/mosaichub-portal)

---

## License

This project is licensed under the [Apache License 2.0](LICENSE).
