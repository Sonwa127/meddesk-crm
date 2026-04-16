'use client'

import { useEffect, useState } from 'react'
import { createClient } from '../../utils/supabase'
import { useRouter } from 'next/navigation'
import Sidebar from '../../components/Sidebar'

export default function AuditLogPage() {
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      const { data } = await supabase
        .from('audit_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(200)
      setLogs(data || [])
      setLoading(false)
    }
    load()
  }, [])

  const filtered = filter === 'all' ? logs : logs.filter(l => l.action === filter)

  const actionBadge = {
    INSERT: 'bg-green-950 text-green-400',
    UPDATE: 'bg-blue-950 text-blue-400',
    DELETE: 'bg-red-950 text-red-400',
    SELECT: 'bg-gray-800 text-gray-400'
  }

  const tableColor = {
    patients: 'text-purple-400',
    intake_forms: 'text-amber-400',
    financials: 'text-green-400'
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <div className="border-b border-gray-800 px-6 py-4 flex items-center justify-between">
        <h1 className="text-lg font-semibold">meddesk</h1>
        <button onClick={() => { supabase.auth.signOut(); router.push('/login') }} className="text-sm text-gray-400 hover:text-white">Sign out</button>
      </div>

      <div className="flex">
        <Sidebar active="Audit Log" />

        <main className="flex-1 p-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-semibold">Audit Log</h2>
              <p className="text-gray-400 text-sm">All PHI access and modifications — HIPAA compliant</p>
            </div>
            <div className="flex gap-2">
              {['all', 'INSERT', 'UPDATE', 'DELETE'].map(f => (
                <button key={f} onClick={() => setFilter(f)}
                  className={`text-xs px-3 py-1.5 rounded-lg transition capitalize ${filter === f ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-400 hover:text-white'}`}>
                  {f === 'all' ? 'All' : f}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-amber-950 border border-amber-800 rounded-xl p-4 text-sm text-amber-300 mb-6">
            ⚠️ This log is write-only and tamper-proof. All access to protected health information (PHI) is recorded automatically in compliance with HIPAA regulations.
          </div>

          <div className="grid grid-cols-4 gap-4 mb-6">
            {[
              ['Total Events', logs.length, 'text-white'],
              ['Inserts', logs.filter(l => l.action === 'INSERT').length, 'text-green-400'],
              ['Updates', logs.filter(l => l.action === 'UPDATE').length, 'text-blue-400'],
              ['Deletes', logs.filter(l => l.action === 'DELETE').length, 'text-red-400'],
            ].map(([label, value, color]) => (
              <div key={label} className="bg-gray-900 border border-gray-800 rounded-xl p-4">
                <p className="text-gray-400 text-xs mb-1">{label}</p>
                <p className={`text-2xl font-semibold ${color}`}>{value}</p>
              </div>
            ))}
          </div>

          <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-800 text-gray-400 text-left">
                  <th className="px-4 py-3 font-medium">Timestamp</th>
                  <th className="px-4 py-3 font-medium">Action</th>
                  <th className="px-4 py-3 font-medium">Table</th>
                  <th className="px-4 py-3 font-medium">Record ID</th>
                  <th className="px-4 py-3 font-medium">User</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-500">Loading...</td></tr>
                ) : filtered.length === 0 ? (
                  <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-500">No audit events yet.</td></tr>
                ) : filtered.map(l => (
                  <tr key={l.id} className="border-b border-gray-800 hover:bg-gray-800 transition">
                    <td className="px-4 py-3 text-gray-400 text-xs">{new Date(l.created_at).toLocaleString()}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${actionBadge[l.action] || 'bg-gray-800 text-gray-400'}`}>{l.action}</span>
                    </td>
                    <td className={`px-4 py-3 text-xs font-medium ${tableColor[l.table_name] || 'text-gray-400'}`}>{l.table_name}</td>
                    <td className="px-4 py-3 text-gray-500 text-xs font-mono">{l.record_id ? l.record_id.slice(0, 8) + '...' : '—'}</td>
                    <td className="px-4 py-3 text-gray-500 text-xs font-mono">{l.user_id ? l.user_id.slice(0, 8) + '...' : 'system'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </main>
      </div>
    </div>
  )
}