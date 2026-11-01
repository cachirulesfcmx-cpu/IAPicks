import type { Metadata } from 'next';
import Link from 'next/link';
import { Notice, PageHeader } from '@/components/ui';
import BankrollLoader from './BankrollLoader';

export const metadata: Metadata = { title: 'Bankroll' };

export default function Bankroll() {
  return (
    <div className="stack">
      <PageHeader title="Gestión de" accent="bankroll." subtitle="Unidades, riesgo y disciplina de stake. Una herramienta personal, sin transacciones." />
      <BankrollLoader />
      <Notice tone="warn" title="Juego responsable">
        IA Picks no acepta ni procesa apuestas y no custodia dinero. Fija un límite que puedas permitirte perder y no persigas pérdidas. <Link href="/responsible">Más información</Link>.
      </Notice>
    </div>
  );
}
