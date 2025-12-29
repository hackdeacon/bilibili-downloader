import './globals.css'

export const metadata = {
  title: 'Bilibili Downloader',
  description: 'An elegant and modern Bilibili video downloader, supporting multiple qualities with a smooth user experience.',
  keywords: 'Bilibili downloader, video download, Bilibili video',
  openGraph: {
    title: 'Bilibili Downloader',
    description: 'Elegant and modern Bilibili video downloader tool',
    type: 'website',
  },
}

export default function RootLayout({ children }) {
  return (
    <html lang="zh-CN">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
        <meta name="theme-color" content="#FB7299" />
      </head>
      <body className="antialiased">
        {children}
      </body>
    </html>
  )
}
