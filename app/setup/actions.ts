'use server';
import crypto from 'node:crypto';
import { db } from '@/lib/db';
import { hashCode, newCode } from '@/lib/auth';

export type SetupState = { error?: string; code?: string; name?: string } | null;

/** Creates the first super admin. Only works while none exists, and needs SETUP_KEY. */
export async function createSuperadmin(_: SetupState, form: FormData): Promise<SetupState> {
  const key = String(form.get('key') || '');
  const name = String(form.get('name') || '').trim();
  const expected = process.env.SETUP_KEY || '';
  if (!expected || key.length !== expected.length || !crypto.timingSafeEqual(Buffer.from(key), Buffer.from(expected))) return { error: 'Clé d’installation incorrecte.' };
  if (!name) return { error: 'Indique ton prénom.' };
  const { count } = await db().from('members').select('id', { count: 'exact', head: true }).eq('role', 'superadmin');
  if ((count ?? 0) > 0) return { error: 'Un super admin existe déjà. Connecte-toi avec ton code.' };
  const code = newCode();
  const { error } = await db().from('members').insert({ name, role: 'superadmin', code_hash: hashCode(code) });
  if (error) return { error: 'Erreur : ' + error.message };
  return { code, name };
}
