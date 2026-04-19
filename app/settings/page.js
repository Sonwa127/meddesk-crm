'use client'

import { useEffect, useState } from 'react'
import { createClient } from '../../utils/supabase'
import { useRouter } from 'next/navigation'
import Sidebar from '../../components/Sidebar'

export default function SettingsPage() {
  const [org, setOrg] = useState(null)
  const [user, setUser] = useState(null)
  const [orgForm, setOrgForm] = useState({ name: '', email: '', phone: '', address: '' })
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      setUser(user)
      const { data: userData } = await supabase.from('users').select('org_id, full_name, role').eq('id', user.id).maybeSingle()
      if (!userData) return
      const { data: orgData } = await supabase.from('organizations').select('*').eq('id', userData.org_id).single()
      setOrg(orgData)
      setOrgForm({ name: orgData.name || '', email: orgData.email || '', phone: orgData.phone || '', address: orgData.address || '' })
    }
    load()
  }, [])

  async function handleSave(e) {
    e.preventDefault()
    setSaving(true)
    await supabase.from('organizations').update(orgForm).eq('id', org.id)
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
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
        <button onClick={() => { supabase.auth.signOut(); router.push('/login') }} className="text-sm text-gray-400 hover:text-white">Sign out</button>
      </div>

      <div className="flex relative">

        {sidebarOpen && (
          <div className="fixed inset-0 bg-black/60 z-20 sm:hidden" onClick={() => setSidebarOpen(false)} />
        )}

        <div className={`fixed sm:static z-30 sm:z-auto h-full sm:h-auto transition-transform duration-200 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full sm:translate-x-0'}`}>
          <Sidebar active="Settings" />
        </div>

        <main className="flex-1 p-4 sm:p-8 min-w-0">
          <div className="max-w-2xl">
            <h2 className="text-xl font-semibold mb-1">Settings</h2>
            <p className="text-gray-400 text-sm mb-6 sm:mb-8">Manage your practice information</p>

            {/* Practice Info */}
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 sm:p-6 mb-6">
              <h3 className="text-sm font-medium text-gray-300 mb-4">Practice Information</h3>
              <form onSubmit={handleSave} className="space-y-4">
                {[
                  ['name', 'Practice Name', 'text'],
                  ['email', 'Contact Email', 'email'],
                  ['phone', 'Phone Number', 'text'],
                  ['address', 'Address', 'text'],
                ].map(([field, label, type]) => (
                  <div key={field}>
                    <label className="text-xs text-gray-400 mb-1 block">{label}</label>
                    <input type={type} value={orgForm[field]} onChange={e => setOrgForm({ ...orgForm, [field]: e.target.value })}
                      className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500" />
                  </div>
                ))}
                <div className="flex flex-wrap items-center gap-3 pt-2">
                  <button type="submit" disabled={saving}
                    className="bg-blue-600 hover:bg-blue-700 text-white text-sm px-4 py-2 rounded-lg transition">
                    {saving ? 'Saving...' : 'Save Changes'}
                  </button>
                  {saved && <span className="text-green-400 text-sm">✓ Saved successfully</span>}
                </div>
              </form>
            </div>

            {/* Account Info */}
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 sm:p-6 mb-6">
              <h3 className="text-sm font-medium text-gray-300 mb-4">Account</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between py-2 border-b border-gray-800 gap-4">
                  <span className="text-xs text-gray-500 flex-shrink-0">Email</span>
                  <span className="text-sm text-gray-300 truncate">{user?.email}</span>
                </div>
                <div className="flex items-center justify-between py-2">
                  <span className="text-xs text-gray-500">Plan</span>
                  <span className="text-xs bg-blue-950 text-blue-400 px-2 py-0.5 rounded-full">Free</span>
                </div>
              </div>
            </div>

            {/* HIPAA / Compliance */}
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 sm:p-6">
              <h3 className="text-sm font-medium text-gray-300 mb-4">Compliance</h3>
              <div className="space-y-3">
                {[
                  ['HIPAA Audit Logging', 'Active', 'text-green-400'],
                  ['Row Level Security', 'Enabled', 'text-green-400'],
                  ['Data Encryption', 'At rest + in transit', 'text-green-400'],
                  ['BAA Status', 'Required for production PHI', 'text-amber-400'],
                ].map(([label, value, color]) => (
                  <div key={label} className="flex items-center justify-between py-2 border-b border-gray-800 last:border-0 gap-4">
                    <span className="text-xs text-gray-500">{label}</span>
                    <span className={`text-xs font-medium text-right ${color}`}>{value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}