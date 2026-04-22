import { runeIconUrl } from '../lib/dataDragon.js'
import { useRuneData } from '../hooks/useRuneData.js'

const SHARDS = {
  offense: ['Adaptive Force', 'Attack Speed', 'Ability Haste'],
  flex:    ['Adaptive Force', 'Move Speed', 'Health Scaling'],
  defense: ['Health', 'Tenacity and Slow Resist', 'Health Scaling'],
}

function RuneBtn({ rune, selected, onSelect, size = 36 }) {
  const stripped = rune.shortDesc?.replace(/<[^>]*>/g, '').slice(0, 120) || ''
  return (
    <button
      onClick={() => onSelect(rune.key)}
      title={`${rune.name}${stripped ? '\n' + stripped : ''}`}
      className={`rounded-full transition-all shrink-0 ${selected
        ? 'ring-2 ring-gold opacity-100 scale-110'
        : 'opacity-30 hover:opacity-75 hover:scale-105'}`}
    >
      <img
        src={runeIconUrl(rune.icon)}
        alt={rune.name}
        className="rounded-full"
        style={{ width: size, height: size }}
      />
    </button>
  )
}

export default function RunePicker({ page, onChange }) {
  const { runeData } = useRuneData()
  if (!runeData) return <div className="text-cream/40 text-sm animate-pulse">Loading rune data…</div>

  const set = (key, val) => onChange({ ...page, [key]: val })

  const primaryTree  = runeData.find(t => t.key === page.primary_path)
  const secondaryTree = runeData.find(t => t.key === page.secondary_path)

  function toggleSecondary(runeKey) {
    if (page.sec1 === runeKey) { onChange({ ...page, sec1: page.sec2 || '', sec2: '' }); return }
    if (page.sec2 === runeKey) { set('sec2', ''); return }
    if (!page.sec1) { set('sec1', runeKey); return }
    if (!page.sec2) { set('sec2', runeKey); return }
    set('sec2', runeKey)
  }

  return (
    <div className="flex flex-col gap-5">
      <input
        className="bg-panel border border-gold-dark/40 rounded px-3 py-1.5 text-cream text-sm w-full max-w-xs"
        value={page.label || ''}
        onChange={e => set('label', e.target.value)}
        placeholder="Page label"
      />

      {/* Primary path */}
      <div>
        <div className="text-gold text-xs font-semibold uppercase tracking-wide mb-2">Primary Path</div>
        <div className="flex gap-3 flex-wrap mb-4">
          {runeData.map(tree => (
            <button
              key={tree.key}
              onClick={() => onChange({ ...page, primary_path: tree.key, keystone: '', slot1: '', slot2: '', slot3: '' })}
              title={tree.name}
              className={`rounded-full transition-all ${page.primary_path === tree.key ? 'ring-2 ring-gold opacity-100' : 'opacity-40 hover:opacity-80'}`}
            >
              <img src={runeIconUrl(tree.icon)} alt={tree.name} className="w-10 h-10 rounded-full" />
            </button>
          ))}
        </div>

        {primaryTree && (
          <>
            <div className="text-cream/40 text-xs mb-2">Keystone</div>
            <div className="flex gap-4 flex-wrap mb-3">
              {primaryTree.slots[0].runes.map(r => (
                <RuneBtn key={r.key} rune={r} selected={page.keystone === r.key} onSelect={k => set('keystone', k)} size={48} />
              ))}
            </div>
            {[1, 2, 3].map(si => {
              const fieldKey = ['slot1', 'slot2', 'slot3'][si - 1]
              const slot = primaryTree.slots[si]
              if (!slot) return null
              return (
                <div key={si} className="flex gap-3 flex-wrap mb-2">
                  {slot.runes.map(r => (
                    <RuneBtn key={r.key} rune={r} selected={page[fieldKey] === r.key} onSelect={k => set(fieldKey, k)} size={34} />
                  ))}
                </div>
              )
            })}
          </>
        )}
      </div>

      {/* Secondary path */}
      <div>
        <div className="text-cream/60 text-xs font-semibold uppercase tracking-wide mb-2">Secondary Path</div>
        <div className="flex gap-3 flex-wrap mb-3">
          {runeData.filter(t => t.key !== page.primary_path).map(tree => (
            <button
              key={tree.key}
              onClick={() => onChange({ ...page, secondary_path: tree.key, sec1: '', sec2: '' })}
              title={tree.name}
              className={`rounded-full transition-all ${page.secondary_path === tree.key ? 'ring-2 ring-gold opacity-100' : 'opacity-40 hover:opacity-80'}`}
            >
              <img src={runeIconUrl(tree.icon)} alt={tree.name} className="w-8 h-8 rounded-full" />
            </button>
          ))}
        </div>
        {secondaryTree && (
          <div className="flex flex-col gap-2">
            <div className="text-cream/30 text-xs mb-1">Pick 2 runes from different rows</div>
            {secondaryTree.slots.slice(1).map((slot, si) => (
              <div key={si} className="flex gap-3 flex-wrap">
                {slot.runes.map(r => (
                  <RuneBtn
                    key={r.key}
                    rune={r}
                    selected={page.sec1 === r.key || page.sec2 === r.key}
                    onSelect={toggleSecondary}
                    size={30}
                  />
                ))}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Shards */}
      <div>
        <div className="text-cream/50 text-xs uppercase mb-2">Stat Shards</div>
        <div className="flex gap-5 flex-wrap">
          {Object.entries(SHARDS).map(([type, options]) => (
            <div key={type} className="flex flex-col gap-1">
              <div className="text-cream/40 text-[11px] uppercase">{type}</div>
              {options.map(s => {
                const k = `shard_${type}`
                return (
                  <button
                    key={s}
                    onClick={() => set(k, s)}
                    className={`text-[11px] rounded px-2 py-0.5 text-left transition-colors
                      ${page[k] === s ? 'bg-gold/20 text-gold' : 'text-cream/50 hover:text-cream hover:bg-panel/50'}`}
                  >
                    {s}
                  </button>
                )
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
