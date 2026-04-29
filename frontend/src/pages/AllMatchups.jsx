import { useState, useEffect, useRef, useCallback } from 'react'
import api from '../lib/api.js'
import { loadChampions, champIconUrl } from '../lib/dataDragon.js'
import useDDData from '../hooks/useDDData.js'

const DIFF = ['easy', 'even', 'hard']
const DIFF_STYLE = {
  easy: 'bg-easy/20 text-easy border-easy/40',
  even: 'bg-blue-500/20 text-blue-300 border-blue-500/40',
  hard: 'bg-danger/20 text-danger border-danger/40',
}
const DIFF_ACTIVE = {
  easy: 'bg-easy/30 text-easy border-easy ring-1 ring-easy/50',
  even: 'bg-blue-500/30 text-blue-300 border-blue-500 ring-1 ring-blue-500/50',
  hard: 'bg-danger/30 text-danger border-danger ring-1 ring-danger/50',
}
const ROLES = ['Top', 'Jungle', 'Mid', 'Bot', 'Support']

// ─── Modal ────────────────────────────────────────────────────────────────────

function MatchupModal({ enemy, pool, matchupMap, onClose, onSave }) {
  const existingEntries = matchupMap.get(enemy.name.toLowerCase()) ?? []

  const buildInitial = () => {
    const map = {}
    for (const champ of pool) {
      const entry = existingEntries.find(e => e.champion_id === champ.id)
      map[champ.id] = {
        difficulty: entry?.difficulty ?? null,
        laning_tip: entry?.laning_tip ?? '',
        matchup_id: entry?.matchup_id ?? null,
        rune_page_id: entry?.rune_page_id ?? null,
        build_id: entry?.build_id ?? null,
      }
    }
    return map
  }

  const [rows, setRows] = useState(buildInitial)
  const [saving, setSaving] = useState(false)
  const [runeOptions, setRuneOptions] = useState({})
  const [buildOptions, setBuildOptions] = useState({})

  useEffect(() => { setRows(buildInitial()) }, [enemy.name])

  useEffect(() => {
    if (pool.length === 0) return
    Promise.all(
      pool.map(c =>
        Promise.all([
          api.get(`/api/champions/${c.id}/runes`),
          api.get(`/api/champions/${c.id}/builds`),
        ]).then(([runes, builds]) => ({ id: c.id, runes, builds }))
      )
    ).then(results => {
      const ro = {}, bo = {}
      for (const { id, runes, builds } of results) {
        ro[id] = runes.map(r => ({ id: r.id, label: r.label || 'Unnamed page' }))
        bo[id] = builds.map(b => ({ id: b.id, label: b.label || 'Unnamed build' }))
      }
      setRuneOptions(ro)
      setBuildOptions(bo)
    })
  }, [pool])

  useEffect(() => {
    const onKey = e => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const setDiff = (champId, diff) => {
    setRows(prev => ({
      ...prev,
      [champId]: {
        ...prev[champId],
        difficulty: prev[champId].difficulty === diff ? null : diff,
        laning_tip: prev[champId].difficulty === diff ? '' : prev[champId].laning_tip,
      },
    }))
  }

  const setTip = (champId, tip) => {
    setRows(prev => ({ ...prev, [champId]: { ...prev[champId], laning_tip: tip } }))
  }

  const setRunePage = (champId, id) => {
    setRows(prev => ({ ...prev, [champId]: { ...prev[champId], rune_page_id: id ? Number(id) : null } }))
  }

  const setBuild = (champId, id) => {
    setRows(prev => ({ ...prev, [champId]: { ...prev[champId], build_id: id ? Number(id) : null } }))
  }

  const handleSave = async () => {
    setSaving(true)
    const updates = []
    for (const champ of pool) {
      const row = rows[champ.id]
      const hadEntry = row.matchup_id !== null
      const hasNow = row.difficulty !== null

      if (hadEntry && hasNow) {
        updates.push(
          api.put(`/api/champions/${champ.id}/matchups/${row.matchup_id}`, {
            enemy_name: enemy.name,
            difficulty: row.difficulty,
            laning_tip: row.laning_tip,
            rune_page_id: row.rune_page_id,
            build_id: row.build_id,
          })
        )
      } else if (!hadEntry && hasNow) {
        updates.push(
          api.post(`/api/champions/${champ.id}/matchups`, {
            enemy_name: enemy.name,
            difficulty: row.difficulty,
            laning_tip: row.laning_tip,
            rune_page_id: row.rune_page_id,
            build_id: row.build_id,
          })
        )
      } else if (hadEntry && !hasNow) {
        updates.push(
          api.delete(`/api/champions/${champ.id}/matchups/${row.matchup_id}`)
        )
      }
    }

    try {
      await Promise.all(updates)
      const newEntries = pool
        .filter(c => rows[c.id].difficulty !== null)
        .map(c => ({
          champion_id: c.id,
          name: c.name,
          role: c.role,
          difficulty: rows[c.id].difficulty,
          laning_tip: rows[c.id].laning_tip,
          matchup_id: rows[c.id].matchup_id,
          rune_page_id: rows[c.id].rune_page_id,
          build_id: rows[c.id].build_id,
        }))
      onSave(enemy.name, newEntries)
    } finally {
      setSaving(false)
    }
  }

  const savedCount = existingEntries.length

  return (
    <div
      className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="bg-panel border border-gold-dark/40 rounded-xl w-full max-w-md max-h-[80vh] flex flex-col shadow-2xl">
        <div className="flex items-center gap-3 px-5 py-4 border-b border-gold-dark/20 flex-shrink-0">
          <img
            src={champIconUrl(enemy.name)}
            alt={enemy.name}
            className="w-10 h-10 rounded-lg object-cover border border-gold-dark/30"
            onError={e => { e.currentTarget.style.display = 'none' }}
          />
          <div className="flex-1 min-w-0">
            <div className="text-cream font-bold text-base">vs {enemy.name}</div>
            <div className="text-cream/40 text-xs">
              {savedCount > 0 ? `${savedCount} matchup${savedCount !== 1 ? 's' : ''} saved` : 'No matchups yet'}
            </div>
          </div>
          <button onClick={onClose} className="text-cream/30 hover:text-cream/70 text-xl leading-none px-1">×</button>
        </div>

        <div className="overflow-y-auto flex-1 px-4 py-3 flex flex-col gap-2">
          {pool.length === 0 && (
            <div className="text-cream/30 text-sm text-center py-6">
              Add champions to your pool first.
            </div>
          )}
          {pool.map(champ => {
            const row = rows[champ.id]
            const active = row.difficulty !== null
            const runes = runeOptions[champ.id] ?? []
            const builds = buildOptions[champ.id] ?? []
            return (
              <div
                key={champ.id}
                className={`rounded-lg border px-3 py-2.5 transition-colors ${active ? 'bg-panel-light border-gold-dark/30' : 'bg-panel border-gold-dark/10'}`}
              >
                <div className="flex items-center gap-2.5 mb-2">
                  <img
                    src={champIconUrl(champ.name)}
                    alt={champ.name}
                    className="w-8 h-8 rounded object-cover border border-gold-dark/20 flex-shrink-0"
                    onError={e => { e.currentTarget.style.display = 'none' }}
                  />
                  <div className="flex-1 min-w-0">
                    <span className="text-cream text-sm font-semibold">{champ.name}</span>
                    <span className="text-cream/30 text-xs ml-2">{champ.role}</span>
                  </div>
                  <div className="flex gap-1">
                    {DIFF.map(d => (
                      <button
                        key={d}
                        onClick={() => setDiff(champ.id, d)}
                        className={`text-[10px] font-bold px-2 py-0.5 rounded border transition-all capitalize ${row.difficulty === d ? DIFF_ACTIVE[d] : DIFF_STYLE[d] + ' opacity-50 hover:opacity-80'}`}
                      >
                        {d}
                      </button>
                    ))}
                  </div>
                </div>

                {active && (
                  <div className="flex flex-col gap-2 mt-1">
                    <textarea
                      className="w-full bg-navy/60 border border-gold-dark/20 rounded px-2.5 py-1.5 text-cream text-xs placeholder-cream/20 focus:outline-none focus:border-gold/50 resize-none min-h-[40px]"
                      placeholder="Laning tip… (optional)"
                      value={row.laning_tip}
                      rows={2}
                      onChange={e => setTip(champ.id, e.target.value)}
                    />
                    <div className="flex gap-2">
                      <div className="flex-1 flex items-center gap-1.5 bg-navy/60 border border-gold-dark/20 rounded px-2.5 py-1.5 min-w-0">
                        <span className="text-[10px]">📖</span>
                        <div className="flex-1 min-w-0">
                          <div className="text-[8px] text-cream/30 uppercase tracking-wide leading-none mb-0.5">Rune page</div>
                          <select
                            className="bg-transparent text-[10px] text-gold w-full outline-none cursor-pointer truncate"
                            value={row.rune_page_id ?? ''}
                            onChange={e => setRunePage(champ.id, e.target.value)}
                          >
                            <option value="">Default</option>
                            {runes.map(r => (
                              <option key={r.id} value={r.id}>{r.label}</option>
                            ))}
                          </select>
                        </div>
                        <a
                          href={`/champions/${champ.id}`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-cream/20 hover:text-gold text-[10px] flex-shrink-0"
                          title="Open champion page"
                        >↗</a>
                      </div>
                      <div className="flex-1 flex items-center gap-1.5 bg-navy/60 border border-gold-dark/20 rounded px-2.5 py-1.5 min-w-0">
                        <span className="text-[10px]">⚔️</span>
                        <div className="flex-1 min-w-0">
                          <div className="text-[8px] text-cream/30 uppercase tracking-wide leading-none mb-0.5">Build</div>
                          <select
                            className="bg-transparent text-[10px] text-gold w-full outline-none cursor-pointer truncate"
                            value={row.build_id ?? ''}
                            onChange={e => setBuild(champ.id, e.target.value)}
                          >
                            <option value="">Default</option>
                            {builds.map(b => (
                              <option key={b.id} value={b.id}>{b.label}</option>
                            ))}
                          </select>
                        </div>
                        <a
                          href={`/champions/${champ.id}`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-cream/20 hover:text-gold text-[10px] flex-shrink-0"
                          title="Open champion page"
                        >↗</a>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>

        <div className="flex justify-end gap-2 px-5 py-4 border-t border-gold-dark/20 flex-shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-sm text-cream/50 border border-gold-dark/20 hover:text-cream/80 hover:border-gold-dark/40 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-5 py-2 rounded-lg text-sm font-semibold bg-gold text-navy hover:bg-gold/90 disabled:opacity-50 transition-colors"
          >
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function AllMatchups() {
  const { ready } = useDDData()
  const [allChamps, setAllChamps] = useState([])   // sorted DD champion list
  const [matchupMap, setMatchupMap] = useState(new Map()) // lowercase name → entries[]
  const [pool, setPool] = useState([])
  const [loading, setLoading] = useState(true)

  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [role, setRole] = useState('')
  const [modalEnemy, setModalEnemy] = useState(null) // { name } DD champ object
  const timerRef = useRef(null)

  // Load everything once DD is ready
  useEffect(() => {
    if (!ready) return
    Promise.all([
      loadChampions(),
      api.get('/api/all-matchups'),
      api.get('/api/champions'),
    ]).then(([dd, matchups, poolData]) => {
      const sorted = Object.values(dd).sort((a, b) => a.name.localeCompare(b.name))
      setAllChamps(sorted)

      const map = new Map()
      for (const { enemy_name, entries } of matchups) {
        map.set(enemy_name.toLowerCase(), entries.map(e => ({ ...e, matchup_id: e.matchup_id ?? null })))
      }
      setMatchupMap(map)
      setPool(poolData)
      setLoading(false)
    })
  }, [ready])

  const handleSearchChange = e => {
    const val = e.target.value
    setSearchInput(val)
    clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => setSearch(val), 250)
  }

  // Filter DD champ list by search
  const filtered = search
    ? allChamps.filter(c => c.name.toLowerCase().includes(search.toLowerCase()))
    : allChamps

  // Get counter entries for a champion, optionally filtered by role
  const getCounters = useCallback((champName) => {
    const entries = matchupMap.get(champName.toLowerCase()) ?? []
    if (!role) return entries
    return entries.filter(e => e.role === role)
  }, [matchupMap, role])

  const handleSave = (enemyName, newEntries) => {
    setMatchupMap(prev => {
      const next = new Map(prev)
      if (newEntries.length === 0) {
        next.delete(enemyName.toLowerCase())
      } else {
        next.set(enemyName.toLowerCase(), newEntries)
      }
      return next
    })
    setModalEnemy(null)
  }

  if (!ready || loading) {
    return (
      <div className="px-6 py-8">
        <h1 className="text-gold text-2xl font-bold mb-2">Matchup Matrix</h1>
        <div className="text-cream/40 text-sm mt-8">Loading champions…</div>
      </div>
    )
  }

  return (
    <div className="px-6 py-8">
      <h1 className="text-gold text-2xl font-bold mb-1">Matchup Matrix</h1>
      <p className="text-cream/40 text-sm mb-6">Click any champion to set which of your picks counter them.</p>

      {/* Filters */}
      <div className="flex gap-3 mb-6 flex-wrap">
        <input
          className="flex-1 min-w-[180px] bg-panel border border-gold-dark/40 rounded-lg px-4 py-2.5 text-cream placeholder-cream/30 focus:outline-none focus:border-gold text-sm"
          placeholder="Search enemy…"
          value={searchInput}
          onChange={handleSearchChange}
        />
        <select
          className="bg-panel border border-gold-dark/40 rounded-lg px-3 py-2.5 text-cream text-sm focus:outline-none focus:border-gold"
          value={role}
          onChange={e => setRole(e.target.value)}
        >
          <option value="">All roles</option>
          {ROLES.map(r => <option key={r}>{r}</option>)}
        </select>
      </div>

      {/* Grid */}
      <div className="flex flex-wrap gap-1.5">
        {filtered.map(champ => {
          const counters = getCounters(champ.name)
          const hasData = counters.length > 0
          const isOpen = modalEnemy?.name === champ.name

          return (
            <button
              key={champ.id}
              onClick={() => setModalEnemy(champ)}
              className={`flex flex-col items-center gap-1 w-[62px] p-1.5 rounded-lg transition-all cursor-pointer
                ${isOpen ? 'ring-1 ring-gold bg-panel-light' : 'hover:bg-panel'}
                ${!hasData ? 'opacity-30 hover:opacity-60' : ''}`}
            >
              <img
                src={champIconUrl(champ.name)}
                alt={champ.name}
                className="w-[52px] h-[52px] rounded object-cover border border-gold-dark/20"
                onError={e => { e.currentTarget.style.display = 'none' }}
              />
              {/* Counter icons */}
              <div className="flex gap-0.5 min-h-[20px] items-center">
                {counters.map(entry => (
                  <img
                    key={entry.champion_id}
                    src={champIconUrl(entry.name)}
                    alt={entry.name}
                    title={`${entry.name} (${entry.difficulty})`}
                    className="w-5 h-5 rounded object-cover border border-gold-dark/30"
                    onError={e => { e.currentTarget.style.display = 'none' }}
                  />
                ))}
              </div>
              <span className="text-[9px] text-cream/50 w-full text-center truncate leading-tight">
                {champ.name}
              </span>
            </button>
          )
        })}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-16 text-cream/20">
          <div className="text-4xl mb-3">🔍</div>
          <div>No champions match "{search}"</div>
        </div>
      )}

      {/* Modal */}
      {modalEnemy && (
        <MatchupModal
          enemy={modalEnemy}
          pool={pool}
          matchupMap={matchupMap}
          onClose={() => setModalEnemy(null)}
          onSave={handleSave}
        />
      )}
    </div>
  )
}
