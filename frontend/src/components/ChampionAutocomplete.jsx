import { useState, useEffect, useRef } from 'react'
import { searchChampions } from '../lib/dataDragon.js'

export default function ChampionAutocomplete({ onSelect, placeholder = 'Search champion…', className = '', focusRef }) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [open, setOpen] = useState(false)
  const timer = useRef(null)
  const ref = useRef(null)
  const inputRef = useRef(null)
  const resolvedInputRef = focusRef || inputRef

  useEffect(() => {
    clearTimeout(timer.current)
    if (!query.trim()) { setResults([]); return }
    timer.current = setTimeout(async () => {
      const r = await searchChampions(query)
      setResults(r)
      setOpen(true)
    }, 200)
  }, [query])

  useEffect(() => {
    function close(e) { if (!ref.current?.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [])

  function pick(champ) {
    onSelect(champ)
    setQuery(champ.name)
    setOpen(false)
  }

  return (
    <div ref={ref} className={`relative ${className}`}>
      <input
        ref={resolvedInputRef}
        className="w-full bg-panel border border-gold-dark/40 rounded-lg px-4 py-2.5 text-cream placeholder-cream/30 focus:outline-none focus:border-gold"
        value={query}
        onChange={e => setQuery(e.target.value)}
        onFocus={() => results.length && setOpen(true)}
        placeholder={placeholder}
      />
      {open && results.length > 0 && (
        <ul className="absolute top-full mt-1 left-0 right-0 bg-navy-light border border-gold-dark/40 rounded-lg overflow-hidden z-50 shadow-xl">
          {results.map(c => (
            <li key={c.key}>
              <button
                className="w-full text-left px-4 py-2 text-sm text-cream hover:bg-panel transition-colors"
                onMouseDown={() => pick(c)}
              >
                {c.name}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
