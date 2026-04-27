-- 创建菜单表
CREATE TABLE IF NOT EXISTS menus (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  path TEXT,
  name TEXT,
  title TEXT,
  icon TEXT,
  parent_id UUID REFERENCES menus(id),
  "order" INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 插入顶级菜单
INSERT INTO menus (path, name, title, icon, "order") VALUES
('/dashboard', 'Dashboard', '控制台', 'dashboard', 0),
('/ai', 'AI', 'AI 应用管理', 'robot', 1),
('/system', 'System', '系统管理', 'setting', 2),
('/model', 'Model', '模型管理', 'api', 3),
('/logs', 'Logs', '日志中心', 'document', 4),
('/profile', 'Profile', '个人中心', 'user', 5);

-- 获取顶级菜单ID
-- Dashboard
INSERT INTO menus (path, title, parent_id, "order") VALUES
('/dashboard/overview', '数据概览', (SELECT id FROM menus WHERE path = '/dashboard'), 0),
('/dashboard/model-stats', '模型调用统计', (SELECT id FROM menus WHERE path = '/dashboard'), 1),
('/dashboard/usage-trend', '今日使用趋势', (SELECT id FROM menus WHERE path = '/dashboard'), 2);

-- AI 应用管理
INSERT INTO menus (title, parent_id, "order") VALUES
('对话应用管理', (SELECT id FROM menus WHERE path = '/ai'), 0),
('知识库管理', (SELECT id FROM menus WHERE path = '/ai'), 1),
('提示词模板', (SELECT id FROM menus WHERE path = '/ai'), 2),
('AI 生成任务', (SELECT id FROM menus WHERE path = '/ai'), 3);

-- 对话应用管理子项
INSERT INTO menus (path, title, parent_id, "order") VALUES
('/ai/chat/list', '对话列表', (SELECT id FROM menus WHERE title = '对话应用管理' AND parent_id = (SELECT id FROM menus WHERE path = '/ai')), 0),
('/ai/chat/session', '会话管理', (SELECT id FROM menus WHERE title = '对话应用管理' AND parent_id = (SELECT id FROM menus WHERE path = '/ai')), 1),
('/ai/chat/logs', '对话日志', (SELECT id FROM menus WHERE title = '对话应用管理' AND parent_id = (SELECT id FROM menus WHERE path = '/ai')), 2);

-- 知识库管理子项
INSERT INTO menus (path, title, parent_id, "order") VALUES
('/ai/knowledge/upload', '文档上传', (SELECT id FROM menus WHERE title = '知识库管理' AND parent_id = (SELECT id FROM menus WHERE path = '/ai')), 0),
('/ai/knowledge/split', '文档切片', (SELECT id FROM menus WHERE title = '知识库管理' AND parent_id = (SELECT id FROM menus WHERE path = '/ai')), 1),
('/ai/knowledge/vector', '向量库管理', (SELECT id FROM menus WHERE title = '知识库管理' AND parent_id = (SELECT id FROM menus WHERE path = '/ai')), 2),
('/ai/knowledge/test', '检索测试', (SELECT id FROM menus WHERE title = '知识库管理' AND parent_id = (SELECT id FROM menus WHERE path = '/ai')), 3);

-- 提示词模板子项
INSERT INTO menus (path, title, parent_id, "order") VALUES
('/ai/prompt/category', '模板分类', (SELECT id FROM menus WHERE title = '提示词模板' AND parent_id = (SELECT id FROM menus WHERE path = '/ai')), 0),
('/ai/prompt/list', '模板列表', (SELECT id FROM menus WHERE title = '提示词模板' AND parent_id = (SELECT id FROM menus WHERE path = '/ai')), 1),
('/ai/prompt/records', '模板调用记录', (SELECT id FROM menus WHERE title = '提示词模板' AND parent_id = (SELECT id FROM menus WHERE path = '/ai')), 2);

-- AI 生成任务子项
INSERT INTO menus (path, title, parent_id, "order") VALUES
('/ai/task/text', '文本生成', (SELECT id FROM menus WHERE title = 'AI 生成任务' AND parent_id = (SELECT id FROM menus WHERE path = '/ai')), 0),
('/ai/task/rewrite', '内容改写', (SELECT id FROM menus WHERE title = 'AI 生成任务' AND parent_id = (SELECT id FROM menus WHERE path = '/ai')), 1),
('/ai/task/records', '任务记录', (SELECT id FROM menus WHERE title = 'AI 生成任务' AND parent_id = (SELECT id FROM menus WHERE path = '/ai')), 2);

-- 系统管理子项
INSERT INTO menus (path, title, parent_id, "order") VALUES
('/system/user', '用户管理', (SELECT id FROM menus WHERE path = '/system'), 0),
('/system/role', '角色管理', (SELECT id FROM menus WHERE path = '/system'), 1),
('/system/menu', '菜单管理', (SELECT id FROM menus WHERE path = '/system'), 2),
('/system/permission', '权限管理', (SELECT id FROM menus WHERE path = '/system'), 3),
('/system/dept', '部门管理', (SELECT id FROM menus WHERE path = '/system'), 4);

-- 模型管理
INSERT INTO menus (title, parent_id, "order") VALUES
('模型配置', (SELECT id FROM menus WHERE path = '/model'), 0),
('向量库配置', (SELECT id FROM menus WHERE path = '/model'), 1),
('系统设置', (SELECT id FROM menus WHERE path = '/model'), 2);

-- 模型配置子项
INSERT INTO menus (path, title, parent_id, "order") VALUES
('/model/config/list', '大模型列表', (SELECT id FROM menus WHERE title = '模型配置' AND parent_id = (SELECT id FROM menus WHERE path = '/model')), 0),
('/model/config/apikey', 'API Key 管理', (SELECT id FROM menus WHERE title = '模型配置' AND parent_id = (SELECT id FROM menus WHERE path = '/model')), 1),
('/model/config/quota', '调用额度设置', (SELECT id FROM menus WHERE title = '模型配置' AND parent_id = (SELECT id FROM menus WHERE path = '/model')), 2);

-- 向量库配置子项
INSERT INTO menus (path, title, parent_id, "order") VALUES
('/model/vector/connect', '连接配置', (SELECT id FROM menus WHERE title = '向量库配置' AND parent_id = (SELECT id FROM menus WHERE path = '/model')), 0),
('/model/vector/db', '库管理', (SELECT id FROM menus WHERE title = '向量库配置' AND parent_id = (SELECT id FROM menus WHERE path = '/model')), 1);

-- 系统设置子项
INSERT INTO menus (path, title, parent_id, "order") VALUES
('/model/setting/base', '基础设置', (SELECT id FROM menus WHERE title = '系统设置' AND parent_id = (SELECT id FROM menus WHERE path = '/model')), 0),
('/model/setting/upload', '上传配置', (SELECT id FROM menus WHERE title = '系统设置' AND parent_id = (SELECT id FROM menus WHERE path = '/model')), 1),
('/model/setting/security', '安全设置', (SELECT id FROM menus WHERE title = '系统设置' AND parent_id = (SELECT id FROM menus WHERE path = '/model')), 2);

-- 日志中心子项
INSERT INTO menus (path, title, parent_id, "order") VALUES
('/logs/operate', '操作日志', (SELECT id FROM menus WHERE path = '/logs'), 0),
('/logs/login', '登录日志', (SELECT id FROM menus WHERE path = '/logs'), 1),
('/logs/model', '模型调用日志', (SELECT id FROM menus WHERE path = '/logs'), 2),
('/logs/error', '异常日志', (SELECT id FROM menus WHERE path = '/logs'), 3);

-- 个人中心子项
INSERT INTO menus (path, title, parent_id, "order") VALUES
('/profile/info', '个人信息', (SELECT id FROM menus WHERE path = '/profile'), 0),
('/profile/password', '修改密码', (SELECT id FROM menus WHERE path = '/profile'), 1),
('/profile/apikey', '我的 API 密钥', (SELECT id FROM menus WHERE path = '/profile'), 2);