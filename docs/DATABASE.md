# 数据库设计文档

> 版本 v1.4 · 最后更新 2026-04-26

## 一、数据库信息

| 项目 | 值 |
|------|------|
| 数据库类型 | MySQL 8.x |
| 数据库名 | portal_db |
| 字符集 | utf8mb4 |
| 排序规则 | utf8mb4_unicode_ci |
| 连接地址 | localhost:3306 |
| ORM | Prisma ^5.12.0 |
| 模型定义 | `prisma/schema.prisma` |

---

## 二、数据表结构

### 2.1 users（用户表）

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | INT | PK, AUTO_INCREMENT | 用户 ID |
| username | VARCHAR(50) | UNIQUE, NOT NULL | 用户名 |
| password | VARCHAR(255) | NOT NULL | 密码 (bcrypt) |
| email | VARCHAR(100) | NULL | 邮箱 |
| phone | VARCHAR(20) | NULL | 手机号 |
| real_name | VARCHAR(50) | NULL | 真实姓名 |
| role | ENUM('USER','ADMIN','SUPER_ADMIN') | DEFAULT 'USER' | 角色 |
| permissions | TEXT | NULL | 模块权限 JSON 数组 |
| avatar | VARCHAR(255) | NULL | 头像 URL |
| created_at | DATETIME(3) | DEFAULT NOW(3) | 创建时间 |
| updated_at | DATETIME(3) | ON UPDATE | 更新时间 |

### 2.2 categories（分类表）

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | INT | PK, AUTO_INCREMENT | 分类 ID |
| name | VARCHAR(50) | NOT NULL | 分类名称 |
| slug | VARCHAR(50) | UNIQUE, NOT NULL | URL 别名 |
| description | VARCHAR(255) | NULL | 描述 |
| sort | INT | DEFAULT 0 | 排序序号 |
| created_at | DATETIME(3) | DEFAULT NOW(3) | 创建时间 |

**预置分类:**

| ID | name | slug | 说明 |
|----|------|------|------|
| 1 | 互动反馈 | feedback | 在线提交反馈与投诉 |
| 2 | 建议征集 | suggestions | 征集意见与改进建议 |
| 3 | 公告通知 | notice | 重要通知公告 |
| 4 | 新闻动态 | news | 最新新闻动态 |

### 2.3 posts（文章表）

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | INT | PK, AUTO_INCREMENT | 文章 ID |
| title | VARCHAR(200) | NOT NULL | 标题 |
| content | TEXT | NOT NULL | 内容 (HTML) |
| summary | VARCHAR(500) | NULL | 摘要 |
| cover_image | VARCHAR(255) | NULL | 封面图 URL |
| view_count | INT | DEFAULT 0 | 浏览量 |
| is_top | TINYINT(1) | DEFAULT 0 | 是否置顶 |
| top_sort | INT | DEFAULT 0 | 置顶排序序号 |
| status | ENUM('DRAFT','PUBLISHED','ARCHIVED') | DEFAULT 'PUBLISHED' | 状态 |
| author_id | INT | FK → users.id | 作者 |
| category_id | INT | FK → categories.id | 分类 |
| created_at | DATETIME(3) | DEFAULT NOW(3) | 创建时间 |
| updated_at | DATETIME(3) | ON UPDATE | 更新时间 |

### 2.4 comments（评论表）

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | INT | PK, AUTO_INCREMENT | 评论 ID |
| content | TEXT | NOT NULL | 评论内容 (支持 Emoji) |
| images | TEXT | NULL | 图片 URL JSON 数组 |
| post_id | INT | FK → posts.id | 所属文章 |
| author_id | INT | FK → users.id | 评论者 |
| parent_id | INT | FK → comments.id, NULL | 父评论 (嵌套回复) |
| created_at | DATETIME(3) | DEFAULT NOW(3) | 创建时间 |

### 2.5 petitions（反馈/意见征集表）

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | INT | PK, AUTO_INCREMENT | 记录 ID |
| title | VARCHAR(200) | NOT NULL | 标题 |
| content | TEXT | NOT NULL | 内容 |
| images | TEXT | NULL | 图片 URL JSON |
| attachments | TEXT | NULL | 附件 JSON `[{url, name, size}]` |
| type | ENUM('FEEDBACK','SUGGESTION') | DEFAULT 'FEEDBACK' | 类型 |
| status | ENUM('PENDING','PROCESSING','REPLIED','CLOSED') | DEFAULT 'PENDING' | 状态 |
| reply | TEXT | NULL | 管理员回复 |
| replied_at | DATETIME(3) | NULL | 回复时间 |
| author_id | INT | FK → users.id | 提交者 |
| created_at | DATETIME(3) | DEFAULT NOW(3) | 创建时间 |
| updated_at | DATETIME(3) | ON UPDATE | 更新时间 |

