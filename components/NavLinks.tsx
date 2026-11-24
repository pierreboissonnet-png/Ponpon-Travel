'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { IconChat, IconMore, IconProgramme, IconTasks, IconToday } from './Icons';

export default function NavLinks({ showTasks, unread }: { showTasks: boolean; unread: number }) {
  const path = usePathname();
  const links = [
    { href: '/', label: 'Aujourd’hui', icon: <IconToday />, match: (p: string) => p === '/' },
    { href: '/programme', label: 'Programme', icon: <IconProgramme />, match: (p: string) => p.startsWith('/programme') },
    ...(showTasks ? [{ href: '/preparatifs', label: 'Préparatifs', icon: <IconTasks />, match: (p: string) => p.startsWith('/preparatifs') }] : []),
    { href: '/messages', label: 'Messages', icon: <IconChat />, match: (p: string) => p.startsWith('/messages'), badge: unread },
    { href: '/reglages', label: 'Réglages', icon: <IconMore />, match: (p: string) => p.startsWith('/reglages') || p.startsWith('/admin') },
  ];
  return (
    <nav className="tabbar" style={{ ['--tabs' as string]: links.length }} aria-label="Navigation">
      {links.map(l => (
        <Link key={l.href} href={l.href} aria-current={l.match(path) ? 'page' : undefined}>
          {l.icon}
          <span>{l.label}</span>
          {'badge' in l && l.badge ? <span className="dot" aria-label={`${l.badge} non traités`}>{l.badge}</span> : null}
        </Link>
      ))}
    </nav>
  );
}
