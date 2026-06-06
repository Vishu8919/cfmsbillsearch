// src/components/LockedHistoryNotice.tsx
//
// Shown inside the history sidebar when the user is logged out. Explains that
// history requires login and sends them to /login?next=<current path> so they
// return to the same page afterward.

import { useRouter } from 'next/router';
import { FaLock, FaSignInAlt } from 'react-icons/fa';

export default function LockedHistoryNotice() {
  const router = useRouter();

  function goLogin() {
    const next = encodeURIComponent(router.asPath);
    router.push(`/login?next=${next}`);
  }

  return (
    <div className="flex flex-col items-center justify-center text-center px-6 py-12 gap-4">
      <div className="w-14 h-14 rounded-2xl bg-indigo-500/15 border border-indigo-400/20 flex items-center justify-center">
        <FaLock className="w-6 h-6 text-indigo-300" />
      </div>
      <div>
        <p className="text-white font-semibold text-base">History is locked</p>
        <p className="text-indigo-200/70 text-sm mt-1.5 leading-relaxed">
          Log in to save your searched bills and access them from any device.
          Your bills stay private to your account.
        </p>
      </div>
      <button
        onClick={goLogin}
        className="mt-1 inline-flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-5 py-2.5 rounded-xl shadow-lg hover:from-indigo-500 hover:to-purple-500 transition-all text-sm font-medium"
      >
        <FaSignInAlt className="w-3.5 h-3.5" />
        Log in to view history
      </button>
    </div>
  );
}
