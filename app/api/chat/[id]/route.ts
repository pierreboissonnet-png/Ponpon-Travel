import { NextResponse } from 'next/server';
import { currentMember } from '@/lib/auth';
import { db } from '@/lib/db';
import { isAdmin } from '@/lib/types';

export const dynamic = 'force-dynamic';

/** Polled by the chat screen every few seconds. */
export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const me = await currentMember();
  if (!me) return NextResponse.json({ error: 'non connecté' }, { status: 401 });
  const { id } = await params;
  const { data: conv } = await db().from('conversations').select('id,created_by,status,urgency,acked_by,acked_at').eq('id', id).maybeSingle();
  if (!conv || (!isAdmin(me.role) && conv.created_by !== me.id)) return NextResponse.json({ error: 'introuvable' }, { status: 404 });
  const { data: msgs } = await db().from('messages').select('id,author_id,body,created_at').eq('conversation_id', id).order('created_at');
  return NextResponse.json({ conv, messages: msgs ?? [] }, { headers: { 'Cache-Control': 'no-store' } });
}
