import { NextResponse } from 'next/server'

export async function POST(request) {
  try {
    const { url } = await request.json()

    if (!url) {
      return NextResponse.json({ error: '请输入视频链接' }, { status: 400 })
    }

    const bvidMatch = url.match(/(BV[\w]+)/)
    if (!bvidMatch) {
      return NextResponse.json({ error: '无效的链接格式' }, { status: 400 })
    }

    const bvid = bvidMatch[1]

    // 获取视频信息
    const videoInfo = await getVideoInfo(bvid)

    return NextResponse.json(videoInfo)
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json({ error: error.message || '获取视频信息失败' }, { status: 500 })
  }
}

async function getVideoInfo(bvid) {
  const headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Referer': 'https://www.bilibili.com/',
    'Accept': 'application/json, text/plain, */*',
  }

  // 获取视频基本信息
  const viewUrl = `https://api.bilibili.com/x/web-interface/view?bvid=${bvid}`
  let videoData = null

  try {
    const viewResponse = await fetch(viewUrl, { headers })
    if (viewResponse.ok) {
      const viewData = await viewResponse.json()
      if (viewData.code === 0) {
        videoData = viewData.data
      }
    }
  } catch (e) {
    console.error('获取视频信息失败:', e)
  }

  if (!videoData) {
    return {
      success: false,
      error: '无法获取视频信息',
      bvid,
    }
  }

  const cid = videoData.cid || videoData.pages?.[0]?.cid

  // 获取视频下载地址（无需签名）
  const downloadLinks = await getDownloadUrls(bvid, cid, headers)

  return {
    success: true,
    title: videoData.title,
    cover: videoData.pic,
    description: videoData.desc,
    author: videoData.owner?.name,
    face: videoData.owner?.face,
    view: videoData.stat?.view,
    like: videoData.stat?.like,
    coin: videoData.stat?.coin,
    duration: videoData.duration,
    bvid: videoData.bvid,
    aid: videoData.aid,
    pages: videoData.pages || [],
    downloadLinks,
    playUrl: `https://www.bilibili.com/video/${bvid}`,
    needLogin: downloadLinks.length === 0,
  }
}

async function getDownloadUrls(bvid, cid, headers) {
  const links = []

  // 直接调用无需签名的播放接口（360P流畅）
  try {
    const apiUrl = `https://api.bilibili.com/x/player/playurl?bvid=${bvid}&cid=${cid}&qn=16&fnval=0`
    const response = await fetch(apiUrl, {
      headers,
      signal: AbortSignal.timeout(10000)
    })

    if (response.ok) {
      const data = await response.json()
      if (data.code === 0 && data.data?.durl) {
        data.data.durl.forEach((item, index) => {
          links.push({
            type: 'video',
            quality: '360P',
            qualityId: 16,
            url: item.url,
            order: index + 1,
            source: '官方无签名',
          })
        })
      }
    }
  } catch (e) {
    console.error('获取下载链接失败:', e.message)
  }

  return links
}

export async function OPTIONS() {
  return NextResponse.json({}, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  })
}
