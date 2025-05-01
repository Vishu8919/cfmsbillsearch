import { useRouter } from 'next/router'
import { useEffect, useState, ComponentType } from 'react'

function withAuth<T extends JSX.IntrinsicAttributes>(WrappedComponent: ComponentType<T>) {
  const AuthComponent = (props: T) => {
    const router = useRouter()
    const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null)

    useEffect(() => {
      const session = localStorage.getItem('cfmsSession')
      if (!session) {
        // Redirect to login page if session doesn't exist
        router.push('/login')
      } else {
        // Session exists, user is authenticated
        setIsAuthenticated(true)
      }
    }, [router])

    // While checking the authentication state, render nothing (or a loading spinner)
    if (isAuthenticated === null) {
      return null // or render a loading spinner
    }

    // Once authentication state is determined, render the wrapped component
    return <WrappedComponent {...props} />
  }

  return AuthComponent
}

export default withAuth
