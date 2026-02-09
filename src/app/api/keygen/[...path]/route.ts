import { NextRequest, NextResponse } from 'next/server'

const KEYGEN_API_URL = process.env.NEXT_PUBLIC_KEYGEN_API_URL || 'https://api.keygen.sh/v1'

async function proxyRequest(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params
  const targetPath = path.join('/')
  const targetUrl = new URL(`${KEYGEN_API_URL}/${targetPath}`)

  // Preserve query parameters
  request.nextUrl.searchParams.forEach((value, key) => {
    targetUrl.searchParams.append(key, value)
  })

  // Build headers to forward
  const headers: Record<string, string> = {}

  const authorization = request.headers.get('authorization')
  if (authorization) {
    headers['Authorization'] = authorization
  }

  const contentType = request.headers.get('content-type')
  if (contentType) {
    headers['Content-Type'] = contentType
  }

  const accept = request.headers.get('accept')
  if (accept) {
    headers['Accept'] = accept
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

  const response = await fetch(targetUrl.toString(), {
    method: request.method,
    headers,
    body: body || undefined,
  })

  // Handle empty responses (e.g., DELETE 204)
  if (response.status === 204 || response.headers.get('content-length') === '0') {
    return new NextResponse(null, {
      status: response.status,
      headers: {
        'Content-Type': 'application/vnd.api+json',
      },
    })
  }

  const responseBody = await response.text()

  return new NextResponse(responseBody, {
    status: response.status,
    headers: {
      'Content-Type': response.headers.get('content-type') || 'application/vnd.api+json',
    },
  })
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> }
) {
  return proxyRequest(request, context)
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> }
) {
  return proxyRequest(request, context)
}

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> }
) {
  return proxyRequest(request, context)
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> }
) {
  return proxyRequest(request, context)
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> }
) {
  return proxyRequest(request, context)
}
