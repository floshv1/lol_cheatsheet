import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import api from '../lib/api.js'
import { champIconUrl } from '../lib/dataDragon.js'
import RuneDisplay from '../components/RuneDisplay.jsx'
import RunePicker from '../components/RunePicker.jsx'
import BuildDisplay from '../components/BuildDisplay.jsx'
import ChampionAutocomplete from '../components/ChampionAutocomplete.jsx'

const TABS = ['Runes', 'Builds', 'Matchups']

const DIFF_STYLE = {
  easy: 'text-easy',
  even: 'text-blue-300',
  hard: 'text-danger',
}

function MatchupRow({ matchup, onDelete, runePages }) {
  const override = runePages.find(r => r.id === matchup.rune_page_id)
  return (
    <div className="flex items-start gap-4 p-3 bg-panel/50 rounded-lg">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-semibold text-cream">{matchup.enemy_name}</span>
          <span className={`text-xs font-semibold ${DIFF_STYLE[matchup.difficulty] || ''}`}>{matchup.difficulty}</span>
          {override && <span className="text-xs bg-gold/20 text-gold rounded px-1.5 py-0.5">rune override</span>}
        </div>
        {matchup.laning_tip && <p className="text-sm text-cream/60 mt-1">{matchup.laning_tip}</p>}
        {matchup.item_notes && <p className="text-xs text-cream/40 mt-1 italic">{matchup.item_notes}</p>}
      </div>
      <button onClick={() => onDelete(matchup.id)} className="text-cream/20 hover:text-danger transition-colors text-lg shrink-0">×</button>
    </div>
  )
}

