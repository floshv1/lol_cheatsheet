import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import api from '../lib/api.js'
import { champIconUrl } from '../lib/dataDragon.js'
import RuneDisplay from '../components/RuneDisplay.jsx'
import RunePicker from '../components/RunePicker.jsx'
import BuildDisplay from '../components/BuildDisplay.jsx'
import { RuneDisplayCompact } from '../components/RuneDisplay.jsx'
import ChampionAutocomplete from '../components/ChampionAutocomplete.jsx'
import ItemIcon from '../components/ItemIcon.jsx'

const DIFF_COLOR = { easy: 'text-easy', even: 'text-blue-300', hard: 'text-danger' }

function inlineMd(text) {
  return text.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/).map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) return <strong key={i} className="text-cream font-semibold">{part.slice(2, -2)}</strong>
    if (part.startsWith('*') && part.endsWith('*')) return <em key={i} className="text-cream/80 italic">{part.slice(1, -1)}</em>
    return part
  })
}

function renderNotes(text) {
  return text.split(/\n\n+/).map((block, i) => {
    const lines = block.split('\n')
    if (lines.length > 0 && lines.every(l => l.trimStart().startsWith('- '))) {
      return (
        <ul key={i} className="list-disc pl-4 space-y-0.5">
          {lines.map((l, j) => <li key={j} className="text-sm text-cream/70">{inlineMd(l.replace(/^\s*-\s*/, ''))}</li>)}
        </ul>
      )
    }
    return <p key={i} className="text-sm text-cream/70 leading-relaxed">{inlineMd(block)}</p>
  })
}
const DIFF_BADGE = { easy: 'bg-easy/20 text-easy border-easy/40', even: 'bg-blue-500/20 text-blue-300 border-blue-500/40', hard: 'bg-danger/20 text-danger border-danger/40' }

function Stars({ value }) {
  return <span>{Array.from({ length: 5 }, (_, i) => (
    <span key={i} className={i < value ? 'text-gold' : 'text-cream/20'}>★</span>
  ))}</span>
}

