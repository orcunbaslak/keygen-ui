import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import https from 'https'
import nodeFetch from 'node-fetch'

const KEYGEN_API_URL = process.env.NEXT_PUBLIC_KEYGEN_API_URL
if (!KEYGEN_API_URL) {
  throw new Error('Missing required environment variable: NEXT_PUBLIC_KEYGEN_API_URL')
}

// Extract base URL without /v1 suffix
const BASE_URL = KEYGEN_API_URL.replace(/\/v1\/?$/, '')

// Always validate TLS certificates — use NODE_TLS_REJECT_UNAUTHORIZED=0 or a custom CA
// bundle in development if connecting to a self-signed Keygen instance.
const httpsAgent = new https.Agent({
  rejectUnauthorized: true,
})

// Allowed top-level Keygen API path segments
const ALLOWED_PATH_SEGMENTS = new Set([
  'accounts',
  'licenses',
  'machines',
  'users',
  'products',
  'policies',
  'groups',
  'entitlements',
  'webhooks',
  'webhook-endpoints',
  'webhook-events',
  'tokens',
  'me',
  'request-logs',
  'event-logs',
  'passwords',
  'releases',
  'artifacts',
  'platforms',
  'channels',
  'constraints',
  'processes',
  'components',
  'metrics',
  'actions',
  'second-factors',
  'search',
])

function validatePath(path: string[]): boolean {
  if (path.length === 0) return false

  // Block path traversal attempts
  for (const segment of path) {
    if (segment === '..' || segment === '.' || segment === '' || segment.includes('\0')) {
      return false
    }
  }

  // First segment must be a known Keygen API resource
  return ALLOWED_PATH_SEGMENTS.has(path[0])
}

async function proxyRequest(request: NextRequest, path: string[]) {
  if (!validatePath(path)) {
    return NextResponse.json(
      { errors: [{ title: 'Bad Request', detail: 'Invalid API path' }] },
      { status: 400 }
    )
  }

  const targetUrl = `${BASE_URL}/v1/${path.join('/')}${request.nextUrl.search}`

  const headers: Record<string, string> = {
    'Content-Type': request.headers.get('content-type') || 'application/vnd.api+json',
    'Accept': request.headers.get('accept') || 'application/vnd.api+json',
  }

  // Forward auth header — prefer the request header (e.g. Basic auth during login),
  // otherwise fall back to the httpOnly session cookie.
  const authorization = request.headers.get('authorization')
  if (authorization) {
    headers['Authorization'] = authorization
  } else {
    const cookieStore = await cookies()
    const sessionToken = cookieStore.get('keygen_session')?.value
    if (sessionToken) {
      headers['Authorization'] = `Bearer ${sessionToken}`
    }
  }

  // Read request body for non-GET/HEAD methods
  let body: string | undefined
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    try {
      body = await request.text()
    } catch {
      // No body
    }
  }

  try {
    const response = await nodeFetch(targetUrl, {
      method: request.method,
      headers,
      body: body || undefined,
      agent: targetUrl.startsWith('https') ? httpsAgent : undefined,
    })

    const data = await response.text()

    return new NextResponse(data || null, {
      status: response.status,
      headers: {
        'Content-Type': response.headers.get('content-type') || 'application/vnd.api+json',
      },
    })
  } catch (error) {
    console.error('Proxy error:', error instanceof Error ? error.message : 'Unknown error')
    return NextResponse.json(
      { errors: [{ title: 'Proxy Error', detail: 'Failed to reach upstream API' }] },
      { status: 502 }
    )
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params
  return proxyRequest(request, path)
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params
  return proxyRequest(request, path)
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params
  return proxyRequest(request, path)
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params
  return proxyRequest(request, path)
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params
  return proxyRequest(request, path)
}
