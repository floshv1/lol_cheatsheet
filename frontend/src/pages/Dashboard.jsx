import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../lib/api.js'
import { champIconUrl } from '../lib/dataDragon.js'
import LookupResultCard from '../components/LookupResultCard.jsx'
import ChampionAutocomplete from '../components/ChampionAutocomplete.jsx'

const ROLES = ['Top', 'Jungle', 'Mid', 'Bot', 'Support']
const RECENT_KEY = 'lol:recent-lookups'
const RECENT_MAX = 5
const POOL_STRIP_MAX = 6

function saveRecent(name) {
  const prev = JSON.parse(localStorage.getItem(RECENT_KEY) || '[]')
  const next = [name, ...prev.filter(n => n !== name)].slice(0, RECENT_MAX)
  localStorage.setItem(RECENT_KEY, JSON.stringify(next))
}

function getRecent() {
  return JSON.parse(localStorage.getItem(RECENT_KEY) || '[]')
}

export default function Dashboard() {
  const navigate = useNavigate()
  const [champs, setChamps] = useState([])
  const [stats, setStats] = useState(null)
  const [enemy, setEnemy] = useState('')
  const [role, setRole] = useState('')
  const [lookupData, setLookupData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [recent, setRecent] = useState(getRecent)
  const timer = useRef(null)
  const searchRef = useRef(null)

  useEffect(() => {
    api.get('/api/champions').then(setChamps)
    api.get('/api/stats').then(setStats)
  }, [])

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

  function selectEnemy(name) {
    setEnemy(name)
    saveRecent(name)
    setRecent(getRecent())
  }

  const visiblePool = champs.slice(0, POOL_STRIP_MAX)
  const overflowCount = Math.max(0, champs.length - POOL_STRIP_MAX)

  return (
    <div className="px-6 py-6 flex flex-col gap-6 min-h-screen">

      {/* ── Top bar: stats + pool strip ── */}
      <div className="flex items-center gap-3 flex-wrap pb-4 border-b border-gold-dark/20">
        {stats && (
          <>
            <div className="flex items-center gap-1.5 bg-panel border border-gold-dark/20 rounded-lg px-3 py-1.5">
              <span className="text-gold font-bold text-sm">{stats.champions}</span>
              <span className="text-cream/40 text-xs">champions</span>
            </div>
            <div className="flex items-center gap-1.5 bg-panel border border-gold-dark/20 rounded-lg px-3 py-1.5">
              <span className="text-gold font-bold text-sm">{stats.matchups}</span>
              <span className="text-cream/40 text-xs">matchups</span>
            </div>
            <div className="flex items-center gap-1.5 bg-panel border border-gold-dark/20 rounded-lg px-3 py-1.5">
              <span className="text-gold font-bold text-sm">{stats.roles} / 5</span>
              <span className="text-cream/40 text-xs">roles</span>
            </div>
          </>
        )}

        {champs.length > 0 && (
          <div className="ml-auto flex items-center gap-2">
            <span className="text-cream/30 text-xs">My pool</span>
            <div className="flex gap-1.5 items-center">
              {visiblePool.map(c => (
                <button
                  key={c.id}
                  onClick={() => navigate(`/champions/${c.id}`)}
                  title={c.name}
                  className="w-7 h-7 rounded overflow-hidden border border-gold-dark/20 hover:border-gold/50 transition-colors flex-shrink-0"
                >
                  <img
                    src={champIconUrl(c.name)}
                    alt={c.name}
                    className="w-full h-full object-cover"
                    onError={e => { e.currentTarget.style.display = 'none' }}
                  />
                </button>
              ))}
              {overflowCount > 0 && (
                <button
                  onClick={() => navigate('/pool')}
                  className="w-7 h-7 rounded bg-panel border border-gold-dark/20 hover:border-gold/50 flex items-center justify-center text-[9px] text-cream/50 font-bold transition-colors"
                >
                  +{overflowCount}
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ── Search section ── */}
      <div className="flex flex-col gap-3">
        <h1 className="text-gold text-2xl font-bold leading-none">Enemy Lookup</h1>
        <ChampionAutocomplete
          placeholder="Enemy champion… (press / to focus)"
          onSelect={c => selectEnemy(c.name)}
          focusRef={searchRef}
        />
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setRole('')}
            className={`px-3 py-1 rounded-full text-xs font-semibold border transition-colors ${
              role === ''
                ? 'bg-panel-light border-gold/50 text-cream'
                : 'border-gold-dark/30 text-cream/40 hover:text-cream/70 hover:border-gold-dark/50'
            }`}
          >
            All
          </button>
          {ROLES.map(r => (
            <button
              key={r}
              onClick={() => setRole(prev => prev === r ? '' : r)}
              className={`px-3 py-1 rounded-full text-xs font-semibold border transition-colors ${
                role === r
                  ? 'bg-panel-light border-gold/50 text-cream'
                  : 'border-gold-dark/30 text-cream/40 hover:text-cream/70 hover:border-gold-dark/50'
              }`}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      {/* ── Recent lookups ── */}
      {!enemy && recent.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-cream/30 uppercase tracking-wide">Recent:</span>
          {recent.map(name => (
            <button
              key={name}
              onClick={() => selectEnemy(name)}
              className="flex items-center gap-1.5 bg-panel hover:bg-panel-light border border-gold-dark/20 hover:border-gold/40 rounded-lg px-3 py-1.5 text-cream/60 hover:text-cream text-sm transition-colors"
            >
              <img
                src={champIconUrl(name)}
                alt={name}
                className="w-5 h-5 rounded object-cover"
                onError={e => { e.currentTarget.style.display = 'none' }}
              />
              {name}
            </button>
          ))}
        </div>
      )}

      {/* ── Empty state ── */}
      {!enemy && (
        <div className="text-center py-16 text-cream/20">
          <div className="text-5xl mb-3">⚔️</div>
          <div>Search an enemy to get started</div>
        </div>
      )}

      {/* ── Loading ── */}
      {loading && <div className="text-cream/40 text-sm">Searching…</div>}

      {/* ── Results ── */}
      {lookupData && !loading && (
        <>
          {lookupData.results.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {lookupData.results.map(r => (
                <LookupResultCard key={r.champion.id} {...r} />
              ))}
            </div>
          ) : (
            <div className="text-cream/30 text-sm">No matchup data for this enemy yet.</div>
          )}

          {lookupData.no_data.length > 0 && (
            <div className="bg-panel/40 border border-gold-dark/10 rounded-lg px-4 py-3">
              <div className="text-xs text-cream/30 uppercase tracking-wide mb-2">Pool champs without data</div>
              <div className="flex flex-wrap gap-2">
                {lookupData.no_data.map(c => (
                  <div key={c.id} className="flex items-center gap-1.5 text-cream/40 text-xs">
                    <img
                      src={champIconUrl(c.name)}
                      alt={c.name}
                      className="w-5 h-5 rounded opacity-40"
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
    </div>
  )
}