// Inline matchup editor — assign rune page + build, edit fields
function MatchupEditor({ matchup, runePages, builds, onSave, onDelete, onClose }) {
  const [form, setForm] = useState({
    enemy_name:  matchup.enemy_name,
    difficulty:  matchup.difficulty,
    laning_tip:  matchup.laning_tip  || '',
    item_notes:  matchup.item_notes  || '',
    rune_page_id: matchup.rune_page_id || '',
    build_id:     matchup.build_id     || '',
  })
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }))

  async function save() {
    await onSave(matchup.id, {
      ...form,
      rune_page_id: form.rune_page_id ? Number(form.rune_page_id) : null,
      build_id:     form.build_id     ? Number(form.build_id)     : null,
    })
    onClose()
  }

  const assignedRune  = form.rune_page_id ? runePages.find(p => p.id === Number(form.rune_page_id)) : null
  const assignedBuild = form.build_id     ? builds.find(b => b.id === Number(form.build_id))         : null

  return (
    <div className="mt-2 mb-1 bg-navy border border-gold-dark/30 rounded-xl p-4 flex flex-col gap-3">
      {/* Enemy + difficulty */}
      <div className="flex gap-2 flex-wrap">
        <input
          className="flex-1 min-w-[120px] bg-panel border border-gold-dark/30 rounded px-3 py-1.5 text-cream text-sm focus:outline-none focus:border-gold"
          value={form.enemy_name}
          onChange={e => set('enemy_name', e.target.value)}
          placeholder="Enemy name"
        />
        <select
          className="bg-panel border border-gold-dark/30 rounded px-3 py-1.5 text-cream text-sm focus:outline-none"
          value={form.difficulty}
          onChange={e => set('difficulty', e.target.value)}
        >
          <option value="easy">Easy</option>
          <option value="even">Even</option>
          <option value="hard">Hard</option>
        </select>
      </div>

      {/* Assign rune page */}
      <div className="flex flex-col gap-1">
        <label className="text-xs text-cream/50 uppercase tracking-wide">Rune Page Override</label>
        <select
          className="bg-panel border border-gold-dark/30 rounded px-3 py-1.5 text-cream text-sm focus:outline-none focus:border-gold"
          value={form.rune_page_id}
          onChange={e => set('rune_page_id', e.target.value)}
        >
          <option value="">Default (champion's default page)</option>
          {runePages.map(p => (
            <option key={p.id} value={p.id}>{p.label}{p.is_default ? ' ★' : ''}</option>
          ))}
        </select>
        {assignedRune && (
          <div className="mt-1 pl-1">
            <RuneDisplayCompact page={assignedRune} />
          </div>
        )}
      </div>

      {/* Assign build */}
      <div className="flex flex-col gap-1">
        <label className="text-xs text-cream/50 uppercase tracking-wide">Build Override</label>
        <select
          className="bg-panel border border-gold-dark/30 rounded px-3 py-1.5 text-cream text-sm focus:outline-none focus:border-gold"
          value={form.build_id}
          onChange={e => set('build_id', e.target.value)}
        >
          <option value="">Default (champion's default build)</option>
          {builds.map(b => (
            <option key={b.id} value={b.id}>{b.label}{b.is_default ? ' ★' : ''}</option>
          ))}
        </select>
        {assignedBuild && assignedBuild.items?.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-1 pl-1">
            {assignedBuild.items.filter(i => i.slot === 'core').slice(0, 5).map((item, idx) => (
              <ItemIcon key={item.id} itemId={item.item_id} itemName={item.item_name} size={28} orderIndex={idx} />
            ))}
          </div>
        )}
      </div>

      {/* Laning tip */}
      <textarea
        className="bg-panel border border-gold-dark/30 rounded px-3 py-2 text-cream text-sm resize-none focus:outline-none"
        rows={2}
        placeholder="Laning tip…"
        value={form.laning_tip}
        onChange={e => set('laning_tip', e.target.value)}
      />

      {/* Item notes */}
      <input
        className="bg-panel border border-gold-dark/30 rounded px-3 py-1.5 text-cream text-sm focus:outline-none"
        placeholder="Item notes (e.g. Rush Bramble Vest)"
        value={form.item_notes}
        onChange={e => set('item_notes', e.target.value)}
      />

      <div className="flex gap-2 pt-1">
        <button onClick={save} className="bg-gold text-navy font-semibold px-4 py-1.5 rounded text-sm hover:bg-gold/80 transition-colors">Save</button>
        <button onClick={onClose} className="text-cream/40 hover:text-cream text-sm">Cancel</button>
        <button onClick={() => { onDelete(matchup.id); onClose() }} className="ml-auto text-cream/20 hover:text-danger text-sm transition-colors">Delete</button>
      </div>
    </div>
  )
}

