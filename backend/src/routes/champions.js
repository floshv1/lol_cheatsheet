import { Router } from 'express'
import db from '../db/connection.js'

const router = Router()

router.get('/', (req, res) => {
  res.json(db.prepare('SELECT * FROM my_champions ORDER BY role, name').all())
})

router.post('/', (req, res) => {
  const { name, role, comfort = 3, notes = '' } = req.body
  if (!name || !role) return res.status(400).json({ error: 'name and role required' })
  try {
    const { lastInsertRowid } = db.prepare(
      'INSERT INTO my_champions (name, role, comfort, notes) VALUES (?, ?, ?, ?)'
    ).run(name, role, comfort, notes)
    res.status(201).json(db.prepare('SELECT * FROM my_champions WHERE id = ?').get(lastInsertRowid))
  } catch {
    res.status(409).json({ error: 'Champion already in pool' })
  }
})

router.put('/:id', (req, res) => {
  const c = db.prepare('SELECT * FROM my_champions WHERE id = ?').get(req.params.id)
  if (!c) return res.status(404).json({ error: 'Not found' })
  const { name, role, comfort, notes } = req.body
  db.prepare('UPDATE my_champions SET name=?, role=?, comfort=?, notes=? WHERE id=?').run(
    name ?? c.name, role ?? c.role, comfort ?? c.comfort, notes ?? c.notes, req.params.id
  )
  res.json(db.prepare('SELECT * FROM my_champions WHERE id = ?').get(req.params.id))
})

router.delete('/:id', (req, res) => {
  const result = db.prepare('DELETE FROM my_champions WHERE id = ?').run(req.params.id)
  if (result.changes === 0) return res.status(404).json({ error: 'Not found' })
  res.status(204).send()
})

export default router
