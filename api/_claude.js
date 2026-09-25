// Shared Claude call used by the Vercel function (api/ask.js) and the local server (server.mjs).
// Requires ANTHROPIC_API_KEY. Optional ANTHROPIC_MODEL.
const SYSTEM = `You are Sijil, a clinical-context assistant that answers questions about ONE patient using ONLY the Health Events provided.
Rules:
- Every factual sentence must cite one or more Health Event ids from the provided list (e.g. "E4").
- Never invent history. If the records do not contain the answer, say so in one sentence with kind "none" and empty cites.
- Do not diagnose, prescribe, or recommend starting/stopping/changing medication. Phrase patterns as "worth reviewing with the treating clinician".
- Mark patient-generated information with kind "patient"; clinician-verified facts with kind "fact"; missing follow-ups with kind "gap"; patterns with kind "pattern".
- Be concise: 3-6 claims, each one sentence, written for a busy clinician.
Return ONLY JSON: {"claims":[{"text":"...","cites":["E4"],"kind":"fact"}],"followUps":["...","..."]}`

export async function answerWithClaude({ question, events }) {
  const key = process.env.ANTHROPIC_API_KEY
  if (!key) throw new Error('ANTHROPIC_API_KEY not set')
  if (!question || !Array.isArray(events)) throw new Error('bad request')
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-api-key': key, 'anthropic-version': '2023-06-01' },
    body: JSON.stringify({
      model: process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-5',
      max_tokens: 900,
      system: SYSTEM,
      messages: [
        { role: 'user', content: `HEALTH EVENTS (JSON):\n${JSON.stringify(events)}\n\nQUESTION: ${question}` },
      ],
    }),
  })
  if (!res.ok) throw new Error(`anthropic ${res.status}`)
  const data = await res.json()
  const text = (data.content || []).map((c) => c.text || '').join('')
  const json = text.slice(text.indexOf('{'), text.lastIndexOf('}') + 1)
  return JSON.parse(json)
}
