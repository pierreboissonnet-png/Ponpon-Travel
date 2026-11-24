'use server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { db } from '@/lib/db';
import { requireAdmin, requireMember } from '@/lib/auth';
import { pushTo, pushToAdmins } from '@/lib/push';
import { isAdmin, type Member } from '@/lib/types';

const PREFIX: Record<number, string> = { 1: '🔴 URGENT', 2: '🟠 Important', 3: 'ℹ️ Info' };

async function canSee(me: Member, convId: string) {
  const { data } = await db().from('conversations').select('id,created_by,subject,urgency,status').eq('id', convId).maybeSingle();
  if (!data || (!isAdmin(me.role) && data.created_by !== me.id)) return null;
  return data;
}

export async function createConversation(_: string | null, form: FormData): Promise<string | null> {
  const me = await requireMember();
  const urgency = Number(form.get('urgency'));
  const subject = String(form.get('subject') || '').trim().slice(0, 120);
  const body = String(form.get('body') || '').trim().slice(0, 4000);
  if (![1, 2, 3].includes(urgency)) return 'Choisis un degré d’urgence.';
  if (!subject || !body) return 'Indique un sujet et un message.';
  const now = new Date().toISOString();
  const { data: conv, error } = await db().from('conversations')
    .insert({ created_by: me.id, subject, urgency, last_alert_at: now, alert_count: 1 }).select('id').single();
  if (error) return error.message;
  await db().from('messages').insert({ conversation_id: conv.id, author_id: me.id, body });
  await pushToAdmins({
    title: `${PREFIX[urgency]} · ${me.name}`,
    body: `${subject} — ${body.slice(0, 140)}`,
    url: `/messages/${conv.id}`,
    tag: `conv-${conv.id}`,
    sticky: urgency < 3,
  }, me.id);
  revalidatePath('/', 'layout');
  redirect(`/messages/${conv.id}`);
}

export async function sendMessage(convId: string, body: string) {
  const me = await requireMember();
  const conv = await canSee(me, convId);
  if (!conv) throw new Error('Conversation introuvable');
  const text = body.trim().slice(0, 4000);
  if (!text) return;
  await db().from('messages').insert({ conversation_id: convId, author_id: me.id, body: text });
  const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (isAdmin(me.role)) {
    // an organiser's reply counts as taking the chat into account
    if (conv.status === 'ouvert') Object.assign(patch, { status: 'pris_en_compte', acked_by: me.id, acked_at: new Date().toISOString() });
    if (conv.created_by !== me.id) await pushTo([conv.created_by], { title: `Réponse de ${me.name}`, body: text.slice(0, 160), url: `/messages/${convId}`, tag: `conv-${convId}` });
  } else {
    await pushToAdmins({ title: `${me.name} · ${conv.subject}`, body: text.slice(0, 160), url: `/messages/${convId}`, tag: `conv-${convId}` }, me.id);
  }
  await db().from('conversations').update(patch).eq('id', convId);
  revalidatePath('/', 'layout');
}

export async function ackConversation(convId: string) {
  const me = await requireAdmin();
  const { data: conv } = await db().from('conversations').select('created_by,status').eq('id', convId).single();
  if (!conv || conv.status !== 'ouvert') return;
  const now = new Date().toISOString();
  await db().from('conversations').update({ status: 'pris_en_compte', acked_by: me.id, acked_at: now, updated_at: now }).eq('id', convId);
  await db().from('messages').insert({ conversation_id: convId, author_id: null, body: `${me.name} a pris en charge la demande.` });
  if (conv.created_by !== me.id) await pushTo([conv.created_by], { title: 'Demande prise en charge', body: `${me.name} s’en occupe.`, url: `/messages/${convId}`, tag: `conv-${convId}` });
  revalidatePath('/', 'layout');
}

export async function closeConversation(convId: string) {
  const me = await requireMember();
  const conv = await canSee(me, convId);
  if (!conv) return;
  const now = new Date().toISOString();
  await db().from('conversations').update({ status: 'clos', updated_at: now, ...(conv.status === 'ouvert' ? { acked_by: me.id, acked_at: now } : {}) }).eq('id', convId);
  await db().from('messages').insert({ conversation_id: convId, author_id: null, body: `Conversation close par ${me.name}.` });
  revalidatePath('/', 'layout');
}

