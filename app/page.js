'use client'

import { useRouter } from 'next/navigation'

export default function LandingPage() {
  const router = useRouter()

  const features = [
    { icon: '👥', title: 'Patient Management', desc: 'Full patient records with PHI protection, intake forms, and membership tracking.' },
    { icon: '💰', title: 'Financial Tracking', desc: 'Revenue, expenses, collections, and net profit — all in real time.' },
    { icon: '📊', title: 'KPI Dashboards', desc: 'Weekly and monthly snapshots of practice performance with visual charts.' },
    { icon: '✓', title: 'Task Management', desc: 'Assign tasks to staff with priority levels, due dates, and accountability tracking.' },
    { icon: '📋', title: 'Form Builder', desc: 'Build patient intake and client onboarding forms with shareable public links.' },
    { icon: '🔒', title: 'HIPAA Audit Log', desc: 'Tamper-proof log of every action on patient data. Cannot be deleted or modified.' },
  ]

  const stats = [
    { value: 'Multi-tenant', label: 'Architecture — one database, unlimited practices' },
    { value: 'HIPAA', label: 'Compliant — audit logging at database level' },
    { value: 'Real-time', label: 'Data — live KPIs and financial tracking' },
  ]

  return (
    <div className="min-h-screen bg-gray-950 text-white">

      {/* Nav */}
      <nav className="border-b border-gray-800 px-4 sm:px-8 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded bg-blue-600 flex items-center justify-center text-xs font-bold">M</div>
          <span className="font-semibold text-lg">MedDesk</span>
        </div>
        <button
          onClick={() => router.push('/login')}
          className="bg-blue-600 hover:bg-blue-700 text-white text-sm px-4 py-2 rounded-lg transition"
        >
          Sign in
        </button>
      </nav>

      {/* Hero */}
      <div className="max-w-4xl mx-auto px-4 sm:px-8 pt-16 sm:pt-24 pb-12 sm:pb-16 text-center">
        <div className="inline-flex items-center gap-2 bg-blue-950 border border-blue-800 text-blue-400 text-xs px-3 py-1.5 rounded-full mb-6">
          🔒 HIPAA-Compliant Infrastructure
        </div>
        <h1 className="text-3xl sm:text-5xl font-bold mb-6 leading-tight">
          The CRM built for<br />
          <span className="text-blue-400">medical practices</span>
        </h1>
        <p className="text-gray-400 text-base sm:text-lg mb-10 max-w-2xl mx-auto">
          MedDesk gives independent medical practices a unified platform to manage patients, track financials, monitor KPIs, and stay HIPAA compliant — all in one place.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
          <button
            onClick={() => router.push('/login')}
            className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition"
          >
            Try Demo Free
          </button>
          <button
            onClick={() => router.push('/login')}
            className="w-full sm:w-auto border border-gray-700 hover:border-gray-500 text-gray-300 px-6 py-3 rounded-lg font-medium transition"
          >
            Sign in →
          </button>
        </div>
      </div>

      {/* Main content */}
      <div className="max-w-5xl mx-auto px-4 sm:px-8 pb-24">

        {/* Features */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-16">
          {features.map(({ icon, title, desc }) => (
            <div key={title} className="bg-gray-900 border border-gray-800 rounded-xl p-5">
              <div className="text-2xl mb-3">{icon}</div>
              <h3 className="font-semibold mb-2">{title}</h3>
              <p className="text-gray-400 text-sm">{desc}</p>
            </div>
          ))}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-16">
          {stats.map(({ value, label }) => (
            <div key={value} className="text-center">
              <p className="text-2xl sm:text-3xl font-bold text-blue-400 mb-2">{value}</p>
              <p className="text-gray-400 text-sm">{label}</p>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8 sm:p-10 text-center">
          <h2 className="text-xl sm:text-2xl font-bold mb-3">See it in action</h2>
          <p className="text-gray-400 mb-6 text-sm sm:text-base">
            Click Try Demo to explore the full CRM with sample data — no signup required.
          </p>
          <button
            onClick={() => router.push('/login')}
            className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-medium transition"
          >
            Try Demo →
          </button>
        </div>

        {/* Footer */}
        <div className="text-center mt-12 text-gray-600 text-sm">
          Built with Next.js · Supabase · Tailwind · Deployed on Vercel
          <span className="mx-2">·</span>
          Built by{' '}
          <a
            href="https://www.linkedin.com/in/ann-chisom-sokwueaku"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-400 hover:text-blue-300 transition"
          >
            Ann Chisom Sokwueaku
          </a>
        </div>

      </div>
    </div>
  )
}