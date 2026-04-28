import { Router } from 'express'
import crypto from 'crypto'
import pool from '../db.ts'

const router = Router()

// ==================== 工具函数 ====================

function formatTime(iso: string | null | undefined): string {
  if (!iso) return ''
  const d = new Date(iso)
  if (isNaN(d.getTime())) return ''
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
}

function transformUser(row: any) {
  let roles: any[] = row.roles || []
  if (typeof roles === 'string') {
    try {
      roles = JSON.parse(roles)
    } catch {
      roles = []
    }
  }

  return {
    userId: row.id,
    username: row.username,
    nickName: row.nick_name,
    phone: row.phone || '',
    email: row.email || '',
    roleIds: roles.filter((r: any) => r.id).map((r: any) => r.id),
    roleNames: roles.filter((r: any) => r.rolename).map((r: any) => r.rolename),
    status: row.status,
    remark: row.remark || '',
    createTime: formatTime(row.create_time),
    loginTime: formatTime(row.login_time),
  }
}

// ==================== 角色接口 ====================

router.get('/system/roles', async (_req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, role_name, role_code, status FROM system_roles WHERE status = 1 ORDER BY id',
    )
    const list = result.rows.map((r: any) => ({
      id: r.id,
      roleName: r.role_name,
      roleCode: r.role_code,
      status: r.status,
    }))
    res.json({ data: list })
  } catch (err: any) {
    res.status(500).json({ message: err.message })
  }
})

// ==================== 用户 CRUD ====================

/** 分页列表（含筛选） */
router.get('/system/users', async (req, res) => {
  try {
    const {
      keywords,
      roleId,
      status,
      beginTime,
      endTime,
      page = '1',
      pageSize = '20',
    } = req.query as Record<string, string>

    const conditions: string[] = []
    const params: any[] = []
    let paramIndex = 1

    if (keywords) {
      conditions.push(`(su.username ILIKE $${paramIndex} OR su.nick_name ILIKE $${paramIndex})`)
      params.push(`%${keywords}%`)
      paramIndex++
    }

    if (roleId) {
      conditions.push(`sur.role_id = $${paramIndex}`)
      params.push(Number(roleId))
      paramIndex++
    }

    if (status !== undefined && status !== '') {
      conditions.push(`su.status = $${paramIndex}`)
      params.push(Number(status))
      paramIndex++
    }

    if (beginTime) {
      conditions.push(`su.create_time >= $${paramIndex}::timestamp`)
      params.push(beginTime)
      paramIndex++
    }

    if (endTime) {
      conditions.push(`su.create_time <= $${paramIndex}::timestamp`)
      params.push(`${endTime} 23:59:59`)
      paramIndex++
    }

    const whereClause = conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : ''

    // 总数
    const countResult = await pool.query(
      `SELECT COUNT(DISTINCT su.id) AS total FROM system_users su LEFT JOIN system_user_roles sur ON su.id = sur.user_id ${whereClause}`,
      params,
    )
    const total = parseInt(countResult.rows[0].total, 10)

    // 分页数据（含角色）
    const pageNum = Number(page)
    const size = Number(pageSize)
    const dataParams = [...params, size, (pageNum - 1) * size]
    const dataResult = await pool.query(
      `SELECT su.*,
        COALESCE(
          json_agg(
            json_build_object('id', sr.id, 'roleName', sr.role_name, 'roleCode', sr.role_code, 'rolename', sr.role_name)
            ORDER BY sr.id
          ) FILTER (WHERE sr.id IS NOT NULL),
          '[]'::json
        ) AS roles
      FROM system_users su
      LEFT JOIN system_user_roles sur ON su.id = sur.user_id
      LEFT JOIN system_roles sr ON sur.role_id = sr.id
      ${whereClause}
      GROUP BY su.id
      ORDER BY su.id DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      dataParams,
    )

    const list = dataResult.rows.map(transformUser)

    res.json({
      data: {
        list,
        total,
        page: pageNum,
        pageSize: size,
      },
    })
  } catch (err: any) {
    res.status(500).json({ message: err.message })
  }
})

/** 用户详情 */
router.get('/system/users/:id', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT su.*,
        COALESCE(
          json_agg(
            json_build_object('id', sr.id, 'roleName', sr.role_name, 'roleCode', sr.role_code, 'rolename', sr.role_name)
            ORDER BY sr.id
          ) FILTER (WHERE sr.id IS NOT NULL),
          '[]'::json
        ) AS roles
      FROM system_users su
      LEFT JOIN system_user_roles sur ON su.id = sur.user_id
      LEFT JOIN system_roles sr ON sur.role_id = sr.id
      WHERE su.id = $1
      GROUP BY su.id`,
      [Number(req.params.id)],
    )

    if (result.rows.length === 0) {
      return res.status(404).json({ message: '用户不存在' })
    }

    res.json({ data: transformUser(result.rows[0]) })
  } catch (err: any) {
    res.status(500).json({ message: err.message })
  }
})

