import './globals.css'
import { Inter_Tight, Newsreader } from 'next/font/google'
import { Nav } from '../components/ui'

const sans = Inter_Tight({
  subsets: ['latin'],
  style: ['normal', 'italic'],
  variable: '--font-sans',
  display: 'swap',
})
const serif = Newsreader({
  subsets: ['latin'],
  variable: '--font-serif',
  display: 'swap',
})

export const metadata = {
  title: 'Art. 12 Audit Log',
  description: 'Tamper-evident, privacy-aware AI-system log',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${sans.variable} ${serif.variable}`}>
      <body>
        <Nav />
        <main>{children}</main>
      </body>
    </html>
  )
}
