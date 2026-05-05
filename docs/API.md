# API 接口文档

> 版本 v1.5 · 最后更新 2026-04-26

## 基础信息

- **Base URL**: `http://localhost:9055/api`
- **认证方式**: Bearer Token (JWT)，Header 格式: `Authorization: Bearer <token>`
- **请求格式**: JSON (`Content-Type: application/json`)；文件上传使用 `multipart/form-data`
- **响应格式**: JSON

---

## 一、认证接口 `/api/auth/*`

### 1.1 用户注册

```
POST /api/auth/register
```

**请求体:**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| username | string | 是 | 用户名 (3-20 字符) |
| password | string | 是 | 密码 (≥6 字符) |
| email | string | 否 | 邮箱 |
| phone | string | 否 | 手机号 |
| realName | string | 否 | 真实姓名 |

**成功响应 (201):**
```json
{
  "token": "jwt_token_string",
  "user": { "id": 1, "username": "testuser", "role": "USER", "permissions": [] }
}
```

### 1.2 用户登录

```
POST /api/auth/login
```

**请求体:**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| username | string | 是 | 用户名 |
| password | string | 是 | 密码 |

**成功响应 (200):**
```json
{
  "token": "jwt_token_string",
  "user": { "id": 1, "username": "admin", "role": "SUPER_ADMIN", "permissions": ["publish","posts","comments","users","menus","settings"] }
}
```

### 1.3 获取个人信息

```
GET /api/auth/profile
Authorization: Bearer <token>
```

**成功响应 (200):**
```json
{
  "id": 1, "username": "admin", "email": null, "phone": null,
  "realName": "系统管理员", "role": "ADMIN", "createdAt": "...",
  "_count": { "posts": 6, "comments": 3, "petitions": 0 }
}
```

### 1.4 更新个人信息

```
PUT /api/auth/profile
Authorization: Bearer <token>
```

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| email | string | 否 | 邮箱 |
| phone | string | 否 | 手机号 |
| realName | string | 否 | 真实姓名 |

### 1.5 修改密码

```
PUT /api/auth/password
Authorization: Bearer <token>
```

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| oldPassword | string | 是 | 原密码 |
| newPassword | string | 是 | 新密码 (≥6 字符) |

**成功响应 (200):**
```json
{ "message": "密码修改成功" }
```

---

## 二、文章接口 `/api/posts`

### 2.1 获取文章列表

```
GET /api/posts?category=feedback&page=1&limit=10&top=true
```

| 参数 | 类型 | 说明 |
|------|------|------|
| category | string | 分类 slug (`feedback` / `suggestions` / `notice` / `news`) |
| page | number | 页码，默认 1 |
| limit | number | 每页数量，默认 10 |
| top | string | `true` 仅返回置顶文章 |

**成功响应 (200):**
```json
{
  "posts": [
    {
      "id": 1, "title": "...", "content": "...", "summary": "...",
      "coverImage": "/uploads/xxx.jpg", "viewCount": 120, "isTop": true,
      "status": "PUBLISHED", "createdAt": "...", "updatedAt": "...",
      "category": { "name": "互动反馈", "slug": "feedback" },
      "author": { "username": "admin" }
    }
  ],
  "total": 20, "page": 1, "totalPages": 2
}
```

### 2.2 获取文章详情

```
GET /api/posts/:id
```

返回文章详情（含完整评论树），同时自动 +1 浏览量。

### 2.3 文章互动 (收藏/支持/反对)

```
GET /api/posts/:id/reactions
```

返回互动计数和当前用户的互动状态：

```json
{
  "favorite": 3, "support": 10, "oppose": 1,
  "userReactions": ["FAVORITE", "SUPPORT"]
}
```

```
POST /api/posts/:id/reactions
Authorization: Bearer <token>
```

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| type | string | 是 | `FAVORITE` / `SUPPORT` / `OPPOSE` |

**行为:** Toggle —— 已存在则取消，不存在则添加。

### 2.4 创建文章 (需登录)

```
POST /api/posts
Authorization: Bearer <token>
```

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| title | string | 是 | 标题 |
| content | string | 是 | 内容 (HTML) |
| summary | string | 否 | 摘要 |
| categoryId | number | 是 | 分类 ID |
| coverImage | string | 否 | 封面图 URL (通过上传接口获取) |
| isTop | boolean | 否 | 是否置顶 (ADMIN 专用) |

---

## 三、评论接口 `/api/comments`

### 3.1 创建评论 (需登录)

```
POST /api/comments
Authorization: Bearer <token>
```

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| content | string | 是 | 评论内容 (支持 Emoji) |
| postId | number | 是 | 文章 ID |
| parentId | number | 否 | 父评论 ID (回复) |
| images | string[] | 否 | 图片 URL 数组 |

