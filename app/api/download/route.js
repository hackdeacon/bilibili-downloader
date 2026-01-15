import { NextResponse } from 'next/server'

const BILIBILI_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Referer': 'https://www.bilibili.com/',
  'Accept': 'application/json, text/plain, */*',
}

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
}

export async function POST(request) {
  try {
    const { url } = await request.json()

    if (!url) {
      return NextResponse.json({ error: 'Please enter a video link' }, { status: 400 })
    }

    const bvidMatch = url.match(/(BV[\w]+)/)
    if (!bvidMatch) {
      return NextResponse.json({ error: 'Invalid link format' }, { status: 400 })
    }

    const videoInfo = await fetchVideoInfo(bvidMatch[1])
    return NextResponse.json(videoInfo)
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to get video info' },
      { status: 500 }
    )
  }
}

export async function OPTIONS() {
  return NextResponse.json({}, { headers: CORS_HEADERS })
}

async function fetchVideoInfo(bvid) {
  const viewUrl = `https://api.bilibili.com/x/web-interface/view?bvid=${bvid}`

  const response = await fetch(viewUrl, { headers: BILIBILI_HEADERS })
  if (!response.ok) {
    return { success: false, error: 'Failed to fetch video info', bvid }
  }

  const { code, data } = await response.json()
  if (code !== 0 || !data) {
    return { success: false, error: 'Failed to fetch video info', bvid }
  }

  const cid = data.cid || data.pages?.[0]?.cid
  const downloadLinks = await fetchDownloadUrls(bvid, cid)

  return {
    success: true,
    title: data.title,
    cover: data.pic,
    description: data.desc,
    author: data.owner?.name,
    face: data.owner?.face,
    view: data.stat?.view,
    like: data.stat?.like,
    coin: data.stat?.coin,
    duration: data.duration,
    bvid: data.bvid,
    aid: data.aid,
    pages: data.pages || [],
    downloadLinks,
    playUrl: `https://www.bilibili.com/video/${bvid}`,
    needLogin: downloadLinks.length === 0,
  }
}

async function fetchDownloadUrls(bvid, cid) {
  const apiUrl = `https://api.bilibili.com/x/player/playurl?bvid=${bvid}&cid=${cid}&qn=16&fnval=0`

  try {
    const response = await fetch(apiUrl, {
      headers: BILIBILI_HEADERS,
      signal: AbortSignal.timeout(10000),
    })

    if (!response.ok) return []

    const { code, data } = await response.json()
    if (code !== 0 || !data?.durl) return []

    return data.durl.map((item, index) => ({
      type: 'video',
      quality: '360P',
      qualityId: 16,
      url: item.url,
      order: index + 1,
    }))
  } catch (error) {
    console.error('Failed to fetch download links:', error.message)
    return []
  }
}
