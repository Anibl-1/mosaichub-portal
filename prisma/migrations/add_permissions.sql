-- ============================================
-- 权限系统数据库迁移脚本
-- 执行时间: 2026-04-22
-- 说明: 新增 SUPER_ADMIN 角色及模块级权限字段
-- ============================================

-- 1. 修改 UserRole 枚举，新增 SUPER_ADMIN
ALTER TABLE `users` MODIFY COLUMN `role` ENUM('USER', 'ADMIN', 'SUPER_ADMIN') NOT NULL DEFAULT 'USER';

-- 2. 新增 permissions 字段 (JSON 数组存储模块权限)
ALTER TABLE `users` ADD COLUMN `permissions` TEXT NULL AFTER `role`;

-- 3. 将现有 admin 用户升级为超级管理员并赋予全部权限
UPDATE `users`
SET `role` = 'SUPER_ADMIN',
    `permissions` = '["publish","posts","comments","users","menus","settings"]'
WHERE `username` = 'admin';

-- 4. 为其他已有 ADMIN 用户设置默认权限（发文、文章、评论、用户）
UPDATE `users`
SET `permissions` = '["publish","posts","comments","users"]'
WHERE `role` = 'ADMIN' AND (`permissions` IS NULL OR `permissions` = '');
