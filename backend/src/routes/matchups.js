import { Router } from 'express'
import db from '../db/connection.js'

const router = Router({ mergeParams: true })

router.get('/', (req, res) => {
  const matchups = db.prepare(`
    SELECT m.*, rp.label as rune_label, rp.primary_path, rp.keystone, rp.secondary_path, rp.sec1, rp.sec2
    FROM matchups m
    LEFT JOIN rune_pages rp ON rp.id = m.rune_page_id
    WHERE m.champion_id = ?
    ORDER BY m.difficulty, m.enemy_name
  `).all(req.params.championId)
  res.json(matchups)
})

router.post('/', (req, res) => {
  const { enemy_name, difficulty = 'even', laning_tip = '', rune_page_id = null, build_id = null, item_notes = '' } = req.body
  if (!enemy_name) return res.status(400).json({ error: 'enemy_name required' })
  const { lastInsertRowid } = db.prepare(
    'INSERT INTO matchups (champion_id, enemy_name, difficulty, laning_tip, rune_page_id, build_id, item_notes) VALUES (?, ?, ?, ?, ?, ?, ?)'
  ).run(req.params.championId, enemy_name, difficulty, laning_tip, rune_page_id || null, build_id || null, item_notes)
  res.status(201).json(db.prepare('SELECT * FROM matchups WHERE id = ?').get(lastInsertRowid))
})

router.put('/:matchupId', (req, res) => {
  const m = db.prepare('SELECT * FROM matchups WHERE id = ? AND champion_id = ?').get(req.params.matchupId, req.params.championId)
  if (!m) return res.status(404).json({ error: 'Not found' })
  const { enemy_name, difficulty, laning_tip, rune_page_id, build_id, item_notes } = req.body
  db.prepare('UPDATE matchups SET enemy_name=?, difficulty=?, laning_tip=?, rune_page_id=?, build_id=?, item_notes=? WHERE id=?').run(
    enemy_name ?? m.enemy_name, difficulty ?? m.difficulty, laning_tip ?? m.laning_tip,
    rune_page_id !== undefined ? (rune_page_id || null) : m.rune_page_id,
    build_id    !== undefined ? (build_id    || null) : m.build_id,
    item_notes ?? m.item_notes, req.params.matchupId
  )
  res.json(db.prepare('SELECT * FROM matchups WHERE id = ?').get(req.params.matchupId))
})

router.delete('/:matchupId', (req, res) => {
  const result = db.prepare('DELETE FROM matchups WHERE id = ? AND champion_id = ?').run(req.params.matchupId, req.params.championId)
  if (result.changes === 0) return res.status(404).json({ error: 'Not found' })
  res.status(204).send()
})

export default router
