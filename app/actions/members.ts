'use server';
import { revalidatePath } from 'next/cache';
import { db } from '@/lib/db';
import { hashCode, newCode, requireSuperadmin } from '@/lib/auth';
import type { Role } from '@/lib/types';

export type CodeResult = { error?: string; code?: string; name?: string } | null;
const ROLES: Role[] = ['superadmin', 'admin', 'guest'];

/** Inserts with a fresh code, retrying on the (unlikely) clash of two codes. */
async function withFreshCode(fn: (hash: string) => Promise<{ error: { code?: string; message: string } | null }>) {
  for (let i = 0; i < 5; i++) {
    const code = newCode();
    const { error } = await fn(hashCode(code));
    if (!error) return { code };
    if (error.code !== '23505') return { error: error.message };
  }
  return { error: 'Impossible de générer un code unique, réessaie.' };
}

export async function addMember(_: CodeResult, form: FormData): Promise<CodeResult> {
  await requireSuperadmin();
  const name = String(form.get('name') || '').trim().slice(0, 40);
  const role = String(form.get('role')) as Role;
  if (!name) return { error: 'Indique un prénom.' };
  if (!ROLES.includes(role)) return { error: 'Profil invalide.' };
  const r = await withFreshCode(async h => await db().from('members').insert({ name, role, code_hash: h }));
  revalidatePath('/admin/membres');
  return r.error ? { error: r.error } : { code: r.code, name };
}

export async function resetCode(_: CodeResult, form: FormData): Promise<CodeResult> {
  await requireSuperadmin();
  const id = String(form.get('id'));
  const { data: m } = await db().from('members').select('name').eq('id', id).single();
  if (!m) return { error: 'Participant introuvable.' };
  const r = await withFreshCode(async h => await db().from('members').update({ code_hash: h }).eq('id', id));
  return r.error ? { error: r.error } : { code: r.code, name: m.name };
}

async function superadminCount() {
  const { count } = await db().from('members').select('id', { count: 'exact', head: true }).eq('role', 'superadmin');
  return count ?? 0;
}

export async function changeRole(form: FormData) {
  const me = await requireSuperadmin();
  const id = String(form.get('id'));
  const role = String(form.get('role')) as Role;
  if (!ROLES.includes(role)) return;
  if (id === me.id && role !== 'superadmin' && (await superadminCount()) <= 1) return;
  await db().from('members').update({ role }).eq('id', id);
  revalidatePath('/admin/membres');
}

export async function removeMember(form: FormData) {
  const me = await requireSuperadmin();
  const id = String(form.get('id'));
  if (id === me.id) return;
  await db().from('members').delete().eq('id', id);
  revalidatePath('/admin/membres');
}