/** 新增用户 */
router.post('/system/users', async (req, res) => {
  try {
    const { username, nickName, phone, email, password, roleIds, status, remark } = req.body

    if (!username || !nickName) {
      return res.status(400).json({ message: '登录账号和用户昵称为必填项' })
    }

    // 检查账号唯一性
    const existing = await pool.query('SELECT id FROM system_users WHERE username = $1', [username])
    if (existing.rows.length > 0) {
      return res.status(409).json({ message: '登录账号已存在' })
    }

    // 插入用户
    const hashedPassword = password
      ? crypto.createHash('md5').update(password).digest('hex')
      : 'e10adc3949ba59abbe56e057f20f883e' // MD5('123456')
    const userResult = await pool.query(
      `INSERT INTO system_users (username, nick_name, phone, email, password, status, remark)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [username, nickName, phone || '', email || '', hashedPassword, status ?? 1, remark || ''],
    )
    const newUser = userResult.rows[0]

    // 插入角色关联
    if (roleIds?.length) {
      const rolePlaceholders = roleIds.map((_: any, i: number) => `($1, $${i + 2})`).join(', ')
      await pool.query(
        `INSERT INTO system_user_roles (user_id, role_id) VALUES ${rolePlaceholders}`,
        [newUser.id, ...roleIds],
      )
    }

    // 获取角色信息
    const rolesResult = await pool.query(
      `SELECT sr.id, sr.role_name, sr.role_code
       FROM system_roles sr
       JOIN system_user_roles sur ON sr.id = sur.role_id
       WHERE sur.user_id = $1`,
      [newUser.id],
    )

    const roles = rolesResult.rows.map((r: any) => ({
      id: r.id,
      roleName: r.role_name,
      roleCode: r.role_code,
    }))

    res.json({
      data: {
        userId: newUser.id,
        username: newUser.username,
        nickName: newUser.nick_name,
        phone: newUser.phone || '',
        email: newUser.email || '',
        roleIds: roles.map((r: any) => r.id),
        roleNames: roles.map((r: any) => r.roleName),
        status: newUser.status,
        remark: newUser.remark || '',
        createTime: formatTime(newUser.create_time),
        loginTime: '',
      },
    })
  } catch (err: any) {
    res.status(500).json({ message: err.message })
  }
})

// ==================== 状态管理 ====================

/** 切换用户状态（启用/禁用） */
router.put('/system/users/status', async (req, res) => {
  try {
    const { ids, status } = req.body
    if (!ids?.length) return res.status(400).json({ message: '请选择用户' })

    const placeholders = ids.map((_: any, i: number) => `$${i + 2}`).join(', ')
    await pool.query(
      `UPDATE system_users SET status = $1, update_time = NOW() WHERE id IN (${placeholders})`,
      [status, ...ids],
    )

    res.json({ message: status === 1 ? '启用成功' : '禁用成功' })
  } catch (err: any) {
    res.status(500).json({ message: err.message })
  }
})

/** 更新用户 */
router.put('/system/users/:id', async (req, res) => {
  try {
    const userId = Number(req.params.id)
    const { username, nickName, phone, email, roleIds, status, remark } = req.body

    // 检查用户是否存在
    const userCheck = await pool.query('SELECT id FROM system_users WHERE id = $1', [userId])
    if (userCheck.rows.length === 0) {
      return res.status(404).json({ message: '用户不存在' })
    }

    // 检查账号唯一性
    if (username) {
      const dup = await pool.query('SELECT id FROM system_users WHERE username = $1 AND id != $2', [
        username,
        userId,
      ])
      if (dup.rows.length > 0) {
        return res.status(409).json({ message: '登录账号已存在' })
      }
    }

    // 更新用户信息
    const sets: string[] = []
    const params: any[] = []
    let idx = 1

    if (username !== undefined) {
      sets.push(`username = $${idx++}`)
      params.push(username)
    }
    if (nickName !== undefined) {
      sets.push(`nick_name = $${idx++}`)
      params.push(nickName)
    }
    if (phone !== undefined) {
      sets.push(`phone = $${idx++}`)
      params.push(phone)
    }
    if (email !== undefined) {
      sets.push(`email = $${idx++}`)
      params.push(email)
    }
    if (status !== undefined) {
      sets.push(`status = $${idx++}`)
      params.push(status)
    }
    if (remark !== undefined) {
      sets.push(`remark = $${idx++}`)
      params.push(remark)
    }

    if (sets.length > 0) {
      sets.push('update_time = NOW()')
      params.push(userId)
      await pool.query(`UPDATE system_users SET ${sets.join(', ')} WHERE id = $${idx}`, params)
    }

    // 更新角色关联
    if (roleIds !== undefined) {
      await pool.query('DELETE FROM system_user_roles WHERE user_id = $1', [userId])
      if (roleIds.length > 0) {
        const rolePlaceholders = roleIds.map((_: any, i: number) => `($1, $${i + 2})`).join(', ')
        await pool.query(
          `INSERT INTO system_user_roles (user_id, role_id) VALUES ${rolePlaceholders}`,
          [userId, ...roleIds],
        )
      }
    }

    // 返回更新后的完整用户
    const result = await pool.query(
      `SELECT su.*,
        COALESCE(
          json_agg(
            json_build_object('id', sr.id, 'roleName', sr.role_name, 'roleCode', sr.role_code, 'rolename', sr.role_name)
            ORDER BY sr.id
          ) FILTER (WHERE sr.id IS NOT NULL),
          '[]'::json
        ) AS roles
      FROM system_users su
      LEFT JOIN system_user_roles sur ON su.id = sur.user_id
      LEFT JOIN system_roles sr ON sur.role_id = sr.id
      WHERE su.id = $1
      GROUP BY su.id`,
      [userId],
    )

    res.json({ data: transformUser(result.rows[0]) })
  } catch (err: any) {
    res.status(500).json({ message: err.message })
  }
})

/** 批量删除用户 */
router.delete('/system/users', async (req, res) => {
  try {
    const userIds: number[] = req.body.ids || []
    if (!userIds.length) return res.status(400).json({ message: '请选择要删除的用户' })

    const placeholders = userIds.map((_, i) => `$${i + 1}`).join(', ')
    await pool.query(`DELETE FROM system_users WHERE id IN (${placeholders})`, userIds)

    res.json({ message: '删除成功' })
  } catch (err: any) {
    res.status(500).json({ message: err.message })
  }
})

// ==================== 密码管理 ====================

/** 重置密码 */
router.put('/system/users/:id/password', async (req, res) => {
  try {
    const userId = Number(req.params.id)
    const { newPassword, confirmPassword } = req.body

    if (!newPassword || !confirmPassword) {
      return res.status(400).json({ message: '密码不能为空' })
    }
    if (newPassword !== confirmPassword) {
      return res.status(400).json({ message: '两次输入的密码不一致' })
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ message: '密码长度不能少于6位' })
    }

    const existing = await pool.query('SELECT id FROM system_users WHERE id = $1', [userId])
    if (existing.rows.length === 0) {
      return res.status(404).json({ message: '用户不存在' })
    }

    const hashedPassword = crypto.createHash('md5').update(newPassword).digest('hex')
    await pool.query('UPDATE system_users SET password = $1, update_time = NOW() WHERE id = $2', [
      hashedPassword,
      userId,
    ])

    res.json({ message: '密码重置成功' })
  } catch (err: any) {
    res.status(500).json({ message: err.message })
  }
})

// ==================== 角色分配 ====================

/** 分配角色 */
router.put('/system/users/:id/roles', async (req, res) => {
  try {
    const userId = Number(req.params.id)
    const { roleIds } = req.body

    if (!roleIds?.length) {
      return res.status(400).json({ message: '请选择角色' })
    }

    const existing = await pool.query('SELECT id FROM system_users WHERE id = $1', [userId])
    if (existing.rows.length === 0) {
      return res.status(404).json({ message: '用户不存在' })
    }

    // 重新分配角色
    await pool.query('DELETE FROM system_user_roles WHERE user_id = $1', [userId])
    const rolePlaceholders = roleIds.map((_: any, i: number) => `($1, $${i + 2})`).join(', ')
    await pool.query(
      `INSERT INTO system_user_roles (user_id, role_id) VALUES ${rolePlaceholders}`,
      [userId, ...roleIds],
    )

    // 返回更新后的用户
    const result = await pool.query(
      `SELECT su.*,
        COALESCE(
          json_agg(
            json_build_object('id', sr.id, 'roleName', sr.role_name, 'roleCode', sr.role_code, 'rolename', sr.role_name)
            ORDER BY sr.id
          ) FILTER (WHERE sr.id IS NOT NULL),
          '[]'::json
        ) AS roles
      FROM system_users su
      LEFT JOIN system_user_roles sur ON su.id = sur.user_id
      LEFT JOIN system_roles sr ON sur.role_id = sr.id
      WHERE su.id = $1
      GROUP BY su.id`,
      [userId],
    )

    res.json({ data: transformUser(result.rows[0]) })
  } catch (err: any) {
    res.status(500).json({ message: err.message })
  }
})

export default router
