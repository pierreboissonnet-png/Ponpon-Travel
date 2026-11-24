'use server';
import { after } from 'next/server';
import { revalidatePath } from 'next/cache';
import { db } from '@/lib/db';
import { requireAdmin, requireMember } from '@/lib/auth';
import { pushTo, pushToAdmins } from '@/lib/push';
import { triage } from '@/lib/triage';
import { isAdmin } from '@/lib/types';

const clean = (s: unknown, max: number) => String(s ?? '').replace(/[\u0000-\u0008\u000b-\u001f]/g, '').trim().slice(0, max);
const okImg = (s: unknown) => typeof s === 'string' && /^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/.test(s) && s.length < 890000 ? s : null;

export type BugResult = { ok: true; no: number } | { ok: false; error: string };

export async function createBug(input: { text: string; ctx: Record<string, unknown>; img: string | null }): Promise<BugResult> {
  const me = await requireMember();
  const text = clean(input.text, 2000);
  if (text.length < 3) return { ok: false, error: 'Décris le problème en quelques mots.' };
  if (!isAdmin(me.role)) {
    // anti-abuse: at most 30 untreated reports sent in 24 h
    const since = new Date(Date.now() - 86400_000).toISOString();
    const { count } = await db().from('bug_reports').select('id', { count: 'exact', head: true }).eq('member_id', me.id).gte('created_at', since).in('status', ['new', 'doing']);
    if ((count ?? 0) >= 30) return { ok: false, error: 'Tu as déjà 30 signalements en attente depuis 24 h : réessaie quand une partie aura été traitée.' };
  }
  const raw = input.ctx && typeof input.ctx === 'object' ? input.ctx : {};
  const ctx = JSON.stringify(raw).length < 20000 ? raw : { ecran: String((raw as { ecran?: unknown }).ecran ?? ''), tronque: true };
  const { data, error } = await db().from('bug_reports').insert({ member_id: me.id, pseudo: me.name, text, ctx, img: okImg(input.img) }).select('id,no').single();
  if (error) return { ok: false, error: error.message };
  await pushToAdmins({ title: `🐞 Signalement n°${data.no} · ${me.name}`, body: text.slice(0, 160), url: `/signalements/${data.no}`, tag: `bug-${data.no}` }, me.id);
  after(() => triage(data.id));
  revalidatePath('/signalements');
  return { ok: true, no: data.no };
}

async function bugFor(no: number) {
  const { data } = await db().from('bug_reports').select('id,no,member_id,status').eq('no', no).maybeSingle();
  return data;
}

export async function updateBug(no: number, status: string, note: string) {
  const me = await requireAdmin();
  const b = await bugFor(no);
  if (!b) throw new Error('Signalement introuvable');
  const patch: Record<string, unknown> = { note: clean(note, 1000) || null, updated_by: me.name, updated_at: new Date().toISOString() };
  if (['new', 'doing', 'done', 'wontfix'].includes(status)) patch.status = status;
  await db().from('bug_reports').update(patch).eq('id', b.id);
  if (b.member_id && b.member_id !== me.id && patch.status !== b.status) {
    const label: Record<string, string> = { new: 'Nouveau', doing: 'En cours', done: 'Résolu', wontfix: 'Sans suite' };
    await pushTo([b.member_id], { title: `Signalement n°${no} : ${label[status] ?? status}`, body: clean(note, 140) || 'Statut mis à jour.', url: `/signalements/${no}`, tag: `bug-${no}` });
  }
  revalidatePath('/signalements', 'layout');
}

export async function deleteBug(no: number) {
  await requireAdmin();
  await db().from('bug_reports').delete().eq('no', no);
  revalidatePath('/signalements', 'layout');
}

/** Exchanges: the reporter adds details (text, screenshot), the team answers. A reporter's message puts the report back to "Nouveau". */
export async function addBugComment(no: number, text: string, img: string | null) {
  const me = await requireMember();
  const admin = isAdmin(me.role);
  const b = await bugFor(no);
  if (!b || (!admin && b.member_id !== me.id)) throw new Error('Signalement introuvable');
  const body = clean(text, 2000);
  if (!body) return;
  await db().from('bug_comments').insert({ bug_id: b.id, member_id: me.id, pseudo: me.name, text: body, img: okImg(img), from_admin: admin });
  await db().from('bug_reports').update({ updated_at: new Date().toISOString(), ...(admin ? {} : { status: 'new' }) }).eq('id', b.id);
  if (admin) {
    if (b.member_id && b.member_id !== me.id) await pushTo([b.member_id], { title: `Réponse sur le signalement n°${no}`, body: body.slice(0, 160), url: `/signalements/${no}`, tag: `bug-${no}` });
  } else {
    await pushToAdmins({ title: `🐞 Précision sur le n°${no} · ${me.name}`, body: body.slice(0, 160), url: `/signalements/${no}`, tag: `bug-${no}` }, me.id);
  }
  revalidatePath('/signalements', 'layout');
}

export async function setBugApiOff(off: boolean) {
  await requireAdmin();
  const { data } = await db().from('app_config').select('value').eq('key', 'bugapi').maybeSingle();
  await db().from('app_config').upsert({ key: 'bugapi', value: { ...(data?.value ?? {}), off } });
  revalidatePath('/signalements');
}
