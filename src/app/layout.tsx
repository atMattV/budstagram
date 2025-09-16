// src/app/layout.tsx
import "./globals.css";
import Link from "next/link";

export const metadata = {
  title: 'Budstagram',
  description: 'A tiny Instagram-style feed for Bud.',
  themeColor: '#111111',
  icons: {
    icon: [
      { url: '/icons/icon-192.png', sizes: '192x192' },
      { url: '/icons/icon-512.png', sizes: '512x512' },
    ],
    apple: [{ url: '/icons/apple-touch-icon.png', sizes: '180x180' }],
  },
};

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
