import { Router } from 'express'
import db from '../db/connection.js'

const router = Router({ mergeParams: true })

function buildWithItems(buildId) {
  const build = db.prepare('SELECT * FROM builds WHERE id = ?').get(buildId)
  if (!build) return null
  build.items = db.prepare('SELECT * FROM build_items WHERE build_id = ? ORDER BY slot, order_index').all(buildId)
  return build
}

router.get('/', (req, res) => {
  const builds = db.prepare('SELECT * FROM builds WHERE champion_id = ? ORDER BY is_default DESC, id').all(req.params.championId)
  res.json(builds.map(b => buildWithItems(b.id)))
})

router.post('/', (req, res) => {
  const { label = 'New Build', is_default = 0 } = req.body
  if (is_default) db.prepare('UPDATE builds SET is_default = 0 WHERE champion_id = ?').run(req.params.championId)
  const { lastInsertRowid } = db.prepare('INSERT INTO builds (champion_id, label, is_default) VALUES (?, ?, ?)').run(req.params.championId, label, is_default ? 1 : 0)
  res.status(201).json(buildWithItems(lastInsertRowid))
})

router.put('/:buildId', (req, res) => {
  const build = db.prepare('SELECT * FROM builds WHERE id = ? AND champion_id = ?').get(req.params.buildId, req.params.championId)
  if (!build) return res.status(404).json({ error: 'Not found' })
  const { label, is_default } = req.body
  if (is_default) db.prepare('UPDATE builds SET is_default = 0 WHERE champion_id = ?').run(req.params.championId)
  db.prepare('UPDATE builds SET label=?, is_default=? WHERE id=?').run(
    label ?? build.label, is_default !== undefined ? (is_default ? 1 : 0) : build.is_default, req.params.buildId
  )
  res.json(buildWithItems(Number(req.params.buildId)))
})

router.delete('/:buildId', (req, res) => {
  const result = db.prepare('DELETE FROM builds WHERE id = ? AND champion_id = ?').run(req.params.buildId, req.params.championId)
  if (result.changes === 0) return res.status(404).json({ error: 'Not found' })
  res.status(204).send()
})

// ── Items ──────────────────────────────────────────────────────────────────────

router.post('/:buildId/items', (req, res) => {
  const { item_name, item_id = 0, slot = 'core', order_index = 0, note = '' } = req.body
  if (!item_name) return res.status(400).json({ error: 'item_name required' })
  const { lastInsertRowid } = db.prepare(
    'INSERT INTO build_items (build_id, item_name, item_id, slot, order_index, note) VALUES (?, ?, ?, ?, ?, ?)'
  ).run(req.params.buildId, item_name, item_id, slot, order_index, note)
  res.status(201).json(db.prepare('SELECT * FROM build_items WHERE id = ?').get(lastInsertRowid))
})

router.put('/:buildId/items/reorder', (req, res) => {
  const { order } = req.body // [{id, order_index}, ...]
  if (!Array.isArray(order)) return res.status(400).json({ error: 'order array required' })
  const stmt = db.prepare('UPDATE build_items SET order_index = ? WHERE id = ? AND build_id = ?')
  db.transaction(() => {
    for (const { id, order_index } of order) stmt.run(order_index, id, req.params.buildId)
  })()
  res.json(buildWithItems(Number(req.params.buildId)))
})

router.put('/:buildId/items/:itemId', (req, res) => {
  const item = db.prepare('SELECT * FROM build_items WHERE id = ?').get(req.params.itemId)
  if (!item) return res.status(404).json({ error: 'Not found' })
  const { item_name, item_id, slot, order_index, note } = req.body
  db.prepare('UPDATE build_items SET item_name=?, item_id=?, slot=?, order_index=?, note=? WHERE id=?').run(
    item_name ?? item.item_name, item_id ?? item.item_id, slot ?? item.slot,
    order_index ?? item.order_index, note ?? item.note, req.params.itemId
  )
  res.json(db.prepare('SELECT * FROM build_items WHERE id = ?').get(req.params.itemId))
})

router.delete('/:buildId/items/:itemId', (req, res) => {
  const result = db.prepare('DELETE FROM build_items WHERE id = ?').run(req.params.itemId)
  if (result.changes === 0) return res.status(404).json({ error: 'Not found' })
  res.status(204).send()
})

export default router
