import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="empty empty-page" role="status">
      <h1 className="display">No <em>encontrado.</em></h1>
      <p>Este partido, pick o página no existe.</p>
      <Link className="btn btn-ghost" href="/games">Ir al calendario</Link>
    </div>
  );
}
