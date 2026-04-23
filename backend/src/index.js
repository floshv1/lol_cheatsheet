import express from 'express'
import cors from 'cors'
import path from 'path'
import { fileURLToPath } from 'url'
import { runMigrations } from './db/migrations.js'
import { runSeed } from './db/seed.js'
import settingsRouter from './routes/settings.js'
import championsRouter from './routes/champions.js'
import runesRouter from './routes/runes.js'
import buildsRouter from './routes/builds.js'
import matchupsRouter from './routes/matchups.js'
import lookupRouter from './routes/lookup.js'
import allMatchupsRouter from './routes/all-matchups.js'
import statsRouter from './routes/stats.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const app = express()

app.use(cors())
app.use(express.json({ limit: '50mb' }))

const uploadsPath = process.env.UPLOADS_PATH || path.join(__dirname, '../../uploads')
app.use('/uploads', express.static(uploadsPath))

app.use('/api/settings', settingsRouter)
app.use('/api/champions', championsRouter)
app.use('/api/champions/:championId/runes', runesRouter)
app.use('/api/champions/:championId/builds', buildsRouter)
app.use('/api/champions/:championId/matchups', matchupsRouter)
app.use('/api/lookup', lookupRouter)
app.use('/api/all-matchups', allMatchupsRouter)
app.use('/api/stats', statsRouter)

runMigrations()
runSeed()

const PORT = process.env.PORT || 3001
app.listen(PORT, () => console.log(`Backend listening on :${PORT}`))