export default function ChampionDetail() {
  const { championId } = useParams()
  const navigate = useNavigate()
  const [champion, setChampion] = useState(null)
  const [tab, setTab] = useState('Runes')
  const [runePages, setRunePages] = useState([])
  const [activeRunePage, setActiveRunePage] = useState(null)
  const [builds, setBuilds] = useState([])
  const [activeBuild, setActiveBuild] = useState(null)
  const [matchups, setMatchups] = useState([])
  const [addMatchup, setAddMatchup] = useState(false)
  const [mForm, setMForm] = useState({ enemy_name: '', difficulty: 'even', laning_tip: '', item_notes: '' })

  useEffect(() => {
    api.get(`/api/champions`).then(list => {
      const c = list.find(x => String(x.id) === String(championId))
      if (!c) { navigate('/pool'); return }
      setChampion(c)
    })
    api.get(`/api/champions/${championId}/runes`).then(pages => {
      setRunePages(pages)
      setActiveRunePage(pages.find(p => p.is_default) || pages[0] || null)
    })
    api.get(`/api/champions/${championId}/builds`).then(bl => {
      setBuilds(bl)
      setActiveBuild(bl.find(b => b.is_default) || bl[0] || null)
    })
    api.get(`/api/champions/${championId}/matchups`).then(setMatchups)
  }, [championId])

  async function saveRunePage(page) {
    const updated = await api.put(`/api/champions/${championId}/runes/${page.id}`, page)
    setRunePages(prev => prev.map(p => p.id === updated.id ? updated : p))
    setActiveRunePage(updated)
  }

  async function addRunePage() {
    const newPage = await api.post(`/api/champions/${championId}/runes`, { label: 'New Page' })
    setRunePages(prev => [...prev, newPage])
    setActiveRunePage(newPage)
  }

  async function deleteRunePage(id) {
    await api.delete(`/api/champions/${championId}/runes/${id}`)
    const remaining = runePages.filter(p => p.id !== id)
    setRunePages(remaining)
    setActiveRunePage(remaining[0] || null)
  }

  async function addItem(item) {
    if (!activeBuild) {
      const newBuild = await api.post(`/api/champions/${championId}/builds`, { label: 'Default Build', is_default: 1 })
      setBuilds([newBuild])
      setActiveBuild(newBuild)
      const addedItem = await api.post(`/api/champions/${championId}/builds/${newBuild.id}/items`, item)
      setActiveBuild(prev => ({ ...prev, items: [...(prev?.items || []), addedItem] }))
    } else {
      const addedItem = await api.post(`/api/champions/${championId}/builds/${activeBuild.id}/items`, item)
      setActiveBuild(prev => ({ ...prev, items: [...(prev?.items || []), addedItem] }))
    }
  }

  async function deleteItem(itemId) {
    await api.delete(`/api/champions/${championId}/builds/${activeBuild.id}/items/${itemId}`)
    setActiveBuild(prev => ({ ...prev, items: prev.items.filter(i => i.id !== itemId) }))
  }

  async function submitMatchup(e) {
    e.preventDefault()
    const created = await api.post(`/api/champions/${championId}/matchups`, mForm)
    setMatchups(prev => [...prev, created])
    setAddMatchup(false)
    setMForm({ enemy_name: '', difficulty: 'even', laning_tip: '', item_notes: '' })
  }

  async function deleteMatchup(id) {
    await api.delete(`/api/champions/${championId}/matchups/${id}`)
    setMatchups(prev => prev.filter(m => m.id !== id))
  }

  if (!champion) return <div className="p-8 text-cream/40">Loading…</div>

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <button onClick={() => navigate('/pool')} className="text-cream/40 hover:text-cream text-sm">← Pool</button>
        <img
          src={champIconUrl(champion.name)}
          alt={champion.name}
          className="w-16 h-16 rounded-xl border border-gold-dark/40 object-cover"
          onError={e => { e.currentTarget.style.display = 'none' }}
        />
        <div>
          <h1 className="text-gold text-2xl font-bold">{champion.name}</h1>
          <div className="text-cream/40 text-sm">{champion.role}</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gold-dark/30 mb-6">
        {TABS.map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-5 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px
              ${tab === t ? 'border-gold text-gold' : 'border-transparent text-cream/50 hover:text-cream'}`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Runes Tab */}
      {tab === 'Runes' && (
        <div>
          <div className="flex gap-2 flex-wrap mb-4">
            {runePages.map(p => (
              <button
                key={p.id}
                onClick={() => setActiveRunePage(p)}
                className={`px-3 py-1.5 text-sm rounded-lg border transition-colors
                  ${activeRunePage?.id === p.id
                    ? 'bg-gold/20 border-gold text-gold'
                    : 'border-gold-dark/30 text-cream/60 hover:border-gold/40'}`}
              >
                {p.label}
                {p.is_default ? ' ★' : ''}
              </button>
            ))}
            <button
              onClick={addRunePage}
              className="px-3 py-1.5 text-sm rounded-lg border border-dashed border-gold-dark/30 text-cream/30 hover:text-gold hover:border-gold transition-colors"
            >
              + New Page
            </button>
          </div>

          {activeRunePage && (
            <div className="bg-panel rounded-xl p-5">
              <RunePicker page={activeRunePage} onChange={saveRunePage} />
              <div className="mt-4 pt-4 border-t border-gold-dark/20 flex gap-2">
                <button
                  onClick={async () => {
                    await api.put(`/api/champions/${championId}/runes/${activeRunePage.id}/default`)
                    const pages = await api.get(`/api/champions/${championId}/runes`)
                    setRunePages(pages)
                    setActiveRunePage(pages.find(p => p.id === activeRunePage.id) || pages[0])
                  }}
                  className="text-xs text-cream/50 hover:text-gold transition-colors"
                >
                  Set as default
                </button>
                <button
                  onClick={() => deleteRunePage(activeRunePage.id)}
                  className="text-xs text-cream/30 hover:text-danger transition-colors ml-auto"
                >
                  Delete page
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Builds Tab */}
      {tab === 'Builds' && (
        <div>
          <div className="flex gap-2 flex-wrap mb-4">
            {builds.map(b => (
              <button
                key={b.id}
                onClick={() => setActiveBuild(b)}
                className={`px-3 py-1.5 text-sm rounded-lg border transition-colors
                  ${activeBuild?.id === b.id
                    ? 'bg-gold/20 border-gold text-gold'
                    : 'border-gold-dark/30 text-cream/60 hover:border-gold/40'}`}
              >
                {b.label}{b.is_default ? ' ★' : ''}
              </button>
            ))}
            <button
              onClick={async () => {
                const newBuild = await api.post(`/api/champions/${championId}/builds`, { label: 'New Build' })
                setBuilds(prev => [...prev, newBuild])
                setActiveBuild(newBuild)
              }}
              className="px-3 py-1.5 text-sm rounded-lg border border-dashed border-gold-dark/30 text-cream/30 hover:text-gold hover:border-gold transition-colors"
            >
              + New Build
            </button>
          </div>

          {activeBuild && (
            <div className="bg-panel rounded-xl p-5">
              <BuildDisplay
                items={activeBuild.items || []}
                buildId={activeBuild.id}
                onAdd={addItem}
                onDelete={deleteItem}
                editable
              />
            </div>
          )}
          {!activeBuild && builds.length === 0 && (
            <div className="text-cream/30 text-sm">No builds yet. Click "+ New Build" to start.</div>
          )}
        </div>
      )}

      {/* Matchups Tab */}
      {tab === 'Matchups' && (
        <div className="flex flex-col gap-3">
          {matchups.sort((a, b) => {
            const o = { easy: 0, even: 1, hard: 2 }
            return (o[a.difficulty] ?? 1) - (o[b.difficulty] ?? 1)
          }).map(m => (
            <MatchupRow key={m.id} matchup={m} onDelete={deleteMatchup} runePages={runePages} />
          ))}

          {addMatchup ? (
            <form onSubmit={submitMatchup} className="bg-panel border border-gold-dark/30 rounded-xl p-4 flex flex-col gap-3 mt-2">
              <div className="flex gap-3 flex-wrap">
                <ChampionAutocomplete
                  onSelect={c => setMForm(p => ({ ...p, enemy_name: c.name }))}
                  placeholder="Enemy name…"
                  className="flex-1 min-w-[160px]"
                />
                <select
                  className="bg-navy border border-gold-dark/30 rounded px-3 py-2 text-cream text-sm focus:outline-none focus:border-gold"
                  value={mForm.difficulty}
                  onChange={e => setMForm(p => ({ ...p, difficulty: e.target.value }))}
                >
                  <option value="easy">Easy</option>
                  <option value="even">Even</option>
                  <option value="hard">Hard</option>
                </select>
              </div>
              <textarea
                className="bg-navy border border-gold-dark/30 rounded px-3 py-2 text-cream text-sm resize-none focus:outline-none focus:border-gold"
                rows={2}
                placeholder="Laning tip…"
                value={mForm.laning_tip}
                onChange={e => setMForm(p => ({ ...p, laning_tip: e.target.value }))}
              />
              <input
                className="bg-navy border border-gold-dark/30 rounded px-3 py-2 text-cream text-sm focus:outline-none focus:border-gold"
                placeholder="Item notes (optional)"
                value={mForm.item_notes}
                onChange={e => setMForm(p => ({ ...p, item_notes: e.target.value }))}
              />
              <div className="flex gap-2">
                <button type="submit" className="bg-gold text-navy font-semibold px-4 py-1.5 rounded text-sm hover:bg-gold/80 transition-colors">Save</button>
                <button type="button" onClick={() => setAddMatchup(false)} className="text-cream/40 hover:text-cream text-sm">Cancel</button>
              </div>
            </form>
          ) : (
            <button
              onClick={() => setAddMatchup(true)}
              className="mt-2 border border-dashed border-gold-dark/30 rounded-xl px-4 py-3 text-cream/30 hover:text-gold hover:border-gold transition-colors text-sm"
            >
              + Add Matchup
            </button>
          )}
        </div>
      )}
    </div>
  )
}
