import 'server-only';
import crypto from 'node:crypto';
import { cache } from 'react';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { db } from './db';
import { SESSION_COOKIE, readSession } from './session';
import { isAdmin, type Member } from './types';

/** Personal codes are stored as an HMAC, so a database leak does not reveal them. */
export function hashCode(code: string) {
  return crypto.createHmac('sha256', process.env.AUTH_SECRET || '').update(code.trim()).digest('hex');
}

export function newCode() {
  return String(crypto.randomInt(0, 1_000_000)).padStart(6, '0');
}

/** The signed-in member, re-read from the database on every request (role changes apply at once). */
export const currentMember = cache(async (): Promise<Member | null> => {
  const id = await readSession((await cookies()).get(SESSION_COOKIE)?.value);
  if (!id) return null;
  const { data } = await db().from('members').select('id,name,role').eq('id', id).maybeSingle();
  return (data as Member) ?? null;
});

export async function requireMember(): Promise<Member> {
  const m = await currentMember();
  if (!m) redirect('/login');
  return m;
}

export async function requireAdmin(): Promise<Member> {
  const m = await requireMember();
  if (!isAdmin(m.role)) redirect('/');
  return m;
}

export async function requireSuperadmin(): Promise<Member> {
  const m = await requireMember();
  if (m.role !== 'superadmin') redirect('/');
  return m;
}
