import { NextResponse } from 'next/server'

export async function GET(request) {
  const { searchParams } = new URL(request.url)
  const url = searchParams.get('url')

  if (!url) {
    return new NextResponse('Missing url parameter', { status: 400 })
  }

  try {
    // 获取请求头中的range参数（支持断点续传）
    const range = request.headers.get('range')

    const headers = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Referer': 'https://www.bilibili.com/',
      'Accept': '*/*',
      'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
      'Origin': 'https://www.bilibili.com',
    }

    if (range) {
      headers['Range'] = range
    }

    const response = await fetch(url, {
      headers,
      method: range ? 'GET' : 'GET', // 总是GET，range在headers中
      signal: AbortSignal.timeout(300000), // 5分钟超时
    })

    if (!response.ok && response.status !== 206) {
      console.error('Proxy fetch failed:', response.status)
      return new NextResponse('Failed to fetch video', { status: response.status })
    }

    // 获取响应头
    const responseHeaders = new Headers()
    responseHeaders.set('Access-Control-Allow-Origin', '*')
    responseHeaders.set('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS')
    responseHeaders.set('Access-Control-Allow-Headers', 'Range')

    // 透传关键响应头
    if (response.headers.get('Content-Type')) {
      responseHeaders.set('Content-Type', response.headers.get('Content-Type'))
    }
    if (response.headers.get('Content-Length')) {
      responseHeaders.set('Content-Length', response.headers.get('Content-Length'))
    }
    if (response.headers.get('Content-Range')) {
      responseHeaders.set('Content-Range', response.headers.get('Content-Range'))
    }
    if (response.headers.get('Accept-Ranges')) {
      responseHeaders.set('Accept-Ranges', response.headers.get('Accept-Ranges'))
    }
    if (response.headers.get('Content-Disposition')) {
      responseHeaders.set('Content-Disposition', response.headers.get('Content-Disposition'))
    }

    // 返回流式响应
    return new NextResponse(response.body, {
      status: response.status,
      headers: responseHeaders,
    })
  } catch (error) {
    console.error('Proxy error:', error)
    return new NextResponse('Proxy failed: ' + error.message, { status: 500 })
  }
}

// 支持OPTIONS请求（CORS预检）
export async function OPTIONS() {
  return new NextResponse(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
      'Access-Control-Allow-Headers': 'Range',
      'Access-Control-Max-Age': '86400',
    },
  })
}
