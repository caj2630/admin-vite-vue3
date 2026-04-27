-- 检查并修复 menus 表权限
-- 首先检查表是否存在
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'menus') THEN
        RAISE EXCEPTION 'Table menus does not exist';
    END IF;
END $$;

-- 禁用现有的 RLS（如果存在）
ALTER TABLE menus DISABLE ROW LEVEL SECURITY;

-- 删除现有的策略（如果存在）
DROP POLICY IF EXISTS "Allow public read access on menus" ON menus;

-- 启用 RLS
ALTER TABLE menus ENABLE ROW LEVEL SECURITY;

-- 创建新的读取策略
CREATE POLICY "Allow public read access on menus" ON menus
FOR SELECT USING (true);

-- 验证设置
SELECT schemaname, tablename, rowsecurity
FROM pg_tables
WHERE tablename = 'menus';
