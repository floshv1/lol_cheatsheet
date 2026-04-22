import { useEffect, useState } from 'react'
import api from '../lib/api.js'
import { setPatch, loadChampions, loadItems, loadRunes } from '../lib/dataDragon.js'

export default function useDDData() {
  const [ready, setReady] = useState(false)
  const [patch, setPatchState] = useState(null)

  useEffect(() => {
    api.get('/api/settings').then(settings => {
      const p = settings?.patch || '16.8.1'
      setPatch(p)
      setPatchState(p)
      // Preload all three in parallel
      Promise.all([loadChampions(), loadItems(), loadRunes()])
        .then(() => setReady(true))
        .catch(() => setReady(true)) // still mark ready even if DD is unreachable
    })
  }, [])

  return { ready, patch }
}
