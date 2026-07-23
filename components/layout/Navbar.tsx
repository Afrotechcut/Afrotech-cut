'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';

interface NavUser {
  id: string;
  email: string;
  full_name?: string;
  role: string;
}

export default function Navbar() {
  const [user, setUser] = useState<NavUser | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    fetch('/api/auth/me')
      .then((r) => r.json())
      .then((d) => setUser(d.user || null));
  }, [pathname]);

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    setUser(null);
    router.push('/');
    router.refresh();
  };

  const dashboardLink = user?.role === 'admin' ? '/admin' : user?.role === 'barber' ? '/dashboard' : '/bookings';
  const dashboardLabel = user?.role === 'barber' ? 'Dashboard' : user?.role === 'admin' ? 'Admin' : 'My Bookings';

  return (
    <nav className="sticky top-0 z-40 bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <div className="w-7 h-7 bg-gray-900 rounded-md flex items-center justify-center">
              <svg className="w-4 h-4 text-brand-400" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                <circle cx="6" cy="6" r="2.4" />
                <circle cx="6" cy="18" r="2.4" />
                <line x1="7.8" y1="7.6" x2="20" y2="19" />
                <line x1="7.8" y1="16.4" x2="20" y2="5" />
              </svg>
            </div>
            <span className="font-bold text-gray-900 tracking-tight text-[15px]">AFROTECHCUTS</span>
          </Link>

          {/* Desktop nav links */}
          <div className="hidden md:flex items-center gap-6">
            <Link href="/search" className="text-sm text-gray-600 hover:text-gray-900 font-medium transition-colors">Find a Barber</Link>
            <Link href="/style-match" className="text-sm text-gray-600 hover:text-gray-900 font-medium transition-colors">AI Style Match</Link>
          </div>

          {/* Desktop auth */}
          <div className="hidden md:flex items-center gap-3">
            {user ? (
              <>
                <Link href={dashboardLink} className="text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors">
                  {dashboardLabel}
                </Link>
                <button
                  onClick={handleLogout}
                  className="text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors"
                >
                  Sign out
                </button>
              </>
            ) : (
              <>
                <Link href="/login" className="text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors">Sign in</Link>
                <Link href="/register" className="inline-flex items-center px-4 py-2 text-sm font-semibold bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors">
                  Get started
                </Link>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <button
            className="md:hidden p-2 rounded-lg text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-colors"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            {menuOpen ? (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
            )}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden border-t border-gray-200 bg-white px-4 py-4 space-y-2">
          <Link href="/search" className="block py-2 text-sm font-medium text-gray-700" onClick={() => setMenuOpen(false)}>Find a Barber</Link>
          <Link href="/style-match" className="block py-2 text-sm font-medium text-gray-700" onClick={() => setMenuOpen(false)}>AI Style Match</Link>
          {user ? (
            <>
              <Link href={dashboardLink} className="block py-2 text-sm font-medium text-gray-700" onClick={() => setMenuOpen(false)}>{dashboardLabel}</Link>
              <button onClick={handleLogout} className="block py-2 text-sm font-medium text-gray-500 w-full text-left">Sign out</button>
            </>
          ) : (
            <>
              <Link href="/login" className="block py-2 text-sm font-medium text-gray-700" onClick={() => setMenuOpen(false)}>Sign in</Link>
              <Link href="/register" className="block py-2 text-sm font-semibold text-brand-600" onClick={() => setMenuOpen(false)}>Get started</Link>
            </>
          )}
        </div>
      )}
    </nav>
  );
}
