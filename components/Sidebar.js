'use client'

import { useRouter } from 'next/navigation'
import { createClient } from '../utils/supabase'

export default function Sidebar({ active }) {
  const router = useRouter()
  const supabase = createClient()

  const workspaceLinks = [
    { label: 'Overview', href: '/dashboard', icon: '⊞' },
    { label: 'Patients', href: '/patients', icon: '👥' },
    { label: 'Financials', href: '/financials', icon: '💰' },
    { label: 'Tasks', href: '/tasks', icon: '✓' },
    { label: 'Audit Log', href: '/audit', icon: '🔒' },
    { label: 'Settings', href: '/settings', icon: '⚙️' },
  ]

  const formsLinks = [
    { label: 'Form Builder', href: '/forms', icon: '⊕' },
    { label: 'Submissions', href: '/forms', icon: '📋' },
  ]

  const bottomLinks = [
    { label: 'KPIs', href: '/kpis', icon: '📊' },
  ]

  return (
    <aside className="w-56 border-r border-gray-800 min-h-screen flex flex-col flex-shrink-0 bg-gray-950">

      <div className="px-4 py-3 border-b border-gray-800">
        <div className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-gray-800 cursor-pointer transition">
          <div className="w-6 h-6 rounded bg-blue-600 flex items-center justify-center text-xs font-bold text-white flex-shrink-0">M</div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-white truncate">MedDesk</p>
            <p className="text-xs text-gray-500 truncate">Demo Practice</p>
          </div>
          <span className="text-gray-500 text-xs">⌄</span>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-5 overflow-y-auto">

        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-2 mb-2">Workspace</p>
          <div className="space-y-0.5">
            {workspaceLinks.map(({ label, href, icon }) => {
              const isActive = label === active || (label === 'Overview' && active === 'Dashboard')
              return (
                <div key={label} onClick={() => router.push(href)}
                  className={`flex items-center gap-2.5 px-2 py-1.5 rounded-lg text-sm cursor-pointer transition ${isActive ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white hover:bg-gray-800'}`}>
                  <span className="text-base w-4 text-center">{icon}</span>
                  <span>{label}</span>
                </div>
              )
            })}
          </div>
        </div>

        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-2 mb-2">Forms</p>
          <div className="space-y-0.5">
            {formsLinks.map(({ label, href, icon }) => {
              const isActive = label === active
              return (
                <div key={label} onClick={() => router.push(href)}
                  className={`flex items-center gap-2.5 px-2 py-1.5 rounded-lg text-sm cursor-pointer transition ${isActive ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white hover:bg-gray-800'}`}>
                  <span className="text-base w-4 text-center">{icon}</span>
                  <span>{label}</span>
                </div>
              )
            })}
          </div>
        </div>

        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-2 mb-2">Analytics</p>
          <div className="space-y-0.5">
            {bottomLinks.map(({ label, href, icon }) => {
              const isActive = label === active
              return (
                <div key={label} onClick={() => router.push(href)}
                  className={`flex items-center gap-2.5 px-2 py-1.5 rounded-lg text-sm cursor-pointer transition ${isActive ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white hover:bg-gray-800'}`}>
                  <span className="text-base w-4 text-center">{icon}</span>
                  <span>{label}</span>
                </div>
              )
            })}
          </div>
        </div>

      </nav>

      <div className="px-4 py-3 border-t border-gray-800">
        <div className="flex items-center gap-2 px-2 py-1.5 rounded-lg bg-green-950 border border-green-900">
          <span className="text-green-400 text-xs">🔒</span>
          <span className="text-xs text-green-400 font-medium">HIPAA Active</span>
        </div>
      </div>

    </aside>
  )
}