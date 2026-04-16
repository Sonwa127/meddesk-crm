'use client'

import { useEffect, useState } from 'react'
import { createClient } from '../../utils/supabase'
import { useRouter } from 'next/navigation'
import Sidebar from '../../components/Sidebar'

export default function KPIsPage() {
  const [kpis, setKpis] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState({
    period_type: 'monthly',
    period_start: '',
    period_end: '',
    total_revenue: '',
    total_collections: '',
    total_expenses: '',
    payroll_percentage: '',
    active_patients: '',
    new_patients: '',
    billing_rate: '',
    notes: ''
  })
  const [saving, setSaving] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      const { data } = await supabase.from('kpis').select('*').order('period_start', { ascending: false })
      setKpis(data || [])
      setLoading(false)
    }
    load()
  }, [])

  async function handleSubmit(e) {
    e.preventDefault()
    setSaving(true)
    const payload = {
      ...form,
      total_revenue: parseFloat(form.total_revenue) || 0,
      total_collections: parseFloat(form.total_collections) || 0,
      total_expenses: parseFloat(form.total_expenses) || 0,
      payroll_percentage: parseFloat(form.payroll_percentage) || 0,
      active_patients: parseInt(form.active_patients) || 0,
      new_patients: parseInt(form.new_patients) || 0,
      billing_rate: parseFloat(form.billing_rate) || 0,
    }
    if (editingId) {
      await supabase.from('kpis').update(payload).eq('id', editingId)
    } else {
      const { data: { user } } = await supabase.auth.getUser()
      const { data: userData } = await supabase.from('users').select('org_id').eq('id', user.id).maybeSingle()
      if (!userData) { setSaving(false); return }
      const { error } = await supabase.from('kpis').insert({ ...payload, org_id: userData.org_id, created_by: user.id })
      if (error) { console.error('Insert error:', error); setSaving(false); return }
    }
    const { data } = await supabase.from('kpis').select('*').order('period_start', { ascending: false })
    setKpis(data || [])
    setForm({ period_type: 'monthly', period_start: '', period_end: '', total_revenue: '', total_collections: '', total_expenses: '', payroll_percentage: '', active_patients: '', new_patients: '', billing_rate: '', notes: '' })
    setEditingId(null)
    setShowForm(false)
    setSaving(false)
  }

  function handleEdit(k) {
    setForm({
      period_type: k.period_type,
      period_start: k.period_start,
      period_end: k.period_end,
      total_revenue: k.total_revenue,
      total_collections: k.total_collections,
      total_expenses: k.total_expenses,
      payroll_percentage: k.payroll_percentage,
      active_patients: k.active_patients,
      new_patients: k.new_patients,
      billing_rate: k.billing_rate,
      notes: k.notes || ''
    })
    setEditingId(k.id)
    setShowForm(true)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  async function handleDelete(id) {
    if (!confirm('Delete this KPI snapshot?')) return
    await supabase.from('kpis').delete().eq('id', id)
    setKpis(kpis.filter(k => k.id !== id))
  }

  const latest = kpis[0]

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <div className="border-b border-gray-800 px-6 py-4 flex items-center justify-between">
        <h1 className="text-lg font-semibold">meddesk</h1>
        <button onClick={() => { supabase.auth.signOut(); router.push('/login') }} className="text-sm text-gray-400 hover:text-white">Sign out</button>
      </div>

      <div className="flex">
        <Sidebar active="KPIs" />

        <main className="flex-1 p-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-semibold">KPIs</h2>
              <p className="text-gray-400 text-sm">Practice performance snapshots</p>
            </div>
            <button onClick={() => { setShowForm(!showForm); setEditingId(null); setForm({ period_type: 'monthly', period_start: '', period_end: '', total_revenue: '', total_collections: '', total_expenses: '', payroll_percentage: '', active_patients: '', new_patients: '', billing_rate: '', notes: '' }) }}
              className="bg-blue-600 hover:bg-blue-700 text-white text-sm px-4 py-2 rounded-lg transition">
              + Add Snapshot
            </button>
          </div>

          {latest && (
            <div className="grid grid-cols-4 gap-4 mb-6">
              {[
                ['Revenue', `$${Number(latest.total_revenue).toLocaleString()}`, 'text-green-400'],
                ['Collections', `$${Number(latest.total_collections).toLocaleString()}`, 'text-blue-400'],
                ['Expenses', `$${Number(latest.total_expenses).toLocaleString()}`, 'text-red-400'],
                ['Payroll %', `${latest.payroll_percentage}%`, 'text-amber-400'],
                ['Active Patients', latest.active_patients, 'text-white'],
                ['New Patients', latest.new_patients, 'text-white'],
                ['Billing Rate', `${latest.billing_rate}%`, 'text-purple-400'],
              ].map(([label, value, color]) => (
                <div key={label} className="bg-gray-900 border border-gray-800 rounded-xl p-4">
                  <p className="text-gray-400 text-xs mb-1">{label}</p>
                  <p className={`text-xl font-semibold ${color}`}>{value}</p>
                </div>
              ))}
            </div>
          )}

          {showForm && (
            <form onSubmit={handleSubmit} className="bg-gray-900 border border-gray-800 rounded-xl p-6 mb-6 grid grid-cols-3 gap-4">
              <div className="col-span-3 text-sm font-medium text-gray-300 mb-1">{editingId ? 'Edit Snapshot' : 'New KPI Snapshot'}</div>
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Period Type</label>
                <select value={form.period_type} onChange={e => setForm({ ...form, period_type: e.target.value })}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none">
                  <option value="monthly">Monthly</option>
                  <option value="weekly">Weekly</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Period Start</label>
                <input type="date" value={form.period_start} onChange={e => setForm({ ...form, period_start: e.target.value })}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500" required />
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Period End</label>
                <input type="date" value={form.period_end} onChange={e => setForm({ ...form, period_end: e.target.value })}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500" required />
              </div>
              {[
                ['total_revenue', 'Total Revenue ($)'],
                ['total_collections', 'Total Collections ($)'],
                ['total_expenses', 'Total Expenses ($)'],
                ['payroll_percentage', 'Payroll %'],
                ['active_patients', 'Active Patients'],
                ['new_patients', 'New Patients'],
                ['billing_rate', 'Billing Rate %'],
              ].map(([field, label]) => (
                <div key={field}>
                  <label className="text-xs text-gray-400 mb-1 block">{label}</label>
                  <input type="number" step="0.01" value={form[field]} onChange={e => setForm({ ...form, [field]: e.target.value })}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500" />
                </div>
              ))}
              <div className="col-span-3">
                <label className="text-xs text-gray-400 mb-1 block">Notes</label>
                <input type="text" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500" />
              </div>
              <div className="col-span-3 flex gap-3 justify-end">
                <button type="button" onClick={() => { setShowForm(false); setEditingId(null) }} className="text-sm text-gray-400 hover:text-white px-4 py-2">Cancel</button>
                <button type="submit" disabled={saving} className="bg-blue-600 hover:bg-blue-700 text-white text-sm px-4 py-2 rounded-lg">
                  {saving ? 'Saving...' : editingId ? 'Update Snapshot' : 'Save Snapshot'}
                </button>
              </div>
            </form>
          )}

          <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-800 text-gray-400 text-left">
                  <th className="px-4 py-3 font-medium">Period</th>
                  <th className="px-4 py-3 font-medium">Type</th>
                  <th className="px-4 py-3 font-medium">Revenue</th>
                  <th className="px-4 py-3 font-medium">Expenses</th>
                  <th className="px-4 py-3 font-medium">Patients</th>
                  <th className="px-4 py-3 font-medium">Payroll %</th>
                  <th className="px-4 py-3 font-medium"></th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-500">Loading...</td></tr>
                ) : kpis.length === 0 ? (
                  <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-500">No snapshots yet. Add your first one.</td></tr>
                ) : kpis.map(k => (
                  <tr key={k.id} className="border-b border-gray-800 hover:bg-gray-800 transition">
                    <td className="px-4 py-3 text-gray-400">{k.period_start} → {k.period_end}</td>
                    <td className="px-4 py-3 capitalize text-gray-400">{k.period_type}</td>
                    <td className="px-4 py-3 text-green-400">${Number(k.total_revenue).toLocaleString()}</td>
                    <td className="px-4 py-3 text-red-400">${Number(k.total_expenses).toLocaleString()}</td>
                    <td className="px-4 py-3 text-gray-400">{k.active_patients} active / {k.new_patients} new</td>
                    <td className="px-4 py-3 text-amber-400">{k.payroll_percentage}%</td>
                    <td className="px-4 py-3 text-right flex gap-2 justify-end">
                      <button onClick={() => handleEdit(k)} className="text-xs text-blue-400 hover:text-blue-300 px-2 py-1 rounded hover:bg-gray-700 transition">Edit</button>
                      <button onClick={() => handleDelete(k.id)} className="text-xs text-red-400 hover:text-red-300 px-2 py-1 rounded hover:bg-gray-700 transition">Delete</button>
                    </td>
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