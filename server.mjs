// Zero-dependency local server: serves the built app (dist/) and POST /api/ask (Claude mode).
// Usage: npm run build && ANTHROPIC_API_KEY=sk-... node server.mjs
import { createServer } from 'node:http'
import { readFile } from 'node:fs/promises'
import { extname, join } from 'node:path'
import { answerWithClaude } from './api/_claude.js'

const PORT = process.env.PORT || 8787
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.json': 'application/json', '.woff2': 'font/woff2' }

createServer(async (req, res) => {
  if (req.url === '/api/ask' && req.method === 'POST') {
    let body = ''
    for await (const chunk of req) body += chunk
    try {
      const out = await answerWithClaude(JSON.parse(body))
      res.writeHead(200, { 'content-type': 'application/json' }).end(JSON.stringify(out))
    } catch (e) {
      res.writeHead(503, { 'content-type': 'application/json' }).end(JSON.stringify({ error: String(e.message || e) }))
    }
    return
  }
  const path = req.url === '/' ? '/index.html' : req.url.split('?')[0]
  try {
    const file = await readFile(join('dist', path))
    res.writeHead(200, { 'content-type': TYPES[extname(path)] || 'application/octet-stream' }).end(file)
  } catch {
    res.writeHead(404).end('not found')
  }
}).listen(PORT, () => console.log(`Sijil running on http://localhost:${PORT}`))