### 2.6 attachments（附件表）

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | INT | PK, AUTO_INCREMENT | 附件 ID |
| filename | VARCHAR(255) | NOT NULL | 存储文件名 |
| original_name | VARCHAR(255) | NOT NULL | 原始文件名 |
| mime_type | VARCHAR(100) | NOT NULL | MIME 类型 |
| size | INT | NOT NULL | 文件大小 (bytes) |
| url | VARCHAR(500) | NOT NULL | 访问 URL |
| post_id | INT | NULL | 关联文章 |
| uploader_id | INT | NOT NULL | 上传者 |
| created_at | DATETIME(3) | DEFAULT NOW(3) | 创建时间 |

### 2.7 post_reactions（文章互动表）

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | INT | PK, AUTO_INCREMENT | 记录 ID |
| type | ENUM('FAVORITE','SUPPORT','OPPOSE') | NOT NULL | 互动类型 |
| post_id | INT | FK → posts.id, CASCADE | 文章 |
| user_id | INT | FK → users.id, CASCADE | 用户 |
| created_at | DATETIME(3) | DEFAULT NOW(3) | 创建时间 |

**唯一约束:** `(post_id, user_id, type)` —— 每人每篇文章每种类型只能操作一次。

### 2.8 site_settings（站点设置表）

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | INT | PK, AUTO_INCREMENT | 记录 ID |
| key | VARCHAR(100) | UNIQUE, NOT NULL | 配置键名 |
| value | TEXT | NOT NULL | 配置值 |
| label | VARCHAR(200) | NULL | 中文标签说明 |
| created_at | DATETIME(3) | DEFAULT NOW(3) | 创建时间 |
| updated_at | DATETIME(3) | ON UPDATE | 更新时间 |

**预置配置项:**

| key | label | 默认值 | 说明 |
|-----|-------|--------|------|
| site_name | 站点名称 | 企业门户网站 | 页头显示的完整站名 |
| site_short_name | 站点简称 | 企业门户 | Logo 旁显示的简称 |
| site_logo_text | Logo 文字 | EP | Logo 图标内文字 |
| site_logo_subtitle | Logo 副标题 | ENTERPRISE PORTAL | Logo 下方英文 |
| site_hotline | 客服热线 | (空) | 页头和页脚显示的电话 |
| site_copyright | 版权信息 | (空) | 页脚版权文字，空则自动拼接简称 |
| site_icp | ICP备案号 | (空) | 页脚备案号 |
| popup_image | 悬浮按钮弹窗图片 | (空) | 点击左侧悬浮按钮弹出的图片 URL |
| home_module_left_tab1 | 首页左侧模块 Tab1 | feedback | 首页左栏第一个 Tab 对应的分类 slug |
| home_module_left_tab2 | 首页左侧模块 Tab2 | suggestions | 首页左栏第二个 Tab 对应的分类 slug |
| home_module_right_tab1 | 首页右侧模块 Tab1 | notice | 首页右栏第一个 Tab 对应的分类 slug |
| home_module_right_tab2 | 首页右侧模块 Tab2 | news | 首页右栏第二个 Tab 对应的分类 slug |
| sidebar_left_category | 左侧悬浮按钮分类 | feedback | 左侧悬浮按钮对应的分类 slug |
| sidebar_right_category | 右侧悬浮按钮分类 | suggestions | 右侧悬浮按钮对应的分类 slug |

### 2.9 nav_menus（导航菜单表）

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | INT | PK, AUTO_INCREMENT | 菜单 ID |
| name | VARCHAR(50) | NOT NULL | 菜单名称 |
| url | VARCHAR(500) | NULL | 链接地址 (内部或外部) |
| icon | VARCHAR(50) | NULL | 图标名称 |
| sort | INT | DEFAULT 0 | 排序序号 |
| parent_id | INT | FK → nav_menus.id, NULL | 父菜单 (自关联) |
| visible | TINYINT(1) | DEFAULT 1 | 是否显示 |
| created_at | DATETIME(3) | DEFAULT NOW(3) | 创建时间 |

