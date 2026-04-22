import { Router } from 'express'
import db from '../db/connection.js'

const router = Router({ mergeParams: true })

const FIELDS = 'primary_path, keystone, slot1, slot2, slot3, secondary_path, sec1, sec2, shard_offense, shard_flex, shard_defense'

router.get('/', (req, res) => {
  res.json(db.prepare('SELECT * FROM rune_pages WHERE champion_id = ? ORDER BY is_default DESC, id').all(req.params.championId))
})

router.post('/', (req, res) => {
  const { label = 'New Page', is_default = 0, primary_path = '', keystone = '', slot1 = '', slot2 = '', slot3 = '', secondary_path = '', sec1 = '', sec2 = '', shard_offense = '', shard_flex = '', shard_defense = '' } = req.body
  if (is_default) db.prepare('UPDATE rune_pages SET is_default = 0 WHERE champion_id = ?').run(req.params.championId)
  const { lastInsertRowid } = db.prepare(`
    INSERT INTO rune_pages (champion_id, label, is_default, ${FIELDS})
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(req.params.championId, label, is_default ? 1 : 0, primary_path, keystone, slot1, slot2, slot3, secondary_path, sec1, sec2, shard_offense, shard_flex, shard_defense)
  res.status(201).json(db.prepare('SELECT * FROM rune_pages WHERE id = ?').get(lastInsertRowid))
})

router.put('/:pageId', (req, res) => {
  const page = db.prepare('SELECT * FROM rune_pages WHERE id = ? AND champion_id = ?').get(req.params.pageId, req.params.championId)
  if (!page) return res.status(404).json({ error: 'Not found' })
  const { label, is_default, primary_path, keystone, slot1, slot2, slot3, secondary_path, sec1, sec2, shard_offense, shard_flex, shard_defense } = req.body
  if (is_default) db.prepare('UPDATE rune_pages SET is_default = 0 WHERE champion_id = ?').run(req.params.championId)
  db.prepare(`
    UPDATE rune_pages SET label=?, is_default=?, primary_path=?, keystone=?, slot1=?, slot2=?, slot3=?,
      secondary_path=?, sec1=?, sec2=?, shard_offense=?, shard_flex=?, shard_defense=?
    WHERE id=?
  `).run(
    label ?? page.label, is_default !== undefined ? (is_default ? 1 : 0) : page.is_default,
    primary_path ?? page.primary_path, keystone ?? page.keystone,
    slot1 ?? page.slot1, slot2 ?? page.slot2, slot3 ?? page.slot3,
    secondary_path ?? page.secondary_path, sec1 ?? page.sec1, sec2 ?? page.sec2,
    shard_offense ?? page.shard_offense, shard_flex ?? page.shard_flex, shard_defense ?? page.shard_defense,
    req.params.pageId
  )
  res.json(db.prepare('SELECT * FROM rune_pages WHERE id = ?').get(req.params.pageId))
})

router.delete('/:pageId', (req, res) => {
  const result = db.prepare('DELETE FROM rune_pages WHERE id = ? AND champion_id = ?').run(req.params.pageId, req.params.championId)
  if (result.changes === 0) return res.status(404).json({ error: 'Not found' })
  res.status(204).send()
})

router.put('/:pageId/default', (req, res) => {
  const page = db.prepare('SELECT * FROM rune_pages WHERE id = ? AND champion_id = ?').get(req.params.pageId, req.params.championId)
  if (!page) return res.status(404).json({ error: 'Not found' })
  db.prepare('UPDATE rune_pages SET is_default = 0 WHERE champion_id = ?').run(req.params.championId)
  db.prepare('UPDATE rune_pages SET is_default = 1 WHERE id = ?').run(req.params.pageId)
  res.json(db.prepare('SELECT * FROM rune_pages WHERE id = ?').get(req.params.pageId))
})

export default router
