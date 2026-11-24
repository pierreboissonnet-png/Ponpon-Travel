import 'server-only';
import { db } from './db';

const SYSTEM = `Tu es le développeur de l'application web « Écosse 2027 » (Next.js 15 + Supabase, hébergée sur Vercel, installable sur iPhone).
Écrans : Aujourd'hui (récap du jour), Programme (5 journées), Fiche (détail d'une activité ou tâche), Préparatifs (to-do list), Messages (chat avec urgence et notifications), Réglages (notifications, participants).
À partir d'un signalement d'utilisateur, rédige en français, en moins de 200 mots :
- « Résumé » : le problème en une phrase ;
- « Reproduction » : étapes probables ;
- « Cause probable » : hypothèses classées, en t'appuyant sur les erreurs JavaScript fournies ;
- « Gravité » : bloquant / gênant / mineur, avec une phrase de justification ;
- « Piste de correction » : fichier ou module probable et changement proposé.
N'invente pas de faits : signale ce qu'il faudrait demander à l'utilisateur si l'information manque.`;

/** Optional first diagnosis by Claude (only when ANTHROPIC_API_KEY is set: the API is billed per use). */
export async function triage(bugId: string) {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return;
  try {
    const { data: bug } = await db().from('bug_reports').select('no,pseudo,text,ctx,has_img,created_at').eq('id', bugId).single();
    if (!bug) return;
    const r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'x-api-key': key, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' },
      body: JSON.stringify({ model: process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-5', max_tokens: 900, system: SYSTEM, messages: [{ role: 'user', content: 'Signalement (JSON) :\n' + JSON.stringify(bug) }] }),
    });
    if (!r.ok) throw new Error(`API Claude : ${r.status}`);
    const j = await r.json();
    const text = (j.content || []).filter((c: { type: string }) => c.type === 'text').map((c: { text: string }) => c.text).join('\n').trim();
    if (text) await db().from('bug_reports').update({ analysis: text }).eq('id', bugId);
  } catch (e) {
    console.error('triage', (e as Error).message);
  }
}
