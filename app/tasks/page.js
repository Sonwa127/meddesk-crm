'use client'

import { useEffect, useState } from 'react'
import { createClient } from '../../utils/supabase'
import { useRouter } from 'next/navigation'
import Sidebar from '../../components/Sidebar'

export default function TasksPage() {
  const [tasks, setTasks] = useState([])
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState({ title: '', description: '', assigned_to: '', priority: 'medium', due_date: '', status: 'open' })
  const [saving, setSaving] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      const [{ data: tasksData }, { data: usersData }] = await Promise.all([
        supabase.from('staff_tasks').select('*').order('created_at', { ascending: false }),
        supabase.from('users').select('id, full_name')
      ])
      setTasks(tasksData || [])
      setUsers(usersData || [])
      setLoading(false)
    }
    load()
  }, [])

  async function handleSubmit(e) {
    e.preventDefault()
    setSaving(true)
    if (editingId) {
      await supabase.from('staff_tasks').update(form).eq('id', editingId)
    } else {
      const { data: { user } } = await supabase.auth.getUser()
      const { data: userData } = await supabase.from('users').select('org_id').eq('id', user.id).maybeSingle()
      if (!userData) { setSaving(false); return }
      const { error } = await supabase.from('staff_tasks').insert({ ...form, org_id: userData.org_id, assigned_by: user.id })
      if (error) { console.error('Insert error:', error); setSaving(false); return }
    }
    const { data } = await supabase.from('staff_tasks').select('*').order('created_at', { ascending: false })
    setTasks(data || [])
    setForm({ title: '', description: '', assigned_to: '', priority: 'medium', due_date: '', status: 'open' })
    setEditingId(null)
    setShowForm(false)
    setSaving(false)
  }

  function handleEdit(t) {
    setForm({ title: t.title, description: t.description || '', assigned_to: t.assigned_to || '', priority: t.priority, due_date: t.due_date || '', status: t.status })
    setEditingId(t.id)
    setShowForm(true)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  async function handleDelete(id) {
    if (!confirm('Delete this task?')) return
    await supabase.from('staff_tasks').delete().eq('id', id)
    setTasks(tasks.filter(t => t.id !== id))
  }

  async function toggleStatus(t) {
    const newStatus = t.status === 'completed' ? 'open' : 'completed'
    await supabase.from('staff_tasks').update({ status: newStatus, completed_at: newStatus === 'completed' ? new Date().toISOString() : null }).eq('id', t.id)
    setTasks(tasks.map(x => x.id === t.id ? { ...x, status: newStatus } : x))
  }

  function getUserName(id) {
    const u = users.find(u => u.id === id)
    return u ? u.full_name : '—'
  }

  const priorityBadge = {
    low: 'bg-gray-800 text-gray-400',
    medium: 'bg-amber-950 text-amber-400',
    high: 'bg-red-950 text-red-400'
  }
  const statusBadge = {
    open: 'bg-blue-950 text-blue-400',
    in_progress: 'bg-purple-950 text-purple-400',
    completed: 'bg-green-950 text-green-400',
    cancelled: 'bg-gray-800 text-gray-500'
  }

  const open = tasks.filter(t => t.status === 'open').length
  const completed = tasks.filter(t => t.status === 'completed').length
  const inProgress = tasks.filter(t => t.status === 'in_progress').length

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <div className="border-b border-gray-800 px-6 py-4 flex items-center justify-between">
        <h1 className="text-lg font-semibold">Practice Founder</h1>
        <button onClick={() => { supabase.auth.signOut(); router.push('/login') }} className="text-sm text-gray-400 hover:text-white">Sign out</button>
      </div>

      <div className="flex">
        <Sidebar active="Tasks" />

        <main className="flex-1 p-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-semibold">Tasks</h2>
              <p className="text-gray-400 text-sm">{open} open · {inProgress} in progress · {completed} completed</p>
            </div>
            <button onClick={() => { setShowForm(!showForm); setEditingId(null); setForm({ title: '', description: '', assigned_to: '', priority: 'medium', due_date: '', status: 'open' }) }}
              className="bg-blue-600 hover:bg-blue-700 text-white text-sm px-4 py-2 rounded-lg transition">
              + Add Task
            </button>
          </div>

          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
              <p className="text-gray-400 text-xs mb-1">Open</p>
              <p className="text-2xl font-semibold text-blue-400">{open}</p>
            </div>
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
              <p className="text-gray-400 text-xs mb-1">In Progress</p>
              <p className="text-2xl font-semibold text-purple-400">{inProgress}</p>
            </div>
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
              <p className="text-gray-400 text-xs mb-1">Completed</p>
              <p className="text-2xl font-semibold text-green-400">{completed}</p>
            </div>
          </div>

          {showForm && (
            <form onSubmit={handleSubmit} className="bg-gray-900 border border-gray-800 rounded-xl p-6 mb-6 grid grid-cols-2 gap-4">
              <div className="col-span-2 text-sm font-medium text-gray-300 mb-1">{editingId ? 'Edit Task' : 'New Task'}</div>
              <div className="col-span-2">
                <label className="text-xs text-gray-400 mb-1 block">Title</label>
                <input type="text" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500" required />
              </div>
              <div className="col-span-2">
                <label className="text-xs text-gray-400 mb-1 block">Description</label>
                <input type="text" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500" />
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Assign To</label>
                <select value={form.assigned_to} onChange={e => setForm({ ...form, assigned_to: e.target.value })}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none">
                  <option value="">Unassigned</option>
                  {users.map(u => <option key={u.id} value={u.id}>{u.full_name}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Priority</label>
                <select value={form.priority} onChange={e => setForm({ ...form, priority: e.target.value })}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none">
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Due Date</label>
                <input type="date" value={form.due_date} onChange={e => setForm({ ...form, due_date: e.target.value })}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500" />
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Status</label>
                <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none">
                  <option value="open">Open</option>
                  <option value="in_progress">In Progress</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
              <div className="col-span-2 flex gap-3 justify-end">
                <button type="button" onClick={() => { setShowForm(false); setEditingId(null) }} className="text-sm text-gray-400 hover:text-white px-4 py-2">Cancel</button>
                <button type="submit" disabled={saving} className="bg-blue-600 hover:bg-blue-700 text-white text-sm px-4 py-2 rounded-lg">
                  {saving ? 'Saving...' : editingId ? 'Update Task' : 'Save Task'}
                </button>
              </div>
            </form>
          )}

          <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-800 text-gray-400 text-left">
                  <th className="px-4 py-3 font-medium">Task</th>
                  <th className="px-4 py-3 font-medium">Assigned To</th>
                  <th className="px-4 py-3 font-medium">Priority</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Due Date</th>
                  <th className="px-4 py-3 font-medium">Created</th>
                  <th className="px-4 py-3 font-medium"></th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-500">Loading...</td></tr>
                ) : tasks.length === 0 ? (
                  <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-500">No tasks yet. Add your first one.</td></tr>
                ) : tasks.map(t => (
                  <tr key={t.id} className="border-b border-gray-800 hover:bg-gray-800 transition">
                    <td className="px-4 py-3">
                      <p className={`font-medium ${t.status === 'completed' ? 'line-through text-gray-500' : ''}`}>{t.title}</p>
                      {t.description && <p className="text-xs text-gray-500 mt-0.5">{t.description}</p>}
                    </td>
                    <td className="px-4 py-3 text-gray-400">{getUserName(t.assigned_to)}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-1 rounded-full font-medium capitalize ${priorityBadge[t.priority]}`}>{t.priority}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-1 rounded-full font-medium capitalize ${statusBadge[t.status]}`}>{t.status.replace('_', ' ')}</span>
                    </td>
                    <td className="px-4 py-3 text-gray-400">{t.due_date || '—'}</td>
                    <td className="px-4 py-3 text-gray-500 text-xs">{new Date(t.created_at).toLocaleDateString()}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex gap-2 justify-end">
                        <button onClick={() => toggleStatus(t)} className="text-xs text-green-400 hover:text-green-300 px-2 py-1 rounded hover:bg-gray-700 transition">
                          {t.status === 'completed' ? 'Reopen' : 'Complete'}
                        </button>
                        <button onClick={() => handleEdit(t)} className="text-xs text-blue-400 hover:text-blue-300 px-2 py-1 rounded hover:bg-gray-700 transition">Edit</button>
                        <button onClick={() => handleDelete(t.id)} className="text-xs text-red-400 hover:text-red-300 px-2 py-1 rounded hover:bg-gray-700 transition">Delete</button>
                      </div>
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