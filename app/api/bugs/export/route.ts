import { NextResponse } from 'next/server';
import { currentMember } from '@/lib/auth';
import { db } from '@/lib/db';
import { BUG_COLS, BUG_ST, type Bug } from '@/lib/bugs';
import { APP_VERSION } from '@/lib/bugs-client';
import { isAdmin } from '@/lib/types';

export const dynamic = 'force-dynamic';

/** Admins: export the reports (CSV for a spreadsheet, JSON with screenshots for Claude). */
export async function GET(req: Request) {
  const me = await currentMember();
  if (!me || !isAdmin(me.role)) return NextResponse.json({ error: 'réservé aux organisateurs' }, { status: 403 });
  const u = new URL(req.url);
  const fmt = u.searchParams.get('format') === 'json' ? 'json' : 'csv';
  const f = u.searchParams.get('f') || 'all';
  let q = db().from('bug_reports').select(BUG_COLS + (fmt === 'json' ? ',img' : '')).order('no', { ascending: false }).limit(1000);
  if (f === 'open') q = q.in('status', ['new', 'doing']); else if (f !== 'all') q = q.eq('status', f);
  const { data } = await q;
  const L = (data ?? []) as unknown as Bug[];
  const day = new Date().toISOString().slice(0, 10);
  if (fmt === 'json') {
    const body = JSON.stringify({ exporte: new Date().toISOString(), version: APP_VERSION, signalements: L.map(({ img, ...b }) => ({ ...b, capture: img ?? null })) }, null, 1);
    return new NextResponse(body, { headers: { 'Content-Type': 'application/json', 'Content-Disposition': `attachment; filename="signalements_${day}.json"` } });
  }
  const C: [string, string][] = [['no', 'N°'], ['date', 'Date'], ['statut', 'Statut'], ['pseudo', 'Personne'], ['ecran', 'Écran'], ['texte', 'Description'], ['capture', 'Capture'], ['version', 'Version'], ['installee', 'Appli installée'], ['reseau', 'Réseau'], ['ecranTaille', 'Taille d’écran'], ['appareil', 'Appareil'], ['erreurs', 'Erreurs JS'], ['note', 'Note de suivi'], ['analyse', 'Diagnostic Claude'], ['par', 'Traité par']];
  const row = (b: Bug): Record<string, unknown> => {
    const c = b.ctx || {};
    return { no: b.no, date: new Date(b.created_at).toISOString().replace('T', ' ').slice(0, 19), statut: (BUG_ST[b.status] ?? BUG_ST.new)[0], pseudo: b.pseudo, ecran: c.ecran, texte: b.text, capture: b.has_img ? 'oui' : 'non', version: c.version, installee: c.installee, reseau: c.reseau, ecranTaille: c.ecranTaille, appareil: c.appareil, erreurs: (c.erreurs || []).map(e => e.msg).join(' | '), note: b.note, analyse: b.analysis, par: b.updated_by };
  };
  const qv = (v: unknown) => `"${String(v ?? '').replace(/"/g, '""')}"`;
  const csv = '﻿' + [C.map(x => qv(x[1])).join(';'), ...L.map(b => { const r = row(b); return C.map(x => qv(r[x[0]])).join(';'); })].join('\r\n');
  return new NextResponse(csv, { headers: { 'Content-Type': 'text/csv; charset=utf-8', 'Content-Disposition': `attachment; filename="signalements_${day}.csv"` } });
}
