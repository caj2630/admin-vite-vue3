-- =========================================================
-- 系统用户 & 角色 建表 + 种子数据
-- 在 Supabase SQL Editor 中运行此脚本
-- =========================================================

-- 1. 系统角色表
CREATE TABLE IF NOT EXISTS system_roles (
  id SERIAL PRIMARY KEY,
  role_name VARCHAR(50) NOT NULL,
  role_code VARCHAR(50) NOT NULL UNIQUE,
  status SMALLINT NOT NULL DEFAULT 1,
  create_time TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. 系统用户表
CREATE TABLE IF NOT EXISTS system_users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(50) NOT NULL UNIQUE,
  nick_name VARCHAR(50) NOT NULL,
  phone VARCHAR(20),
  email VARCHAR(100),
  password VARCHAR(255) NOT NULL DEFAULT '123456',
  status SMALLINT NOT NULL DEFAULT 1,
  remark TEXT,
  create_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  update_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  login_time TIMESTAMP WITH TIME ZONE
);

-- 3. 用户-角色关联表
CREATE TABLE IF NOT EXISTS system_user_roles (
  user_id INTEGER NOT NULL REFERENCES system_users(id) ON DELETE CASCADE,
  role_id INTEGER NOT NULL REFERENCES system_roles(id) ON DELETE CASCADE,
  PRIMARY KEY (user_id, role_id)
);

-- 4. 角色种子数据
INSERT INTO system_roles (role_name, role_code) VALUES
  ('超级管理员', 'super_admin'),
  ('管理员', 'admin'),
  ('普通用户', 'user'),
  ('访客', 'guest')
ON CONFLICT (role_code) DO NOTHING;

-- 5. 用户种子数据（密码: 123456 → MD5）
INSERT INTO system_users (username, nick_name, phone, email, password, status, remark, create_time, login_time) VALUES
  ('admin',    '系统管理员', '13800001001', 'admin@example.com',    'e10adc3949ba59abbe56e057f20f883e', 1, '超级管理员账号', '2024-01-01 00:00:00', '2025-04-26 14:30:00'),
  ('zhangsan', '张三',       '13800001002', 'zhangsan@example.com', 'e10adc3949ba59abbe56e057f20f883e', 1, '',              '2024-01-15 00:00:00', '2025-04-25 09:15:00'),
  ('lisi',     '李四',       '13800001003', 'lisi@example.com',     'e10adc3949ba59abbe56e057f20f883e', 1, '研发部成员',     '2024-02-20 00:00:00', '2025-04-20 16:45:00'),
  ('wangwu',   '王五',       '13800001004', 'wangwu@example.com',   'e10adc3949ba59abbe56e057f20f883e', 0, '已离职',         '2024-03-10 00:00:00', '2024-12-01 08:00:00'),
  ('zhaoliu',  '赵六',       '13800001005', 'zhaoliu@example.com',  'e10adc3949ba59abbe56e057f20f883e', 1, '',              '2024-03-25 00:00:00', '2025-04-22 11:20:00'),
  ('sunqi',    '孙七',       '13800001006', 'sunqi@example.com',    'e10adc3949ba59abbe56e057f20f883e', 1, '兼职管理员',     '2024-04-10 00:00:00', '2025-04-18 10:00:00'),
  ('zhouba',   '周八',       '13800001007', 'zhouba@example.com',   'e10adc3949ba59abbe56e057f20f883e', 0, '',              '2024-05-05 00:00:00', '2025-03-15 13:30:00')
ON CONFLICT (username) DO NOTHING;

-- 6. 用户-角色关联种子数据
-- admin → 超级管理员; zhangsan → 管理员; lisi → 普通用户; wangwu → 普通用户+访客
-- zhaoliu → 普通用户; sunqi → 管理员+普通用户; zhouba → 普通用户
INSERT INTO system_user_roles (user_id, role_id)
SELECT u.id, r.id
FROM system_users u, system_roles r
WHERE (u.username = 'admin'    AND r.role_code = 'super_admin')
   OR (u.username = 'zhangsan' AND r.role_code = 'admin')
   OR (u.username = 'lisi'     AND r.role_code = 'user')
   OR (u.username = 'wangwu'   AND r.role_code = 'user')
   OR (u.username = 'wangwu'   AND r.role_code = 'guest')
   OR (u.username = 'zhaoliu'  AND r.role_code = 'user')
   OR (u.username = 'sunqi'    AND r.role_code = 'admin')
   OR (u.username = 'sunqi'    AND r.role_code = 'user')
   OR (u.username = 'zhouba'   AND r.role_code = 'user')
ON CONFLICT DO NOTHING;
