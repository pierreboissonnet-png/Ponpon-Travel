// Session token helpers, usable from middleware (edge) and server code.
import { SignJWT, jwtVerify } from 'jose';

export const SESSION_COOKIE = 'ev_session';
export const SESSION_DAYS = 200;

function key() {
  const s = process.env.AUTH_SECRET;
  if (!s || s.length < 16) throw new Error('AUTH_SECRET manquant ou trop court.');
  return new TextEncoder().encode(s);
}

export async function signSession(memberId: string) {
  return new SignJWT({})
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(memberId)
    .setIssuedAt()
    .setExpirationTime(`${SESSION_DAYS}d`)
    .sign(key());
}

export async function readSession(token: string | undefined): Promise<string | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, key(), { algorithms: ['HS256'] });
    return typeof payload.sub === 'string' ? payload.sub : null;
  } catch {
    return null;
  }
}
