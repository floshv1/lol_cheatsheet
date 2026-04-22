import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../lib/api.js'
import { champIconUrl } from '../lib/dataDragon.js'
import ChampionAutocomplete from '../components/ChampionAutocomplete.jsx'

const ROLES = ['Top', 'Jungle', 'Mid', 'Bot', 'Support']
const ROLE_ICONS = { Top: '🛡️', Jungle: '🌲', Mid: '⚡', Bot: '🏹', Support: '💚' }

function ComfortStars({ value, onChange }) {
  return (
    <span className="cursor-pointer select-none">
      {Array.from({ length: 5 }, (_, i) => (
        <span
          key={i}
          onClick={e => { e.stopPropagation(); onChange(i + 1) }}
          className={`text-base transition-colors ${i < value ? 'text-gold' : 'text-cream/20 hover:text-gold/50'}`}
        >★</span>
      ))}
    </span>
  )
}

function ChampCard({ champ, onNavigate, onComfortChange, onDelete }) {
  return (
    <div
      onClick={() => onNavigate(champ.id)}
      className="bg-panel border border-gold-dark/20 rounded-xl p-3 flex items-center gap-3 cursor-pointer hover:border-gold/40 hover:bg-panel-light transition-colors group"
    >
      <img
        src={champIconUrl(champ.name)}
        alt={champ.name}
        className="w-12 h-12 rounded-lg object-cover border border-gold-dark/30 shrink-0"
        onError={e => { e.currentTarget.style.display = 'none'; e.currentTarget.nextSibling.style.display = 'flex' }}
      />
      <div className="w-12 h-12 rounded-lg bg-navy border border-gold-dark/30 shrink-0 items-center justify-center text-gold font-bold" style={{ display: 'none' }}>
        {champ.name[0]}
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-semibold text-cream text-sm truncate">{champ.name}</div>
        <ComfortStars value={champ.comfort} onChange={v => onComfortChange(champ.id, v)} />
      </div>
      <button
        onClick={e => { e.stopPropagation(); onDelete(champ.id) }}
        className="text-cream/20 hover:text-danger opacity-0 group-hover:opacity-100 transition-all text-xl leading-none px-1 shrink-0"
      >×</button>
    </div>
  )
}

function RoleSection({ role, champs, open, onToggle, onNavigate, onComfortChange, onDelete }) {
  const icon = ROLE_ICONS[role]
  return (
    <div className="border border-gold-dark/20 rounded-xl overflow-hidden">
      {/* Header — clickable to toggle */}
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-3 px-4 py-3 bg-panel hover:bg-panel-light transition-colors text-left"
      >
        <span className="text-lg">{icon}</span>
        <span className="font-semibold text-cream flex-1">{role}</span>
        <span className="text-xs text-cream/40">{champs.length} champion{champs.length !== 1 ? 's' : ''}</span>
        <span className="text-cream/40 text-sm ml-2">{open ? '▲' : '▼'}</span>
      </button>

      {/* Champion grid — shown when open */}
      {open && (
        <div className="px-3 py-3 bg-navy/40 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
          {champs.length === 0 ? (
            <div className="col-span-full text-center py-4 text-cream/25 text-sm">
              No {role} champions in your pool yet.
            </div>
          ) : (
            champs.map(c => (
              <ChampCard
                key={c.id}
                champ={c}
                onNavigate={onNavigate}
                onComfortChange={onComfortChange}
                onDelete={onDelete}
              />
            ))
          )}
        </div>
      )}
    </div>
  )
}

