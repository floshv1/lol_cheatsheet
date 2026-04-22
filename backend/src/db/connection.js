import Database from 'better-sqlite3'
import path from 'path'
import { fileURLToPath } from 'url'
import fs from 'fs'

const dbPath = process.env.DB_PATH || path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  '../../../data/db.sqlite'
)

fs.mkdirSync(path.dirname(dbPath), { recursive: true })

const db = new Database(dbPath)
db.pragma('journal_mode = WAL')
db.pragma('foreign_keys = ON')

export default db
