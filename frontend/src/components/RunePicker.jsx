import { runeIconUrl } from '../lib/dataDragon.js'
import { useRuneData } from '../hooks/useRuneData.js'

const SHARDS = {
  offense: ['Adaptive Force', 'Attack Speed', 'Ability Haste'],
  flex:    ['Adaptive Force', 'Move Speed', 'Health Scaling'],
  defense: ['Health', 'Tenacity and Slow Resist', 'Health Scaling'],
}

const SHARD_ICONS = {
  'Adaptive Force':           'perk-images/StatMods/StatModsAdaptiveForceIcon.png',
  'Attack Speed':             'perk-images/StatMods/StatModsAttackSpeedIcon.png',
  'Ability Haste':            'perk-images/StatMods/StatModsCDRScalingIcon.png',
  'Move Speed':               'perk-images/StatMods/StatModsMovementSpeedIcon.png',
  'Health Scaling':           'perk-images/StatMods/StatModsHealthPlusIcon.png',
  'Health':                   'perk-images/StatMods/StatModsHealthScalingIcon.png',
  'Tenacity and Slow Resist': 'perk-images/StatMods/StatModsTenacityIcon.png',
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

function ShardBtn({ name, selected, onSelect }) {
  const iconPath = SHARD_ICONS[name]
  return (
    <button
      onClick={onSelect}
      title={name}
      className={`rounded-full transition-all shrink-0 ${selected
        ? 'ring-2 ring-gold opacity-100 scale-110'
        : 'opacity-30 hover:opacity-75 hover:scale-105'}`}
    >
      {iconPath ? (
        <img
          src={runeIconUrl(iconPath)}
          alt={name}
          className="rounded-full"
          style={{ width: 28, height: 28 }}
        />
      ) : (
        <div className="w-7 h-7 rounded-full bg-panel flex items-center justify-center text-cream/40 text-[9px] text-center leading-tight px-0.5">
          {name.slice(0, 4)}
        </div>
      )}
    </button>
  )
}

export default function RunePicker({ page, onChange }) {
  const { runeData } = useRuneData()
  if (!runeData) return <div className="text-cream/40 text-sm animate-pulse">Loading rune data…</div>

  const set = (key, val) => onChange({ ...page, [key]: val })

  const primaryTree   = runeData.find(t => t.key === page.primary_path)
  const secondaryTree = runeData.find(t => t.key === page.secondary_path)

  function toggleSecondary(runeKey) {
    if (page.sec1 === runeKey) { onChange({ ...page, sec1: page.sec2 || '', sec2: '' }); return }
    if (page.sec2 === runeKey) { set('sec2', ''); return }
    if (!page.sec1) { set('sec1', runeKey); return }
    if (!page.sec2) { set('sec2', runeKey); return }
    set('sec2', runeKey)
  }

  return (
    <div className="flex flex-col gap-6">
      <input
        className="bg-panel border border-gold-dark/40 rounded px-3 py-1.5 text-cream text-sm w-full max-w-xs"
        value={page.label || ''}
        onChange={e => set('label', e.target.value)}
        placeholder="Page label"
      />

      {/* Primary + Secondary side by side */}
      <div className="flex gap-10 flex-wrap">

        {/* Primary path */}
        <div className="flex flex-col gap-3 flex-1 min-w-[220px]">
          <div className="text-gold text-xs font-semibold uppercase tracking-wide">Primary Path</div>

          {/* Tree selector */}
          <div className="flex gap-3 flex-wrap">
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
              <div className="text-cream/40 text-xs">Keystone</div>
              <div className="flex gap-4 flex-wrap">
                {primaryTree.slots[0].runes.map(r => (
                  <RuneBtn key={r.key} rune={r} selected={page.keystone === r.key} onSelect={k => set('keystone', k)} size={48} />
                ))}
              </div>
              {[1, 2, 3].map(si => {
                const fieldKey = ['slot1', 'slot2', 'slot3'][si - 1]
                const slot = primaryTree.slots[si]
                if (!slot) return null
                return (
                  <div key={si} className="flex gap-3 flex-wrap">
                    {slot.runes.map(r => (
                      <RuneBtn key={r.key} rune={r} selected={page[fieldKey] === r.key} onSelect={k => set(fieldKey, k)} size={36} />
                    ))}
                  </div>
                )
              })}
            </>
          )}
        </div>

        {/* Secondary path */}
        <div className="flex flex-col gap-3 flex-1 min-w-[180px]">
          <div className="text-cream/60 text-xs font-semibold uppercase tracking-wide">Secondary Path</div>

          {/* Tree selector */}
          <div className="flex gap-3 flex-wrap">
            {runeData.filter(t => t.key !== page.primary_path).map(tree => (
              <button
                key={tree.key}
                onClick={() => onChange({ ...page, secondary_path: tree.key, sec1: '', sec2: '' })}
                title={tree.name}
                className={`rounded-full transition-all ${page.secondary_path === tree.key ? 'ring-2 ring-gold opacity-100' : 'opacity-40 hover:opacity-80'}`}
              >
                <img src={runeIconUrl(tree.icon)} alt={tree.name} className="w-9 h-9 rounded-full" />
              </button>
            ))}
          </div>

          {secondaryTree && (
            <>
              <div className="text-cream/30 text-xs">Pick 2 from different rows</div>
              {secondaryTree.slots.slice(1).map((slot, si) => (
                <div key={si} className="flex gap-3 flex-wrap">
                  {slot.runes.map(r => (
                    <RuneBtn
                      key={r.key}
                      rune={r}
                      selected={page.sec1 === r.key || page.sec2 === r.key}
                      onSelect={toggleSecondary}
                      size={34}
                    />
                  ))}
                </div>
              ))}
            </>
          )}
        </div>
      </div>

      {/* Shards */}
      <div>
        <div className="text-cream/50 text-xs uppercase tracking-wide mb-3">Stat Shards</div>
        <div className="flex gap-8 flex-wrap">
          {Object.entries(SHARDS).map(([type, options]) => (
            <div key={type} className="flex flex-col gap-2">
              <div className="text-cream/40 text-[11px] uppercase tracking-wide">{type}</div>
              <div className="flex gap-2">
                {options.map(s => {
                  const k = `shard_${type}`
                  return (
                    <ShardBtn
                      key={s}
                      name={s}
                      selected={page[k] === s}
                      onSelect={() => set(k, s)}
                    />
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
