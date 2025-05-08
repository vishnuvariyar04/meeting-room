import { Inter } from 'next/font/google'
import './globals.css'
import { AuthProvider } from '@/components/providers/AuthProvider'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'FiiRE Meeting Room Booking',
  description: 'Meeting Room Booking System for FiiRE Incubation Center',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthProvider>
        {children}
        </AuthProvider>
      </body>
    </html>
  )
}
