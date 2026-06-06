// src/components/RequireAuth.tsx — gate a page behind login
//
// Wrap any page's content with <RequireAuth> to require a logged-in user.
// While the session is being restored it shows a themed spinner; if no user,
// it redirects to /login (remembering where they were going).

import { useEffect, ReactNode } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../context/AuthContext';
import { Role } from '../lib/auth';

interface RequireAuthProps {
  children: ReactNode;
  roles?: Role[]; // optional: restrict to specific roles (admin always allowed)
}

export default function RequireAuth({ children, roles }: RequireAuthProps) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    if (!user) {
      const next = encodeURIComponent(router.asPath);
      router.replace(`/login?next=${next}`);
      return;
    }

    if (roles && roles.length > 0 && user.role !== 'admin' && !roles.includes(user.role)) {
      // Logged in but not allowed here — send home.
      router.replace('/');
    }
  }, [user, loading, roles, router]);

  // While restoring or redirecting, show a themed loader.
  if (loading || !user || (roles && roles.length > 0 && user.role !== 'admin' && !roles.includes(user.role))) {
    return (
      <div
        className="bg-gradient-to-br from-gray-900 via-indigo-900 to-violet-900 flex items-center justify-center"
        style={{ minHeight: '100dvh' }}
      >
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-indigo-400/30 border-t-indigo-400 rounded-full animate-spin" />
          <p className="text-indigo-200/70 text-sm">Loading…</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
