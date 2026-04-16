'use client'

import { useEffect, useState } from 'react'
import { createClient } from '../../utils/supabase'
import { useRouter } from 'next/navigation'
import Sidebar from '../../components/Sidebar'

const TEMPLATES = {
  client_onboarding: {
    name: 'Client Onboarding Form',
    form_type: 'client_onboarding',
    fields: [
      { id: 1, label: 'Practice Name', type: 'text', required: true },
      { id: 2, label: 'Owner Full Name', type: 'text', required: true },
      { id: 3, label: 'Specialty', type: 'text', required: true },
      { id: 4, label: 'Monthly Revenue Range', type: 'select', required: false, options: ['Under $10k', '$10k-$50k', '$50k-$100k', 'Over $100k'] },
      { id: 5, label: 'Number of Staff', type: 'number', required: false },
      { id: 6, label: 'Main Pain Point', type: 'textarea', required: false },
    ]
  },
  patient_intake: {
    name: 'Patient Intake Form',
    form_type: 'patient_intake',
    fields: [
      { id: 1, label: 'Full Name', type: 'text', required: true },
      { id: 2, label: 'Date of Birth', type: 'date', required: true },
      { id: 3, label: 'Email', type: 'email', required: true },
      { id: 4, label: 'Phone Number', type: 'phone', required: true },
      { id: 5, label: 'Gender', type: 'select', required: false, options: ['Male', 'Female', 'Other', 'Prefer not to say'] },
      { id: 6, label: 'Address', type: 'text', required: false },
      { id: 7, label: 'Emergency Contact Name', type: 'text', required: false },
      { id: 8, label: 'Emergency Contact Phone', type: 'phone', required: false },
      { id: 9, label: 'Medical History / Notes', type: 'textarea', required: false },
    ]
  }
}

