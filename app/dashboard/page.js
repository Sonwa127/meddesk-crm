'use client'

import { useEffect, useState } from 'react'
import { createClient } from '../../utils/supabase'
import { useRouter } from 'next/navigation'
import Sidebar from '../../components/Sidebar'

export default function Dashboard() {
  const [user, setUser] = useState(null)
  const [stats, setStats] = useState({ patients: 0, tasks: 0, revenue: 0 })
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      setUser(user)

      const [{ count: patients }, { count: tasks }, { data: financials }] = await Promise.all([
        supabase.from('patients').select('*', { count: 'exact', head: true }),
        supabase.from('staff_tasks').select('*', { count: 'exact', head: true }).eq('status', 'open'),
        supabase.from('financials').select('amount').eq('entry_type', 'revenue')
      ])

      const revenue = financials?.reduce((sum, r) => sum + Number(r.amount), 0) || 0
      setStats({ patients: patients || 0, tasks: tasks || 0, revenue })
    }
    load()
  }, [])

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <div className="border-b border-gray-800 px-6 py-4 flex items-center justify-between">
        <h1 className="text-lg font-semibold">Practice Founder</h1>
        <button onClick={handleLogout} className="text-sm text-gray-400 hover:text-white transition">
          Sign out
        </button>
      </div>

      <div className="flex">
        <Sidebar active="Dashboard" />

        <main className="flex-1 p-8">
          <h2 className="text-xl font-semibold mb-1">Overview</h2>
          <p className="text-gray-400 text-sm mb-8">Welcome back, {user?.email}</p>

          <div className="grid grid-cols-3 gap-4 mb-8">
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
              <p className="text-gray-400 text-sm mb-1">Total Patients</p>
              <p className="text-3xl font-semibold">{stats.patients}</p>
            </div>
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
              <p className="text-gray-400 text-sm mb-1">Open Tasks</p>
              <p className="text-3xl font-semibold">{stats.tasks}</p>
            </div>
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
              <p className="text-gray-400 text-sm mb-1">Total Revenue</p>
              <p className="text-3xl font-semibold">${stats.revenue.toLocaleString()}</p>
            </div>
          </div>

          <div className="bg-amber-950 border border-amber-800 rounded-xl p-4 text-sm text-amber-300">
            ⚠️ This system contains protected health information (PHI). All access is logged and monitored in compliance with HIPAA regulations.
          </div>
        </main>
      </div>
    </div>
  )
}