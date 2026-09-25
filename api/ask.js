// Vercel serverless function: POST /api/ask  { question, events } -> { claims, followUps }
import { answerWithClaude } from './_claude.js'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' })
  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body
    res.status(200).json(await answerWithClaude(body))
  } catch (e) {
    res.status(503).json({ error: String(e.message || e) })
  }
}
