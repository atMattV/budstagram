// src/app/layout.tsx
import "./globals.css";
import Link from "next/link";

export const metadata = {
  title: 'Budstagram',
  description: 'A tiny photo feed for Bud.',
  manifest: '/manifest.webmanifest',
  themeColor: '#0b0b0b',
  icons: {
    icon: [
      { url: '/favicon-16x16.png', type: 'image/png', sizes: '16x16' },
      { url: '/favicon-32x32.png', type: 'image/png', sizes: '32x32' }
    ],
    apple: '/icons/apple-touch-icon.png',
    shortcut: '/favicon.ico'
  }
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-dvh bg-black text-neutral-100">
        <header className="border-b border-neutral-800">
          <nav className="mx-auto max-w-3xl px-4 h-12 flex items-center justify-between">
            <div className="font-black">Budstagram</div>
            <div className="flex items-center gap-6 text-sm">
              <Link href="/">Feed</Link>
              <Link href="/admin" prefetch={false}>
                Admin
              </Link>
            </div>
          </nav>
        </header>

        <main className="mx-auto max-w-3xl px-4 py-6">{children}</main>

        <footer className="mx-auto max-w-3xl px-4 py-10 text-xs opacity-60 text-center">
          © 2025 Budstagram · Built for Bud 🐾
        </footer>
      </body>
    </html>
  );
}
