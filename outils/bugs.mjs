#!/usr/bin/env node
// Lecture et suivi des signalements depuis un terminal (ou par Claude dans Cowork).
// Variables : APP_URL (ex. https://travelecosse2027.vercel.app) et BUG_API_KEY (la même que dans Vercel).
//   node outils/bugs.mjs                  → signalements à traiter
//   node outils/bugs.mjs all              → tous
//   node outils/bugs.mjs 12               → détail du n°12 (+ capture enregistrée en bug-12.jpg)
//   node outils/bugs.mjs 12 doing "Analyse en cours"   → statut (new|doing|done|wontfix) + note
import fs from 'node:fs';
const base = (process.env.APP_URL || '').replace(/\/$/, ''), key = process.env.BUG_API_KEY || '';
if (!base || key.length < 32) { console.error('Définissez APP_URL et BUG_API_KEY (32 caractères minimum).'); process.exit(1); }
const url = base + '/api/bugs-api', H = { 'x-bug-key': key, 'content-type': 'application/json' };
const [a, st, ...note] = process.argv.slice(2);
const call = async (q = '', opt = {}) => { const r = await fetch(url + q, { headers: H, ...opt }); const j = await r.json(); if (!r.ok) throw new Error(j.error || r.status); return j; };
try {
  if (!a || a === 'all' || a === 'open') {
    const { bugs } = await call(a === 'all' ? '' : '?status=open');
    if (!bugs.length) console.log('Aucun signalement.');
    for (const b of bugs) console.log(`#${b.no} [${b.status}] ${b.created_at.slice(0, 16).replace('T', ' ')} · ${b.pseudo} · ${(b.ctx || {}).ecran || ''}${b.has_img ? ' · capture' : ''}\n   ${b.text.replace(/\n/g, ' ')}${b.note ? '\n   note : ' + b.note : ''}`);
  } else if (!st) {
    const { bug, img } = await call(`?no=${+a}&img=1`);
    if (img) { fs.writeFileSync(`bug-${bug.no}.jpg`, Buffer.from(img.split(',')[1], 'base64')); console.error(`Capture : bug-${bug.no}.jpg`); }
    console.log(JSON.stringify(bug, null, 2));
  } else {
    const { bug } = await call('', { method: 'POST', body: JSON.stringify({ no: +a, status: st, ...(note.length ? { note: note.join(' ') } : {}) }) });
    console.log(`#${bug.no} → ${bug.status}${bug.note ? ' · ' + bug.note : ''}`);
  }
} catch (e) { console.error('Erreur :', e.message); process.exit(1); }
