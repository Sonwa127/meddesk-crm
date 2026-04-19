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
      setOrgForm({
        name: orgData.name || '',
        email: orgData.email || '',
        phone: orgData.phone || '',
        address: orgData.address || ''
      })
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
      <div className="border-b border-gray-800 px-6 py-4 flex items-center justify-between">
        <h1 className="text-lg font-semibold">MedDesk</h1>
        <button onClick={() => { supabase.auth.signOut(); router.push('/login') }} className="text-sm text-gray-400 hover:text-white">Sign out</button>
      </div>

      <div className="flex">
        <Sidebar active="Settings" />

        <main className="flex-1 p-8 max-w-2xl">
          <h2 className="text-xl font-semibold mb-1">Settings</h2>
          <p className="text-gray-400 text-sm mb-8">Manage your practice information</p>

          {/* Practice Info */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 mb-6">
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
              <div className="flex items-center gap-3 pt-2">
                <button type="submit" disabled={saving}
                  className="bg-blue-600 hover:bg-blue-700 text-white text-sm px-4 py-2 rounded-lg transition">
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
                {saved && <span className="text-green-400 text-sm">✓ Saved successfully</span>}
              </div>
            </form>
          </div>

          {/* Account Info */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 mb-6">
            <h3 className="text-sm font-medium text-gray-300 mb-4">Account</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between py-2 border-b border-gray-800">
                <span className="text-xs text-gray-500">Email</span>
                <span className="text-sm text-gray-300">{user?.email}</span>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-xs text-gray-500">Plan</span>
                <span className="text-xs bg-blue-950 text-blue-400 px-2 py-0.5 rounded-full">Free</span>
              </div>
            </div>
          </div>

          {/* HIPAA Info */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
            <h3 className="text-sm font-medium text-gray-300 mb-4">Compliance</h3>
            <div className="space-y-3">
              {[
                ['HIPAA Audit Logging', 'Active', 'text-green-400'],
                ['Row Level Security', 'Enabled', 'text-green-400'],
                ['Data Encryption', 'At rest + in transit', 'text-green-400'],
                ['BAA Status', 'Required for production PHI', 'text-amber-400'],
              ].map(([label, value, color]) => (
                <div key={label} className="flex items-center justify-between py-2 border-b border-gray-800 last:border-0">
                  <span className="text-xs text-gray-500">{label}</span>
                  <span className={`text-xs font-medium ${color}`}>{value}</span>
                </div>
              ))}
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}