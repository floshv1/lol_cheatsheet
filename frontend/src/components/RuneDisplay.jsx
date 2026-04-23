import { runeIconUrl } from '../lib/dataDragon.js'
import { useRuneData } from '../hooks/useRuneData.js'

// active=null → no selection yet (show full brightness); active=true/false → dim unselected
function RuneIcon({ runeKey, runeMap, size = 32, active = null, className = '' }) {
  const info = runeMap[runeKey]
  const dimmed = active === false // only dim when explicitly deselected

  if (!info) return (
    <div
      title={runeKey}
      className={`rounded-full bg-panel flex items-center justify-center text-cream/20 text-[10px] shrink-0 ${dimmed ? 'opacity-20' : ''} ${className}`}
      style={{ width: size, height: size }}
    >?</div>
  )
  return (
    <img
      src={runeIconUrl(info.icon)}
      alt={info.name}
      title={info.name}
      className={`rounded-full shrink-0 transition-opacity ${dimmed ? 'opacity-20' : 'opacity-100'} ${className}`}
      style={{ width: size, height: size }}
    />
  )
}

// Compact: keystone + secondary path icon only
export function RuneDisplayCompact({ page }) {
  const { runeMap, runeData } = useRuneData()
  if (!page) return null
  const secTree      = runeData?.find(t => t.key === page.secondary_path || t.name === page.secondary_path)
  const keystoneInfo = runeMap[page.keystone]
  return (
    <div className="flex items-center gap-2">
      {keystoneInfo && (
        <img src={runeIconUrl(keystoneInfo.icon)} alt={page.keystone} className="w-9 h-9 rounded-full bg-panel" />
      )}
      {secTree && (
        <img src={runeIconUrl(secTree.icon)} alt={secTree.name} className="w-5 h-5 rounded-full opacity-60" />
      )}
      <span className="text-xs text-cream/50">{page.label}</span>
    </div>
  )
}

// Full visual rune tree (read-only)
export default function RuneDisplay({ page }) {
  const { runeData, runeMap } = useRuneData()

  if (!page)    return <div className="text-cream/40 text-sm">No rune page</div>
  if (!runeData) return <div className="text-cream/40 text-sm animate-pulse">Loading runes…</div>

  const primaryTree   = runeData.find(t => t.key === page.primary_path   || t.name === page.primary_path)
  const secondaryTree = runeData.find(t => t.key === page.secondary_path || t.name === page.secondary_path)
  const secActive     = [page.sec1, page.sec2].filter(Boolean)

  // Has the user filled in any slots at all?
  const anySelected = !!(page.keystone || page.slot1 || page.slot2 || page.slot3)

  return (
    <div className="flex gap-8 flex-wrap">
      {/* Primary tree */}
      <div className="flex flex-col gap-3 min-w-[120px]">
        {primaryTree && (
          <div className="flex items-center gap-2">
            <img src={runeIconUrl(primaryTree.icon)} alt={primaryTree.name} className="w-7 h-7" />
            <span className="text-gold text-sm font-semibold">{primaryTree.name}</span>
          </div>
        )}

        {/* Keystone row */}
        {primaryTree && (
          <div className="flex gap-3">
            {primaryTree.slots[0].runes.map(rune => {
              const isSelected = page.keystone === rune.key || page.keystone === rune.name
              return (
                <RuneIcon
                  key={rune.key}
                  runeKey={rune.key}
                  runeMap={runeMap}
                  size={58}
                  active={anySelected ? isSelected : null}
                />
              )
            })}
          </div>
        )}

        {/* Slots 1–3 */}
        {primaryTree && primaryTree.slots.slice(1).map((slot, si) => {
          const selected = [page.slot1, page.slot2, page.slot3][si]
          return (
            <div key={si} className="flex gap-2">
              {slot.runes.map(rune => {
                const isSelected = selected === rune.key || selected === rune.name
                return (
                  <RuneIcon
                    key={rune.key}
                    runeKey={rune.key}
                    runeMap={runeMap}
                    size={40}
                    active={selected ? isSelected : null}
                  />
                )
              })}
            </div>
          )
        })}
      </div>

      {/* Secondary tree */}
      <div className="flex flex-col gap-3 min-w-[100px]">
        {secondaryTree && (
          <div className="flex items-center gap-2">
            <img src={runeIconUrl(secondaryTree.icon)} alt={secondaryTree.name} className="w-5 h-5 opacity-70" />
            <span className="text-cream/60 text-sm">{secondaryTree.name}</span>
          </div>
        )}
        {secondaryTree && secondaryTree.slots.slice(1).map((slot, si) => (
          <div key={si} className="flex gap-2">
            {slot.runes.map(rune => {
              const isSelected = secActive.includes(rune.key) || secActive.includes(rune.name)
              return (
                <RuneIcon
                  key={rune.key}
                  runeKey={rune.key}
                  runeMap={runeMap}
                  size={36}
                  active={secActive.length > 0 ? isSelected : null}
                />
              )
            })}
          </div>
        ))}

        {/* Shards */}
        <div className="flex flex-col gap-1 mt-2">
          {[
            { k: 'shard_offense', label: 'Off' },
            { k: 'shard_flex',    label: 'Flex' },
            { k: 'shard_defense', label: 'Def' },
          ].map(({ k, label }) => (
            <span key={k} className="text-[11px] text-cream/50 bg-panel/40 rounded px-1.5 py-0.5">
              {label}: {page[k] || '—'}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}
