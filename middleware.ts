import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getSessionFromRequest } from '@/lib/auth';

const PUBLIC_PATHS = ['/', '/search', '/barbers', '/style-match', '/login', '/register', '/api/auth', '/api/barbers', '/api/bookings', '/api/ai', '/booking/success', '/_next', '/favicon', '/fonts'];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Always allow public paths and static files
  if (pathname === '/' || PUBLIC_PATHS.some((p) => p !== '/' && pathname.startsWith(p))) {
    return NextResponse.next();
  }

  const session = await getSessionFromRequest(req);

  // Dashboard — barbers only
  if (pathname.startsWith('/dashboard')) {
    if (!session || session.role !== 'barber') {
      return NextResponse.redirect(new URL('/login?next=' + encodeURIComponent(pathname), req.url));
    }
    // Inject barber session into headers for server components
    const res = NextResponse.next();
    res.headers.set('x-user-id', session.sub);
    res.headers.set('x-user-role', session.role);
    if (session.barberId) res.headers.set('x-barber-id', session.barberId);
    return res;
  }

  // Admin — admin only
  if (pathname.startsWith('/admin')) {
    if (!session || session.role !== 'admin') {
      return NextResponse.redirect(new URL('/login', req.url));
    }
    const res = NextResponse.next();
    res.headers.set('x-user-id', session.sub);
    res.headers.set('x-user-role', session.role);
    return res;
  }

  // Customer bookings — customers only
  if (pathname.startsWith('/bookings')) {
    if (!session || session.role !== 'customer') {
      if (session?.role === 'barber') return NextResponse.redirect(new URL('/dashboard', req.url));
      return NextResponse.redirect(new URL('/login?next=' + encodeURIComponent(pathname), req.url));
    }
    const res = NextResponse.next();
    res.headers.set('x-user-id', session.sub);
    res.headers.set('x-user-role', session.role);
    return res;
  }

  // Protected API routes
  if (pathname.startsWith('/api/dashboard')) {
    if (!session || session.role !== 'barber') {
      return NextResponse.json({ error: 'Unauthorised' }, { status: 401 });
    }
  }

  if (pathname.startsWith('/api/admin')) {
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorised' }, { status: 401 });
    }
  }

  if (pathname.startsWith('/api/customer')) {
    if (!session || session.role !== 'customer') {
      return NextResponse.json({ error: 'Unauthorised' }, { status: 401 });
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
