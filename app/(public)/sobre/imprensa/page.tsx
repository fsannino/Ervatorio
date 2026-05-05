import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = { title: 'Imprensa — Sobre' };

export default function ImprensaPage() {
  return (
    <div className="py-16">
      <div className="container-content">
        <nav className="text-xs mb-6" style={{ color: 'var(--color-footnote)', fontFamily: 'var(--font-dm-sans)' }}>
          <Link href="/" className="hover:underline">Home</Link>
          <span className="mx-2">›</span>
          <Link href="/sobre" className="hover:underline">Sobre</Link>
          <span className="mx-2">›</span>
          <span>Imprensa</span>
        </nav>
        <h1 className="text-3xl mb-6" style={{ fontFamily: 'var(--font-playfair)' }}>Imprensa</h1>
        <p style={{ color: 'var(--color-footnote)', fontFamily: 'var(--font-source-serif)' }}>
          Para entrevistas e assessoria de imprensa, entre em{' '}
          <Link href="/contato" className="underline" style={{ color: 'var(--color-academic)' }}>
            contato
          </Link>.
        </p>
      </div>
    </div>
  );
}
