import express from 'express'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, resolve } from 'path'
import { createSupabaseClient } from './supabase.ts'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

dotenv.config({ path: resolve(__dirname, '../.env') })

const app = express()
const port = process.env.PORT || 3333
const router = express.Router()
const supabase = createSupabaseClient()

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*')
  res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS')
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  res.header('Access-Control-Allow-Credentials', 'true')

  if (req.method === 'OPTIONS') {
    return res.sendStatus(204)
  }
  next()
})

app.use(express.json())
app.use('/api', router)

router.post('/login', async (req, res) => {
  const rawEmail = req.body.email || req.body.username || req.body.account
  const password = req.body.password

  if (!rawEmail || !password) {
    return res.status(400).json({ error: '邮箱和密码不能为空' })
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (typeof rawEmail !== 'string' || !emailRegex.test(rawEmail)) {
    return res.status(400).json({ error: '登录账号必须是完整邮箱地址，请输入注册时使用的邮箱' })
  }

  console.log('login request body:', JSON.stringify(req.body, null, 2))
  console.log('login request headers:', JSON.stringify(req.headers, null, 2))

  const { data, error } = await supabase.auth.signInWithPassword({
    email: rawEmail,
    password,
  })

  if (error) {
    const message =
      error.message === 'Invalid login credentials'
        ? '登录失败，邮箱或密码错误。如果刚注册，请先确认邮箱后再登录。'
        : error.message
    return res.status(401).json({ error: message })
  }

  return res.json({
    data: {
      user: data.user,
      session: data.session,
    },
  })
})

router.post('/register', async (req, res) => {
  const { email, password } = req.body
  if (!email || !password) {
    return res.status(400).json({ error: '邮箱和密码不能为空' })
  }

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  })

  if (error) {
    return res.status(400).json({ error: error.message })
  }

  return res.json({
    data: {
      user: data.user,
    },
  })
})

router.get('/list', async (req, res) => {
  res.json({
    data: [
      {
        name: 'zs',
        age: 18,
      },
    ],
  })
})

router.get('/menus', async (req, res) => {
  const { data, error } = await supabase
    .from('menus')
    .select('*')
    .order('order')

  if (error) {
    return res.status(500).json({ error: error.message })
  }

  // 构建树形结构
  const buildTree = (items: any[], parentId: string | null = null): any[] => {
    return items
      .filter(item => item.parent_id === parentId)
      .map(item => ({
        ...item,
        children: buildTree(items, item.id)
      }))
  }

  const menuTree = buildTree(data)
  res.json({ data: menuTree })
})

app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`)
})
