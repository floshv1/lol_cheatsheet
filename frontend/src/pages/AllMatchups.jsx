import { useState, useEffect, useRef } from 'react'
import api from '../lib/api.js'
import { champIconUrl } from '../lib/dataDragon.js'

const DIFF_STYLE = {
  easy: 'bg-easy/20 text-easy',
  even: 'bg-blue-500/20 text-blue-300',
  hard: 'bg-danger/20 text-danger',
}

export default function AllMatchups() {
  const [data, setData] = useState([])
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [role, setRole] = useState('')
  const [loading, setLoading] = useState(true)
  const timerRef = useRef(null)

  useEffect(() => {
    const params = new URLSearchParams()
    if (search) params.set('search', search)
    if (role) params.set('role', role)
    setLoading(true)
    api.get(`/api/all-matchups?${params}`)
      .then(setData)
      .finally(() => setLoading(false))
  }, [search, role])

  return (
    <div className="px-6 py-8">
      <h1 className="text-gold text-2xl font-bold mb-2">Matchup Matrix</h1>
      <p className="text-cream/50 text-sm mb-6">For every enemy, see which of your pool champions to pick.</p>

      <div className="flex gap-3 mb-6 flex-wrap">
        <input
          className="flex-1 min-w-[200px] bg-panel border border-gold-dark/40 rounded-lg px-4 py-2.5 text-cream placeholder-cream/30 focus:outline-none focus:border-gold"
          placeholder="Search enemy…"
          value={searchInput}
          onChange={e => {
            const val = e.target.value
            setSearchInput(val)
            clearTimeout(timerRef.current)
            timerRef.current = setTimeout(() => setSearch(val), 250)
          }}
        />
        <select
          className="bg-panel border border-gold-dark/40 rounded-lg px-3 py-2.5 text-cream text-sm focus:outline-none focus:border-gold"
          value={role}
          onChange={e => setRole(e.target.value)}
        >
          <option value="">All roles</option>
          <option>Top</option>
          <option>Jungle</option>
          <option>Mid</option>
          <option>Bot</option>
          <option>Support</option>
        </select>
      </div>

      {loading && <div className="text-cream/40 text-sm">Loading…</div>}

      {!loading && data.length === 0 && (
        <div className="text-center py-16 text-cream/20">
          <div className="text-5xl mb-4">⚔️</div>
          <div className="text-lg">No matchup data yet</div>
          <div className="text-sm mt-2">Add matchups in your champion pool pages</div>
        </div>
      )}

      <div className="flex flex-col gap-3">
        {data.map(({ enemy_name, entries }) => (
          <div key={enemy_name} className="bg-panel border border-gold-dark/30 rounded-xl overflow-hidden">
            <div className="flex items-center gap-3 px-4 py-3 border-b border-gold-dark/20">
              <img
                src={champIconUrl(enemy_name)}
                alt={enemy_name}
                className="w-9 h-9 rounded-lg object-cover border border-gold-dark/30"
                onError={e => { e.currentTarget.style.display = 'none' }}
              />
              <span className="font-semibold text-cream">{enemy_name}</span>
              <span className="text-xs text-cream/30 ml-auto">{entries.length} answer{entries.length !== 1 ? 's' : ''}</span>
            </div>
            <div className="flex flex-wrap gap-2 px-4 py-3">
              {entries.map(e => (
                <div key={e.champion_id} className="flex items-center gap-2 bg-panel-light rounded-lg px-3 py-2">
                  <img
                    src={champIconUrl(e.name)}
                    alt={e.name}
                    className="w-7 h-7 rounded object-cover"
                    onError={ev => { ev.currentTarget.style.display = 'none' }}
                  />
                  <div>
                    <div className="text-sm text-cream font-medium">{e.name}</div>
                    <div className="flex items-center gap-1.5">
                      <span className={`text-[11px] rounded px-1.5 py-0.5 ${DIFF_STYLE[e.difficulty] || ''}`}>{e.difficulty}</span>
                      <span className="text-[11px] text-cream/30">{e.role}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
