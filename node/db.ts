import pg from 'pg'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, resolve } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
dotenv.config({ path: resolve(__dirname, '../.env') })

const databaseUrl = process.env.DATABASE_URL

if (!databaseUrl) {
  throw new Error(
    'DATABASE_URL is required. Get it from your Supabase dashboard: Project Settings → Database → Connection string → URI',
  )
}

const pool = new pg.Pool({
  connectionString: databaseUrl,
})

export default pool
