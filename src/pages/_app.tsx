import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import type { AppProps } from 'next/app'
import '@/styles/globals.css'

function MyApp({ Component, pageProps }: AppProps) {
  const router = useRouter()
  const [isReady, setIsReady] = useState(false)

  useEffect(() => {
    // Only runs on client, so localStorage is safe here
    const session = localStorage.getItem('cfmsSession')

    if (session && router.pathname === '/login') {
      router.replace('/')
    } else if (!session && router.pathname !== '/login') {
      router.replace('/login')
    } else {
      setIsReady(true)
    }
  }, [router.pathname])

  // Don't render anything until the logic above completes — safe for SSR
  if (typeof window === 'undefined' || !isReady) {
    return null
  }

  return <Component {...pageProps} />
}

export default MyApp
