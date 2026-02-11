import { NextRequest, NextResponse } from 'next/server'
import https from 'https'
import nodeFetch from 'node-fetch'

const KEYGEN_API_URL = process.env.NEXT_PUBLIC_KEYGEN_API_URL || 'https://api.keygen.sh/v1'

// Extract base URL without /v1 suffix
const BASE_URL = KEYGEN_API_URL.replace(/\/v1\/?$/, '')

// Create an HTTPS agent that ignores self-signed certificate errors in development
const httpsAgent = new https.Agent({
  rejectUnauthorized: process.env.NODE_ENV === 'production',
})

async function proxyRequest(request: NextRequest, path: string[]) {
  const targetUrl = `${BASE_URL}/v1/${path.join('/')}${request.nextUrl.search}`

  const headers: Record<string, string> = {
    'Content-Type': request.headers.get('content-type') || 'application/vnd.api+json',
    'Accept': request.headers.get('accept') || 'application/vnd.api+json',
  }

  // Forward auth header
  const authorization = request.headers.get('authorization')
  if (authorization) {
    headers['Authorization'] = authorization
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
    console.error('Proxy error:', error)
    return NextResponse.json(
      { errors: [{ title: 'Proxy Error', detail: String(error) }] },
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
