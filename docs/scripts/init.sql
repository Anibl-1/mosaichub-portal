-- ============================================
-- 企业门户网站 - 数据库初始化脚本 (一键执行)
-- 功能: 删库 → 建库建表 → 灌入种子数据
-- 用法: mysql -u root -p --default-character-set=utf8mb4 < init.sql
-- 版本: v1.6 (2026-04-26)
-- ============================================

-- ===========================================
-- 第一部分: 建库
-- ===========================================
DROP DATABASE IF EXISTS `mosaichub_portal`;

CREATE DATABASE `mosaichub_portal`
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE `mosaichub_portal`;

-- ===========================================
-- 第二部分: 建表
-- ===========================================

-- 1. 用户表
CREATE TABLE `users` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `username` VARCHAR(50) NOT NULL,
  `password` VARCHAR(255) NOT NULL,
  `email` VARCHAR(100) DEFAULT NULL,
  `phone` VARCHAR(20) DEFAULT NULL,
  `real_name` VARCHAR(50) DEFAULT NULL,
  `role` ENUM('USER', 'ADMIN', 'SUPER_ADMIN') NOT NULL DEFAULT 'USER',
  `permissions` TEXT DEFAULT NULL,
  `avatar` VARCHAR(255) DEFAULT NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `users_username_key` (`username`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. 分类表
CREATE TABLE `categories` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(50) NOT NULL,
  `slug` VARCHAR(50) NOT NULL,
  `description` VARCHAR(255) DEFAULT NULL,
  `sort` INT NOT NULL DEFAULT 0,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `categories_slug_key` (`slug`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. 文章表
CREATE TABLE `posts` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `title` VARCHAR(200) NOT NULL,
  `content` TEXT NOT NULL,
  `summary` VARCHAR(500) DEFAULT NULL,
  `cover_image` VARCHAR(255) DEFAULT NULL,
  `view_count` INT NOT NULL DEFAULT 0,
  `is_top` TINYINT(1) NOT NULL DEFAULT 0,
  `top_sort` INT NOT NULL DEFAULT 0,
  `status` ENUM('DRAFT', 'PUBLISHED', 'ARCHIVED') NOT NULL DEFAULT 'PUBLISHED',
  `author_id` INT NOT NULL,
  `category_id` INT NOT NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `posts_author_id_fkey` (`author_id`),
  KEY `posts_category_id_fkey` (`category_id`),
  CONSTRAINT `posts_author_id_fkey` FOREIGN KEY (`author_id`) REFERENCES `users` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `posts_category_id_fkey` FOREIGN KEY (`category_id`) REFERENCES `categories` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. 评论表
CREATE TABLE `comments` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `content` TEXT NOT NULL,
  `images` TEXT DEFAULT NULL,
  `post_id` INT NOT NULL,
  `author_id` INT NOT NULL,
  `parent_id` INT DEFAULT NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `comments_post_id_fkey` (`post_id`),
  KEY `comments_author_id_fkey` (`author_id`),
  KEY `comments_parent_id_fkey` (`parent_id`),
  CONSTRAINT `comments_post_id_fkey` FOREIGN KEY (`post_id`) REFERENCES `posts` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `comments_author_id_fkey` FOREIGN KEY (`author_id`) REFERENCES `users` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `comments_parent_id_fkey` FOREIGN KEY (`parent_id`) REFERENCES `comments` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. 附件表
CREATE TABLE `attachments` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `filename` VARCHAR(255) NOT NULL,
  `original_name` VARCHAR(255) NOT NULL,
  `mime_type` VARCHAR(100) NOT NULL,
  `size` INT NOT NULL,
  `url` VARCHAR(500) NOT NULL,
  `post_id` INT DEFAULT NULL,
  `uploader_id` INT NOT NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. 反馈/意见征集表
CREATE TABLE `petitions` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `title` VARCHAR(200) NOT NULL,
  `content` TEXT NOT NULL,
  `images` TEXT DEFAULT NULL,
  `attachments` TEXT DEFAULT NULL,
  `type` ENUM('FEEDBACK', 'SUGGESTION') NOT NULL DEFAULT 'FEEDBACK',
  `status` ENUM('PENDING', 'PROCESSING', 'REPLIED', 'CLOSED') NOT NULL DEFAULT 'PENDING',
  `reply` TEXT DEFAULT NULL,
  `replied_at` DATETIME(3) DEFAULT NULL,
  `author_id` INT NOT NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `petitions_author_id_fkey` (`author_id`),
  CONSTRAINT `petitions_author_id_fkey` FOREIGN KEY (`author_id`) REFERENCES `users` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 7. 文章互动表
CREATE TABLE `post_reactions` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `type` ENUM('FAVORITE', 'SUPPORT', 'OPPOSE') NOT NULL,
  `post_id` INT NOT NULL,
  `user_id` INT NOT NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `post_reactions_post_id_user_id_type_key` (`post_id`, `user_id`, `type`),
  KEY `post_reactions_post_id_fkey` (`post_id`),
  KEY `post_reactions_user_id_fkey` (`user_id`),
  CONSTRAINT `post_reactions_post_id_fkey` FOREIGN KEY (`post_id`) REFERENCES `posts` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `post_reactions_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 8. 站点设置表
CREATE TABLE `site_settings` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `key` VARCHAR(100) NOT NULL,
  `value` TEXT NOT NULL,
  `label` VARCHAR(200) DEFAULT NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `site_settings_key_key` (`key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 9. 导航菜单表
CREATE TABLE `nav_menus` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(50) NOT NULL,
  `url` VARCHAR(500) DEFAULT NULL,
  `icon` VARCHAR(50) DEFAULT NULL,
  `sort` INT NOT NULL DEFAULT 0,
  `parent_id` INT DEFAULT NULL,
  `visible` TINYINT(1) NOT NULL DEFAULT 1,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `nav_menus_parent_id_fkey` (`parent_id`),
  CONSTRAINT `nav_menus_parent_id_fkey` FOREIGN KEY (`parent_id`) REFERENCES `nav_menus` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 10. AI对话历史表 (加密存储)
CREATE TABLE `ai_chat_history` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `session_id` VARCHAR(100) NOT NULL COMMENT '会话ID',
  `type` VARCHAR(20) NOT NULL DEFAULT 'chat' COMMENT '对话类型: chat=普通对话, designer=布局设计器',
  `role` VARCHAR(20) NOT NULL COMMENT '消息角色: system/user/assistant',
  `content` LONGTEXT NOT NULL COMMENT '消息内容(加密存储)',
  `user_id` INT NOT NULL COMMENT '操作用户ID',
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `ai_chat_history_session_id_idx` (`session_id`),
  KEY `ai_chat_history_user_id_idx` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 11. 用户偏好设置表 (每个用户独立的配置，如主题色)
CREATE TABLE `user_preferences` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `user_id` INT NOT NULL COMMENT '用户ID',
  `key` VARCHAR(50) NOT NULL COMMENT '配置键名，如 theme_color',
  `value` VARCHAR(500) NOT NULL COMMENT '配置值',
  `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `user_preferences_user_id_key_key` (`user_id`, `key`),
  KEY `user_preferences_user_id_idx` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ===========================================
-- 第三部分: 种子数据
-- ===========================================

-- 3.1 分类
INSERT INTO `categories` (`name`, `slug`, `description`, `sort`, `created_at`) VALUES
  ('互动反馈', 'feedback',    '在线提交反馈与投诉', 1, NOW(3)),
  ('建议征集', 'suggestions', '征集意见与改进建议', 2, NOW(3)),
  ('公告通知', 'notice',      '重要通知公告',       3, NOW(3)),
  ('新闻动态', 'news',        '最新新闻动态',       4, NOW(3));

-- 3.2 管理员 (密码: admin123)
INSERT INTO `users` (`username`, `password`, `real_name`, `role`, `permissions`, `email`, `created_at`, `updated_at`) VALUES
  ('admin', '$2a$10$VDhkds6PGlOi9w/WApF10e5L.4o8ki3fH0LL0aKxMXr6Yc9CpLxlq', '系统管理员', 'SUPER_ADMIN',
   '["publish","posts","comments","users","menus","settings"]', 'admin@example.com', NOW(3), NOW(3));

-- 获取 ID
SET @admin_id = (SELECT `id` FROM `users`      WHERE `username` = 'admin' LIMIT 1);
SET @cat_xf   = (SELECT `id` FROM `categories` WHERE `slug` = 'feedback');
SET @cat_zj   = (SELECT `id` FROM `categories` WHERE `slug` = 'suggestions');
SET @cat_gg   = (SELECT `id` FROM `categories` WHERE `slug` = 'notice');
SET @cat_news = (SELECT `id` FROM `categories` WHERE `slug` = 'news');

-- 3.3 示例文章
INSERT INTO `posts` (`title`, `content`, `summary`, `cover_image`, `is_top`, `status`, `author_id`, `category_id`, `created_at`, `updated_at`) VALUES
  -- 互动反馈 (6篇, 前2篇置顶)
  ('关于开通在线反馈渠道的通知',
   '<p>为更好地服务广大用户，现开通在线反馈渠道，欢迎大家提交意见和建议。</p>',
   '在线反馈渠道正式开通',
   '/uploads/demo/banner1.jpg', 1, 'PUBLISHED', @admin_id, @cat_xf, NOW(3), NOW(3)),
  ('关于加强用户反馈处理的通知',
   '<p>为提升反馈处理效率，现将有关事项通知如下：</p><p>一、各部门高度重视用户反馈</p><p>二、建立反馈处理机制</p><p>三、加强问题排查与化解</p>',
   '加强用户反馈处理机制建设',
   '/uploads/demo/banner2.jpg', 1, 'PUBLISHED', @admin_id, @cat_xf, NOW(3), NOW(3)),
  ('反馈事项办理流程说明',
   '<p>为方便用户了解反馈办理流程，现公布如下：</p><p>1. 提交反馈</p><p>2. 受理登记</p><p>3. 转办处理</p><p>4. 结果反馈</p><p>5. 满意度评价</p>',
   '反馈事项办理的完整流程',
   '/uploads/demo/cover1.jpg', 0, 'PUBLISHED', @admin_id, @cat_xf, NOW(3), NOW(3)),
  ('关于规范反馈提交格式的说明',
   '<p>为提高反馈处理效率，请在提交时注明类别、描述和联系方式。</p>',
   '反馈提交格式规范',
   '/uploads/demo/cover2.jpg', 0, 'PUBLISHED', @admin_id, @cat_xf, NOW(3), NOW(3)),
  ('第一季度反馈处理情况通报',
   '<p>第一季度共收到反馈128件，已处理120件，处理率93.7%。</p>',
   '第一季度反馈处理情况汇总',
   '/uploads/demo/cover3.jpg', 0, 'PUBLISHED', @admin_id, @cat_xf, NOW(3), NOW(3)),
  ('常见问题解答（FAQ）',
   '<p>整理了用户高频反馈的问题及解答，供参考。</p>',
   '常见问题解答汇总',
   '/uploads/demo/cover4.jpg', 0, 'PUBLISHED', @admin_id, @cat_xf, NOW(3), NOW(3)),

  -- 建议征集 (4篇, 前1篇置顶)
  ('2024年度意见征集活动启动',
   '<p>为广泛听取意见建议，提升服务质量，现开展2024年度征集活动。</p><p>征集时间：2024年1月-12月</p><p>征集方式：线上提交</p><p>欢迎积极参与！</p>',
   '广泛征集意见建议，提升服务质量',
   '/uploads/demo/banner3.jpg', 1, 'PUBLISHED', @admin_id, @cat_zj, NOW(3), NOW(3)),
  ('征集服务改进建议',
   '<p>为进一步提升服务水平，现面向社会征集服务改进建议。</p><p>征集内容：服务态度、效率、环境、创新等。</p>',
   '面向社会征集服务改进建议',
   '/uploads/demo/cover5.jpg', 0, 'PUBLISHED', @admin_id, @cat_zj, NOW(3), NOW(3)),
  ('关于"效能提升"意见建议征集',
   '<p>为提升整体工作效能，现征集意见和建议。</p>',
   '效能提升建议征集',
   '/uploads/demo/cover6.jpg', 0, 'PUBLISHED', @admin_id, @cat_zj, NOW(3), NOW(3)),
  ('关于"制度优化"意见建议征集',
   '<p>为完善各项管理制度，现征集相关建议。</p>',
   '制度优化建议征集',
   '/uploads/demo/cover7.jpg', 0, 'PUBLISHED', @admin_id, @cat_zj, NOW(3), NOW(3)),

  -- 公告通知 (4篇)
  ('2024年春节放假通知',
   '<p>根据国务院办公厅关于2024年春节放假的安排，现将春节期间工作安排通知如下：</p><p>2024年2月10日至17日放假，2月18日正常上班。</p><p>线上服务正常运行。</p>',
   '2024年春节期间工作时间安排',
   '/uploads/demo/cover8.jpg', 0, 'PUBLISHED', @admin_id, @cat_gg, NOW(3), NOW(3)),
  ('违规问题典型案例通报',
   '<p>近日，对存在的违规问题进行了通报，要求各部门引以为戒。</p>',
   '违规问题典型案例通报',
   '/uploads/demo/news1.jpg', 0, 'PUBLISHED', @admin_id, @cat_gg, NOW(3), NOW(3)),
  ('关于开展2024年度员工培训的通知',
   '<p>为提升员工业务能力，现开展2024年度培训工作。</p>',
   '2024年度员工培训通知',
   '/uploads/demo/news2.jpg', 0, 'PUBLISHED', @admin_id, @cat_gg, NOW(3), NOW(3)),
  ('关于系统升级维护的公告',
   '<p>因系统升级维护，部分业务将暂停服务，请提前做好安排。</p>',
   '系统升级维护公告',
   '/uploads/demo/news3.jpg', 0, 'PUBLISHED', @admin_id, @cat_gg, NOW(3), NOW(3)),

  -- 新闻动态 (6篇)
  ('数字化转型取得新突破',
   '<p>近日，在数字化转型方面取得重要进展，移动端用户突破500万，线上交易占比超过85%。</p><p>下一步将继续加大科技投入，为用户提供更便捷的服务。</p>',
   '数字化转型成果显著',
   '/uploads/demo/banner4.jpg', 0, 'PUBLISHED', @admin_id, @cat_news, NOW(3), NOW(3)),
  ('2024年度工作推进倡议书',
   '<p>为推动年度各项重点工作，特发起工作推进倡议。</p>',
   '年度工作推进倡议书发布',
   '/uploads/demo/news4.jpg', 0, 'PUBLISHED', @admin_id, @cat_news, NOW(3), NOW(3)),
  ('寻根宪法之魂 共筑法治企业',
   '<p>为弘扬宪法精神，推进法治企业建设，开展了系列法治宣传活动。</p>',
   '法治企业建设宣传活动',
   '/uploads/demo/cover1.jpg', 0, 'PUBLISHED', @admin_id, @cat_news, NOW(3), NOW(3)),
  ('与高校党建共建签约仪式',
   '<p>近日，与高校举办了党建共建签约仪式。</p>',
   '校企合作签约仪式',
   '/uploads/demo/cover5.jpg', 0, 'PUBLISHED', @admin_id, @cat_news, NOW(3), NOW(3)),
  ('学史力行践初心 基层开展七一活动',
   '<p>6月30日，基层开展七一主题活动，传承红色基因。</p>',
   '七一主题活动报道',
   '/uploads/demo/cover6.jpg', 0, 'PUBLISHED', @admin_id, @cat_news, NOW(3), NOW(3)),
  ('领导一行赴基层调研',
   '<p>领导一行赴基层开展调研工作，了解业务开展情况。</p>',
   '领导调研基层工作',
   '/uploads/demo/cover8.jpg', 0, 'PUBLISHED', @admin_id, @cat_news, NOW(3), NOW(3));

-- 3.4 导航菜单
INSERT INTO `nav_menus` (`name`, `url`, `sort`, `parent_id`, `visible`, `created_at`) VALUES
  ('首页',     '/',                     1, NULL, 1, NOW(3)),
  ('互动反馈', '/category/feedback',    2, NULL, 1, NOW(3)),
  ('建议征集', '/category/suggestions', 3, NULL, 1, NOW(3)),
  ('公告通知', '/category/notice',      4, NULL, 1, NOW(3)),
  ('新闻动态', '/category/news',        5, NULL, 1, NOW(3)),
  ('信息查询', '/search',               6, NULL, 1, NOW(3));

-- 3.5 站点设置
INSERT INTO `site_settings` (`key`, `value`, `label`, `created_at`, `updated_at`) VALUES
  ('site_name',              '企业门户网站',                        '站点名称',            NOW(3), NOW(3)),
  ('site_short_name',        '企业门户',                            '站点简称',            NOW(3), NOW(3)),
  ('site_logo_text',         'EP',                                  'Logo文字',            NOW(3), NOW(3)),
  ('site_logo_subtitle',     'ENTERPRISE PORTAL',                   'Logo副标题',          NOW(3), NOW(3)),
  ('site_description',       '安全、便捷、高效的企业内部信息门户',      '站点描述',            NOW(3), NOW(3)),
  ('site_hotline',           '',                                    '客服热线',            NOW(3), NOW(3)),
  ('site_copyright',         '',                                    '版权信息',            NOW(3), NOW(3)),
  ('site_icp',               '',                                    'ICP备案号',           NOW(3), NOW(3)),
  ('popup_image',            '',                                    '悬浮按钮弹窗图片',    NOW(3), NOW(3)),
  ('home_modules',           '',                                    '首页模块配置（JSON）', NOW(3), NOW(3)),
  ('sidebar_left_category',  '',                                    '左侧悬浮按钮分类',    NOW(3), NOW(3)),
  ('sidebar_left_name',      '',                                    '左侧悬浮按钮名称',    NOW(3), NOW(3)),
  ('sidebar_left_icon',      '',                                    '左侧悬浮按钮图标',    NOW(3), NOW(3)),
  ('sidebar_right_category', '',                                    '右侧悬浮按钮分类',    NOW(3), NOW(3)),
  ('sidebar_right_name',     '',                                    '右侧悬浮按钮名称',    NOW(3), NOW(3)),
  ('sidebar_right_icon',     '',                                    '右侧悬浮按钮图标',    NOW(3), NOW(3));

-- ===========================================
-- 第四部分: 验证
-- ===========================================
SELECT '=== 数据库初始化完成 ===' AS message;
SELECT CONCAT('分类: ', COUNT(*)) AS result FROM `categories`;
SELECT CONCAT('用户: ', COUNT(*)) AS result FROM `users`;
SELECT CONCAT('文章: ', COUNT(*)) AS result FROM `posts`;
SELECT CONCAT('导航: ', COUNT(*)) AS result FROM `nav_menus`;
SELECT CONCAT('设置: ', COUNT(*)) AS result FROM `site_settings`;
SELECT CONCAT('AI对话历史: ', COUNT(*)) AS result FROM `ai_chat_history`;
SELECT CONCAT('用户偏好: ', COUNT(*)) AS result FROM `user_preferences`;
SELECT '管理员账号: admin / admin123' AS info;
