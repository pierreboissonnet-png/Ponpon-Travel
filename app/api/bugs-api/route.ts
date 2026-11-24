// Service access to the bug reports, so that Claude can read them and update their follow-up.
// Key: BUG_API_KEY (32 characters minimum), sent in the "x-bug-key" header. An admin can cut access from the app.
//
//   GET  /api/bugs-api?status=open|new|doing|done|wontfix&since=<n°>   list
//   GET  /api/bugs-api?no=12&img=1                                     one report (+ screenshot and exchanges)
//   POST /api/bugs-api  {"no":12, "status":"doing", "note":"Corrigé en 1.1.1"}
import crypto from 'node:crypto';
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { BUG_COLS } from '@/lib/bugs';

export const dynamic = 'force-dynamic';

const json = (body: unknown, status = 200) => NextResponse.json(body, { status, headers: { 'Cache-Control': 'no-store' } });
const sha = (s: string) => crypto.createHash('sha256').update(s).digest();
const COLS = BUG_COLS.replace('member_id,', '');

async function guard(req: Request) {
  const want = process.env.BUG_API_KEY || '';
  if (want.length < 32) return json({ error: 'Introuvable.' }, 404);
  if (!crypto.timingSafeEqual(sha(req.headers.get('x-bug-key') || ''), sha(want))) {
    await new Promise(r => setTimeout(r, 800)); // slows down guessing
    return json({ error: 'Clé refusée.' }, 401);
  }
  const { data } = await db().from('app_config').select('value').eq('key', 'bugapi').maybeSingle();
  const cfg = (data?.value ?? {}) as { off?: boolean; n?: number };
  if (cfg.off) return json({ error: 'Accès coupé par un organisateur.' }, 403);
  await db().from('app_config').upsert({ key: 'bugapi', value: { ...cfg, last: new Date().toISOString(), n: (cfg.n || 0) + 1 } });
  return null;
}

export async function GET(req: Request) {
  const denied = await guard(req);
  if (denied) return denied;
  const u = new URL(req.url);
  const no = Number(u.searchParams.get('no')) || 0;
  if (!no) {
    let q = db().from('bug_reports').select(COLS).order('no', { ascending: false }).limit(500);
    const st = u.searchParams.get('status') || '', since = Number(u.searchParams.get('since')) || 0;
    if (st === 'open') q = q.in('status', ['new', 'doing']); else if (st) q = q.eq('status', st);
    if (since) q = q.gt('no', since);
    const { data, error } = await q;
    return error ? json({ error: error.message }, 500) : json({ bugs: data ?? [] });
  }
  const { data: b } = await db().from('bug_reports').select('id,' + COLS + ',img').eq('no', no).maybeSingle();
  if (!b) return json({ error: 'Signalement introuvable.' }, 404);
  const { img, id, ...rest } = b as unknown as Record<string, unknown>;
  const { data: comments } = await db().from('bug_comments').select('pseudo,text,from_admin,created_at').eq('bug_id', id as string).order('created_at');
  return json({ bug: { ...rest, echanges: comments ?? [] }, img: u.searchParams.get('img') === '1' ? img : null });
}

export async function POST(req: Request) {
  const denied = await guard(req);
  if (denied) return denied;
  const body = await req.json().catch(() => ({}));
  const no = Number(body.no) || 0;
  const { data: b } = await db().from('bug_reports').select('id').eq('no', no).maybeSingle();
  if (!b) return json({ error: 'Signalement introuvable.' }, 404);
  const patch: Record<string, unknown> = { updated_by: 'Claude (API)', updated_at: new Date().toISOString() };
  if (['new', 'doing', 'done', 'wontfix'].includes(body.status)) patch.status = body.status;
  if ('note' in body) patch.note = String(body.note ?? '').replace(/[\u0000-\u0008\u000b-\u001f]/g, '').trim().slice(0, 1000);
  const { data, error } = await db().from('bug_reports').update(patch).eq('id', b.id).select(COLS).single();
  return error ? json({ error: error.message }, 500) : json({ bug: data });
}
