import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
})

export async function POST(request) {
  try {
    const { stats, financials, patients, tasks } = await request.json()

    const prompt = `You are a healthcare practice analyst. Analyze this medical practice data and give a concise 3-4 sentence performance summary with one key recommendation.

Practice Data:
- Total Patients: ${stats.patients}
- Open Tasks: ${stats.tasks}
- Total Revenue: $${stats.revenue.toLocaleString()}
- Recent Financial Entries: ${JSON.stringify(financials?.slice(0, 5))}
- Recent Patients Added: ${patients?.length}

Be specific, professional, and actionable. Focus on financial health, patient load, and operational efficiency.`

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 200
    })

    return Response.json({ insight: completion.choices[0].message.content })
  } catch (error) {
    console.error('OpenAI error:', error)
    return Response.json({ error: 'Failed to generate insight' }, { status: 500 })
  }
}