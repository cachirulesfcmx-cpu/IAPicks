'use client';
import dynamic from 'next/dynamic';

// The bankroll tool keeps its data in this browser only (localStorage), so it renders client-side.
const BankrollClient = dynamic(() => import('./BankrollClient'), {
  ssr: false,
  loading: () => (
    <div className="stack" aria-busy="true">
      <div className="skeleton sk-hero" />
      <div className="skeleton sk-card" />
    </div>
  ),
});

export default function BankrollLoader() {
  return <BankrollClient />;
}