export default function FormsPage() {
  const [forms, setForms] = useState([])
  const [submissions, setSubmissions] = useState([])
  const [loading, setLoading] = useState(true)
  const [showBuilder, setShowBuilder] = useState(false)
  const [showTemplates, setShowTemplates] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [formName, setFormName] = useState('')
  const [formType, setFormType] = useState('client_onboarding')
  const [fields, setFields] = useState([])
  const [saving, setSaving] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      const [{ data: formsData }, { data: subsData }] = await Promise.all([
        supabase.from('forms').select('*').order('created_at', { ascending: false }),
        supabase.from('form_submissions').select('*, forms(name, form_type)').order('submitted_at', { ascending: false })
      ])
      setForms(formsData || [])
      setSubmissions(subsData || [])
      setLoading(false)
    }
    load()
  }, [])

  function addField() {
    setFields([...fields, { id: Date.now(), label: '', type: 'text', required: false }])
  }

  function updateField(id, key, value) {
    setFields(fields.map(f => f.id === id ? { ...f, [key]: value } : f))
  }

  function removeField(id) {
    setFields(fields.filter(f => f.id !== id))
  }

  function loadTemplate(key) {
    const t = TEMPLATES[key]
    setFormName(t.name)
    setFormType(t.form_type)
    setFields(t.fields.map(f => ({ ...f, id: Date.now() + f.id })))
    setShowTemplates(false)
    setShowBuilder(true)
  }

  function handleEdit(f) {
    setFormName(f.name)
    setFormType(f.form_type)
    setFields(f.fields || [])
    setEditingId(f.id)
    setShowBuilder(true)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function copyLink(formId) {
    navigator.clipboard.writeText(`${window.location.origin}/intake/${formId}`)
    alert('Link copied!')
  }

  async function handleSaveForm() {
    if (!formName) return alert('Please enter a form name')
    setSaving(true)
    if (editingId) {
      await supabase.from('forms').update({ name: formName, form_type: formType, fields }).eq('id', editingId)
    } else {
      const { data: { user } } = await supabase.auth.getUser()
      const { data: userData } = await supabase.from('users').select('org_id').eq('id', user.id).maybeSingle()
      if (!userData) { setSaving(false); return }
      const { error } = await supabase.from('forms').insert({ org_id: userData.org_id, name: formName, form_type: formType, fields, created_by: user.id })
      if (error) { console.error('Error:', error); setSaving(false); return }
    }
    const { data } = await supabase.from('forms').select('*').order('created_at', { ascending: false })
    setForms(data || [])
    setShowBuilder(false)
    setEditingId(null)
    setFormName('')
    setFields([])
    setSaving(false)
  }

  async function handleDeleteForm(id) {
    if (!confirm('Delete this form?')) return
    await supabase.from('forms').delete().eq('id', id)
    setForms(forms.filter(f => f.id !== id))
  }

  async function markReviewed(id) {
    const { data: { user } } = await supabase.auth.getUser()
    await supabase.from('form_submissions').update({ status: 'reviewed', reviewed_by: user.id, reviewed_at: new Date().toISOString() }).eq('id', id)
    const { data } = await supabase.from('form_submissions').select('*, forms(name, form_type)').order('submitted_at', { ascending: false })
    setSubmissions(data || [])
  }

  const formTypeBadge = {
    client_onboarding: 'bg-blue-950 text-blue-400',
    patient_intake: 'bg-purple-950 text-purple-400'
  }

  const statusBadge = {
    pending: 'bg-amber-950 text-amber-400',
    synced: 'bg-green-950 text-green-400',
    reviewed: 'bg-blue-950 text-blue-400'
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <div className="border-b border-gray-800 px-6 py-4 flex items-center justify-between">
        <h1 className="text-lg font-semibold">meddesk</h1>
        <button onClick={() => { supabase.auth.signOut(); router.push('/login') }} className="text-sm text-gray-400 hover:text-white">Sign out</button>
      </div>

      <div className="flex">
        <Sidebar active="Forms" />

        <main className="flex-1 p-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-semibold">Form Builder</h2>
              <p className="text-gray-400 text-sm">Build and manage intake forms</p>
            </div>
            <div className="flex gap-2">
              <button onClick={() => { setShowTemplates(!showTemplates); setShowBuilder(false) }}
                className="bg-gray-800 hover:bg-gray-700 text-white text-sm px-4 py-2 rounded-lg transition">
                Use Template
              </button>
              <button onClick={() => { setShowBuilder(!showBuilder); setShowTemplates(false); setEditingId(null); setFormName(''); setFields([]) }}
                className="bg-blue-600 hover:bg-blue-700 text-white text-sm px-4 py-2 rounded-lg transition">
                + New Form
              </button>
            </div>
          </div>

          {/* Templates */}
          {showTemplates && (
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 mb-6">
              <p className="text-sm font-medium text-gray-300 mb-4">Choose a template</p>
              <div className="grid grid-cols-2 gap-4">
                <div onClick={() => loadTemplate('client_onboarding')}
                  className="bg-gray-800 border border-gray-700 hover:border-blue-500 rounded-xl p-4 cursor-pointer transition">
                  <span className="text-xs px-2 py-0.5 rounded-full bg-blue-950 text-blue-400 mb-2 inline-block">Client Onboarding</span>
                  <p className="font-medium text-sm mb-1">Client Onboarding Form</p>
                  <p className="text-xs text-gray-500">Practice name, owner, specialty, revenue range, staff count, pain point</p>
                  <p className="text-xs text-gray-600 mt-2">6 fields</p>
                </div>
                <div onClick={() => loadTemplate('patient_intake')}
                  className="bg-gray-800 border border-gray-700 hover:border-purple-500 rounded-xl p-4 cursor-pointer transition">
                  <span className="text-xs px-2 py-0.5 rounded-full bg-purple-950 text-purple-400 mb-2 inline-block">Patient Intake</span>
                  <p className="font-medium text-sm mb-1">Patient Intake Form</p>
                  <p className="text-xs text-gray-500">Full name, DOB, contact info, gender, emergency contact, medical history</p>
                  <p className="text-xs text-gray-600 mt-2">9 fields — PHI / HIPAA logged</p>
                </div>
              </div>
            </div>
          )}

          {/* Form Builder */}
          {showBuilder && (
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 mb-6">
              <div className="text-sm font-medium text-gray-300 mb-4">{editingId ? 'Edit Form' : 'New Form'}</div>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">Form Name</label>
                  <input type="text" value={formName} onChange={e => setFormName(e.target.value)}
                    placeholder="e.g. Client Onboarding Form"
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500" />
                </div>
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">Form Type</label>
                  <select value={formType} onChange={e => setFormType(e.target.value)}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none">
                    <option value="client_onboarding">Client Onboarding</option>
                    <option value="patient_intake">Patient Intake</option>
                  </select>
                </div>
              </div>

              <div className="space-y-3 mb-4">
                {fields.map((field, i) => (
                  <div key={field.id} className="bg-gray-800 border border-gray-700 rounded-lg p-3 grid grid-cols-12 gap-3 items-center">
                    <div className="col-span-1 text-gray-500 text-xs">{i + 1}</div>
                    <div className="col-span-5">
                      <input type="text" value={field.label} onChange={e => updateField(field.id, 'label', e.target.value)}
                        placeholder="Field label"
                        className="w-full bg-gray-700 border border-gray-600 rounded px-2 py-1.5 text-sm focus:outline-none" />
                    </div>
                    <div className="col-span-3">
                      <select value={field.type} onChange={e => updateField(field.id, 'type', e.target.value)}
                        className="w-full bg-gray-700 border border-gray-600 rounded px-2 py-1.5 text-sm focus:outline-none">
                        <option value="text">Text</option>
                        <option value="email">Email</option>
                        <option value="phone">Phone</option>
                        <option value="number">Number</option>
                        <option value="date">Date</option>
                        <option value="select">Dropdown</option>
                        <option value="textarea">Long Text</option>
                      </select>
                    </div>
                    <div className="col-span-2 flex items-center gap-1">
                      <input type="checkbox" checked={field.required} onChange={e => updateField(field.id, 'required', e.target.checked)} className="accent-blue-500" />
                      <span className="text-xs text-gray-400">Required</span>
                    </div>
                    <div className="col-span-1 text-right">
                      <button onClick={() => removeField(field.id)} className="text-red-400 hover:text-red-300 text-xs">✕</button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-between">
                <button onClick={addField} className="text-sm text-blue-400 hover:text-blue-300 transition">+ Add Field</button>
                <div className="flex gap-3">
                  <button onClick={() => { setShowBuilder(false); setEditingId(null) }} className="text-sm text-gray-400 hover:text-white px-4 py-2">Cancel</button>
                  <button onClick={handleSaveForm} disabled={saving} className="bg-blue-600 hover:bg-blue-700 text-white text-sm px-4 py-2 rounded-lg">
                    {saving ? 'Saving...' : editingId ? 'Update Form' : 'Save Form'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Active Forms */}
          <div className="mb-8">
            <h3 className="text-sm font-medium text-gray-400 mb-3">Active Forms ({forms.length})</h3>
            <div className="space-y-3">
              {loading ? (
                <p className="text-gray-500 text-sm">Loading...</p>
              ) : forms.length === 0 ? (
                <p className="text-gray-500 text-sm">No forms yet. Create your first one or use a template.</p>
              ) : forms.map(f => (
                <div key={f.id} className="bg-gray-900 border border-gray-800 rounded-xl p-4 flex items-center justify-between">
                  <div>
                    <p className="font-medium text-sm">{f.name}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${formTypeBadge[f.form_type] || 'bg-gray-800 text-gray-400'}`}>
                        {f.form_type?.replace('_', ' ')}
                      </span>
                      <span className="text-xs text-gray-500">{f.fields?.length || 0} fields</span>
                      <span className="text-xs text-gray-500">{new Date(f.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => copyLink(f.id)} className="text-xs text-blue-400 hover:text-blue-300 px-3 py-1.5 rounded-lg bg-blue-950 transition">Copy Link</button>
                    <button onClick={() => handleEdit(f)} className="text-xs text-gray-300 hover:text-white px-3 py-1.5 rounded-lg bg-gray-800 transition">Edit</button>
                    <button onClick={() => handleDeleteForm(f.id)} className="text-xs text-red-400 hover:text-red-300 px-3 py-1.5 rounded-lg bg-red-950 transition">Delete</button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Submissions */}
          <div>
            <h3 className="text-sm font-medium text-gray-400 mb-3">Recent Submissions ({submissions.length})</h3>
            <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-800 text-gray-400 text-left">
                    <th className="px-4 py-3 font-medium">Form</th>
                    <th className="px-4 py-3 font-medium">Type</th>
                    <th className="px-4 py-3 font-medium">Submitted</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                    <th className="px-4 py-3 font-medium"></th>
                  </tr>
                </thead>
                <tbody>
                  {submissions.length === 0 ? (
                    <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-500">No submissions yet.</td></tr>
                  ) : submissions.map(s => (
                    <tr key={s.id} className="border-b border-gray-800 hover:bg-gray-800 transition">
                      <td className="px-4 py-3 font-medium">{s.forms?.name || '—'}</td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-1 rounded-full ${formTypeBadge[s.forms?.form_type] || 'bg-gray-800 text-gray-400'}`}>
                          {s.forms?.form_type?.replace('_', ' ') || '—'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-400">{new Date(s.submitted_at).toLocaleString()}</td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-1 rounded-full font-medium ${statusBadge[s.status]}`}>{s.status}</span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        {s.status !== 'reviewed' && (
                          <button onClick={() => markReviewed(s.id)} className="text-xs text-green-400 hover:text-green-300 px-2 py-1 rounded hover:bg-gray-700 transition">
                            Mark Reviewed
                          </button>
                        )}
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