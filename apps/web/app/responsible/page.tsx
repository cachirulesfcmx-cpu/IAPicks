import type { Metadata } from 'next';
import { LifeBuoy } from 'lucide-react';
import { PageHeader } from '@/components/ui';

export const metadata: Metadata = { title: 'Juego responsable' };

export default function Responsible() {
  return (
    <div className="stack narrow">
      <PageHeader title="Juego responsable y" accent="aviso legal." />
      <section className="panel prose">
        <p>IA Picks es una herramienta de análisis deportivo con fines informativos y de entretenimiento para personas mayores de 18 años. No acepta, realiza, procesa ni facilita apuestas, no custodia dinero y no enlaza a operadores de apuestas.</p>
        <p>Las probabilidades son estimaciones con incertidumbre. El rendimiento pasado no garantiza resultados futuros. Ningún modelo “gana siempre”: los mercados de apuestas incorporan un margen y la mayoría de los apostadores pierde dinero a largo plazo.</p>
        <h2>Señales de alerta</h2>
        <ul>
          <li>Apostar más de lo que puedes permitirte perder o para recuperar pérdidas.</li>
          <li>Ocultar el tiempo o el dinero que dedicas a apostar.</li>
          <li>Sentir ansiedad o irritabilidad cuando no apuestas.</li>
        </ul>
      </section>
      <section className="panel help">
        <LifeBuoy size={24} aria-hidden />
        <p>Si el juego te está causando problemas, busca ayuda profesional. En México puedes llamar gratis a la Línea de la Vida: <strong>800 911 2000</strong> (24 horas).</p>
      </section>
    </div>
  );
}
