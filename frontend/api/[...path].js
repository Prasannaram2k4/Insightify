import { Readable } from 'node:stream'

export const config = {
  api: {
    bodyParser: false,
  },
}

const REQUEST_HOP_HEADERS = new Set([
  'connection',
  'content-length',
  'host',
  'transfer-encoding',
])

const RESPONSE_HOP_HEADERS = new Set([
  'connection',
  'content-encoding',
  'content-length',
  'keep-alive',
  'transfer-encoding',
])

export default async function handler(request, response) {
  const serviceUrl = process.env.INSIGHTIFY_API_URL
  if (!serviceUrl) {
    response.status(503).json({ detail: 'The analysis service is not configured.' })
    return
  }

  const incomingUrl = new URL(request.url || '/', 'http://vercel.local')
  const apiPath = incomingUrl.pathname.replace(/^\/api(?=\/|$)/, '') || '/'
  const targetUrl = new URL(apiPath.replace(/^\/+/, ''), `${serviceUrl.replace(/\/+$/, '')}/`)
  targetUrl.search = incomingUrl.search

  const headers = new Headers()
  for (const [name, value] of Object.entries(request.headers)) {
    if (!REQUEST_HOP_HEADERS.has(name.toLowerCase()) && value !== undefined) {
      headers.set(name, Array.isArray(value) ? value.join(', ') : value)
    }
  }

  const method = request.method || 'GET'
  const options = { method, headers }
  if (method !== 'GET' && method !== 'HEAD') {
    options.body = request
    options.duplex = 'half'
  }

  try {
    const upstream = await fetch(targetUrl, options)
    response.statusCode = upstream.status
    for (const [name, value] of upstream.headers) {
      if (!RESPONSE_HOP_HEADERS.has(name.toLowerCase())) {
        response.setHeader(name, value)
      }
    }

    if (!upstream.body) {
      response.end()
      return
    }

    Readable.fromWeb(upstream.body).on('error', error => response.destroy(error)).pipe(response)
  } catch (error) {
    response.status(502).json({ detail: 'Could not reach the analysis service.' })
  }
}