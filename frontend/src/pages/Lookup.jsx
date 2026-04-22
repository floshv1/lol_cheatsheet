import { useState, useEffect, useRef } from 'react'
import api from '../lib/api.js'
import { champIconUrl } from '../lib/dataDragon.js'
import LookupResultCard from '../components/LookupResultCard.jsx'
import ChampionAutocomplete from '../components/ChampionAutocomplete.jsx'

export default function Lookup() {
  const [enemy, setEnemy] = useState('')
  const [role, setRole] = useState('')
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(false)
  const timer = useRef(null)

  useEffect(() => {
    clearTimeout(timer.current)
    if (!enemy.trim()) { setData(null); return }
    timer.current = setTimeout(() => {
      setLoading(true)
      const params = new URLSearchParams({ enemy })
      if (role) params.set('role', role)
      api.get(`/api/lookup?${params}`)
        .then(setData)
        .catch(() => setData(null))
        .finally(() => setLoading(false))
    }, 300)
  }, [enemy, role])

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-gold text-2xl font-bold mb-2">Enemy Lookup</h1>
      <p className="text-cream/50 text-sm mb-6">Search an enemy champion to see which of your pool to pick and how.</p>

      {/* Search */}
      <div className="flex gap-3 mb-8 flex-wrap">
        <ChampionAutocomplete
          placeholder="Enemy champion name…"
          onSelect={c => setEnemy(c.name)}
          className="flex-1 min-w-[200px]"
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

      {loading && <div className="text-cream/40 text-sm">Searching…</div>}

      {data && (
        <>
          {data.results.length > 0 ? (
            <>
              <div className="text-xs text-cream/40 uppercase tracking-wide mb-3">
                {data.results.length} champion{data.results.length !== 1 ? 's' : ''} with matchup data
              </div>
              <div className="flex flex-col gap-4">
                {data.results.map(r => (
                  <LookupResultCard key={r.champion.id} {...r} />
                ))}
              </div>
            </>
          ) : (
            <div className="text-cream/40 text-sm mb-4">No matchup data for this enemy yet.</div>
          )}

          {data.no_data.length > 0 && (
            <div className="mt-8">
              <div className="text-xs text-cream/30 uppercase tracking-wide mb-3">Pool champs without data</div>
              <div className="flex flex-wrap gap-2">
                {data.no_data.map(c => (
                  <div key={c.id} className="flex items-center gap-2 bg-panel/50 rounded-lg px-3 py-2 text-cream/50 text-sm">
                    <img
                      src={champIconUrl(c.name)}
                      alt={c.name}
                      className="w-7 h-7 rounded object-cover opacity-50"
                      onError={e => { e.currentTarget.style.display = 'none' }}
                    />
                    {c.name}
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {!enemy && (
        <div className="text-center py-16 text-cream/20">
          <div className="text-5xl mb-4">⚔️</div>
          <div className="text-lg">Search an enemy to get started</div>
        </div>
      )}
    </div>
  )
}
