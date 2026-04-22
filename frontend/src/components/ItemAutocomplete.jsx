import { useState, useEffect, useRef } from 'react'
import { searchItems } from '../lib/dataDragon.js'
import ItemIcon from './ItemIcon.jsx'

export default function ItemAutocomplete({ onSelect, placeholder = 'Search item…', className = '' }) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [open, setOpen] = useState(false)
  const timer = useRef(null)
  const ref = useRef(null)

  useEffect(() => {
    clearTimeout(timer.current)
    if (!query.trim()) { setResults([]); return }
    timer.current = setTimeout(async () => {
      const r = await searchItems(query)
      setResults(r)
      setOpen(true)
    }, 200)
  }, [query])

  useEffect(() => {
    function close(e) { if (!ref.current?.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [])

  function pick(item) {
    onSelect(item)
    setQuery('')
    setOpen(false)
  }

  return (
    <div ref={ref} className={`relative ${className}`}>
      <input
        className="w-full bg-panel border border-gold-dark/30 rounded px-3 py-1.5 text-cream text-sm placeholder-cream/30 focus:outline-none focus:border-gold"
        value={query}
        onChange={e => setQuery(e.target.value)}
        onFocus={() => results.length && setOpen(true)}
        placeholder={placeholder}
      />
      {open && results.length > 0 && (
        <ul className="absolute top-full mt-1 left-0 right-0 bg-navy-light border border-gold-dark/40 rounded-lg overflow-hidden z-50 shadow-xl max-h-60 overflow-y-auto">
          {results.map(item => (
            <li key={item.id}>
              <button
                className="w-full flex items-center gap-2 px-3 py-1.5 text-sm text-cream hover:bg-panel transition-colors"
                onMouseDown={() => pick(item)}
              >
                <ItemIcon itemId={item.id} itemName={item.name} size={28} />
                <span>{item.name}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
