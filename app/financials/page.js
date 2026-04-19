'use client'

import { useEffect, useState } from 'react'
import { createClient } from '../../utils/supabase'
import { useRouter } from 'next/navigation'
import Sidebar from '../../components/Sidebar'

export default function FinancialsPage() {
  const [entries, setEntries] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState({ entry_type: 'revenue', amount: '', description: '', entry_date: new Date().toISOString().split('T')[0] })
  const [saving, setSaving] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      const { data } = await supabase.from('financials').select('*').order('entry_date', { ascending: false })
      setEntries(data || [])
      setLoading(false)
    }
    load()
  }, [])

  async function handleSubmit(e) {
    e.preventDefault()
    setSaving(true)
    if (editingId) {
      await supabase.from('financials').update({ ...form, amount: parseFloat(form.amount) }).eq('id', editingId)
    } else {
      const { data: { user } } = await supabase.auth.getUser()
      const { data: userData } = await supabase.from('users').select('org_id').eq('id', user.id).maybeSingle()
      if (!userData) { setSaving(false); return }
      const { error: insertError } = await supabase.from('financials').insert({ ...form, amount: parseFloat(form.amount), org_id: userData.org_id, recorded_by: user.id })
      if (insertError) { console.error('Insert error:', insertError); setSaving(false); return }
    }
    const { data } = await supabase.from('financials').select('*').order('entry_date', { ascending: false })
    setEntries(data || [])
    setForm({ entry_type: 'revenue', amount: '', description: '', entry_date: new Date().toISOString().split('T')[0] })
    setEditingId(null)
    setShowForm(false)
    setSaving(false)
  }

  function handleEdit(entry) {
    setForm({ entry_type: entry.entry_type, amount: entry.amount, description: entry.description || '', entry_date: entry.entry_date })
    setEditingId(entry.id)
    setShowForm(true)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  async function handleDelete(id) {
    if (!confirm('Delete this entry?')) return
    await supabase.from('financials').delete().eq('id', id)
    setEntries(entries.filter(e => e.id !== id))
  }

  function exportCSV() {
    const headers = ['Date', 'Type', 'Description', 'Amount']
    const rows = entries.map(e => [e.entry_date, e.entry_type, e.description || '', e.amount])
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = 'financials.csv'; a.click()
    URL.revokeObjectURL(url)
  }

  const typeColor = {
    revenue: 'text-green-400', collection: 'text-blue-400',
    billing: 'text-purple-400', expense: 'text-red-400', payroll: 'text-amber-400'
  }

  const totalRevenue = entries.filter(e => e.entry_type === 'revenue').reduce((sum, e) => sum + Number(e.amount), 0)
  const totalExpenses = entries.filter(e => ['expense', 'payroll'].includes(e.entry_type)).reduce((sum, e) => sum + Number(e.amount), 0)
  const netProfit = totalRevenue - totalExpenses

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
        <button onClick={() => { supabase.auth.signOut(); router.push('/login') }} className="text-sm text-gray-400 hover:text-white">Sign out</button>
      </div>

      <div className="flex relative">

        {sidebarOpen && (
          <div className="fixed inset-0 bg-black/60 z-20 sm:hidden" onClick={() => setSidebarOpen(false)} />
        )}

        <div className={`fixed sm:static z-30 sm:z-auto h-full sm:h-auto transition-transform duration-200 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full sm:translate-x-0'}`}>
          <Sidebar active="Financials" />
        </div>

        <main className="flex-1 p-4 sm:p-8 min-w-0">

          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
            <div>
              <h2 className="text-xl font-semibold">Financials</h2>
              <p className="text-gray-400 text-sm">{entries.length} entries</p>
            </div>
            <div className="flex gap-2">
              <button onClick={exportCSV}
                className="border border-gray-700 hover:border-gray-500 text-gray-300 text-sm px-4 py-2 rounded-lg transition">
                Export CSV
              </button>
              <button onClick={() => { setShowForm(!showForm); setEditingId(null); setForm({ entry_type: 'revenue', amount: '', description: '', entry_date: new Date().toISOString().split('T')[0] }) }}
                className="bg-blue-600 hover:bg-blue-700 text-white text-sm px-4 py-2 rounded-lg transition">
                + Add Entry
              </button>
            </div>
          </div>

          {/* KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
              <p className="text-gray-400 text-sm mb-1">Total Revenue</p>
              <p className="text-2xl font-semibold text-green-400">${totalRevenue.toLocaleString()}</p>
            </div>
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
              <p className="text-gray-400 text-sm mb-1">Total Expenses</p>
              <p className="text-2xl font-semibold text-red-400">${totalExpenses.toLocaleString()}</p>
            </div>
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
              <p className="text-gray-400 text-sm mb-1">Net Profit</p>
              <p className={`text-2xl font-semibold ${netProfit >= 0 ? 'text-green-400' : 'text-red-400'}`}>${netProfit.toLocaleString()}</p>
            </div>
          </div>

          {/* Form */}
          {showForm && (
            <form onSubmit={handleSubmit} className="bg-gray-900 border border-gray-800 rounded-xl p-4 sm:p-6 mb-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="col-span-1 sm:col-span-2 text-sm font-medium text-gray-300 mb-1">
                {editingId ? 'Edit Entry' : 'New Entry'}
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Type</label>
                <select value={form.entry_type} onChange={e => setForm({ ...form, entry_type: e.target.value })}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none">
                  <option value="revenue">Revenue</option>
                  <option value="collection">Collection</option>
                  <option value="billing">Billing</option>
                  <option value="expense">Expense</option>
                  <option value="payroll">Payroll</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Amount ($)</label>
                <input type="number" step="0.01" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500" required />
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Date</label>
                <input type="date" value={form.entry_date} onChange={e => setForm({ ...form, entry_date: e.target.value })}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500" />
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Description</label>
                <input type="text" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500" />
              </div>
              <div className="col-span-1 sm:col-span-2 flex gap-3 justify-end">
                <button type="button" onClick={() => { setShowForm(false); setEditingId(null) }} className="text-sm text-gray-400 hover:text-white px-4 py-2">Cancel</button>
                <button type="submit" disabled={saving} className="bg-blue-600 hover:bg-blue-700 text-white text-sm px-4 py-2 rounded-lg">
                  {saving ? 'Saving...' : editingId ? 'Update Entry' : 'Save Entry'}
                </button>
              </div>
            </form>
          )}

          {/* Table — scrollable on mobile */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[500px]">
                <thead>
                  <tr className="border-b border-gray-800 text-gray-400 text-left">
                    <th className="px-4 py-3 font-medium">Date</th>
                    <th className="px-4 py-3 font-medium">Type</th>
                    <th className="px-4 py-3 font-medium">Description</th>
                    <th className="px-4 py-3 font-medium">Amount</th>
                    <th className="px-4 py-3 font-medium"></th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-500">Loading...</td></tr>
                  ) : entries.length === 0 ? (
                    <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-500">No entries yet. Add your first one.</td></tr>
                  ) : entries.map(e => (
                    <tr key={e.id} className="border-b border-gray-800 hover:bg-gray-800 transition">
                      <td className="px-4 py-3 text-gray-400 whitespace-nowrap">{e.entry_date}</td>
                      <td className={`px-4 py-3 capitalize font-medium whitespace-nowrap ${typeColor[e.entry_type]}`}>{e.entry_type}</td>
                      <td className="px-4 py-3 text-gray-400 max-w-[160px] truncate">{e.description || '—'}</td>
                      <td className="px-4 py-3 font-medium whitespace-nowrap">${Number(e.amount).toLocaleString()}</td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex gap-2 justify-end">
                          <button onClick={() => handleEdit(e)} className="text-xs text-blue-400 hover:text-blue-300 px-2 py-1 rounded hover:bg-gray-700 transition">Edit</button>
                          <button onClick={() => handleDelete(e.id)} className="text-xs text-red-400 hover:text-red-300 px-2 py-1 rounded hover:bg-gray-700 transition">Delete</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </main>
      </div>
    </div>
  )
}