export default function ChampionOverview() {
  const { championId } = useParams()
  const navigate = useNavigate()

  const [champion, setChampion]       = useState(null)
  const [runePages, setRunePages]     = useState([])
  const [builds, setBuilds]           = useState([])
  const [matchups, setMatchups]       = useState([])
  const [selectedMatchup, setSelectedMatchup] = useState(null)
  const [activeRunePage, setActiveRunePage]   = useState(null)
  const [activeBuild, setActiveBuild]         = useState(null)
  const [editRunes, setEditRunes]     = useState(false)
  const [editBuild, setEditBuild]     = useState(false)
  const [mobileTab, setMobileTab]     = useState('build')
  const [editNotes, setEditNotes]     = useState(false)
  const [notesVal, setNotesVal]       = useState('')
  const [addMatchup, setAddMatchup]   = useState(false)
  const [editingMatchupId, setEditingMatchupId] = useState(null)
  const [mForm, setMForm] = useState({ enemy_name: '', difficulty: 'even', laning_tip: '', item_notes: '', rune_page_id: '', build_id: '' })

  useEffect(() => {
    Promise.all([
      api.get('/api/champions'),
      api.get(`/api/champions/${championId}/runes`),
      api.get(`/api/champions/${championId}/builds`),
      api.get(`/api/champions/${championId}/matchups`),
    ]).then(([list, runes, bl, mu]) => {
      const c = list.find(x => String(x.id) === String(championId))
      if (!c) { navigate('/'); return }
      setChampion(c)
      setNotesVal(c.notes || '')
      setRunePages(runes)
      setBuilds(bl)
      setMatchups(mu)
      setActiveRunePage(runes.find(p => p.is_default) || runes[0] || null)
      setActiveBuild(bl.find(b => b.is_default) || bl[0] || null)
    })
  }, [championId])

  // Update view when matchup selection changes
  useEffect(() => {
    if (!selectedMatchup) {
      setActiveRunePage(runePages.find(p => p.is_default) || runePages[0] || null)
      setActiveBuild(builds.find(b => b.is_default) || builds[0] || null)
      return
    }
    if (selectedMatchup.rune_page_id) {
      const rpId = Number(selectedMatchup.rune_page_id)
      const override = runePages.find(p => p.id === rpId)
      setActiveRunePage(override || runePages.find(p => p.is_default) || runePages[0] || null)
    } else {
      setActiveRunePage(runePages.find(p => p.is_default) || runePages[0] || null)
    }
    if (selectedMatchup.build_id) {
      const bId = Number(selectedMatchup.build_id)
      const override = builds.find(b => b.id === bId)
      setActiveBuild(override || builds.find(b => b.is_default) || builds[0] || null)
    } else {
      setActiveBuild(builds.find(b => b.is_default) || builds[0] || null)
    }
  }, [selectedMatchup, runePages, builds])

  async function saveRunePage(page) {
    const updated = await api.put(`/api/champions/${championId}/runes/${page.id}`, page)
    setRunePages(prev => prev.map(p => p.id === updated.id ? updated : p))
    setActiveRunePage(updated)
  }

  async function addRunePage() {
    const newPage = await api.post(`/api/champions/${championId}/runes`, {
      label: 'New Page', primary_path: 'Precision', keystone: '', slot1: '', slot2: '', slot3: '',
      secondary_path: 'Domination', sec1: '', sec2: '',
      shard_offense: 'Adaptive Force', shard_flex: 'Adaptive Force', shard_defense: 'Health Scaling',
    })
    setRunePages(prev => [...prev, newPage])
    setActiveRunePage(newPage)
    setEditRunes(true)
  }

  async function addBuild() {
    const newBuild = await api.post(`/api/champions/${championId}/builds`, { label: 'New Build' })
    setBuilds(prev => [...prev, newBuild])
    setActiveBuild(newBuild)
    setEditBuild(true)
  }

  async function addItem(item) {
    let build = activeBuild
    if (!build) {
      build = await api.post(`/api/champions/${championId}/builds`, { label: 'Standard', is_default: 1 })
      setBuilds([build])
    }
    const added = await api.post(`/api/champions/${championId}/builds/${build.id}/items`, item)
    const updated = { ...build, items: [...(build.items || []), added] }
    setBuilds(prev => prev.map(b => b.id === build.id ? updated : b))
    setActiveBuild(updated)
  }

  async function deleteItem(itemId) {
    await api.delete(`/api/champions/${championId}/builds/${activeBuild.id}/items/${itemId}`)
    const updated = { ...activeBuild, items: activeBuild.items.filter(i => i.id !== itemId) }
    setBuilds(prev => prev.map(b => b.id === activeBuild.id ? updated : b))
    setActiveBuild(updated)
  }

  async function reorderItems(order) {
    const updated = await api.put(`/api/champions/${championId}/builds/${activeBuild.id}/items/reorder`, { order })
    setBuilds(prev => prev.map(b => b.id === activeBuild.id ? updated : b))
    setActiveBuild(updated)
  }

  async function saveNotes() {
    const updated = await api.put(`/api/champions/${championId}`, { notes: notesVal })
    setChampion(prev => ({ ...prev, notes: updated.notes }))
    setEditNotes(false)
  }

  async function submitMatchup(e) {
    e.preventDefault()
    const payload = {
      ...mForm,
      rune_page_id: mForm.rune_page_id ? Number(mForm.rune_page_id) : null,
      build_id:     mForm.build_id     ? Number(mForm.build_id)     : null,
    }
    const created = await api.post(`/api/champions/${championId}/matchups`, payload)
    setMatchups(prev => [...prev, created])
    setSelectedMatchup(created)
    setAddMatchup(false)
    setMForm({ enemy_name: '', difficulty: 'even', laning_tip: '', item_notes: '', rune_page_id: '', build_id: '' })
  }

  async function updateMatchup(id, data) {
    const updated = await api.put(`/api/champions/${championId}/matchups/${id}`, data)
    setMatchups(prev => prev.map(m => m.id === id ? updated : m))
    if (selectedMatchup?.id === id) setSelectedMatchup(updated)
  }

  async function deleteMatchup(id) {
    await api.delete(`/api/champions/${championId}/matchups/${id}`)
    if (selectedMatchup?.id === id) setSelectedMatchup(null)
    setMatchups(prev => prev.filter(m => m.id !== id))
  }

  if (!champion) return <div className="p-8 text-cream/40">Loading…</div>

  const sortedMatchups = [...matchups].sort((a, b) => {
    const o = { easy: 0, even: 1, hard: 2 }
    return (o[a.difficulty] ?? 1) - (o[b.difficulty] ?? 1)
  })

  const hasMatchupOverride = selectedMatchup && (selectedMatchup.rune_page_id || selectedMatchup.build_id)

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-gold-dark/20 bg-navy-light flex-wrap">
        <button onClick={() => navigate('/')} className="text-cream/40 hover:text-cream text-sm shrink-0">←</button>
        <img src={champIconUrl(champion.name)} alt={champion.name}
          className="w-11 h-11 rounded-xl border border-gold-dark/40 object-cover shrink-0"
          onError={e => { e.currentTarget.style.display = 'none' }} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-gold text-lg font-bold">{champion.name}</span>
            <span className="text-xs text-cream/40 bg-panel rounded px-1.5 py-0.5">{champion.role}</span>
            <Stars value={champion.comfort} />
          </div>
        </div>
        {/* vs filter */}
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-cream/40 text-sm">vs</span>
          <select
            className="bg-panel border border-gold-dark/40 rounded-lg px-3 py-1.5 text-cream text-sm focus:outline-none focus:border-gold max-w-[160px]"
            value={selectedMatchup?.id || ''}
            onChange={e => {
              const id = e.target.value ? Number(e.target.value) : null
              setSelectedMatchup(id ? matchups.find(m => m.id === id) || null : null)
            }}
          >
            <option value="">General</option>
            {sortedMatchups.map(m => (
              <option key={m.id} value={m.id}>{m.enemy_name} ({m.difficulty})</option>
            ))}
          </select>
        </div>
      </div>

      {/* Matchup banner */}
      {selectedMatchup && (
        <div className={`px-4 py-2 text-sm border-b border-current/20 flex items-start gap-3 flex-wrap ${DIFF_BADGE[selectedMatchup.difficulty]}`}>
          <span className="font-semibold shrink-0">vs {selectedMatchup.enemy_name}</span>
          {selectedMatchup.laning_tip && <span className="text-cream/80 flex-1">{selectedMatchup.laning_tip}</span>}
          {selectedMatchup.item_notes && <span className="italic text-cream/60 shrink-0">{selectedMatchup.item_notes}</span>}
          {hasMatchupOverride && (
            <span className="text-xs bg-black/20 rounded px-1.5 py-0.5 shrink-0">
              {selectedMatchup.rune_page_id ? '🔮 rune override ' : ''}
              {selectedMatchup.build_id ? '🛠 build override' : ''}
            </span>
          )}
        </div>
      )}

      {/* Mobile tab switcher */}
      <div className="flex md:hidden border-b border-gold-dark/20">
        {[['build', 'Build'], ['runes', 'Runes & Matchups']].map(([tab, label]) => (
          <button
            key={tab}
            onClick={() => setMobileTab(tab)}
            className={`flex-1 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors
              ${mobileTab === tab ? 'border-gold text-gold' : 'border-transparent text-cream/50 hover:text-cream'}`}
          >{label}</button>
        ))}
      </div>

      {/* Two-column body */}
      <div className="flex flex-col md:flex-row flex-1 overflow-hidden">

        {/* Left: Build */}
        <div className={`w-full md:w-72 lg:w-80 shrink-0 md:border-r border-gold-dark/20 px-4 py-5 overflow-y-auto ${mobileTab !== 'build' ? 'hidden md:block' : ''}`}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="text-cream/60 text-xs uppercase tracking-wide font-semibold">Build</span>
              {selectedMatchup?.build_id && activeBuild?.id === selectedMatchup.build_id && (
                <span className="text-[10px] bg-gold/20 text-gold rounded px-1 py-0.5">override</span>
              )}
            </div>
            <div className="flex gap-2">
              <button onClick={() => setEditBuild(e => !e)}
                className={`text-xs px-2 py-1 rounded transition-colors ${editBuild ? 'bg-gold/20 text-gold' : 'text-cream/40 hover:text-cream'}`}>
                {editBuild ? 'Done' : 'Edit'}
              </button>
              <button onClick={addBuild} className="text-xs text-cream/40 hover:text-gold transition-colors">+ New</button>
            </div>
          </div>

          {builds.length > 1 && (
            <div className="flex gap-1 flex-wrap mb-3">
              {builds.map(b => (
                <button key={b.id} onClick={() => { setActiveBuild(b); setSelectedMatchup(null) }}
                  className={`text-xs px-2 py-1 rounded-md border transition-colors
                    ${activeBuild?.id === b.id ? 'bg-gold/20 border-gold text-gold' : 'border-gold-dark/30 text-cream/50 hover:border-gold/40'}`}>
                  {b.label}{b.is_default ? ' ★' : ''}
                </button>
              ))}
            </div>
          )}

          {editBuild && activeBuild && (
            <input
              key={activeBuild.id}
              className="w-full mb-3 bg-navy border border-gold-dark/40 rounded px-3 py-1.5 text-cream text-sm focus:outline-none focus:border-gold"
              defaultValue={activeBuild.label}
              placeholder="Build name"
              onBlur={async e => {
                const label = e.target.value.trim() || 'Build'
                if (label === activeBuild.label) return
                const updated = await api.put(`/api/champions/${championId}/builds/${activeBuild.id}`, { label })
                setBuilds(prev => prev.map(b => b.id === updated.id ? updated : b))
                setActiveBuild(updated)
              }}
              onKeyDown={e => e.key === 'Enter' && e.currentTarget.blur()}
            />
          )}

          {activeBuild ? (
            <BuildDisplay items={activeBuild.items || []} buildId={activeBuild.id}
              onAdd={addItem} onDelete={deleteItem} onReorder={reorderItems} editable={editBuild} />
          ) : (
            <div className="text-cream/30 text-sm text-center py-6">
              No build yet.{' '}
              <button onClick={addBuild} className="text-gold underline">Create one</button>
            </div>
          )}
        </div>

        {/* Right: Rune page + matchups */}
        <div className={`flex-1 px-4 py-5 overflow-y-auto ${mobileTab !== 'runes' ? 'hidden md:block' : ''}`}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="text-cream/60 text-xs uppercase tracking-wide font-semibold">Rune Page</span>
              {selectedMatchup?.rune_page_id && activeRunePage?.id === selectedMatchup.rune_page_id && (
                <span className="text-[10px] bg-gold/20 text-gold rounded px-1 py-0.5">override</span>
              )}
            </div>
            <div className="flex gap-2">
              <button onClick={() => setEditRunes(e => !e)}
                className={`text-xs px-2 py-1 rounded transition-colors ${editRunes ? 'bg-gold/20 text-gold' : 'text-cream/40 hover:text-cream'}`}>
                {editRunes ? 'Done' : 'Edit'}
              </button>
              <button onClick={addRunePage} className="text-xs text-cream/40 hover:text-gold transition-colors">+ New</button>
            </div>
          </div>

          {runePages.length > 1 && (
            <div className="flex gap-1 flex-wrap mb-4">
              {runePages.map(p => (
                <button key={p.id} onClick={() => { setActiveRunePage(p); setSelectedMatchup(null) }}
                  className={`text-xs px-2 py-1 rounded-md border transition-colors
                    ${activeRunePage?.id === p.id ? 'bg-gold/20 border-gold text-gold' : 'border-gold-dark/30 text-cream/50 hover:border-gold/40'}`}>
                  {p.label}{p.is_default ? ' ★' : ''}
                </button>
              ))}
            </div>
          )}

          {activeRunePage && (
            <div className="bg-panel/40 rounded-xl p-5">
              {editRunes ? (
                <>
                  <RunePicker page={activeRunePage} onChange={saveRunePage} />
                  <div className="mt-4 pt-4 border-t border-gold-dark/20 flex gap-3">
                    <button onClick={async () => {
                      await api.put(`/api/champions/${championId}/runes/${activeRunePage.id}/default`)
                      const pages = await api.get(`/api/champions/${championId}/runes`)
                      setRunePages(pages)
                      setActiveRunePage(pages.find(p => p.id === activeRunePage.id) || pages[0])
                    }} className="text-xs text-cream/50 hover:text-gold transition-colors">
                      Set as default
                    </button>
                    <button onClick={async () => {
                      await api.delete(`/api/champions/${championId}/runes/${activeRunePage.id}`)
                      const remaining = runePages.filter(p => p.id !== activeRunePage.id)
                      setRunePages(remaining)
                      setActiveRunePage(remaining[0] || null)
                    }} className="text-xs text-cream/30 hover:text-danger transition-colors ml-auto">
                      Delete page
                    </button>
                  </div>
                </>
              ) : (
                <RuneDisplay page={activeRunePage} />
              )}
            </div>
          )}

          {/* ── Matchups ─────────────────────────────────────────── */}
          <div className="mt-7">
            <div className="flex items-center justify-between mb-3">
              <span className="text-cream/60 text-xs uppercase tracking-wide font-semibold">
                Matchups ({matchups.length})
              </span>
              <button onClick={() => { setAddMatchup(a => !a); setEditingMatchupId(null) }}
                className="text-xs text-cream/40 hover:text-gold transition-colors">
                + Add
              </button>
            </div>

            {/* Add matchup form */}
            {addMatchup && (
              <form onSubmit={submitMatchup} className="bg-panel border border-gold-dark/30 rounded-xl p-4 mb-3 flex flex-col gap-3">
                <div className="flex gap-2 flex-wrap">
                  <ChampionAutocomplete onSelect={c => setMForm(p => ({ ...p, enemy_name: c.name }))}
                    placeholder="Enemy name…" className="flex-1 min-w-[130px]" />
                  <select className="bg-navy border border-gold-dark/30 rounded px-3 py-2 text-cream text-sm focus:outline-none"
                    value={mForm.difficulty} onChange={e => setMForm(p => ({ ...p, difficulty: e.target.value }))}>
                    <option value="easy">Easy</option>
                    <option value="even">Even</option>
                    <option value="hard">Hard</option>
                  </select>
                </div>

                {/* Assign rune + build right from the add form */}
                <div className="flex gap-2 flex-wrap">
                  <div className="flex-1 min-w-[140px] flex flex-col gap-1">
                    <label className="text-[11px] text-cream/40 uppercase">Rune page</label>
                    <select className="bg-navy border border-gold-dark/30 rounded px-2 py-1.5 text-cream text-xs focus:outline-none"
                      value={mForm.rune_page_id} onChange={e => setMForm(p => ({ ...p, rune_page_id: e.target.value }))}>
                      <option value="">Default</option>
                      {runePages.map(p => <option key={p.id} value={p.id}>{p.label}{p.is_default ? ' ★' : ''}</option>)}
                    </select>
                  </div>
                  <div className="flex-1 min-w-[140px] flex flex-col gap-1">
                    <label className="text-[11px] text-cream/40 uppercase">Build</label>
                    <select className="bg-navy border border-gold-dark/30 rounded px-2 py-1.5 text-cream text-xs focus:outline-none"
                      value={mForm.build_id} onChange={e => setMForm(p => ({ ...p, build_id: e.target.value }))}>
                      <option value="">Default</option>
                      {builds.map(b => <option key={b.id} value={b.id}>{b.label}{b.is_default ? ' ★' : ''}</option>)}
                    </select>
                  </div>
                </div>

                <textarea className="bg-navy border border-gold-dark/30 rounded px-3 py-2 text-cream text-sm resize-none focus:outline-none"
                  rows={2} placeholder="Laning tip…"
                  value={mForm.laning_tip} onChange={e => setMForm(p => ({ ...p, laning_tip: e.target.value }))} />

                <div className="flex gap-2">
                  <button type="submit" className="bg-gold text-navy font-semibold px-4 py-1.5 rounded text-sm hover:bg-gold/80 transition-colors">Save</button>
                  <button type="button" onClick={() => setAddMatchup(false)} className="text-cream/40 hover:text-cream text-sm">Cancel</button>
                </div>
              </form>
            )}

            {/* Matchup list */}
            {matchups.length === 0 && !addMatchup && (
              <div className="text-cream/30 text-sm text-center py-4">No matchups yet. Click + Add.</div>
            )}
            <div className="flex flex-col gap-1">
              {sortedMatchups.map(m => (
                <div key={m.id}>
                  <div
                    onClick={() => {
                      setSelectedMatchup(prev => prev?.id === m.id ? null : m)
                      setEditingMatchupId(null)
                    }}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-colors group
                      ${selectedMatchup?.id === m.id ? 'bg-panel border border-gold/30' : 'hover:bg-panel/50 border border-transparent'}`}
                  >
                    <span className={`text-xs font-bold w-10 shrink-0 ${DIFF_COLOR[m.difficulty] || ''}`}>{m.difficulty}</span>
                    <span className="text-cream text-sm flex-1 font-medium">{m.enemy_name}</span>
                    {/* Override indicators */}
                    <div className="flex gap-1 items-center">
                      {m.rune_page_id && <span className="text-[11px] text-gold/60" title="Rune override">🔮</span>}
                      {m.build_id     && <span className="text-[11px] text-gold/60" title="Build override">🛠</span>}
                    </div>
                    <button
                      onClick={e => { e.stopPropagation(); setEditingMatchupId(id => id === m.id ? null : m.id); setAddMatchup(false) }}
                      className="text-cream/30 hover:text-gold opacity-0 group-hover:opacity-100 transition-all text-xs px-1"
                      title="Edit matchup"
                    >Edit</button>
                    <button
                      onClick={e => { e.stopPropagation(); deleteMatchup(m.id) }}
                      className="text-cream/20 hover:text-danger opacity-0 group-hover:opacity-100 transition-all text-base leading-none"
                    >×</button>
                  </div>

                  {/* Inline editor */}
                  {editingMatchupId === m.id && (
                    <MatchupEditor
                      matchup={m}
                      runePages={runePages}
                      builds={builds}
                      onSave={updateMatchup}
                      onDelete={deleteMatchup}
                      onClose={() => setEditingMatchupId(null)}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* ── Notes ──────────────────────────────────────────────── */}
          <div className="mt-7">
            <div className="flex items-center justify-between mb-3">
              <span className="text-cream/60 text-xs uppercase tracking-wide font-semibold">Notes</span>
              {!editNotes && (
                <button onClick={() => setEditNotes(true)} className="text-xs text-cream/40 hover:text-gold transition-colors">Edit</button>
              )}
            </div>

            {editNotes ? (
              <div className="flex flex-col gap-2">
                <textarea
                  autoFocus
                  rows={6}
                  className="w-full bg-panel border border-gold-dark/40 rounded-lg px-3 py-2.5 text-cream text-sm resize-y focus:outline-none focus:border-gold leading-relaxed"
                  placeholder={"Write notes in markdown:\n**bold**, *italic*\n- bullet list\n\nDouble newline = paragraph"}
                  value={notesVal}
                  onChange={e => setNotesVal(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && e.ctrlKey) saveNotes() }}
                />
                <div className="flex gap-2">
                  <button onClick={saveNotes} className="bg-gold text-navy font-semibold px-3 py-1.5 rounded text-sm hover:bg-gold/80 transition-colors">Save</button>
                  <button onClick={() => { setEditNotes(false); setNotesVal(champion.notes || '') }} className="text-cream/40 hover:text-cream text-sm">Cancel</button>
                </div>
              </div>
            ) : notesVal ? (
              <div className="bg-panel/40 rounded-xl px-4 py-3 flex flex-col gap-2 cursor-pointer hover:bg-panel/60 transition-colors" onClick={() => setEditNotes(true)}>
                {renderNotes(notesVal)}
              </div>
            ) : (
              <div className="text-cream/25 text-sm text-center py-4 cursor-pointer hover:text-cream/40 transition-colors" onClick={() => setEditNotes(true)}>
                Click to add notes…
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
