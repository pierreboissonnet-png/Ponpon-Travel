import { NextResponse, type NextRequest } from 'next/server';

// Lightweight guard: sends visitors without a session cookie to /login.
// The cookie's signature is checked on the server by every page and API route (lib/auth.ts).
const SESSION_COOKIE = 'ev_session';
const PUBLIC = ['/login', '/setup', '/api/cron', '/manifest.webmanifest', '/sw.js', '/favicon.ico'];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  if (PUBLIC.some(p => pathname === p || pathname.startsWith(p + '/'))) return NextResponse.next();
  if (req.cookies.get(SESSION_COOKIE)?.value) return NextResponse.next();
  if (pathname.startsWith('/api/')) return NextResponse.json({ error: 'non connecté' }, { status: 401 });
  const url = req.nextUrl.clone();
  url.pathname = '/login';
  url.search = '';
  return NextResponse.redirect(url);
}

export const config = { matcher: ['/((?!_next/static|_next/image|.*\\.png$).*)'] };
