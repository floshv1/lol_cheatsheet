import { Router } from 'express'
import db from '../db/connection.js'

const router = Router()

router.get('/', (req, res) => {
  const rows = db.prepare('SELECT key, value FROM settings').all()
  const settings = Object.fromEntries(rows.map(r => [r.key, r.value]))
  res.json(settings)
})

router.put('/:key', (req, res) => {
  const { value } = req.body
  if (value === undefined) return res.status(400).json({ error: 'value required' })
  db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)').run(req.params.key, value)
  res.json({ key: req.params.key, value })
})

export default router