**说明:** 支持两级菜单结构。顶级菜单 `parent_id = NULL`，子菜单指向父菜单 ID。当数据库中有菜单数据时替换默认固定导航。

### 2.10 ai_chat_history（AI 对话历史表）

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | INT | PK, AUTO_INCREMENT | 记录 ID |
| session_id | VARCHAR(100) | NOT NULL, INDEX | 会话 ID |
| type | VARCHAR(20) | DEFAULT 'chat' | 对话类型: chat / designer |
| role | VARCHAR(20) | NOT NULL | 消息角色: system / user / assistant |
| content | LONGTEXT | NOT NULL | 消息内容 (加密存储) |
| user_id | INT | NOT NULL, INDEX | 操作用户 ID |
| created_at | DATETIME(3) | DEFAULT NOW(3) | 创建时间 |

### 2.11 user_preferences（用户偏好设置表）

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | INT | PK, AUTO_INCREMENT | 记录 ID |
| user_id | INT | NOT NULL, INDEX | 用户 ID |
| key | VARCHAR(50) | NOT NULL | 配置键名 (如 theme_color) |
| value | VARCHAR(500) | NOT NULL | 配置值 |
| updated_at | DATETIME(3) | ON UPDATE | 更新时间 |

**唯一约束:** `(user_id, key)` —— 每个用户每个配置键唯一。

**已使用的配置键:**

| key | 说明 | 可选值 |
|-----|------|--------|
| theme_color | 用户主题配色 | classic-red / tech-blue / eco-green / royal-purple / warm-orange / teal / rose / slate |

---

## 三、ER 关系图

```
users 1───N posts              (作者 → 文章)
users 1───N comments           (评论者 → 评论)
users 1───N petitions          (提交者 → 反馈/建议)
users 1───N post_reactions     (用户 → 文章互动)
users 1───N ai_chat_history    (用户 → AI 对话)
users 1───N user_preferences   (用户 → 偏好设置)
categories 1───N posts         (分类 → 文章)
posts 1───N comments           (文章 → 评论)
posts 1───N post_reactions     (文章 → 互动)
comments 1───N comments        (自关联, parent_id → 嵌套回复)
nav_menus 1───N nav_menus      (自关联, parent_id → 子菜单)
site_settings                  (独立 key-value 配置表, 无外键)
user_preferences               (用户级 key-value 配置, 按 user_id+key 唯一)
```

---

## 四、枚举类型

| 枚举 | 值 | 说明 |
|------|------|------|
| UserRole | `USER`, `ADMIN`, `SUPER_ADMIN` | 用户角色 |
| PostStatus | `DRAFT`, `PUBLISHED`, `ARCHIVED` | 文章状态 |
| PetitionType | `FEEDBACK`, `SUGGESTION` | 反馈类型 / 意见征集 |
| PetitionStatus | `PENDING`, `PROCESSING`, `REPLIED`, `CLOSED` | 反馈处理状态 |
| ReactionType | `FAVORITE`, `SUPPORT`, `OPPOSE` | 文章互动类型 (收藏/支持/反对) |

---

## 五、索引说明

| 表 | 索引类型 | 字段 | 说明 |
|------|------|------|------|
| users | UNIQUE | username | 用户名唯一 |
| categories | UNIQUE | slug | 分类别名唯一 |
| posts | FK | author_id | 外键索引 |
| posts | FK | category_id | 外键索引 |
| comments | FK | post_id | 外键索引 |
| comments | FK | author_id | 外键索引 |
| comments | FK | parent_id | 外键索引 |
| petitions | FK | author_id | 外键索引 |
| post_reactions | UNIQUE | (post_id, user_id, type) | 复合唯一 |
| post_reactions | FK | post_id, user_id | 外键索引 |
| nav_menus | FK | parent_id | 外键索引 |
| site_settings | UNIQUE | key | 配置键名唯一 |
| ai_chat_history | INDEX | session_id | 会话检索 |
| ai_chat_history | INDEX | user_id | 用户检索 |
| user_preferences | UNIQUE | (user_id, key) | 用户+键名复合唯一 |
| user_preferences | INDEX | user_id | 用户检索 |

---

## 六、数据迁移

推荐使用 Prisma 管理表结构:

```bash
# 从 schema.prisma 同步到数据库
npx prisma db push

# 或使用纯 SQL
mysql -u root -prace < docs/scripts/init.sql
mysql -u root -prace < docs/scripts/seed.sql
```
