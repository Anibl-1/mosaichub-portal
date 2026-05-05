# 权限管理系统

> 版本 v1.0 · 更新 2026-04-22

## 一、角色体系

| 角色 | 标识 | 说明 |
|------|------|------|
| 超级管理员 | `SUPER_ADMIN` | 拥有所有模块权限，可管理其他用户角色和权限 |
| 管理员 | `ADMIN` | 按模块分配权限，由超级管理员配置 |
| 普通用户 | `USER` | 仅可浏览、评论、提交信访 |

## 二、模块权限列表

| 权限标识 | 模块名称 | 说明 |
|----------|----------|------|
| `publish` | 发布文章 | 可在管理后台发布新文章 |
| `posts` | 文章管理 | 查看、编辑、删除、置顶文章 |
| `comments` | 评论管理 | 查看、搜索、删除评论 |
| `users` | 用户管理 | 查看用户列表、重置密码、删除用户 |
| `menus` | 导航管理 | 添加、编辑、删除导航菜单 |
| `settings` | 站点设置 | 修改站点名称、首页模块、侧栏、敏感词等 |

## 三、权限存储

- **数据库字段**: `users.permissions` (TEXT, JSON 数组)
- **格式**: `["publish","posts","comments","users","menus","settings"]`
- **规则**:
  - `SUPER_ADMIN` 自动拥有全部权限，`permissions` 存储全量
  - `ADMIN` 由超级管理员分配部分模块权限
  - `USER` 的 `permissions` 为空或 `[]`

## 四、权限检查逻辑

### 4.1 前端 (admin/page.tsx)

```typescript
const userPerms = user?.permissions || []
const hasPerm = (mod: string) => isSuperAdmin || userPerms.includes(mod)

// Tab 显示由 hasPerm 控制
const tabs = allTabs.filter(t => hasPerm(tabPermMap[t.key]))
```

### 4.2 后端 API

| API 路由 | 所需权限 | 说明 |
|----------|----------|------|
| `POST /api/posts` | `isAdmin(role)` | ADMIN 和 SUPER_ADMIN 均可发文 |
| `GET /api/admin/posts` | `isAdmin(role)` | 管理员级别 |
| `PUT/DELETE /api/admin/posts/[id]` | `isAdmin(role)` | 管理员级别 |
| `GET/DELETE /api/admin/comments` | `isAdmin(role)` | 管理员级别 |
| `GET /api/admin/users` | `isAdmin(role)` | 管理员级别 |
| `PUT /api/admin/users` (改角色) | `SUPER_ADMIN` only | 仅超管可改角色 |
| `PUT /api/settings` | `isSuperAdmin(role)` | 仅超管 |
| `POST/PUT/DELETE /api/nav-menus` | `isSuperAdmin(role)` | 仅超管 |
| `GET /api/admin/stats` | `isAdmin(role)` | 管理员级别 |

### 4.3 工具函数 (lib/auth.ts)

```typescript
// 判断是否管理员（包含超管）
export function isAdmin(role: string): boolean {
  return role === 'ADMIN' || role === 'SUPER_ADMIN'
}

// 判断是否超级管理员
export function isSuperAdmin(role: string): boolean {
  return role === 'SUPER_ADMIN'
}
```

## 五、默认配置

### 5.1 种子数据 (prisma/seed.ts)

默认 admin 账号角色为 `SUPER_ADMIN`，拥有全部 6 个模块权限。

### 5.2 新建管理员默认权限

超级管理员将普通用户升级为管理员时，默认保留当前已选权限；升级为超管时自动赋予全部权限。

## 六、数据库迁移

迁移脚本位于 `prisma/migrations/add_permissions.sql`，包含：

1. `UserRole` 枚举新增 `SUPER_ADMIN`
2. `users` 表新增 `permissions` TEXT 字段
3. 现有 admin 升级为 `SUPER_ADMIN` + 全量权限
4. 其他 `ADMIN` 设置默认权限

执行方式：
```bash
# 方式一：Prisma 推送
npx prisma db push

# 方式二：手动执行 SQL
mysql -u root -p hfbank_portal < prisma/migrations/add_permissions.sql
```

## 七、管理后台操作

1. 以 `SUPER_ADMIN` 登录管理后台
2. 进入「用户管理」Tab
3. 通过角色下拉框修改用户角色
4. 对 `ADMIN` 用户，点击模块权限标签开关对应功能：
   - 蓝色高亮 = 已授权
   - 灰色 = 未授权
5. 权限变更即时生效，用户下次登录后生效
