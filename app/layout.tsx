import './globals.css'
import { Inter } from 'next/font/google'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'Crypto Wallet Bot',
  description: 'Telegram Crypto Wallet Bot',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-crypto-dark text-white min-h-screen`}>
        <main className="max-w-md mx-auto h-screen flex flex-col">
          {children}
        </main>
      </body>
    </html>
  )
} 