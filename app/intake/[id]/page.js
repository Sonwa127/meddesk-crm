'use client'

import { useEffect, useState } from 'react'
import { use } from 'react'
import { createClient } from '../../../utils/supabase'

export default function IntakePage({ params }) {
  const { id } = use(params)
  const [form, setForm] = useState(null)
  const [responses, setResponses] = useState({})
  const [submitted, setSubmitted] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    async function load() {
      const { data } = await supabase.from('forms').select('*').eq('id', id).single()
      setForm(data)
      setLoading(false)
    }
    load()
  }, [])

  async function handleSubmit(e) {
    e.preventDefault()
    setSubmitting(true)
    await supabase.from('form_submissions').insert({
      org_id: form.org_id,
      form_id: form.id,
      responses,
      status: 'pending'
    })
    setSubmitted(true)
    setSubmitting(false)
  }

  if (loading) return (
    <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center">
      <p className="text-gray-400">Loading form...</p>
    </div>
  )

  if (!form) return (
    <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center">
      <p className="text-gray-400">Form not found.</p>
    </div>
  )

  if (submitted) return (
    <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center">
      <div className="text-center">
        <div className="text-4xl mb-4">✅</div>
        <h2 className="text-xl font-semibold mb-2">Thank you!</h2>
        <p className="text-gray-400">Your form has been submitted successfully.</p>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <div className="max-w-xl mx-auto px-4 py-12">
        <div className="mb-8">
          <p className="text-blue-400 text-sm mb-1">Practice Founder</p>
          <h1 className="text-2xl font-semibold">{form.name}</h1>
          <p className="text-gray-400 text-sm mt-1 capitalize">{form.form_type?.replace('_', ' ')}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {form.fields?.map(field => (
            <div key={field.id}>
              <label className="text-sm text-gray-300 mb-1.5 block">
                {field.label}
                {field.required && <span className="text-red-400 ml-1">*</span>}
              </label>
              {field.type === 'textarea' ? (
                <textarea
                  required={field.required}
                  value={responses[field.label] || ''}
                  onChange={e => setResponses({ ...responses, [field.label]: e.target.value })}
                  rows={4}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                />
              ) : field.type === 'select' ? (
                <select
                  required={field.required}
                  value={responses[field.label] || ''}
                  onChange={e => setResponses({ ...responses, [field.label]: e.target.value })}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500">
                  <option value="">Select an option</option>
                  {field.options?.map(opt => <option key={opt}>{opt}</option>)}
                </select>
              ) : (
                <input
                  type={field.type}
                  required={field.required}
                  value={responses[field.label] || ''}
                  onChange={e => setResponses({ ...responses, [field.label]: e.target.value })}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                />
              )}
            </div>
          ))}

          <button type="submit" disabled={submitting}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 rounded-lg transition mt-4">
            {submitting ? 'Submitting...' : 'Submit'}
          </button>
        </form>

        <p className="text-center text-xs text-gray-600 mt-6">Powered by Practice Founder</p>
      </div>
    </div>
  )
}