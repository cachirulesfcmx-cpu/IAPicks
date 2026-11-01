import type { Metadata, Viewport } from 'next';
import { Archivo, Inter } from 'next/font/google';
import Link from 'next/link';
import type { ReactNode } from 'react';
import { UserRound } from 'lucide-react';
import { SideNav, TabBar } from '@/components/nav';
import { BrandMark } from '@/components/visual';
import { getProvider } from '@/lib/providers';
import './globals.css';

// Self-hosted at build time by next/font: no runtime requests to Google, CSP stays 'self'.
const display = Archivo({ subsets: ['latin'], weight: ['600', '700', '800', '900'], style: ['normal', 'italic'], variable: '--font-display', display: 'swap' });
const body = Inter({ subsets: ['latin'], variable: '--font-body', display: 'swap' });

export const metadata: Metadata = {
  title: { default: 'IA Picks — Inteligencia deportiva', template: '%s · IA Picks' },
  description: 'Análisis deportivo informativo: calendario, datos y probabilidades validadas. Sin apuestas ni transacciones.',
  applicationName: 'IA Picks',
  manifest: '/manifest.json',
  appleWebApp: { capable: true, title: 'IA Picks', statusBarStyle: 'black-translucent' },
};
export const viewport: Viewport = { themeColor: '#050b09', width: 'device-width', initialScale: 1, viewportFit: 'cover' };

export default function RootLayout({ children }: { children: ReactNode }) {
  const demo = getProvider().isDemo;
  return (
    <html lang="es-MX" className={`${display.variable} ${body.variable}`}>
      <body>
        <a className="skip" href="#main">Saltar al contenido</a>
        <div className="app">
          <aside className="rail">
            <Link href="/" className="brand" aria-label="IA Picks, inicio">
              <BrandMark size={38} />
              <span className="brand-word">IA <em>Picks</em></span>
            </Link>
            <SideNav />
            <div className="rail-foot">
              <Link href="/follows" className="side-link"><UserRound size={20} aria-hidden />Cuenta y seguidos</Link>
              <Link href="/responsible" className="rail-legal">+18 · Juego responsable</Link>
            </div>
          </aside>
          <div className="content">
            <header className="topbar">
              <Link href="/" className="brand brand-compact" aria-label="IA Picks, inicio">
                <BrandMark size={32} />
                <span className="brand-word">IA <em>Picks</em></span>
              </Link>
              <div className="topbar-actions">
                {demo ? <span className="badge badge-demo badge-lg" role="status" title="Los datos mostrados son ficticios">Modo demo</span> : null}
                <Link href="/follows" className="icon-btn" aria-label="Cuenta y equipos seguidos"><UserRound size={20} aria-hidden /></Link>
              </div>
            </header>
            <main id="main" className="main">{children}</main>
            <footer className="footer">
              <span>© 2026 IA Picks · Análisis deportivo informativo</span>
              <span>+18 · No aceptamos ni facilitamos apuestas. Las probabilidades no garantizan resultados. <Link href="/responsible">Juego responsable</Link></span>
            </footer>
          </div>
        </div>
        <TabBar />
      </body>
    </html>
  );
}
