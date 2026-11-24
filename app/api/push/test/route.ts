import { NextResponse } from 'next/server';
import { currentMember } from '@/lib/auth';
import { pushTo } from '@/lib/push';

export const dynamic = 'force-dynamic';

export async function POST() {
  const me = await currentMember();
  if (!me) return NextResponse.json({ error: 'non connecté' }, { status: 401 });
  const n = await pushTo([me.id], { title: 'Écosse 2027', body: `Les notifications fonctionnent, ${me.name} !`, url: '/reglages', tag: 'test' });
  return NextResponse.json({ devices: n });
}
