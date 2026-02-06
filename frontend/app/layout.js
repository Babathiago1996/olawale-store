import { Manrope } from 'next/font/google'
import './globals.css'
import { Toaster } from '@/components/ui/sonner'
import { AuthProvider } from '@/components/providers/auth-provider'

const manrope = Manrope({ 
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
})

export const metadata = {
  title: 'Olawale Store - Inventory Management',
  description: 'Professional inventory management system for Olawale Store',
  keywords: ['inventory', 'management', 'saas', 'olawale', 'store'],
   icons: {
    icon: "/olawale-favicon.png",
}}

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={manrope.variable}>
      <body className="font-sans antialiased">
        <AuthProvider>
          {children}
          <Toaster position="top-right" richColors />
        </AuthProvider>
      </body>
    </html>
  )
}