'use client'

import { useEffect, useState } from 'react'
import { createClient } from '../../utils/supabase'
import { useRouter } from 'next/navigation'
import Sidebar from '../../components/Sidebar'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, LineChart, Line } from 'recharts'

export default function Dashboard() {
  const [user, setUser] = useState(null)
  const [stats, setStats] = useState({ patients: 0, tasks: 0, revenue: 0 })
  const [revenueData, setRevenueData] = useState([])
  const [patientData, setPatientData] = useState([])
  const [insight, setInsight] = useState(null)
  const [loadingInsight, setLoadingInsight] = useState(false)
  const [chartType, setChartType] = useState('area')
  const [sidebarOpen, setSidebarOpen] = useState(false)
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

      const revenueByMonth = {}
      financials?.filter(f => f.entry_type === 'revenue').forEach(f => {
        const month = new Date(f.entry_date).toLocaleDateString('en-US', { month: 'short', year: '2-digit' })
        revenueByMonth[month] = (revenueByMonth[month] || 0) + Number(f.amount)
      })
      setRevenueData(Object.entries(revenueByMonth).map(([month, revenue]) => ({ month, revenue })))

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

  async function generateInsight() {
    setLoadingInsight(true)
    const { data: financials } = await supabase.from('financials').select('*').limit(10)
    const { data: patients } = await supabase.from('patients').select('*').limit(10)
    const res = await fetch('/api/insights', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ stats, financials, patients })
    })
    const data = await res.json()
    setInsight(data.insight)
    setLoadingInsight(false)
  }

  const chartToggle = (color) => (
    <div className="flex gap-1">
      {['area', 'bar', 'line'].map(type => (
        <button key={type} onClick={() => setChartType(type)}
          className={`text-xs px-2 py-1 rounded capitalize transition ${chartType === type ? `bg-${color}-600 text-white` : 'bg-gray-800 text-gray-400 hover:text-white'}`}>
          {type}
        </button>
      ))}
    </div>
  )

  const RevenueChart = () => {
    if (chartType === 'bar') return <BarChart data={revenueData}><CartesianGrid strokeDasharray="3 3" stroke="#1f2937" /><XAxis dataKey="month" tick={{ fill: '#6b7280', fontSize: 11 }} /><YAxis tick={{ fill: '#6b7280', fontSize: 11 }} /><Tooltip contentStyle={{ backgroundColor: '#111827', border: '1px solid #374151', borderRadius: '8px' }} /><Bar dataKey="revenue" fill="#3b82f6" radius={[4,4,0,0]} /></BarChart>
    if (chartType === 'line') return <LineChart data={revenueData}><CartesianGrid strokeDasharray="3 3" stroke="#1f2937" /><XAxis dataKey="month" tick={{ fill: '#6b7280', fontSize: 11 }} /><YAxis tick={{ fill: '#6b7280', fontSize: 11 }} /><Tooltip contentStyle={{ backgroundColor: '#111827', border: '1px solid #374151', borderRadius: '8px' }} /><Line type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={2} dot={{ fill: '#3b82f6' }} /></LineChart>
    return <AreaChart data={revenueData}><defs><linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/><stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/></linearGradient></defs><CartesianGrid strokeDasharray="3 3" stroke="#1f2937" /><XAxis dataKey="month" tick={{ fill: '#6b7280', fontSize: 11 }} /><YAxis tick={{ fill: '#6b7280', fontSize: 11 }} /><Tooltip contentStyle={{ backgroundColor: '#111827', border: '1px solid #374151', borderRadius: '8px' }} /><Area type="monotone" dataKey="revenue" stroke="#3b82f6" fill="url(#revenueGrad)" strokeWidth={2} /></AreaChart>
  }

  const PatientChart = () => {
    if (chartType === 'area') return <AreaChart data={patientData}><defs><linearGradient id="patientGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/><stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/></linearGradient></defs><CartesianGrid strokeDasharray="3 3" stroke="#1f2937" /><XAxis dataKey="month" tick={{ fill: '#6b7280', fontSize: 11 }} /><YAxis tick={{ fill: '#6b7280', fontSize: 11 }} /><Tooltip contentStyle={{ backgroundColor: '#111827', border: '1px solid #374151', borderRadius: '8px' }} /><Area type="monotone" dataKey="count" stroke="#8b5cf6" fill="url(#patientGrad)" strokeWidth={2} /></AreaChart>
    if (chartType === 'line') return <LineChart data={patientData}><CartesianGrid strokeDasharray="3 3" stroke="#1f2937" /><XAxis dataKey="month" tick={{ fill: '#6b7280', fontSize: 11 }} /><YAxis tick={{ fill: '#6b7280', fontSize: 11 }} /><Tooltip contentStyle={{ backgroundColor: '#111827', border: '1px solid #374151', borderRadius: '8px' }} /><Line type="monotone" dataKey="count" stroke="#8b5cf6" strokeWidth={2} dot={{ fill: '#8b5cf6' }} /></LineChart>
    return <BarChart data={patientData}><CartesianGrid strokeDasharray="3 3" stroke="#1f2937" /><XAxis dataKey="month" tick={{ fill: '#6b7280', fontSize: 11 }} /><YAxis tick={{ fill: '#6b7280', fontSize: 11 }} /><Tooltip contentStyle={{ backgroundColor: '#111827', border: '1px solid #374151', borderRadius: '8px' }} /><Bar dataKey="count" fill="#8b5cf6" radius={[4,4,0,0]} /></BarChart>
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white">

      {/* Top nav */}
      <div className="border-b border-gray-800 px-4 sm:px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="sm:hidden text-gray-400 hover:text-white">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <h1 className="text-lg font-semibold">MedDesk</h1>
        </div>
        <button onClick={handleLogout} className="text-sm text-gray-400 hover:text-white transition">Sign out</button>
      </div>

      <div className="flex relative">

        {sidebarOpen && (
          <div className="fixed inset-0 bg-black/60 z-20 sm:hidden" onClick={() => setSidebarOpen(false)} />
        )}

        <div className={`fixed sm:static z-30 sm:z-auto h-full sm:h-auto transition-transform duration-200 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full sm:translate-x-0'}`}>
          <Sidebar active="Dashboard" />
        </div>

        <main className="flex-1 p-4 sm:p-8 min-w-0">
          <h2 className="text-xl font-semibold mb-1">Overview</h2>
          <p className="text-gray-400 text-sm mb-6 sm:mb-8 truncate">Welcome back, {user?.email}</p>

          {/* KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6 sm:mb-8">
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

          {/* AI Insights */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 sm:p-5 mb-6 sm:mb-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-3">
              <div>
                <h3 className="text-sm font-medium text-gray-300">AI Practice Insights</h3>
                <p className="text-xs text-gray-500 mt-0.5">Powered by GPT-4o mini</p>
              </div>
              <button onClick={generateInsight} disabled={loadingInsight}
                className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs px-3 py-1.5 rounded-lg transition self-start sm:self-auto">
                {loadingInsight ? 'Analyzing...' : '✨ Generate Insight'}
              </button>
            </div>
            {insight ? (
              <p className="text-gray-300 text-sm leading-relaxed">{insight}</p>
            ) : (
              <p className="text-gray-600 text-sm">Click "Generate Insight" to get an AI-powered summary of this practice's performance.</p>
            )}
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6 sm:mb-8">

            {/* Revenue Chart */}
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 sm:p-5">
              <div className="flex items-center justify-between mb-4 gap-2">
                <h3 className="text-sm font-medium text-gray-300 truncate">Revenue Over Time</h3>
                <div className="flex gap-1 flex-shrink-0">
                  {['area', 'bar', 'line'].map(type => (
                    <button key={type} onClick={() => setChartType(type)}
                      className={`text-xs px-2 py-1 rounded capitalize transition ${chartType === type ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-400 hover:text-white'}`}>
                      {type}
                    </button>
                  ))}
                </div>
              </div>
              {revenueData.length > 0 ? (
                <ResponsiveContainer width="100%" height={200}>
                  <RevenueChart />
                </ResponsiveContainer>
              ) : (
                <div className="h-48 flex items-center justify-center text-gray-600 text-sm">No revenue data yet</div>
              )}
            </div>

            {/* Patient Growth Chart */}
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 sm:p-5">
              <div className="flex items-center justify-between mb-4 gap-2">
                <h3 className="text-sm font-medium text-gray-300 truncate">Patient Growth</h3>
                <div className="flex gap-1 flex-shrink-0">
                  {['bar', 'area', 'line'].map(type => (
                    <button key={type} onClick={() => setChartType(type)}
                      className={`text-xs px-2 py-1 rounded capitalize transition ${chartType === type ? 'bg-purple-600 text-white' : 'bg-gray-800 text-gray-400 hover:text-white'}`}>
                      {type}
                    </button>
                  ))}
                </div>
              </div>
              {patientData.length > 0 ? (
                <ResponsiveContainer width="100%" height={200}>
                  <PatientChart />
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