import './globals.css'
import Providers from '@/components/Providers'

export const metadata = {
  title: 'Interpark Property Management System',
  description: 'Manage your properties efficiently',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('interpark-theme');document.documentElement.classList.toggle('dark',t==='dark');document.documentElement.style.colorScheme=t==='dark'?'dark':'light'}catch(e){}})();`,
          }}
        />
      </head>
      <body>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  )
}
