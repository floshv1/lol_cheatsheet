import { Router } from 'express'
import db from '../db/connection.js'

const router = Router()

// GET /api/all-matchups?search=Darius&role=Top
// Enemy-centric view: for each enemy, which pool champs have matchup data
router.get('/', (req, res) => {
  const { search, role } = req.query

  let sql = `
    SELECT
      m.enemy_name,
      m.id as matchup_id,
      m.rune_page_id,
      m.build_id,
      c.id as champion_id, c.name, c.comfort, c.role,
      m.difficulty, m.laning_tip
    FROM matchups m
    JOIN my_champions c ON c.id = m.champion_id
    WHERE 1=1
  `
  const params = []
  if (search) { sql += ' AND m.enemy_name LIKE ?'; params.push(`%${search}%`) }
  if (role)   { sql += ' AND c.role = ?'; params.push(role) }
  sql += ' ORDER BY m.enemy_name, m.difficulty, c.comfort DESC'

  const rows = db.prepare(sql).all(...params)

  // Group by enemy_name
  const map = new Map()
  for (const row of rows) {
    if (!map.has(row.enemy_name)) map.set(row.enemy_name, [])
    map.get(row.enemy_name).push({
      matchup_id: row.matchup_id,
      champion_id: row.champion_id,
      name: row.name,
      comfort: row.comfort,
      role: row.role,
      difficulty: row.difficulty,
      laning_tip: row.laning_tip,
      rune_page_id: row.rune_page_id ?? null,
      build_id: row.build_id ?? null,
    })
  }

  const result = Array.from(map.entries()).map(([enemy_name, entries]) => ({ enemy_name, entries }))
  res.json(result)
})

export default router
