import './globals.css'

export const metadata = {
  title: 'Bilibili Demo',
  description: 'Bilibili Demo',
  keywords: 'Bilibili Demo',
  openGraph: {
    title: 'Bilibili Demo',
    description: 'Bilibili Demo',
    type: 'website',
  },
}

export default function RootLayout({ children }) {
  return (
    <html lang="zh-CN">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover" />
        <meta name="theme-color" content="#FB7299" />
      </head>
      <body className="antialiased">
        {children}
      </body>
    </html>
  )
}
