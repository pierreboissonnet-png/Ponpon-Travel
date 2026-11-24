export const BUG_ST: Record<string, [string, string]> = { new: ['Nouveau', 'late'], doing: ['En cours', 's-a_faire'], done: ['Résolu', 's-termine'], wontfix: ['Sans suite', ''] };
export const bugDate = (t: string) => new Date(t).toLocaleString('fr-FR', { timeZone: 'Europe/Paris', day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
export const BUG_COLS = 'id,no,member_id,pseudo,text,ctx,has_img,status,note,analysis,updated_by,created_at,updated_at';
export interface Bug {
  id: string; no: number; member_id: string | null; pseudo: string; text: string; ctx: Record<string, unknown> & { ecran?: string; erreurs?: { t: string; type: string; msg: string; src?: string; stack?: string }[]; actions?: { t: string; k: string; v: string }[] };
  has_img: boolean; img?: string | null; status: 'new' | 'doing' | 'done' | 'wontfix'; note: string | null; analysis: string | null; updated_by: string | null; created_at: string; updated_at: string;
}
