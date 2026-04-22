import { useState, useEffect } from 'react'
import { loadChampions, loadItems, champIconUrl, itemIconUrl, runeIconUrl } from '../lib/dataDragon.js'
import { useRuneData } from '../hooks/useRuneData.js'

const TABS = ['Champions', 'Items', 'Runes']

// Strip HTML tags from DD descriptions
function stripHtml(html) {
  return (html || '').replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim()
}

// ── Champions tab ──────────────────────────────────────────────────────────────

function ChampionCard({ id, champ, onClick }) {
  return (
    <button
      onClick={() => onClick({ id, champ })}
      className="bg-panel hover:bg-panel-light border border-gold-dark/20 hover:border-gold/40 rounded-xl overflow-hidden transition-colors text-left group"
    >
      <img
        src={champIconUrl(champ.id)}
        alt={champ.name}
        className="w-full aspect-square object-cover object-top"
        onError={e => { e.currentTarget.style.display = 'none' }}
      />
      <div className="p-2">
        <div className="text-cream text-sm font-semibold truncate">{champ.name}</div>
        <div className="text-cream/40 text-xs truncate">{champ.tags?.join(', ')}</div>
      </div>
    </button>
  )
}

function ChampionDetail({ id, champ, onClose }) {
  return (
    <div className="fixed inset-0 bg-navy/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-navy-light border border-gold-dark/40 rounded-2xl w-full max-w-lg max-h-[85vh] overflow-y-auto">
        <div className="flex items-start gap-4 p-5 border-b border-gold-dark/20">
          <img src={champIconUrl(champ.id)} alt={champ.name} className="w-20 h-20 rounded-xl object-cover shrink-0" />
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h2 className="text-gold text-xl font-bold">{champ.name}</h2>
              <button onClick={onClose} className="ml-auto text-cream/40 hover:text-cream text-xl leading-none">×</button>
            </div>
            <div className="text-cream/50 text-sm italic">{champ.title}</div>
            <div className="flex gap-1 mt-1 flex-wrap">
              {champ.tags?.map(t => (
                <span key={t} className="text-xs bg-panel rounded px-1.5 py-0.5 text-cream/60">{t}</span>
              ))}
            </div>
          </div>
        </div>
        <div className="p-5">
          <p className="text-cream/70 text-sm leading-relaxed mb-4">{champ.blurb}</p>
          <div className="grid grid-cols-3 gap-2 text-center">
            {Object.entries(champ.info || {}).map(([stat, val]) => (
              <div key={stat} className="bg-panel rounded-lg p-2">
                <div className="text-gold text-sm font-semibold">{val}</div>
                <div className="text-cream/40 text-xs capitalize">{stat}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function ChampionsTab() {
  const [data, setData] = useState(null)
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState(null)

  useEffect(() => { loadChampions().then(setData) }, [])

  if (!data) return <div className="text-cream/40 animate-pulse p-4">Loading champions…</div>

  const q = search.toLowerCase()
  const filtered = Object.entries(data)
    .filter(([, c]) => !q || c.name.toLowerCase().includes(q) || c.tags?.some(t => t.toLowerCase().includes(q)))
    .sort(([, a], [, b]) => a.name.localeCompare(b.name))

  return (
    <div>
      <input
        className="w-full mb-5 bg-panel border border-gold-dark/40 rounded-lg px-4 py-2.5 text-cream placeholder-cream/30 focus:outline-none focus:border-gold"
        placeholder="Search by name or role (Marksman, Mage, Tank…)"
        value={search}
        onChange={e => setSearch(e.target.value)}
      />
      <div className="text-xs text-cream/30 mb-3">{filtered.length} champions</div>
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-7 gap-3">
        {filtered.map(([id, champ]) => (
          <ChampionCard key={id} id={id} champ={champ} onClick={setSelected} />
        ))}
      </div>
      {selected && <ChampionDetail {...selected} onClose={() => setSelected(null)} />}
    </div>
  )
}

// ── Items tab ──────────────────────────────────────────────────────────────────

const ITEM_CATEGORIES = ['All', 'Mythic', 'Legendary', 'Epic', 'Boots', 'Starter', 'Component']

function ItemCard({ id, item }) {
  const [hovered, setHovered] = useState(false)
  return (
    <div
      className="relative"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div className="bg-panel border border-gold-dark/20 hover:border-gold/40 rounded-xl p-2 flex flex-col items-center gap-1 cursor-default transition-colors">
        <img
          src={itemIconUrl(id)}
          alt={item.name}
          className="w-12 h-12 rounded-lg object-cover"
          onError={e => { e.currentTarget.style.display = 'none' }}
        />
        <div className="text-cream text-[11px] text-center leading-tight font-medium line-clamp-2 w-full">{item.name}</div>
        {item.gold?.total > 0 && (
          <div className="text-gold text-[11px]">{item.gold.total}g</div>
        )}
      </div>
      {hovered && (
        <div className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 z-50 w-60 bg-navy-light border border-gold-dark/40 rounded-xl p-3 shadow-xl pointer-events-none">
          <div className="text-gold font-semibold text-sm mb-1">{item.name}</div>
          {item.gold?.total > 0 && (
            <div className="text-gold/60 text-xs mb-2">Cost: {item.gold.total}g (sell: {item.gold.sell}g)</div>
          )}
          <p className="text-cream/70 text-xs leading-relaxed">{stripHtml(item.description)}</p>
        </div>
      )}
    </div>
  )
}

function hasTag(item, tag) {
  return item.tags?.includes(tag) || item.description?.toLowerCase().includes(tag.toLowerCase())
}

function itemCategory(item) {
  if (item.tags?.includes('Boots')) return 'Boots'
  const hasFrom = item.from?.length > 0
  const hasInto = item.into?.length > 0
  if (!hasFrom) return hasInto ? 'Component' : 'Starter'
  if (hasInto) return 'Component'
  if ((item.description || '').includes('Mythic Passive')) return 'Mythic'
  return item.gold?.total >= 2800 ? 'Legendary' : 'Epic'
}

function ItemsTab() {
  const [data, setData] = useState(null)
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('All')

  useEffect(() => { loadItems().then(setData) }, [])

  if (!data) return <div className="text-cream/40 animate-pulse p-4">Loading items…</div>

  const q = search.toLowerCase()
  const filtered = Object.entries(data)
    .filter(([, item]) => {
      if (!item.gold?.purchasable) return false
      if (item.requiredChampion) return false
      if (q && !item.name.toLowerCase().includes(q)) return false
      if (category !== 'All' && itemCategory(item) !== category) return false
      return true
    })
    .sort(([, a], [, b]) => (b.gold?.total || 0) - (a.gold?.total || 0))

  return (
    <div>
      <div className="flex gap-3 mb-5 flex-wrap">
        <input
          className="flex-1 min-w-[200px] bg-panel border border-gold-dark/40 rounded-lg px-4 py-2.5 text-cream placeholder-cream/30 focus:outline-none focus:border-gold"
          placeholder="Search items…"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <div className="flex gap-1 flex-wrap">
          {ITEM_CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={`text-xs px-3 py-2 rounded-lg border transition-colors
                ${category === cat ? 'bg-gold/20 border-gold text-gold' : 'border-gold-dark/30 text-cream/50 hover:border-gold/40'}`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>
      <div className="text-xs text-cream/30 mb-3">{filtered.length} items</div>
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2">
        {filtered.map(([id, item]) => (
          <ItemCard key={id} id={id} item={item} />
        ))}
      </div>
    </div>
  )
}

// ── Runes tab ──────────────────────────────────────────────────────────────────

function RuneEntry({ rune, size = 36 }) {
  const [hovered, setHovered] = useState(false)
  return (
    <div
      className="relative flex items-center gap-3 p-2 rounded-lg hover:bg-panel/50 transition-colors cursor-default"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <img src={runeIconUrl(rune.icon)} alt={rune.name} className="rounded-full shrink-0" style={{ width: size, height: size }} />
      <div className="flex-1 min-w-0">
        <div className="text-cream text-sm font-medium">{rune.name}</div>
        <div className="text-cream/50 text-xs line-clamp-1">{stripHtml(rune.shortDesc)}</div>
      </div>
      {hovered && rune.longDesc && (
        <div className="absolute left-full ml-2 top-0 z-50 w-72 bg-navy-light border border-gold-dark/40 rounded-xl p-3 shadow-xl pointer-events-none">
          <div className="text-gold font-semibold text-sm mb-1">{rune.name}</div>
          <p className="text-cream/70 text-xs leading-relaxed">{stripHtml(rune.longDesc)}</p>
        </div>
      )}
    </div>
  )
}

function RunesTab() {
  const { runeData } = useRuneData()
  const [openTree, setOpenTree] = useState(null)

  if (!runeData) return <div className="text-cream/40 animate-pulse p-4">Loading runes…</div>

  return (
    <div className="flex flex-col gap-4">
      {runeData.map(tree => {
        const open = openTree === tree.key
        return (
          <div key={tree.key} className="bg-panel border border-gold-dark/20 rounded-xl overflow-hidden">
            <button
              onClick={() => setOpenTree(open ? null : tree.key)}
              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-panel-light transition-colors text-left"
            >
              <img src={runeIconUrl(tree.icon)} alt={tree.name} className="w-8 h-8 rounded-full" />
              <span className="text-gold font-semibold">{tree.name}</span>
              <span className="ml-auto text-cream/40 text-lg">{open ? '▲' : '▼'}</span>
            </button>
            {open && (
              <div className="px-4 pb-4 flex flex-col gap-4">
                {tree.slots.map((slot, si) => (
                  <div key={si}>
                    <div className="text-cream/30 text-xs uppercase mb-2 pl-2">
                      {si === 0 ? 'Keystone' : `Row ${si}`}
                    </div>
                    <div className="flex flex-col gap-1">
                      {slot.runes.map(rune => (
                        <RuneEntry key={rune.key} rune={rune} size={si === 0 ? 44 : 32} />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

// ── Main Library page ──────────────────────────────────────────────────────────

export default function Library() {
  const [tab, setTab] = useState('Champions')

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-gold text-2xl font-bold mb-2">Library</h1>
      <p className="text-cream/40 text-sm mb-6">All champions, items and runes from the current patch.</p>

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

      {tab === 'Champions' && <ChampionsTab />}
      {tab === 'Items'     && <ItemsTab />}
      {tab === 'Runes'     && <RunesTab />}
    </div>
  )
}
