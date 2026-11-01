import type { Metadata } from 'next';
import { PageHeader } from '@/components/ui';
import FollowsClient from './FollowsClient';

export const metadata: Metadata = { title: 'Seguidos' };

export default function Follows() {
  return (
    <div className="stack narrow">
      <PageHeader title="Tu cuenta y" accent="equipos." subtitle="Sigue equipos para personalizar tu inicio. Tu lista es privada: solo tú puedes verla (RLS por usuario)." />
      <FollowsClient />
    </div>
  );
}
