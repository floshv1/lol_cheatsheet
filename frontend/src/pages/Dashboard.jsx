import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../lib/api.js'
import { champIconUrl } from '../lib/dataDragon.js'
import LookupResultCard from '../components/LookupResultCard.jsx'
import ChampionAutocomplete from '../components/ChampionAutocomplete.jsx'

const ROLES = ['Top', 'Jungle', 'Mid', 'Bot', 'Support']

const ROLE_ICONS = { Top: '🛡️', Jungle: '🌲', Mid: '⚡', Bot: '🏹', Support: '💚' }

function Stars({ value }) {
  return (
    <span className="text-sm">
      {Array.from({ length: 5 }, (_, i) => (
        <span key={i} className={i < value ? 'text-gold' : 'text-cream/20'}>★</span>
      ))}
    </span>
  )
}

function PoolChampCard({ champ, onClick }) {
  return (
    <button
      onClick={() => onClick(champ)}
      className="flex items-center gap-2 bg-panel hover:bg-panel-light border border-gold-dark/20 hover:border-gold/40 rounded-lg px-3 py-2 transition-colors w-full text-left group"
    >
      <img
        src={champIconUrl(champ.name)}
        alt={champ.name}
        className="w-9 h-9 rounded object-cover border border-gold-dark/30 shrink-0"
        onError={e => { e.currentTarget.style.display = 'none' }}
      />
      <div className="flex-1 min-w-0">
        <div className="text-cream text-sm font-medium truncate">{champ.name}</div>
        <Stars value={champ.comfort} />
      </div>
    </button>
  )
}

export default function Dashboard() {
  const navigate = useNavigate()
  const [champs, setChamps] = useState([])
  const [enemy, setEnemy] = useState('')
  const [role, setRole] = useState('')
  const [lookupData, setLookupData] = useState(null)
  const [loading, setLoading] = useState(false)
  const timer = useRef(null)
  const searchRef = useRef(null)

  useEffect(() => { api.get('/api/champions').then(setChamps) }, [])

  useEffect(() => {
    function handler() { searchRef.current?.focus() }
    window.addEventListener('lol:focus-search', handler)
    return () => window.removeEventListener('lol:focus-search', handler)
  }, [])

  useEffect(() => {
    clearTimeout(timer.current)
    if (!enemy.trim()) { setLookupData(null); return }
    timer.current = setTimeout(() => {
      setLoading(true)
      const params = new URLSearchParams({ enemy })
      if (role) params.set('role', role)
      api.get(`/api/lookup?${params}`)
        .then(setLookupData)
        .catch(() => setLookupData(null))
        .finally(() => setLoading(false))
    }, 300)
  }, [enemy, role])

  const byRole = ROLES.map(r => ({
    role: r,
    champs: champs.filter(c => c.role === r).sort((a, b) => b.comfort - a.comfort),
  })).filter(g => g.champs.length > 0)

  return (
    <div className="flex flex-col lg:flex-row h-full min-h-screen">

      {/* Left: Lookup */}
      <div className="flex-1 px-4 py-8 max-w-2xl lg:border-r lg:border-gold-dark/20">
        <h1 className="text-gold text-2xl font-bold mb-1">Enemy Lookup</h1>
        <p className="text-cream/40 text-sm mb-5">Search an enemy to see which of your pool to pick and how.</p>

        <div className="flex gap-3 mb-6 flex-wrap">
          <ChampionAutocomplete
            placeholder="Enemy champion… (press / to focus)"
            onSelect={c => setEnemy(c.name)}
            className="flex-1 min-w-[180px]"
            focusRef={searchRef}
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

        {loading && <div className="text-cream/40 text-sm">Searching…</div>}

        {lookupData && (
          <>
            {lookupData.results.length > 0 ? (
              <div className="flex flex-col gap-4">
                {lookupData.results.map(r => (
                  <LookupResultCard key={r.champion.id} {...r} />
                ))}
              </div>
            ) : (
              <div className="text-cream/30 text-sm">No matchup data for this enemy yet.</div>
            )}

            {lookupData.no_data.length > 0 && (
              <div className="mt-6">
                <div className="text-xs text-cream/30 uppercase tracking-wide mb-2">Pool champs without data</div>
                <div className="flex flex-wrap gap-2">
                  {lookupData.no_data.map(c => (
                    <div key={c.id} className="flex items-center gap-1.5 bg-panel/40 rounded px-2 py-1 text-cream/40 text-xs">
                      <img src={champIconUrl(c.name)} alt={c.name} className="w-5 h-5 rounded opacity-50"
                        onError={e => { e.currentTarget.style.display = 'none' }} />
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
            <div className="text-5xl mb-3">⚔️</div>
            <div>Search an enemy to get started</div>
          </div>
        )}
      </div>

      {/* Right: Pool by role */}
      <div className="w-full lg:w-80 xl:w-96 px-4 py-8 shrink-0">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-cream font-bold text-lg">My Pool</h2>
          <button
            onClick={() => navigate('/pool')}
            className="text-xs text-gold hover:text-gold/70 transition-colors"
          >
            Manage →
          </button>
        </div>

        {byRole.length === 0 && (
          <div className="text-cream/20 text-sm text-center py-8">
            No champions yet.{' '}
            <button onClick={() => navigate('/pool')} className="text-gold underline">Add some →</button>
          </div>
        )}

        <div className="flex flex-col gap-5">
          {byRole.map(({ role, champs }) => (
            <div key={role}>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-base">{ROLE_ICONS[role]}</span>
                <span className="text-xs text-cream/50 uppercase tracking-wide font-semibold">{role}</span>
              </div>
              <div className="flex flex-col gap-1.5">
                {champs.map(c => (
                  <PoolChampCard
                    key={c.id}
                    champ={c}
                    onClick={() => navigate(`/champions/${c.id}`)}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
