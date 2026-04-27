import { Client } from 'pg'
import * as dotenv from 'dotenv'

dotenv.config()

const databaseUrl = process.env.DATABASE_URL

if (!databaseUrl) {
  throw new Error('DATABASE_URL is required')
}

const client = new Client({
  connectionString: databaseUrl,
})

const aiAdminMenus = [
  {
    path: '/dashboard',
    name: 'Dashboard',
    title: '控制台',
    icon: 'dashboard',
    children: [
      { path: '/dashboard/overview', title: '数据概览' },
      { path: '/dashboard/model-stats', title: '模型调用统计' },
      { path: '/dashboard/usage-trend', title: '今日使用趋势' }
    ]
  },
  {
    path: '/ai',
    name: 'AI',
    title: 'AI 应用管理',
    icon: 'robot',
    children: [
      {
        title: '对话应用管理',
        children: [
          { path: '/ai/chat/list', title: '对话列表' },
          { path: '/ai/chat/session', title: '会话管理' },
          { path: '/ai/chat/logs', title: '对话日志' }
        ]
      },
      {
        title: '知识库管理',
        children: [
          { path: '/ai/knowledge/upload', title: '文档上传' },
          { path: '/ai/knowledge/split', title: '文档切片' },
          { path: '/ai/knowledge/vector', title: '向量库管理' },
          { path: '/ai/knowledge/test', title: '检索测试' }
        ]
      },
      {
        title: '提示词模板',
        children: [
          { path: '/ai/prompt/category', title: '模板分类' },
          { path: '/ai/prompt/list', title: '模板列表' },
          { path: '/ai/prompt/records', title: '模板调用记录' }
        ]
      },
      {
        title: 'AI 生成任务',
        children: [
          { path: '/ai/task/text', title: '文本生成' },
          { path: '/ai/task/rewrite', title: '内容改写' },
          { path: '/ai/task/records', title: '任务记录' }
        ]
      }
    ]
  },
  {
    path: '/system',
    name: 'System',
    title: '系统管理',
    icon: 'setting',
    children: [
      { path: '/system/user', title: '用户管理' },
      { path: '/system/role', title: '角色管理' },
      { path: '/system/menu', title: '菜单管理' },
      { path: '/system/permission', title: '权限管理' },
      { path: '/system/dept', title: '部门管理' }
    ]
  },
  {
    path: '/model',
    name: 'Model',
    title: '模型管理',
    icon: 'api',
    children: [
      {
        title: '模型配置',
        children: [
          { path: '/model/config/list', title: '大模型列表' },
          { path: '/model/config/apikey', title: 'API Key 管理' },
          { path: '/model/config/quota', title: '调用额度设置' }
        ]
      },
      {
        title: '向量库配置',
        children: [
          { path: '/model/vector/connect', title: '连接配置' },
          { path: '/model/vector/db', title: '库管理' }
        ]
      },
      {
        title: '系统设置',
        children: [
          { path: '/model/setting/base', title: '基础设置' },
          { path: '/model/setting/upload', title: '上传配置' },
          { path: '/model/setting/security', title: '安全设置' }
        ]
      }
    ]
  },
  {
    path: '/logs',
    name: 'Logs',
    title: '日志中心',
    icon: 'document',
    children: [
      { path: '/logs/operate', title: '操作日志' },
      { path: '/logs/login', title: '登录日志' },
      { path: '/logs/model', title: '模型调用日志' },
      { path: '/logs/error', title: '异常日志' }
    ]
  },
  {
    path: '/profile',
    name: 'Profile',
    title: '个人中心',
    icon: 'user',
    children: [
      { path: '/profile/info', title: '个人信息' },
      { path: '/profile/password', title: '修改密码' },
      { path: '/profile/apikey', title: '我的 API 密钥' }
    ]
  }
]

async function createTable() {
  const query = `
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
  `
  await client.query(query)
  console.log('Table created successfully')
}

async function insertMenu(menu: any, parentId: string | null = null, order: number = 0): Promise<string> {
  const query = `
    INSERT INTO menus (path, name, title, icon, parent_id, "order")
    VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING id
  `
  const values = [menu.path, menu.name, menu.title, menu.icon, parentId, order]
  const res = await client.query(query, values)
  const menuId = res.rows[0].id

  if (menu.children) {
    for (let i = 0; i < menu.children.length; i++) {
      const child = menu.children[i]
      await insertMenu(child, menuId, i)
    }
  }

  return menuId
}

async function seedMenus() {
  await client.connect()
  await createTable()

  for (let i = 0; i < aiAdminMenus.length; i++) {
    const menu = aiAdminMenus[i]
    await insertMenu(menu, null, i)
  }

  console.log('Menus seeded successfully')
  await client.end()
}

seedMenus().catch(console.error)