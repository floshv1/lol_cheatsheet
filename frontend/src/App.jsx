import { useEffect } from 'react'
import { Routes, Route, NavLink, Navigate } from 'react-router-dom'
import useDDData from './hooks/useDDData.js'
import Dashboard from './pages/Dashboard.jsx'
import Pool from './pages/Pool.jsx'
import ChampionOverview from './pages/ChampionOverview.jsx'
import AllMatchups from './pages/AllMatchups.jsx'
import Library from './pages/Library.jsx'
import Settings from './pages/Settings.jsx'

const NAV = [
  { to: '/',         label: 'Home',      icon: '🏠', end: true },
  { to: '/pool',     label: 'My Pool',   icon: '🛡️' },
  { to: '/matchups', label: 'Matchups',  icon: '⚔️' },
  { to: '/library',  label: 'Library',   icon: '📚' },
  { to: '/settings', label: 'Settings',  icon: '⚙️' },
]

function NavItem({ to, label, icon, end }) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        `flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors
         ${isActive
           ? 'bg-panel text-gold border border-gold-dark'
           : 'text-cream/60 hover:text-cream hover:bg-panel/50'}`
      }
    >
      <span className="text-base">{icon}</span>
      <span className="hidden md:inline">{label}</span>
    </NavLink>
  )
}

export default function App() {
  useDDData()

  useEffect(() => {
    function handler(e) {
      if (e.key !== '/') return
      const tag = e.target?.tagName
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(tag)) return
      e.preventDefault()
      window.dispatchEvent(new CustomEvent('lol:focus-search'))
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex flex-col w-52 border-r border-gold-dark/30 bg-navy-light p-3 gap-1 shrink-0">
        <div className="text-gold font-bold text-base mb-3 px-3 pt-1">LoL Cheatsheet</div>
        {NAV.map(n => <NavItem key={n.to} {...n} />)}
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-y-auto pb-20 md:pb-0">
        <Routes>
          <Route path="/"              element={<Dashboard />} />
          <Route path="/pool"          element={<Pool />} />
          <Route path="/champions/:championId" element={<ChampionOverview />} />
          <Route path="/matchups"      element={<AllMatchups />} />
          <Route path="/library"       element={<Library />} />
          <Route path="/settings"      element={<Settings />} />
          <Route path="*"              element={<Navigate to="/" replace />} />
        </Routes>
      </main>

      {/* Mobile bottom tab bar */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 bg-navy-light border-t border-gold-dark/30 flex z-40">
        {NAV.map(n => (
          <NavLink
            key={n.to}
            to={n.to}
            end={n.end}
            className={({ isActive }) =>
              `flex-1 flex flex-col items-center justify-center py-2 gap-0.5 text-[10px] transition-colors min-h-[52px]
               ${isActive ? 'text-gold' : 'text-cream/40'}`
            }
          >
            <span className="text-lg">{n.icon}</span>
            <span>{n.label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  )
}
