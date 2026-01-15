import { NextResponse } from 'next/server'

const BILIBILI_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Referer': 'https://www.bilibili.com/',
  'Accept': '*/*',
  'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
  'Origin': 'https://www.bilibili.com',
}

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
  'Access-Control-Allow-Headers': 'Range',
  'Access-Control-Max-Age': '86400',
}

const PASSTHROUGH_HEADERS = [
  'Content-Type',
  'Content-Length',
  'Content-Range',
  'Accept-Ranges',
  'Content-Disposition',
]

export async function GET(request) {
  const { searchParams } = new URL(request.url)
  const url = searchParams.get('url')

  if (!url) {
    return new NextResponse('Missing url parameter', { status: 400 })
  }

  try {
    const range = request.headers.get('range')
    const headers = { ...BILIBILI_HEADERS }

    if (range) {
      headers['Range'] = range
    }

    const response = await fetch(url, {
      headers,
      signal: AbortSignal.timeout(300000),
    })

    if (!response.ok && response.status !== 206) {
      console.error('Proxy fetch failed:', response.status)
      return new NextResponse('Failed to fetch video', { status: response.status })
    }

    const responseHeaders = new Headers()
    Object.entries(CORS_HEADERS).forEach(([key, value]) => {
      responseHeaders.set(key, value)
    })

    PASSTHROUGH_HEADERS.forEach((header) => {
      const value = response.headers.get(header)
      if (value) {
        responseHeaders.set(header, value)
      }
    })

    return new NextResponse(response.body, {
      status: response.status,
      headers: responseHeaders,
    })
  } catch (error) {
    console.error('Proxy error:', error)
    return new NextResponse('Proxy failed: ' + error.message, { status: 500 })
  }
}

export async function OPTIONS() {
  return new NextResponse(null, { headers: CORS_HEADERS })
}
