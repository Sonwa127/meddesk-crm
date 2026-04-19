'use client'

import { useEffect, useState } from 'react'
import { createClient } from '../../../utils/supabase'
import { useRouter } from 'next/navigation'
import { use } from 'react'
import Sidebar from '../../../components/Sidebar'

export default function PatientProfile({ params }) {
  const { id } = use(params)
  const [patient, setPatient] = useState(null)
  const [tasks, setTasks] = useState([])
  const [auditLogs, setAuditLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }

      const [{ data: patientData }, { data: tasksData }, { data: logsData }] = await Promise.all([
        supabase.from('patients').select('*').eq('id', id).single(),
        supabase.from('staff_tasks').select('*').eq('patient_id', id).order('created_at', { ascending: false }),
        supabase.from('audit_logs').select('*').eq('record_id', id).order('created_at', { ascending: false }).limit(20)
      ])

      setPatient(patientData)
      setTasks(tasksData || [])
      setAuditLogs(logsData || [])
      setLoading(false)
    }
    load()
  }, [])

  if (loading) return (
    <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center">
      <p className="text-gray-400">Loading patient profile...</p>
    </div>
  )

  if (!patient) return (
    <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center">
      <p className="text-gray-400">Patient not found.</p>
    </div>
  )

  const statusColor = { active: 'text-green-400', inactive: 'text-red-400', pending: 'text-amber-400' }
  const priorityBadge = { low: 'bg-gray-800 text-gray-400', medium: 'bg-amber-950 text-amber-400', high: 'bg-red-950 text-red-400' }
  const actionBadge = { INSERT: 'bg-green-950 text-green-400', UPDATE: 'bg-blue-950 text-blue-400', DELETE: 'bg-red-950 text-red-400' }

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
        <button onClick={() => supabase.auth.signOut().then(() => router.push('/login'))} className="text-sm text-gray-400 hover:text-white">
          Sign out
        </button>
      </div>

      <div className="flex relative">

        {sidebarOpen && (
          <div className="fixed inset-0 bg-black/60 z-20 sm:hidden" onClick={() => setSidebarOpen(false)} />
        )}

        <div className={`fixed sm:static z-30 sm:z-auto h-full sm:h-auto transition-transform duration-200 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full sm:translate-x-0'}`}>
          <Sidebar active="Patients" />
        </div>

        <main className="flex-1 p-4 sm:p-8 min-w-0">

          <button onClick={() => router.push('/patients')} className="text-sm text-gray-400 hover:text-white mb-6 flex items-center gap-1">
            ← Back to Patients
          </button>

          {/* Patient Header */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 sm:p-6 mb-6">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-blue-600 flex items-center justify-center text-lg sm:text-xl font-bold flex-shrink-0">
                  {patient.full_name?.charAt(0)}
                </div>
                <div>
                  <h2 className="text-lg sm:text-xl font-semibold">{patient.full_name}</h2>
                  <p className="text-gray-400 text-xs sm:text-sm mt-0.5 break-all sm:break-normal">{patient.email} · {patient.phone}</p>
                  <span className={`text-xs font-medium capitalize mt-1 inline-block ${statusColor[patient.membership_status]}`}>
                    ● {patient.membership_status}
                  </span>
                </div>
              </div>
              <button onClick={() => router.push(`/patients?edit=${patient.id}`)} className="text-sm bg-gray-800 hover:bg-gray-700 px-4 py-2 rounded-lg transition self-start">
                Edit Patient
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 pt-6 border-t border-gray-800">
              {[
                ['Date of Birth', patient.dob || '—'],
                ['Gender', patient.gender || '—'],
                ['Address', patient.address || '—'],
                ['Intake Completed', patient.intake_completed ? 'Yes' : 'No'],
              ].map(([label, value]) => (
                <div key={label}>
                  <p className="text-xs text-gray-500 mb-1">{label}</p>
                  <p className="text-sm text-gray-300">{value}</p>
                </div>
              ))}
            </div>

            {patient.notes && (
              <div className="mt-4 pt-4 border-t border-gray-800">
                <p className="text-xs text-gray-500 mb-1">Notes</p>
                <p className="text-sm text-gray-300">{patient.notes}</p>
              </div>
            )}
          </div>

          {/* Tasks + Audit */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 sm:p-5">
              <h3 className="text-sm font-medium text-gray-300 mb-4">Linked Tasks ({tasks.length})</h3>
              {tasks.length === 0 ? (
                <p className="text-gray-600 text-sm">No tasks linked to this patient.</p>
              ) : tasks.map(t => (
                <div key={t.id} className="flex items-center justify-between py-2 border-b border-gray-800 last:border-0 gap-2">
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{t.title}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{t.due_date || 'No due date'}</p>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full flex-shrink-0 ${priorityBadge[t.priority]}`}>{t.priority}</span>
                </div>
              ))}
            </div>

            <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 sm:p-5">
              <h3 className="text-sm font-medium text-gray-300 mb-4">Access History</h3>
              {auditLogs.length === 0 ? (
                <p className="text-gray-600 text-sm">No audit history for this patient.</p>
              ) : auditLogs.map(l => (
                <div key={l.id} className="flex items-center justify-between py-2 border-b border-gray-800 last:border-0">
                  <div>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${actionBadge[l.action] || 'bg-gray-800 text-gray-400'}`}>{l.action}</span>
                    <p className="text-xs text-gray-500 mt-0.5">{new Date(l.created_at).toLocaleString()}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </main>
      </div>
    </div>
  )
}