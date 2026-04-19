'use client'

import { useEffect, useState } from 'react'
import { createClient } from '../../utils/supabase'
import { useRouter } from 'next/navigation'
import Sidebar from '../../components/Sidebar'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts'

export default function Dashboard() {
  const [user, setUser] = useState(null)
  const [stats, setStats] = useState({ patients: 0, tasks: 0, revenue: 0 })
  const [revenueData, setRevenueData] = useState([])
  const [patientData, setPatientData] = useState([])
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      setUser(user)

      const [{ count: patients }, { count: tasks }, { data: financials }, { data: patientRecords }] = await Promise.all([
        supabase.from('patients').select('*', { count: 'exact', head: true }),
        supabase.from('staff_tasks').select('*', { count: 'exact', head: true }).eq('status', 'open'),
        supabase.from('financials').select('amount, entry_date, entry_type'),
        supabase.from('patients').select('created_at')
      ])

      const revenue = financials?.filter(f => f.entry_type === 'revenue').reduce((sum, r) => sum + Number(r.amount), 0) || 0
      setStats({ patients: patients || 0, tasks: tasks || 0, revenue })

      // Build revenue chart data by month
      const revenueByMonth = {}
      financials?.filter(f => f.entry_type === 'revenue').forEach(f => {
        const month = new Date(f.entry_date).toLocaleDateString('en-US', { month: 'short', year: '2-digit' })
        revenueByMonth[month] = (revenueByMonth[month] || 0) + Number(f.amount)
      })
      setRevenueData(Object.entries(revenueByMonth).map(([month, revenue]) => ({ month, revenue })))

      // Build patient growth data by month
      const patientsByMonth = {}
      patientRecords?.forEach(p => {
        const month = new Date(p.created_at).toLocaleDateString('en-US', { month: 'short', year: '2-digit' })
        patientsByMonth[month] = (patientsByMonth[month] || 0) + 1
      })
      setPatientData(Object.entries(patientsByMonth).map(([month, count]) => ({ month, count })))
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
        <h1 className="text-lg font-semibold">MedDesk</h1>
        <button onClick={handleLogout} className="text-sm text-gray-400 hover:text-white transition">
          Sign out
        </button>
      </div>

      <div className="flex">
        <Sidebar active="Dashboard" />

        <main className="flex-1 p-8">
          <h2 className="text-xl font-semibold mb-1">Overview</h2>
          <p className="text-gray-400 text-sm mb-8">Welcome back, {user?.email}</p>

          {/* KPI Cards */}
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

          {/* Charts */}
          <div className="grid grid-cols-2 gap-6 mb-8">
            {/* Revenue Chart */}
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
              <h3 className="text-sm font-medium text-gray-300 mb-4">Revenue Over Time</h3>
              {revenueData.length > 0 ? (
                <ResponsiveContainer width="100%" height={200}>
                  <AreaChart data={revenueData}>
                    <defs>
                      <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                    <XAxis dataKey="month" tick={{ fill: '#6b7280', fontSize: 11 }} />
                    <YAxis tick={{ fill: '#6b7280', fontSize: 11 }} />
                    <Tooltip contentStyle={{ backgroundColor: '#111827', border: '1px solid #374151', borderRadius: '8px' }} />
                    <Area type="monotone" dataKey="revenue" stroke="#3b82f6" fill="url(#revenueGrad)" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-48 flex items-center justify-center text-gray-600 text-sm">No revenue data yet</div>
              )}
            </div>

            {/* Patient Growth Chart */}
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
              <h3 className="text-sm font-medium text-gray-300 mb-4">Patient Growth</h3>
              {patientData.length > 0 ? (
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={patientData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                    <XAxis dataKey="month" tick={{ fill: '#6b7280', fontSize: 11 }} />
                    <YAxis tick={{ fill: '#6b7280', fontSize: 11 }} />
                    <Tooltip contentStyle={{ backgroundColor: '#111827', border: '1px solid #374151', borderRadius: '8px' }} />
                    <Bar dataKey="count" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-48 flex items-center justify-center text-gray-600 text-sm">No patient data yet</div>
              )}
            </div>
          </div>

          {/* HIPAA Notice */}
          <div className="bg-amber-950 border border-amber-800 rounded-xl p-4 text-sm text-amber-300">
            ⚠️ This system contains protected health information (PHI). All access is logged and monitored in compliance with HIPAA regulations.
          </div>
        </main>
      </div>
    </div>
  )
}