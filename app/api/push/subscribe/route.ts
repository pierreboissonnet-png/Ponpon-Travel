import { NextResponse } from 'next/server';
import { currentMember } from '@/lib/auth';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  const me = await currentMember();
  if (!me) return NextResponse.json({ error: 'non connecté' }, { status: 401 });
  const s = await req.json().catch(() => null);
  const endpoint = s?.endpoint, p256dh = s?.keys?.p256dh, auth = s?.keys?.auth;
  if (typeof endpoint !== 'string' || !endpoint.startsWith('https://') || typeof p256dh !== 'string' || typeof auth !== 'string') {
    return NextResponse.json({ error: 'abonnement invalide' }, { status: 400 });
  }
  const { error } = await db().from('push_subscriptions').upsert({ member_id: me.id, endpoint, p256dh, auth }, { onConflict: 'endpoint' });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: Request) {
  const me = await currentMember();
  if (!me) return NextResponse.json({ error: 'non connecté' }, { status: 401 });
  const s = await req.json().catch(() => null);
  if (typeof s?.endpoint === 'string') await db().from('push_subscriptions').delete().eq('endpoint', s.endpoint).eq('member_id', me.id);
  return NextResponse.json({ ok: true });
}
