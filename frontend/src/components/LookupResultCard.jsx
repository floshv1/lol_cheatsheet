import { champIconUrl } from '../lib/dataDragon.js'
import { RuneDisplayCompact } from './RuneDisplay.jsx'
import ItemIcon from './ItemIcon.jsx'

const DIFF_STYLE = {
  easy: 'bg-easy/20 text-easy border-easy/40',
  even: 'bg-blue-500/20 text-blue-300 border-blue-500/40',
  hard: 'bg-danger/20 text-danger border-danger/40',
}

function ComfortStars({ value }) {
  return (
    <span className="text-sm">
      {Array.from({ length: 5 }, (_, i) => (
        <span key={i} className={i < value ? 'text-gold' : 'text-cream/20'}>★</span>
      ))}
    </span>
  )
}

export default function LookupResultCard({ champion, matchup, rune_page, build_items }) {
  const allItems  = build_items || []
  const coreItems = allItems.filter(i => i.slot === 'core')
  const displayItems = coreItems.length > 0 ? coreItems : allItems
  const diff = matchup?.difficulty || 'even'

  return (
    <div className="bg-panel border border-gold-dark/30 rounded-xl p-4 flex flex-col gap-3 hover:border-gold/40 transition-colors">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="relative shrink-0">
          <img
            src={champIconUrl(champion.name)}
            alt={champion.name}
            className="w-14 h-14 rounded-lg object-cover border border-gold-dark/40"
            onError={e => { e.currentTarget.style.display = 'none' }}
          />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-bold text-cream text-base">{champion.name}</span>
            <span className="text-xs text-cream/40 bg-panel-light rounded px-1.5 py-0.5">{champion.role}</span>
            <span className={`text-xs border rounded px-1.5 py-0.5 ${DIFF_STYLE[diff]}`}>
              {diff}
            </span>
          </div>
          <ComfortStars value={champion.comfort} />
        </div>
      </div>

      {/* Rune summary */}
      {rune_page && (
        <div className="border-t border-gold-dark/20 pt-3">
          <RuneDisplayCompact page={rune_page} />
        </div>
      )}

      {/* Core items */}
      {coreItems.length > 0 && (
        <div className="border-t border-gold-dark/20 pt-3">
          <div className="text-[11px] text-cream/40 uppercase mb-2">Core Build</div>
          <div className="flex flex-wrap gap-2">
            {coreItems.map((item, idx) => (
              <ItemIcon key={item.id} itemId={item.item_id} itemName={item.item_name} note={item.note} size={36} orderIndex={idx} />
            ))}
          </div>
        </div>
      )}

      {/* Laning tip */}
      {matchup?.laning_tip && (
        <div className="border-t border-gold-dark/20 pt-3">
          <p className="text-sm text-cream/70 leading-relaxed">{matchup.laning_tip}</p>
        </div>
      )}

      {/* Item notes */}
      {matchup?.item_notes && (
        <div className="text-xs text-cream/50 italic">{matchup.item_notes}</div>
      )}
    </div>
  )
}
