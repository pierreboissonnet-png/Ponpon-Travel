'use server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { db } from '@/lib/db';
import { requireAdmin, requireMember } from '@/lib/auth';
import { isAdmin, type Status } from '@/lib/types';

function refresh() {
  revalidatePath('/', 'layout');
}

/** Tick / untick an activity or task. Guests can only tick what they can see. */
export async function setDone(id: string, done: boolean) {
  const me = await requireMember();
  let q = db().from('items').update({
    status: done ? 'termine' : 'a_faire',
    done_at: done ? new Date().toISOString() : null,
    done_by: done ? me.id : null,
    updated_at: new Date().toISOString(),
  }).eq('id', id);
  if (!isAdmin(me.role)) q = q.eq('guest_visible', true);
  const { error } = await q;
  if (error) throw new Error(error.message);
  refresh();
}

export async function setStatus(id: string, status: Status) {
  const me = await requireAdmin();
  if (!['a_faire', 'en_cours', 'termine'].includes(status)) throw new Error('statut invalide');
  const done = status === 'termine';
  await db().from('items').update({
    status, done_at: done ? new Date().toISOString() : null, done_by: done ? me.id : null, updated_at: new Date().toISOString(),
  }).eq('id', id);
  refresh();
}

const str = (f: FormData, k: string) => { const v = String(f.get(k) ?? '').trim(); return v === '' ? null : v; };

export async function saveItem(form: FormData) {
  await requireAdmin();
  const id = str(form, 'id');
  const kind = str(form, 'kind') === 'tache' ? 'tache' : 'activite';
  const title = str(form, 'title');
  if (!title) throw new Error('Le titre est obligatoire.');
  const price = str(form, 'price_amount');
  const offsets = form.getAll('remind').map(v => Number(v)).filter(n => Number.isInteger(n) && n >= 0 && n <= 365).sort((a, b) => b - a);
  const row = {
    kind,
    category: str(form, 'category') || 'Autre',
    title,
    summary: str(form, 'summary'),
    details: str(form, 'details'),
    day: str(form, 'day'),
    start_time: str(form, 'start_time'),
    end_time: str(form, 'end_time'),
    location: str(form, 'location'),
    address: str(form, 'address'),
    phone: str(form, 'phone'),
    link: str(form, 'link'),
    due_date: str(form, 'due_date'),
    due_time: str(form, 'due_time'),
    due_note: str(form, 'due_note'),
    need_date: str(form, 'need_date'),
    remind_offsets: offsets,
    status: (str(form, 'status') as Status) || 'a_faire',
    price_amount: price ? Number(price.replace(',', '.')) : null,
    price_currency: str(form, 'price_currency') || '€',
    price_note: str(form, 'price_note'),
    booking_ref: str(form, 'booking_ref'),
    private_note: str(form, 'private_note'),
    guest_visible: form.get('guest_visible') === 'on',
    updated_at: new Date().toISOString(),
  };
  let savedId = id;
  if (id) {
    // a changed deadline or reminder list re-arms the reminders
    const { data: old } = await db().from('items').select('due_date,due_time,remind_offsets').eq('id', id).single();
    const rearm = !old || old.due_date !== row.due_date || (old.due_time || null) !== (row.due_time ? row.due_time + (row.due_time.length === 5 ? ':00' : '') : null) || JSON.stringify(old.remind_offsets) !== JSON.stringify(offsets);
    const { error } = await db().from('items').update(rearm ? { ...row, reminders_sent: [] } : row).eq('id', id);
    if (error) throw new Error(error.message);
  } else {
    const { data, error } = await db().from('items').insert(row).select('id').single();
    if (error) throw new Error(error.message);
    savedId = data.id;
  }
  refresh();
  redirect(`/fiche/${savedId}`);
}

export async function deleteItem(form: FormData) {
  await requireAdmin();
  const id = str(form, 'id');
  const kind = str(form, 'kind');
  if (id) await db().from('items').delete().eq('id', id);
  refresh();
  redirect(kind === 'tache' ? '/preparatifs' : '/programme');
}
