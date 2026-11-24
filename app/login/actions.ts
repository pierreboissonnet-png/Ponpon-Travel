'use server';
import { cookies, headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { db } from '@/lib/db';
import { hashCode } from '@/lib/auth';
import { SESSION_COOKIE, SESSION_DAYS, signSession } from '@/lib/session';

export async function login(_: string | null, form: FormData): Promise<string | null> {
  const code = String(form.get('code') || '').replace(/\D/g, '');
  if (code.length !== 6) return 'Le code fait 6 chiffres.';
  const h = await headers();
  const ip = (h.get('x-forwarded-for') || '').split(',')[0].trim() || 'inconnu';
  const since = new Date(Date.now() - 15 * 60_000).toISOString();
  const { count } = await db().from('login_attempts').select('id', { count: 'exact', head: true }).eq('ip', ip).gte('at', since);
  if ((count ?? 0) >= 10) return 'Trop d’essais. Réessaie dans 15 minutes.';

  const { data: m } = await db().from('members').select('id').eq('code_hash', hashCode(code)).maybeSingle();
  if (!m) {
    await db().from('login_attempts').insert({ ip });
    return 'Code inconnu.';
  }
  (await cookies()).set(SESSION_COOKIE, await signSession(m.id), {
    httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', path: '/', maxAge: SESSION_DAYS * 86400,
  });
  redirect('/');
}

export async function logout() {
  (await cookies()).delete(SESSION_COOKIE);
  redirect('/login');
}
