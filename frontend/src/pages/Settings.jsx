import { useState, useEffect } from 'react'
import api from '../lib/api.js'
import { resync, getPatch, getItemData, getChampData } from '../lib/dataDragon.js'

export default function Settings() {
  const [settings, setSettings] = useState({})
  const [patchInput, setPatchInput] = useState('')
  const [syncing, setSyncing] = useState(false)
  const [saved, setSaved] = useState(false)
  const [diff, setDiff] = useState(null)

  useEffect(() => {
    api.get('/api/settings').then(s => {
      setSettings(s)
      setPatchInput(s.patch || getPatch())
    })
  }, [])

  async function savePatch() {
    const newPatch = patchInput.trim()
    if (!newPatch) return
    if (!/^\d+\.\d+\.\d+$/.test(newPatch)) {
      alert('Patch must be in format X.Y.Z (e.g. 16.8.1)')
      return
    }
    setSyncing(true)
    setDiff(null)
    try {
      const oldItems  = getItemData()  || {}
      const oldChamps = getChampData() || {}
      await api.put('/api/settings/patch', { value: newPatch })
      await resync(newPatch)
      const newItems  = getItemData()  || {}
      const newChamps = getChampData() || {}

      const oldItemIds  = new Set(Object.keys(oldItems))
      const newItemIds  = new Set(Object.keys(newItems))
      const addedItems   = [...newItemIds].filter(id => !oldItemIds.has(id)).map(id => newItems[id].name)
      const removedItems = [...oldItemIds].filter(id => !newItemIds.has(id)).map(id => oldItems[id].name)
      const addedChamps  = Object.keys(newChamps).filter(k => !oldChamps[k]).map(k => newChamps[k].name)

      setDiff({ addedItems, removedItems, addedChamps })
      setSettings(s => ({ ...s, patch: newPatch }))
      setSaved(true)
    } finally {
      setSyncing(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-gold text-2xl font-bold mb-6">Settings</h1>

      <div className="bg-panel border border-gold-dark/30 rounded-xl p-5">
        <h2 className="text-cream font-semibold mb-1">Game Patch Version</h2>
        <p className="text-cream/50 text-sm mb-4">
          Controls which Data Dragon version is used for champion, item and rune icons.
          Current: <span className="text-gold font-semibold">{settings.patch || '—'}</span>
        </p>
        <div className="flex gap-3 items-center flex-wrap">
          <input
            className="bg-navy border border-gold-dark/40 rounded-lg px-3 py-2 text-cream text-sm focus:outline-none focus:border-gold w-36"
            value={patchInput}
            onChange={e => setPatchInput(e.target.value)}
            placeholder="16.8.1"
          />
          <button
            onClick={savePatch}
            disabled={syncing}
            className="bg-gold text-navy font-semibold px-4 py-2 rounded-lg text-sm hover:bg-gold/80 transition-colors disabled:opacity-50"
          >
            {syncing ? 'Syncing…' : 'Save & Resync'}
          </button>
          {saved && !diff && <span className="text-easy text-sm">✓ Synced</span>}
          {saved && diff && (
            <button
              onClick={() => window.location.reload()}
              className="bg-easy/20 text-easy border border-easy/40 px-3 py-1.5 rounded-lg text-sm hover:bg-easy/30 transition-colors"
            >
              ↺ Reload to apply icons
            </button>
          )}
        </div>
        {diff && (
          <div className="mt-5 border-t border-gold-dark/20 pt-4 flex flex-col gap-3">
            <div className="text-cream/50 text-xs uppercase tracking-wide font-semibold">Patch diff</div>
            {diff.addedChamps.length > 0 && (
              <div>
                <div className="text-[11px] text-easy/70 mb-1">New champions ({diff.addedChamps.length})</div>
                <div className="flex flex-wrap gap-1">{diff.addedChamps.map(n => <span key={n} className="text-xs bg-easy/10 text-easy rounded px-1.5 py-0.5">{n}</span>)}</div>
              </div>
            )}
            {diff.addedItems.length > 0 && (
              <div>
                <div className="text-[11px] text-easy/70 mb-1">New items ({diff.addedItems.length})</div>
                <div className="flex flex-wrap gap-1">{diff.addedItems.slice(0, 20).map(n => <span key={n} className="text-xs bg-easy/10 text-easy rounded px-1.5 py-0.5">{n}</span>)}</div>
                {diff.addedItems.length > 20 && <span className="text-xs text-cream/30 ml-1">+{diff.addedItems.length - 20} more</span>}
              </div>
            )}
            {diff.removedItems.length > 0 && (
              <div>
                <div className="text-[11px] text-danger/70 mb-1">Removed items ({diff.removedItems.length})</div>
                <div className="flex flex-wrap gap-1">{diff.removedItems.slice(0, 20).map(n => <span key={n} className="text-xs bg-danger/10 text-danger rounded px-1.5 py-0.5">{n}</span>)}</div>
                {diff.removedItems.length > 20 && <span className="text-xs text-cream/30 ml-1">+{diff.removedItems.length - 20} more</span>}
              </div>
            )}
            {diff.addedChamps.length === 0 && diff.addedItems.length === 0 && diff.removedItems.length === 0 && (
              <div className="text-cream/30 text-sm">No item or champion changes detected between patches.</div>
            )}
          </div>
        )}

        <div className="mt-4 text-cream/30 text-xs space-y-1">
          <div>To find the latest patch, open your browser and visit:</div>
          <div className="font-mono bg-navy rounded px-2 py-1 text-cream/50 text-[11px] break-all">
            ddragon.leagueoflegends.com/api/versions.json
          </div>
        </div>
      </div>
    </div>
  )
}
