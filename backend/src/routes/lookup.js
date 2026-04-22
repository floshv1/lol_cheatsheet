import { Router } from 'express'
import db from '../db/connection.js'

const router = Router()

// GET /api/lookup?enemy=Zed&role=Top
router.get('/', (req, res) => {
  const { enemy, role } = req.query
  if (!enemy) return res.status(400).json({ error: 'enemy query param required' })

  let sql = `
    SELECT
      c.id, c.name, c.role, c.comfort, c.notes,
      m.id as matchup_id, m.difficulty, m.laning_tip, m.item_notes,
      m.rune_page_id,
      m.build_id as matchup_build_id,
      rp.label as rune_label, rp.primary_path, rp.keystone,
      rp.slot1, rp.slot2, rp.slot3,
      rp.secondary_path, rp.sec1, rp.sec2,
      rp.shard_offense, rp.shard_flex, rp.shard_defense,
      def.id as default_build_id
    FROM matchups m
    JOIN my_champions c ON c.id = m.champion_id
    LEFT JOIN rune_pages rp ON rp.id = m.rune_page_id
    LEFT JOIN builds def ON def.champion_id = c.id AND def.is_default = 1
    WHERE m.enemy_name LIKE ?
  `
  const params = [`%${enemy}%`]
  if (role) { sql += ' AND c.role = ?'; params.push(role) }
  sql += ' ORDER BY c.comfort DESC'

  const rows = db.prepare(sql).all(...params)

  const results = rows.map(row => {
    // Rune page: matchup override → champion default
    let runePage = null
    if (row.rune_page_id) {
      runePage = {
        id: row.rune_page_id, label: row.rune_label,
        primary_path: row.primary_path, keystone: row.keystone,
        slot1: row.slot1, slot2: row.slot2, slot3: row.slot3,
        secondary_path: row.secondary_path, sec1: row.sec1, sec2: row.sec2,
        shard_offense: row.shard_offense, shard_flex: row.shard_flex, shard_defense: row.shard_defense,
      }
    } else {
      runePage = db.prepare('SELECT * FROM rune_pages WHERE champion_id = ? AND is_default = 1').get(row.id) || null
    }

    // Build: matchup-assigned → champion default
    const buildId = row.matchup_build_id || row.default_build_id
    const buildItems = buildId
      ? db.prepare('SELECT * FROM build_items WHERE build_id = ? ORDER BY slot, order_index').all(buildId)
      : []

    return {
      champion:   { id: row.id, name: row.name, role: row.role, comfort: row.comfort, notes: row.notes },
      matchup:    { id: row.matchup_id, difficulty: row.difficulty, laning_tip: row.laning_tip, item_notes: row.item_notes },
      rune_page:  runePage,
      build_items: buildItems,
    }
  })

  const ORDER = { easy: 0, even: 1, hard: 2 }
  results.sort((a, b) => {
    const diff = (ORDER[a.matchup.difficulty] ?? 1) - (ORDER[b.matchup.difficulty] ?? 1)
    return diff !== 0 ? diff : b.champion.comfort - a.champion.comfort
  })

  const matchedIds = results.map(r => r.champion.id)
  let noDataSql = 'SELECT id, name, role, comfort FROM my_champions'
  const noDataParams = []
  if (role) { noDataSql += ' WHERE role = ?'; noDataParams.push(role) }
  const no_data = db.prepare(noDataSql).all(...noDataParams).filter(c => !matchedIds.includes(c.id))

  res.json({ results, no_data })
})

export default router