---

## 四、分类接口 `/api/categories`

### 4.1 获取分类列表

```
GET /api/categories
```

---

## 五、搜索接口 `/api/search`

### 5.1 搜索文章

```
GET /api/search?q=关键词&page=1&limit=10
```

| 参数 | 类型 | 说明 |
|------|------|------|
| q | string | 搜索关键词 (标题 + 内容 + 摘要匹配) |
| page | number | 页码，默认 1 |
| limit | number | 每页数量，默认 10 |

**成功响应 (200):**
```json
{
  "posts": [...],
  "total": 5, "page": 1, "totalPages": 1
}
```

---

## 六、反馈 & 意见征集接口 `/api/petitions`

> **隐私**: 普通用户仅返回自己的记录，ADMIN 返回全部。

### 6.1 获取列表 (需登录)

```
GET /api/petitions?type=FEEDBACK&status=PENDING&page=1&limit=20
Authorization: Bearer <token>
```

| 参数 | 类型 | 说明 |
|------|------|------|
| type | string | `FEEDBACK` / `SUGGESTION` |
| status | string | `PENDING` / `PROCESSING` / `REPLIED` / `CLOSED` |
| page | number | 页码，默认 1 |
| limit | number | 每页数量，默认 20 |

### 6.2 创建反馈/建议 (需登录)

```
POST /api/petitions
Authorization: Bearer <token>
```

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| title | string | 是 | 标题 |
| content | string | 是 | 内容 |
| type | string | 否 | `FEEDBACK` (默认) / `SUGGESTION` |
| images | string | 否 | 图片 JSON 字符串 |
| attachments | string | 否 | 附件 JSON 字符串 `[{url, name, size}]` |

### 6.3 查看详情 (需登录)

```
GET /api/petitions/:id
Authorization: Bearer <token>
```

仅作者本人或 ADMIN 可查看。

### 6.4 回复/更新状态 (ADMIN)

```
PUT /api/petitions/:id
Authorization: Bearer <admin_token>
```

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| reply | string | 否 | 管理员回复内容 (同时自动设置 repliedAt) |
| status | string | 否 | `PENDING` / `PROCESSING` / `REPLIED` / `CLOSED` |

### 6.5 删除 (ADMIN)

```
DELETE /api/petitions/:id
Authorization: Bearer <admin_token>
```

---

## 七、文件上传接口 `/api/upload`

### 7.1 上传文件 (需登录)

```
POST /api/upload
Authorization: Bearer <token>
Content-Type: multipart/form-data
```

| 参数 | 类型 | 说明 |
|------|------|------|
| file | File | 上传文件 (FormData) |

**限制:**
- 最大 10 MB
- 允许类型: `image/jpeg`, `image/png`, `image/gif`, `image/webp`, `application/pdf`, `application/msword`, `application/vnd.openxmlformats-officedocument.wordprocessingml.document`

**成功响应 (200):**
```json
{
  "url": "/uploads/1713700000_abc123.jpg",
  "filename": "1713700000_abc123.jpg",
  "originalName": "photo.jpg",
  "mimeType": "image/jpeg",
  "size": 102400
}
```

---

## 八、管理后台接口 `/api/admin/*`

> 所有管理接口均需 ADMIN 角色的 Bearer Token。

### 8.1 获取统计数据

```
GET /api/admin/stats
```

**成功响应 (200):**
```json
{
  "postCount": 10, "userCount": 5,
  "totalViews": 1200, "commentCount": 30
}
```

### 8.2 获取文章列表 (管理)

```
GET /api/admin/posts
Authorization: Bearer <admin_token>
```

### 8.3 编辑文章

```
PUT /api/admin/posts/:id
Authorization: Bearer <admin_token>
```

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| title | string | 否 | 标题 |
| content | string | 否 | 内容 (HTML) |
| summary | string | 否 | 摘要 |
| categoryId | number | 否 | 分类 ID |
| coverImage | string | 否 | 封面图 URL |
| isTop | boolean | 否 | 是否置顶 |
| status | string | 否 | `DRAFT` / `PUBLISHED` / `ARCHIVED` |

### 8.4 删除文章

```
DELETE /api/admin/posts/:id
Authorization: Bearer <admin_token>
```

### 8.5 获取用户列表

```
GET /api/admin/users
Authorization: Bearer <admin_token>
```

返回用户列表，含 `_count: { posts, comments }` 统计和 `permissions: string[]` 模块权限。

### 8.5.1 修改用户角色和权限 (SUPER_ADMIN)

