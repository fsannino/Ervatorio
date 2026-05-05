import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = { title: 'Publicações — Sobre' };

export default function PublicacoesPage() {
  return (
    <div className="py-16">
      <div className="container-content">
        <nav className="text-xs mb-6" style={{ color: 'var(--color-footnote)', fontFamily: 'var(--font-dm-sans)' }}>
          <Link href="/" className="hover:underline">Home</Link>
          <span className="mx-2">›</span>
          <Link href="/sobre" className="hover:underline">Sobre</Link>
          <span className="mx-2">›</span>
          <span>Publicações</span>
        </nav>
        <h1 className="text-3xl mb-6" style={{ fontFamily: 'var(--font-playfair)' }}>Publicações</h1>
        <p style={{ color: 'var(--color-footnote)', fontFamily: 'var(--font-source-serif)' }}>
          Lista de publicações em breve. Acesse o{' '}
          <a href="http://lattes.cnpq.br/" target="_blank" rel="noopener noreferrer"
             className="underline" style={{ color: 'var(--color-academic)' }}>
            Currículo Lattes
          </a>{' '}
          para a lista completa.
        </p>
      </div>
    </div>
  );
}
