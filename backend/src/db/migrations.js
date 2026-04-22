import db from './connection.js'

const STATEMENTS = [
  `CREATE TABLE IF NOT EXISTS settings (
    key   TEXT PRIMARY KEY,
    value TEXT NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS my_champions (
    id      INTEGER PRIMARY KEY AUTOINCREMENT,
    name    TEXT NOT NULL UNIQUE,
    role    TEXT NOT NULL,
    comfort INTEGER NOT NULL DEFAULT 3 CHECK(comfort BETWEEN 1 AND 5),
    notes   TEXT DEFAULT ''
  )`,
  `CREATE TABLE IF NOT EXISTS rune_pages (
    id             INTEGER PRIMARY KEY AUTOINCREMENT,
    champion_id    INTEGER NOT NULL REFERENCES my_champions(id) ON DELETE CASCADE,
    label          TEXT NOT NULL DEFAULT 'Standard',
    is_default     INTEGER NOT NULL DEFAULT 0,
    primary_path   TEXT NOT NULL DEFAULT '',
    keystone       TEXT NOT NULL DEFAULT '',
    slot1          TEXT DEFAULT '',
    slot2          TEXT DEFAULT '',
    slot3          TEXT DEFAULT '',
    secondary_path TEXT NOT NULL DEFAULT '',
    sec1           TEXT DEFAULT '',
    sec2           TEXT DEFAULT '',
    shard_offense  TEXT DEFAULT '',
    shard_flex     TEXT DEFAULT '',
    shard_defense  TEXT DEFAULT ''
  )`,
  `CREATE TABLE IF NOT EXISTS builds (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    champion_id INTEGER NOT NULL REFERENCES my_champions(id) ON DELETE CASCADE,
    label       TEXT NOT NULL DEFAULT 'Standard',
    is_default  INTEGER NOT NULL DEFAULT 0
  )`,
  `CREATE TABLE IF NOT EXISTS build_items (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    build_id    INTEGER NOT NULL REFERENCES builds(id) ON DELETE CASCADE,
    item_name   TEXT NOT NULL,
    item_id     INTEGER NOT NULL DEFAULT 0,
    slot        TEXT NOT NULL DEFAULT 'core' CHECK(slot IN ('starter','core','situational','boots')),
    order_index INTEGER NOT NULL DEFAULT 0,
    note        TEXT DEFAULT ''
  )`,
  `CREATE TABLE IF NOT EXISTS matchups (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    champion_id  INTEGER NOT NULL REFERENCES my_champions(id) ON DELETE CASCADE,
    enemy_name   TEXT NOT NULL,
    difficulty   TEXT NOT NULL DEFAULT 'even' CHECK(difficulty IN ('easy','even','hard')),
    laning_tip   TEXT DEFAULT '',
    rune_page_id INTEGER REFERENCES rune_pages(id) ON DELETE SET NULL,
    build_id     INTEGER REFERENCES builds(id) ON DELETE SET NULL,
    item_notes   TEXT DEFAULT ''
  )`,
  `CREATE INDEX IF NOT EXISTS idx_rune_pages_champion ON rune_pages(champion_id)`,
  `CREATE INDEX IF NOT EXISTS idx_builds_champion     ON builds(champion_id)`,
  `CREATE INDEX IF NOT EXISTS idx_build_items_build   ON build_items(build_id)`,
  `CREATE INDEX IF NOT EXISTS idx_matchups_champion   ON matchups(champion_id)`,
  `CREATE INDEX IF NOT EXISTS idx_matchups_enemy      ON matchups(enemy_name)`,
]

export function runMigrations() {
  for (const sql of STATEMENTS) {
    db.exec(sql)
  }
  // Idempotent column additions for existing databases
  const matchupCols = db.prepare('PRAGMA table_info(matchups)').all().map(c => c.name)
  if (!matchupCols.includes('build_id')) {
    db.exec('ALTER TABLE matchups ADD COLUMN build_id INTEGER REFERENCES builds(id) ON DELETE SET NULL')
  }
}