```
PUT /api/admin/users
Authorization: Bearer <super_admin_token>
```

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| userId | number | 是 | 目标用户 ID |
| role | string | 是 | 新角色: `USER` / `ADMIN` / `SUPER_ADMIN` |
| permissions | string[] | 否 | 模块权限列表，仅 ADMIN 角色需要 |

可选权限值: `publish`, `posts`, `comments`, `users`, `menus`, `settings`

> 详见 [PERMISSIONS.md](./PERMISSIONS.md)

### 8.6 获取评论列表

```
GET /api/admin/comments
Authorization: Bearer <admin_token>
```

返回最近 100 条评论，含作者和所属文章信息。

### 8.7 删除评论

```
DELETE /api/admin/comments
Authorization: Bearer <admin_token>
```

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | number | 是 | 评论 ID (同时删除子回复) |

---

## 九、导航菜单接口 `/api/nav-menus`

### 9.1 获取菜单树 (公开)

```
GET /api/nav-menus
```

返回可见的顶级菜单及其子菜单，按 `sort` 排序。

### 9.2 创建菜单 (SUPER_ADMIN)

```
POST /api/nav-menus
Authorization: Bearer <admin_token>
```

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| name | string | 是 | 菜单名称 |
| url | string | 否 | 链接 URL (内部路径或外部链接) |
| icon | string | 否 | 图标名称 |
| sort | number | 否 | 排序序号 (默认 0) |
| parentId | number | 否 | 父菜单 ID (空则为顶级) |
| visible | boolean | 否 | 是否显示 (默认 true) |

### 9.3 编辑菜单 (SUPER_ADMIN)

```
PUT /api/nav-menus/:id
Authorization: Bearer <admin_token>
```

参数同创建，均为可选。

### 9.4 删除菜单 (SUPER_ADMIN)

```
DELETE /api/nav-menus/:id
Authorization: Bearer <admin_token>
```

同时删除所有子菜单。

---

## 十、站点设置接口 `/api/settings`

### 10.1 获取设置 (公开)

```
GET /api/settings?key=popup_image
```

| 参数 | 类型 | 说明 |
|------|------|------|
| key | string | 配置键名 (可选，不传返回全部) |

**成功响应 (200):**
```json
{
  "id": 1, "key": "popup_image",
  "value": "/uploads/xxx.png", "label": "悬浮按钮弹窗图片",
  "createdAt": "...", "updatedAt": "..."
}
```

当 key 不存在时返回 `{ "key": "xxx", "value": "" }`。

### 10.2 更新设置 (ADMIN)

```
PUT /api/settings
Authorization: Bearer <admin_token>
```

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| key | string | 是 | 配置键名 |
| value | string | 否 | 配置值 (如图片 URL) |
| label | string | 否 | 中文标签说明 |

**行为:** Upsert —— 存在则更新，不存在则创建。

---

## 十一、管理员重置密码 `/api/admin/users/password`

### 11.1 重置用户密码 (ADMIN)

```
PUT /api/admin/users/password
Authorization: Bearer <admin_token>
```

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| userId | number | 是 | 目标用户 ID |
| newPassword | string | 是 | 新密码 (≥6 字符) |

**成功响应 (200):**
```json
{ "message": "密码已重置" }
```

---

## 十二、用户偏好接口 `/api/user-preferences`

> 每个用户独立的配置存储（如主题色），所有接口均需登录。

### 12.1 获取用户偏好

```
GET /api/user-preferences?key=theme_color
Authorization: Bearer <token>
```

| 参数 | 类型 | 说明 |
|------|------|------|
| key | string | 配置键名 (可选，不传返回全部) |

**指定 key 响应 (200):**
```json
{ "key": "theme_color", "value": "tech-blue" }
```

**不传 key 响应 (200):**
```json
{ "theme_color": "tech-blue" }
```

### 12.2 设置用户偏好

```
PUT /api/user-preferences
Authorization: Bearer <token>
```

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| key | string | 是 | 配置键名 |
| value | string | 是 | 配置值 |

**行为:** Upsert —— 存在则更新，不存在则创建。

**成功响应 (200):**
```json
{ "ok": true }
```

**已使用的配置键:**

| key | 说明 | 可选值 |
|-----|------|--------|
| theme_color | 用户主题配色 | `classic-red` / `tech-blue` / `eco-green` / `royal-purple` / `warm-orange` / `teal` / `rose` / `slate` |

---

## 错误响应格式

所有接口统一错误格式:

```json
{
  "error": "错误信息描述"
}
```

常见状态码:

| 状态码 | 说明 |
|------|------|
| 400 | 参数错误 |
| 401 | 未登录 / Token 无效 |
| 403 | 权限不足 (非 ADMIN) |
| 404 | 资源不存在 |
| 500 | 服务器内部错误 |
