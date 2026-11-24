import crypto from 'node:crypto';
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { addDays, parisNow, shortDate } from '@/lib/dates';
import { adminIds, pushTo } from '@/lib/push';

export const dynamic = 'force-dynamic';
export const maxDuration = 30;

/** Repeat interval per urgency level, in minutes (3 = info: no repeat). */
const REPEAT_MIN: Record<number, number> = { 1: 2, 2: 60 };
/** Deadline reminders go out from this Paris time on the reminder day. */
const REMIND_AT = '09:00';

function authorized(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const got = req.headers.get('authorization') || '';
  const want = `Bearer ${secret}`;
  return got.length === want.length && crypto.timingSafeEqual(Buffer.from(got), Buffer.from(want));
}

/**
 * Called every minute by an external scheduler (cron-job.org) and once a day by Vercel Cron.
 * 1. Re-sends chat alerts that no organiser has taken into account yet.
 * 2. Sends deadline reminders (J-x) for preparation tasks.
 */
export async function GET(req: Request) {
  if (!authorized(req)) return NextResponse.json({ error: 'non autorisé' }, { status: 401 });
  const admins = await adminIds();
  const report = { chats: 0, reminders: 0 };

  // ---------- 1. chat escalation ----------
  const { data: open } = await db().from('conversations')
    .select('id,subject,urgency,created_by,last_alert_at,alert_count').eq('status', 'ouvert').in('urgency', [1, 2]);
  const { data: members } = await db().from('members').select('id,name');
  const name = (id: string) => members?.find(m => m.id === id)?.name ?? 'Un voyageur';
  for (const c of open ?? []) {
    const every = REPEAT_MIN[c.urgency];
    const last = c.last_alert_at ? Date.parse(c.last_alert_at) : 0;
    // 20 s of slack so a one-minute scheduler does not skip a beat
    if (Date.now() - last < every * 60_000 - 20_000) continue;
    const n = (c.alert_count ?? 1) + 1;
    await pushTo(admins.filter(id => id !== c.created_by), {
      title: `${c.urgency === 1 ? '🔴 URGENT' : '🟠 Important'} · rappel ${n}`,
      body: `${name(c.created_by)} attend une réponse : ${c.subject}`,
      url: `/messages/${c.id}`,
      tag: `conv-${c.id}`,
      sticky: true,
    });
    await db().from('conversations').update({ last_alert_at: new Date().toISOString(), alert_count: n }).eq('id', c.id);
    report.chats++;
  }

  // ---------- 2. deadline reminders ----------
  const { date: today, time } = parisNow();
  const { data: tasks } = await db().from('items')
    .select('id,title,due_date,due_time,remind_offsets,reminders_sent')
    .eq('kind', 'tache').neq('status', 'termine').not('due_date', 'is', null);
  for (const t of tasks ?? []) {
    const offsets: number[] = t.remind_offsets ?? [];
    const sent: number[] = t.reminders_sent ?? [];
    // reminders whose moment has come: (deadline - offset days) at 09:00, or 1 h before a same-day deadline with a time
    const due = offsets.filter(o => {
      if (sent.includes(o)) return false;
      const day = addDays(t.due_date, -o);
      let at = REMIND_AT;
      if (o === 0 && t.due_time) {
        const [h, m] = t.due_time.split(':').map(Number);
        const mins = Math.max(0, h * 60 + m - 60);
        at = `${String(Math.floor(mins / 60)).padStart(2, '0')}:${String(mins % 60).padStart(2, '0')}`;
      }
      return today > day || (today === day && time >= at);
    });
    if (!due.length) continue;
    const o = Math.min(...due); // only announce the closest one
    const daysLeft = Math.round((Date.parse(t.due_date) - Date.parse(today)) / 864e5);
    const when = daysLeft < 0 ? `en retard depuis le ${shortDate(t.due_date)}` : daysLeft === 0 ? `aujourd’hui${t.due_time ? ' à ' + t.due_time.slice(0, 5) : ''}` : daysLeft === 1 ? 'demain' : `dans ${daysLeft} jours (${shortDate(t.due_date)})`;
    await pushTo(admins, { title: '⏰ Échéance ' + (daysLeft <= 0 ? 'aujourd’hui' : `J-${daysLeft}`), body: `${t.title} — ${when}`, url: `/fiche/${t.id}`, tag: `task-${t.id}` });
    await db().from('items').update({ reminders_sent: [...new Set([...sent, ...due, o])] }).eq('id', t.id);
    report.reminders++;
  }

  // keep the login attempts table small
  await db().from('login_attempts').delete().lt('at', new Date(Date.now() - 86400_000).toISOString());
  return NextResponse.json({ ok: true, ...report });
}
