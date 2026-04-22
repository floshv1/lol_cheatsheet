import { useState, useEffect } from 'react'
import { loadRunes, getRuneData } from '../lib/dataDragon.js'

function buildRuneMap(data) {
  const map = {}
  if (!data) return map
  for (const tree of data) {
    // Index by both key (camelCase) and name (human-readable) for compatibility
    map[tree.key]  = { icon: tree.icon, name: tree.name }
    map[tree.name] = { icon: tree.icon, name: tree.name }
    for (const slot of tree.slots) {
      for (const rune of slot.runes) {
        const entry = { icon: rune.icon, name: rune.name, shortDesc: rune.shortDesc }
        map[rune.key]  = entry
        map[rune.name] = entry
      }
    }
  }
  return map
}

export function useRuneData() {
  const cached = getRuneData()
  const [runeData, setRuneData] = useState(cached)
  const [runeMap, setRuneMap] = useState(() => buildRuneMap(cached))

  useEffect(() => {
    if (runeData) return
    loadRunes().then(d => {
      setRuneData(d)
      setRuneMap(buildRuneMap(d))
    })
  }, [runeData])

  return { runeData, runeMap }
}
