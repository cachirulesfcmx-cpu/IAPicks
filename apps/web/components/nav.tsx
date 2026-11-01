'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { CalendarDays, ChartColumn, Flame, House, Wallet } from 'lucide-react';

export const NAV = [
  { href: '/', label: 'Inicio', Icon: House },
  { href: '/games', label: 'Partidos', Icon: CalendarDays },
  { href: '/picks', label: 'Picks', Icon: Flame },
  { href: '/performance', label: 'Rendimiento', Icon: ChartColumn },
  { href: '/bankroll', label: 'Bankroll', Icon: Wallet },
] as const;

const isActive = (path: string, href: string) => (href === '/' ? path === '/' : path === href || path.startsWith(`${href}/`));

export function TabBar() {
  const path = usePathname() ?? '/';
  return (
    <nav className="tabbar" data-tabbar aria-label="Navegación principal">
      {NAV.map(({ href, label, Icon }) => {
        const on = isActive(path, href);
        return (
          <Link key={href} href={href} className={`tab ${on ? 'tab-on' : ''}`} aria-current={on ? 'page' : undefined}>
            <Icon size={22} strokeWidth={on ? 2.3 : 1.8} aria-hidden />
            <span>{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

export function SideNav() {
  const path = usePathname() ?? '/';
  return (
    <nav className="sidenav" aria-label="Secciones">
      {NAV.map(({ href, label, Icon }) => {
        const on = isActive(path, href);
        return (
          <Link key={href} href={href} className={`side-link ${on ? 'side-on' : ''}`} aria-current={on ? 'page' : undefined}>
            <Icon size={20} strokeWidth={on ? 2.3 : 1.8} aria-hidden />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
