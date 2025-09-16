// src/app/layout.tsx
import './globals.css';
import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Budstagram',
  description: 'A tiny photo feed for Bud.',
  manifest: '/site.webmanifest',
  themeColor: '#0b0b0b',
  icons: {
    icon: [
      { url: '/icons/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/icons/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon.ico' },
    ],
    apple: [{ url: '/icons/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full">
      <body className="min-h-full bg-black text-white">
        {/* Top nav */}
        <header className="sticky top-0 z-20 border-b border-neutral-800 bg-black/80 backdrop-blur">
          <nav className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3">
            <Link href="/" prefetch={false} className="text-lg font-extrabold tracking-tight">
              Budstagram
            </Link>
            <div className="flex items-center gap-4 text-sm">
              <Link href="/" prefetch={false} className="opacity-90 hover:opacity-100">
                Feed
              </Link>
              <Link href="/admin" prefetch={false} className="opacity-90 hover:opacity-100">
                Admin
              </Link>
            </div>
          </nav>
        </header>

        {/* Page content */}
        <main className="mx-auto max-w-3xl px-4 py-6">{children}</main>

        {/* Footer */}
        <footer className="mx-auto max-w-3xl px-4 py-10 text-center text-xs opacity-60">
          © {new Date().getFullYear()} Budstagram · Built for Bud 🐾
        </footer>

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
  );
}
