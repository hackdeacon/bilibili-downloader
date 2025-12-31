'use client'

import { useState, useEffect, useRef } from 'react'

// 日系简约色彩系统 - 已移至 tailwind.config.js

// 图片代理
const getProxyImage = (url) => {
  if (!url) return null
  return `https://corsproxy.io/?${encodeURIComponent(url)}`
}

// 视频代理
const getVideoProxy = (url) => {
  if (!url) return ''
  return `/api/proxy?url=${encodeURIComponent(url)}`
}

// Bicon Component from Simple Icons
const BilibiliIcon = ({ className }) => (
  <svg role="img" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg" className={className}>
    <title>Bilibili</title>
    <path d="M17.813 4.653h.854c1.51.054 2.769.578 3.773 1.574 1.004.995 1.524 2.249 1.56 3.76v7.36c-.036 1.51-.556 2.769-1.56 3.773s-2.262 1.524-3.773 1.56H5.333c-1.51-.036-2.769-.556-3.773-1.56S.036 18.858 0 17.347v-7.36c.036-1.511.556-2.765 1.56-3.76 1.004-.996 2.262-1.52 3.773-1.574h.774l-1.174-1.12a1.234 1.234 0 0 1-.373-.906c0-.356.124-.658.373-.907l.027-.027c.267-.249.573-.373.92-.373.347 0 .653.124.92.373L9.653 4.44c.071.071.134.142.187.213h4.267a.836.836 0 0 1 .16-.213l2.853-2.747c.267-.249.573-.373.92-.373.347 0 .662.151.929.4.267.249.391.551.391.907 0 .355-.124.657-.373.906zM5.333 7.24c-.746.018-1.373.276-1.88.773-.506.498-.769 1.13-.786 1.894v7.52c.017.764.28 1.395.786 1.893.507.498 1.134.756 1.88.773h13.334c.746-.017 1.373-.275 1.88-.773.506-.498.769-1.129.786-1.893v-7.52c-.017-.765-.28-1.396-.786-1.894-.507-.497-1.134-.755-1.88-.773zM8 11.107c.373 0 .684.124.933.373.25.249.383.569.4.96v1.173c-.017.391-.15.711-.4.96-.249.25-.56.374-.933.374s-.684-.125-.933-.374c-.25-.249-.383-.569-.4-.96V12.44c0-.373.129-.689.386-.947.258-.257.574-.386.947-.386zm8 0c.373 0 .684.124.933.373.25.249.383.569.4.96v1.173c-.017.391-.15.711-.4.96-.249.25-.56.374-.933.374s-.684-.125-.933-.374c-.25-.249-.383-.569-.4-.96V12.44c.017-.391.15-.711.4-.96.249-.249.56-.373.933-.373Z" />
  </svg>
)