export default function Pool() {
  const navigate = useNavigate()
  const [champs, setChamps]   = useState([])
  const [adding, setAdding]   = useState(false)
  const [form, setForm]       = useState({ name: '', role: 'Top', comfort: 3 })
  // All sections open by default
  const [openSections, setOpenSections] = useState(() => Object.fromEntries(ROLES.map(r => [r, true])))

  useEffect(() => { api.get('/api/champions').then(setChamps) }, [])

  function toggleSection(role) {
    setOpenSections(prev => ({ ...prev, [role]: !prev[role] }))
  }

  async function addChamp(e) {
    e.preventDefault()
    if (!form.name) return
    const newChamp = await api.post('/api/champions', form)
    setChamps(prev => [...prev, newChamp])
    setOpenSections(prev => ({ ...prev, [form.role]: true }))
    setAdding(false)
    setForm({ name: '', role: 'Top', comfort: 3 })
  }

  async function updateComfort(id, comfort) {
    await api.put(`/api/champions/${id}`, { comfort })
    setChamps(prev => prev.map(c => c.id === id ? { ...c, comfort } : c))
  }

  async function deleteChamp(id) {
    if (!confirm('Remove this champion from your pool?')) return
    await api.delete(`/api/champions/${id}`)
    setChamps(prev => prev.filter(c => c.id !== id))
  }

  const totalCount = champs.length

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-gold text-2xl font-bold">My Champion Pool</h1>
          {totalCount > 0 && <p className="text-cream/40 text-sm mt-0.5">{totalCount} champion{totalCount !== 1 ? 's' : ''}</p>}
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setOpenSections(Object.fromEntries(ROLES.map(r => [r, true])))}
            className="text-xs text-cream/40 hover:text-cream transition-colors px-2 py-1"
          >
            Expand all
          </button>
          <button
            onClick={() => setOpenSections(Object.fromEntries(ROLES.map(r => [r, false])))}
            className="text-xs text-cream/40 hover:text-cream transition-colors px-2 py-1"
          >
            Collapse all
          </button>
          <button
            onClick={() => { setAdding(true) }}
            className="bg-gold text-navy font-semibold px-4 py-2 rounded-lg text-sm hover:bg-gold/80 transition-colors"
          >
            + Add
          </button>
        </div>
      </div>

      {/* Add form */}
      {adding && (
        <form onSubmit={addChamp} className="bg-panel border border-gold-dark/40 rounded-xl p-4 mb-5 flex gap-3 flex-wrap items-end">
          <div className="flex flex-col gap-1">
            <label className="text-xs text-cream/50">Champion name</label>
            <ChampionAutocomplete
              key={adding ? 'open' : 'closed'}
              onSelect={c => setForm(p => ({ ...p, name: c.name }))}
              placeholder="Search champion…"
              className="w-48"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-cream/50">Role</label>
            <select
              className="bg-navy border border-gold-dark/30 rounded px-3 py-1.5 text-cream text-sm focus:outline-none focus:border-gold"
              value={form.role}
              onChange={e => setForm(p => ({ ...p, role: e.target.value }))}
            >
              {ROLES.map(r => <option key={r}>{r}</option>)}
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-cream/50">Comfort</label>
            <ComfortStars value={form.comfort} onChange={v => setForm(p => ({ ...p, comfort: v }))} />
          </div>
          <div className="flex gap-2">
            <button type="submit" className="bg-gold text-navy font-semibold px-3 py-1.5 rounded text-sm hover:bg-gold/80 transition-colors">Add</button>
            <button type="button" onClick={() => setAdding(false)} className="text-cream/40 hover:text-cream px-2 py-1.5 text-sm">Cancel</button>
          </div>
        </form>
      )}

      {/* Role sections */}
      {champs.length === 0 && !adding ? (
        <div className="text-center py-20 text-cream/20">
          <div className="text-5xl mb-4">🛡️</div>
          <div className="text-lg">Your pool is empty</div>
          <div className="text-sm mt-2">Click "+ Add" to get started</div>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {ROLES.map(role => {
            const roleChamps = champs
              .filter(c => c.role === role)
              .sort((a, b) => b.comfort - a.comfort || a.name.localeCompare(b.name))
            return (
              <RoleSection
                key={role}
                role={role}
                champs={roleChamps}
                open={openSections[role]}
                onToggle={() => toggleSection(role)}
                onNavigate={id => navigate(`/champions/${id}`)}
                onComfortChange={updateComfort}
                onDelete={deleteChamp}
              />
            )
          })}
        </div>
      )}
    </div>
  )
}
