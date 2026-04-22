let patch = '16.8.1'
let champData = null
let itemData  = null
let runeData  = null

export function setPatch(p) { patch = p }
export function getPatch()  { return patch }
export function getRuneData()  { return runeData }
export function getChampData() { return champData }
export function getItemData()  { return itemData }

export function clearCache() {
  champData = null
  itemData  = null
  runeData  = null
}

export async function resync(newPatch) {
  patch = newPatch
  clearCache()
  await Promise.all([loadChampions(), loadItems(), loadRunes()])
}

// Fetch with a 10-second timeout
function fetchWithTimeout(url, ms = 10000) {
  const ctrl = new AbortController()
  const id = setTimeout(() => ctrl.abort(), ms)
  return fetch(url, { signal: ctrl.signal }).finally(() => clearTimeout(id))
}

export async function loadChampions() {
  if (champData) return champData
  const res  = await fetchWithTimeout(`https://ddragon.leagueoflegends.com/cdn/${patch}/data/en_US/champion.json`)
  const json = await res.json()
  champData  = json.data
  return champData
}

export async function loadItems() {
  if (itemData) return itemData
  const res  = await fetchWithTimeout(`https://ddragon.leagueoflegends.com/cdn/${patch}/data/en_US/item.json`)
  const json = await res.json()
  itemData   = json.data
  return itemData
}

export async function loadRunes() {
  if (runeData) return runeData
  const res = await fetchWithTimeout(`https://ddragon.leagueoflegends.com/cdn/${patch}/data/en_US/runesReforged.json`)
  runeData  = await res.json()
  return runeData
}

// Resolve the exact Data Dragon champion key from a display name.
// Falls back to stripping special chars when champData isn't loaded yet.
export function champIconUrl(champName) {
  if (champData) {
    const entry = Object.values(champData).find(
      c => c.name.toLowerCase() === champName.toLowerCase()
    )
    if (entry) return `https://ddragon.leagueoflegends.com/cdn/${patch}/img/champion/${entry.id}.png`
  }
  // Best-effort fallback (handles most names)
  const key = champName.replace(/['\s.]/g, '').replace(/^AurelionSol$/, 'AurelionSol')
  return `https://ddragon.leagueoflegends.com/cdn/${patch}/img/champion/${key}.png`
}

export function itemIconUrl(itemId) {
  return `https://ddragon.leagueoflegends.com/cdn/${patch}/img/item/${itemId}.png`
}

export function runeIconUrl(iconPath) {
  return `https://ddragon.leagueoflegends.com/cdn/img/${iconPath}`
}

export async function searchChampions(query) {
  const data = await loadChampions()
  const q = query.toLowerCase()
  return Object.values(data)
    .filter(c => c.name.toLowerCase().includes(q))
    .map(c => ({ key: c.id, name: c.name }))
    .slice(0, 10)
}

export async function searchItems(query) {
  const data = await loadItems()
  const q = query.toLowerCase()
  return Object.entries(data)
    .filter(([, item]) => item.name.toLowerCase().includes(q) && item.gold?.purchasable)
    .map(([id, item]) => ({ id: Number(id), name: item.name }))
    .slice(0, 10)
}
