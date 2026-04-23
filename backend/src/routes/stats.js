import { Router } from 'express'
import db from '../db/connection.js'

const router = Router()

router.get('/', (req, res) => {
  const champions = db.prepare('SELECT COUNT(*) as n FROM my_champions').get().n
  const matchups  = db.prepare('SELECT COUNT(*) as n FROM matchups').get().n
  const roles     = db.prepare('SELECT COUNT(DISTINCT role) as n FROM my_champions').get().n
  res.json({ champions, matchups, roles })
})

export default router
