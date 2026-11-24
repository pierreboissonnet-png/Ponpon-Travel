import { NextResponse, type NextRequest } from 'next/server';
import { SESSION_COOKIE, readSession } from './lib/session';

const PUBLIC = ['/login', '/setup', '/api/cron', '/manifest.webmanifest', '/sw.js', '/icon', '/apple-touch-icon.png', '/favicon.ico'];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  if (PUBLIC.some(p => pathname === p || pathname.startsWith(p + '/') || pathname.startsWith(p + '-'))) return NextResponse.next();
  const ok = await readSession(req.cookies.get(SESSION_COOKIE)?.value);
  if (ok) return NextResponse.next();
  if (pathname.startsWith('/api/')) return NextResponse.json({ error: 'non connecté' }, { status: 401 });
  const url = req.nextUrl.clone();
  url.pathname = '/login';
  url.search = '';
  return NextResponse.redirect(url);
}

export const config = { matcher: ['/((?!_next/static|_next/image|.*\\.png$).*)'] };