export default function Home() {
  const [mounted, setMounted] = useState(false)
  const [url, setUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [videoInfo, setVideoInfo] = useState(null)
  const [copiedIndex, setCopiedIndex] = useState(null)
  const [downloading, setDownloading] = useState(null)
  const [showPreview, setShowPreview] = useState(null)
  const [focused, setFocused] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!url.trim()) {
      setError('Please enter a video link')
      return
    }

    const bvidMatch = url.match(/(BV[\w]+)/)
    if (!bvidMatch) {
      setError('Invalid Bilibili link format')
      return
    }

    setError('')
    setLoading(true)
    setVideoInfo(null)

    try {
      const response = await fetch('/api/download', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: url.trim() }),
      })

      const data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to get video info, please check the link')
      }

      setVideoInfo(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText()
      setUrl(text)
      if (text) setError('')
    } catch (err) {
      console.error('Failed to read clipboard:', err)
    }
  }

  const handleCopy = async (text, index) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedIndex(index)
      setTimeout(() => setCopiedIndex(null), 2000)
    } catch (err) {
      setError('Copy failed, please copy manually')
    }
  }

  const handleDownload = async (link) => {
    setDownloading(link.quality)
    try {
      const proxyUrl = getVideoProxy(link.url)
      const a = document.createElement('a')
      a.href = proxyUrl
      a.download = `${videoInfo?.bvid || 'video'}_${link.quality}.mp4`
      a.target = '_blank'
      a.rel = 'noopener noreferrer'
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      setTimeout(() => setDownloading(null), 2000)
    } catch (err) {
      console.error('Download failed:', err)
    }
  }

  const reset = () => {
    setUrl('')
    setError('')
    setVideoInfo(null)
    setCopiedIndex(null)
    setDownloading(null)
    setShowPreview(null)
  }

  const formatDuration = (seconds) => {
    const h = Math.floor(seconds / 3600)
    const m = Math.floor((seconds % 3600) / 60)
    const s = seconds % 60
    if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
    return `${m}:${s.toString().padStart(2, '0')}`
  }

  const formatNumber = (num) => {
    if (num >= 100000000) return (num / 100000000).toFixed(1) + 'E'
    if (num >= 10000) return (num / 10000).toFixed(1) + 'W'
    return num.toLocaleString()
  }

  const videoLinks = videoInfo?.downloadLinks?.filter(l => l.type === 'video') || []
  const audioLinks = videoInfo?.downloadLinks?.filter(l => l.type === 'audio') || []

  return (
    <div className={`min-h-screen flex flex-col bg-off-white text-ink-900 font-sans selection:bg-primary-100 selection:text-primary-900 ${mounted ? 'transition-opacity duration-300' : ''}`}>
      {/* Main Content */}
      <main className="flex-1 flex flex-col p-6 sm:p-8 lg:p-12">
        <div className="flex-1 flex flex-col max-w-2xl mx-auto w-full">

          {/* Unifed Header/Hero Section */}
          <div className={`
            flex flex-col ${mounted ? 'transition-all duration-700 ease-silky' : ''} will-change-transform
            ${videoInfo || loading ? 'mb-8' : 'flex-1 justify-center -mt-20'}
          `}>
            <div className={`
              flex ${mounted ? 'transition-all duration-700 ease-silky' : ''}
              ${videoInfo || loading ? 'flex-row items-center gap-3' : 'flex-col items-center'}
            `}>
              <div className={`
                ${mounted ? 'transition-all duration-700 ease-silky' : ''}
                ${videoInfo || loading ? 'w-10 h-10' : 'w-24 h-24 mb-8'}
              `}>
                <BilibiliIcon className="w-full h-full text-primary-500" />
              </div>

              <div className={`
                ${mounted ? 'transition-all duration-700 ease-silky' : ''}
                ${videoInfo || loading ? '' : 'text-center'}
              `}>
                <h1 className={`
                  font-bold text-ink-900 ${mounted ? 'transition-all duration-700 ease-silky' : ''}
                  ${videoInfo || loading ? 'text-lg' : 'text-3xl mb-3'}
                `}>
                  Bilibili Downloader
                </h1>
                <p className={`
                  text-ink-500 ${mounted ? 'transition-all duration-500 ease-in-out' : ''}
                  ${videoInfo || loading ? 'text-xs font-medium' : 'text-lg'}
                `}>
                  Simple and pure Bilibili video downloader
                </p>
              </div>
            </div>
          </div>

          {/* Search Form - Floating Style */}
          <form onSubmit={handleSubmit} className={`relative z-10 ${mounted ? 'transition-all duration-700 ease-silky' : ''} will-change-transform ${!(videoInfo || loading) ? 'w-full max-w-xl mx-auto' : ''}`}>
            <div className="flex flex-col md:flex-row items-stretch gap-3 md:gap-0">
              <div className={`
                flex-1 relative overflow-hidden rounded-2xl md:rounded-r-none md:border-r-0 bg-surface border transition-colors duration-200
                ${focused ? 'border-primary-500' : 'border-ink-200'}
             `}>
                <div className="flex items-center p-2">
                  <div className="flex-1 flex items-center px-3">
                    <svg
                      className={`w-5 h-5 mr-3 transition-colors ${focused ? 'text-primary-500' : 'text-ink-300'}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <input
                      type="text"
                      value={url}
                      onChange={(e) => {
                        setUrl(e.target.value)
                        if (e.target.value) setError('')
                      }}
                      onFocus={() => setFocused(true)}
                      onBlur={() => setFocused(false)}
                      placeholder="URL / BV"
                      className="w-full py-3 text-base text-ink-900 placeholder:text-ink-300 bg-transparent border-none outline-none"
                      disabled={loading}
                      autoComplete="off"
                    />
                  </div>
                </div>
              </div>


              <button
                type="submit"
                disabled={loading || !url.trim()}
                className={`
                    px-8 py-3.5 text-base font-medium rounded-2xl md:rounded-l-none transition-colors duration-200 flex items-center justify-center flex-shrink-0 md:border md:border-l-0
                    ${focused ? 'md:border-primary-500' : 'md:border-transparent'}
                    ${loading || !url.trim()
                    ? 'bg-primary-500/40 text-white/50 cursor-not-allowed'
                    : 'bg-primary-500 text-white hover:bg-primary-400 active:bg-primary-600'}
                  `}
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Parsing...
                  </span>
                ) : 'Parse'}
              </button>
            </div>
            {error && (
              <div className="absolute top-full left-0 right-0 mt-3 p-3 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm flex items-center gap-2 border border-red-100 dark:border-red-900/50 animate-slide-up">
                <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>{error}</span>
              </div>
            )}
          </form>

          {/* Video Info & Download */}
          {videoInfo && (
            <div className="mt-8 space-y-6 animate-slide-up" style={{ animationDelay: '0.2s', animationFillMode: 'both' }}>

              {/* Info Card */}
              <div className="bg-surface rounded-2xl border border-ink-200 overflow-hidden">
                <div className="md:flex">
                  {/* Cover */}
                  <div className="md:w-2/5 relative aspect-video md:aspect-auto">
                    <img
                      src={getProxyImage(videoInfo.cover)}
                      alt={videoInfo.title}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.src = 'data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 24 24%22><rect fill=%22%23f5f5f5%22 width=%2224%22 height=%2224%22/></svg>'
                      }}
                    />
                    {videoInfo.duration && (
                      <div className="absolute bottom-3 right-3 px-2 py-1 bg-black/70 backdrop-blur-md text-white text-xs font-medium rounded-md">
                        {formatDuration(videoInfo.duration)}
                      </div>
                    )}
                  </div>

                  {/* Details */}
                  <div className="p-5 md:w-3/5 flex flex-col justify-center">
                    <h3 className="text-lg font-bold text-ink-900 leading-snug mb-3 line-clamp-2">
                      {videoInfo.title}
                    </h3>

                    <div className="flex items-center gap-3 mb-4">
                      {videoInfo.face && (
                        <img
                          src={getProxyImage(videoInfo.face)}
                          alt={videoInfo.author}
                          className="w-8 h-8 rounded-full border border-ink-100 bg-ink-50"
                          onError={(e) => e.target.style.display = 'none'}
                        />
                      )}
                      <div>
                        <p className="text-sm font-medium text-ink-900">{videoInfo.author}</p>
                        {videoInfo.bvid && (
                          <p className="text-xs text-ink-400 font-mono mt-0.5">{videoInfo.bvid}</p>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-nowrap gap-1 text-xs">
                      {[
                        {
                          label: 'Views',
                          value: videoInfo.view,
                          icon: (
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                              <circle cx="12" cy="12" r="3" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                          )
                        },
                        {
                          label: 'Likes',
                          value: videoInfo.like,
                          icon: (
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
                            </svg>
                          )
                        },
                        {
                          label: 'Coins',
                          value: videoInfo.coin,
                          icon: (
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                            </svg>
                          )
                        }
                      ].filter(i => i.value).map((item, i) => (
                        <span key={i} className="px-1.5 py-1 rounded-md bg-ink-50 text-ink-500 font-medium flex items-center gap-1 whitespace-nowrap overflow-hidden text-ellipsis">
                          <span className="flex-shrink-0">{item.icon}</span>
                          <span className="truncate">{formatNumber(item.value)} {item.label}</span>
                        </span>
                      ))}
                    </div>

                    <div className="mt-6 flex flex-wrap gap-3">
                      {videoLinks.length > 0 && videoLinks.map((link, index) => (
                        <div key={index} className="flex gap-3 w-full md:w-auto">
                          <button
                            onClick={() => handleDownload(link)}
                            disabled={downloading === link.quality}
                            className={`
                              flex-1 md:flex-none px-6 py-2.5 text-sm font-medium rounded-xl transition-all flex items-center justify-center gap-2
                              ${downloading === link.quality
                                ? 'bg-primary-500/40 text-white cursor-wait'
                                : 'bg-primary-500 text-white hover:bg-primary-400 active:bg-primary-600'}
                            `}
                          >
                            {downloading === link.quality ? (
                              <>
                                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Downloading...
                              </>
                            ) : (
                              <>
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                </svg>
                                Download
                              </>
                            )}
                          </button>
                          <button
                            onClick={() => setShowPreview({ url: getVideoProxy(link.url), quality: link.quality })}
                            className="px-6 py-2.5 text-sm font-medium text-primary-500 bg-primary-50 border border-transparent rounded-xl hover:bg-primary-100 transition-colors flex items-center justify-center gap-2"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            </svg>
                            Preview
                          </button>
                        </div>
                      ))}

                      {videoLinks.length === 0 && (
                        <a
                          href={videoInfo.playUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-white bg-primary-500 rounded-lg hover:bg-primary-400 transition"
                        >
                          Watch on Bilibili
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Tip */}
              <div className="flex items-start gap-2 justify-center text-xs text-ink-400 dark:text-ink-500 bg-ink-50/50 p-3 rounded-xl border border-dashed border-ink-200">
                {/* <svg className="w-4 h-4 flex-shrink-0 text-ink-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="10" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M12 16v-4" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M12 8h.01" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                </svg> */}
                <span>💡 仅供学习交流使用</span>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="py-6 text-center">
        <p className="text-xs text-ink-300 font-medium space-x-2">
          <a
            href="https://github.com/hackdeacon/bilibili-downloader"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-primary-500 transition-colors"
          >
            GitHub
          </a>
          <span>·</span>
          <a
            href="https://x.com/hackdeacon"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-primary-500 transition-colors"
          >
            hackdeacon
          </a>
        </p>
      </footer>

      {/* Preview Modal */}
      {showPreview && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink-900/80 dark:bg-black/90 backdrop-blur-sm animate-fade-in"
          onClick={() => setShowPreview(null)}
        >
          <div
            className="relative w-full max-w-4xl bg-black rounded-2xl overflow-hidden animate-scale-in"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-4 py-3 bg-white/10 backdrop-blur-md border-b border-white/10">
              <span className="text-sm text-white font-medium">{showPreview.quality} Preview</span>
              <button
                onClick={() => setShowPreview(null)}
                className="p-1.5 rounded-lg text-white/70 hover:text-white hover:bg-white/20 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="pt-0">
              <video
                src={showPreview.url}
                controls
                autoPlay
                className="w-full aspect-video bg-black"
                playsInline
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
