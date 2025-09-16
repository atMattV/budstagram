import './globals.css'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Budstagram',
  description: 'A tiny photo feed for Bud.',
  // your existing manifest file
  manifest: '/site.webmanifest',
  themeColor: '#0b0b0b',
  icons: {
    icon: [
      { url: '/icons/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/icons/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
    ],
    apple: [{ url: '/icons/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }],
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head />
      <body className="min-h-screen bg-black text-white">
        {children}

        {/* PWA: register the service worker */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
if ('serviceWorker' in navigator) {
  window.addEventListener('load', function () {
    navigator.serviceWorker.register('/sw.js').catch(function(){});
  });
}
`,
          }}
        />
      </body>
    </html>
  )
}
