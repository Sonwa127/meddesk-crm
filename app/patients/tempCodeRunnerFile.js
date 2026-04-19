'use client'

import { useEffect, useState } from 'react'
import { createClient } from '../../utils/supabase'
import { useRouter } from 'next/navigation'
import Sidebar from '../../components/Sidebar'

export default function PatientsPage() {
  const [patients, setPatients] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState({ full_name: '', dob: '', gender: '', email: '', phone: '', membership_status: 'active' })
  const [saving, setSaving] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      const { data } = await supabase.from('patients').select('*').order('created_at', { ascending: false })
      setPatients(data || [])
      setLoading(false)
    }
    load()
  }, [])

  async function handleSubmit(e) {
    e.preventDefault()
    setSaving(true)
    if (editingId) {
      await supabase.from('patients').update(form).eq('id', editingId)
    } else {
      const { data: { user } } = await supabase.auth.getUser()
      const { data: userData } = await supabase.from('users').select('org_id').eq('id', user.id).maybeSingle()
      if (!userData) { setSaving(false); return }
      await supabase.from('patients').insert({ ...form, org_id: userData.org_id, created_by: user.id })
    }
    const { data } = await supabase.from('patients').select('*').order('created_at', { ascending: false })
    setPatients(data || [])
    setForm({ full_name: '', dob: '', gender: '', email: '', phone: '', membership_status: 'active' })
    setEditingId(null)
    setShowForm(false)
    setSaving(false)
  }

  function handleEdit(p) {
    setForm({ full_name: p.full_name, dob: p.dob || '', gender: p.gender || '', email: p.email || '', phone: p.phone || '', membership_status: p.membership_status })
    setEditingId(p.id)
    setShowForm(true)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  async function handleDelete(id) {
    if (!confirm('Delete this patient record?')) return
    await supabase.from('patients').delete().eq('id', id)
    setPatients(patients.filter(p => p.id !== id))
  }

  const statusColor = { active: 'text-green-400', inactive: 'text-red-400', pending: 'text-amber-400' }

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

        {/* Mobile overlay */}
        {sidebarOpen && (
          <div className="fixed inset-0 bg-black/60 z-20 sm:hidden" onClick={() => setSidebarOpen(false)} />
        )}

        {/* Sidebar */}
        <div className={`fixed sm:static z-30 sm:z-auto h-full sm:h-auto transition-transform duration-200 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full sm:translate-x-0'}`}>
          <Sidebar active="Patients" />
        </div>

        <main className="flex-1 p-4 sm:p-8 min-w-0">

          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-semibold">Patients</h2>
              <p className="text-gray-400 text-sm">{patients.length} total records</p>
            </div>
            <button
              onClick={() => { setShowForm(!showForm); setEditingId(null); setForm({ full_name: '', dob: '', gender: '', email: '', phone: '', membership_status: 'active' }) }}
              className="bg-blue-600 hover:bg-blue-700 text-white text-sm px-4 py-2 rounded-lg transition"
            >
              + Add Patient
            </button>
          </div>

          {/* Form */}
          {showForm && (
            <form onSubmit={handleSubmit} className="bg-gray-900 border border-gray-800 rounded-xl p-4 sm:p-6 mb-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="col-span-1 sm:col-span-2 text-sm font-medium text-gray-300 mb-1">
                {editingId ? 'Edit Patient' : 'New Patient'}
              </div>
              {[['full_name', 'Full Name', 'text'], ['dob', 'Date of Birth', 'date'], ['email', 'Email', 'email'], ['phone', 'Phone', 'text']].map(([field, label, type]) => (
                <div key={field}>
                  <label className="text-xs text-gray-400 mb-1 block">{label}</label>
                  <input
                    type={type}
                    value={form[field]}
                    onChange={e => setForm({ ...form, [field]: e.target.value })}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                  />
                </div>
              ))}
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Gender</label>
                <select value={form.gender} onChange={e => setForm({ ...form, gender: e.target.value })}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none">
                  <option value="">Select</option>
                  <option>Male</option><option>Female</option><option>Other</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Status</label>
                <select value={form.membership_status} onChange={e => setForm({ ...form, membership_status: e.target.value })}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none">
                  <option value="active">Active</option><option value="inactive">Inactive</option><option value="pending">Pending</option>
                </select>
              </div>
              <div className="col-span-1 sm:col-span-2 flex gap-3 justify-end">
                <button type="button" onClick={() => { setShowForm(false); setEditingId(null) }} className="text-sm text-gray-400 hover:text-white px-4 py-2">Cancel</button>
                <button type="submit" disabled={saving} className="bg-blue-600 hover:bg-blue-700 text-white text-sm px-4 py-2 rounded-lg">
                  {saving ? 'Saving...' : editingId ? 'Update Patient' : 'Save Patient'}
                </button>
              </div>
            </form>
          )}

          {/* Desktop table */}
          <div className="hidden sm:block bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-800 text-gray-400 text-left">
                  <th className="px-4 py-3 font-medium">Name</th>
                  <th className="px-4 py-3 font-medium">DOB</th>
                  <th className="px-4 py-3 font-medium">Email</th>
                  <th className="px-4 py-3 font-medium">Phone</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium"></th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-500">Loading...</td></tr>
                ) : patients.length === 0 ? (
                  <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-500">No patients yet. Add your first one.</td></tr>
                ) : patients.map(p => (
                  <tr key={p.id} className="border-b border-gray-800 hover:bg-gray-800 transition">
                    <td className="px-4 py-3 font-medium">
                      <span onClick={() => router.push(`/patients/${p.id}`)} className="hover:text-blue-400 cursor-pointer transition">{p.full_name}</span>
                    </td>
                    <td className="px-4 py-3 text-gray-400">{p.dob || '—'}</td>
                    <td className="px-4 py-3 text-gray-400">{p.email || '—'}</td>
                    <td className="px-4 py-3 text-gray-400">{p.phone || '—'}</td>
                    <td className={`px-4 py-3 capitalize font-medium ${statusColor[p.membership_status]}`}>{p.membership_status}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex gap-2 justify-end">
                        <button onClick={() => handleEdit(p)} className="text-xs text-blue-400 hover:text-blue-300 px-2 py-1 rounded hover:bg-gray-700 transition">Edit</button>
                        <button onClick={() => handleDelete(p.id)} className="text-xs text-red-400 hover:text-red-300 px-2 py-1 rounded hover:bg-gray-700 transition">Delete</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="sm:hidden space-y-3">
            {loading ? (
              <p className="text-center text-gray-500 py-8">Loading...</p>
            ) : patients.length === 0 ? (
              <p className="text-center text-gray-500 py-8">No patients yet. Add your first one.</p>
            ) : patients.map(p => (
              <div key={p.id} className="bg-gray-900 border border-gray-800 rounded-xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <span
                    onClick={() => router.push(`/patients/${p.id}`)}
                    className="font-medium text-sm hover:text-blue-400 cursor-pointer transition"
                  >
                    {p.full_name}
                  </span>
                  <span className={`text-xs font-medium capitalize ${statusColor[p.membership_status]}`}>● {p.membership_status}</span>
                </div>
                <div className="space-y-1 mb-3">
                  <p className="text-xs text-gray-500">{p.email || '—'}</p>
                  <p className="text-xs text-gray-500">{p.phone || '—'} · DOB: {p.dob || '—'}</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => handleEdit(p)} className="text-xs text-blue-400 hover:text-blue-300 px-3 py-1 rounded bg-gray-800 hover:bg-gray-700 transition">Edit</button>
                  <button onClick={() => handleDelete(p.id)} className="text-xs text-red-400 hover:text-red-300 px-3 py-1 rounded bg-gray-800 hover:bg-gray-700 transition">Delete</button>
                </div>
              </div>
            ))}
          </div>

        </main>
      </div>
    </div>
  )
}