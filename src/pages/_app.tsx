import type { AppProps } from 'next/app';
import '../styles/globals.css';
import { AuthProvider } from '../context/AuthContext';
import Navbar from '../components/Navbar';

export default function App({ Component, pageProps }: AppProps) {
  return (
    <AuthProvider>
      {/* Mounted once here rather than per page, so all 19 routes plus the 11
          article pages get it -- including /admin, which previously had no way
          back to the rest of the site. */}
      <Navbar />
      <Component {...pageProps} />
    </AuthProvider>
  );
}
