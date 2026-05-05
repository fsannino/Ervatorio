import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Trajetória — Sobre',
};

export default function TrajetoriaPage() {
  return (
    <div className="py-16">
      <div className="container-content">
        <nav className="text-xs mb-6" style={{ color: 'var(--color-footnote)', fontFamily: 'var(--font-dm-sans)' }}>
          <Link href="/" className="hover:underline">Home</Link>
          <span className="mx-2">›</span>
          <Link href="/sobre" className="hover:underline">Sobre</Link>
          <span className="mx-2">›</span>
          <span>Trajetória</span>
        </nav>
        <h1 className="text-3xl mb-8" style={{ fontFamily: 'var(--font-playfair)' }}>Trajetória Profissional</h1>
        <p style={{ color: 'var(--color-footnote)', fontFamily: 'var(--font-source-serif)' }}>
          Conteúdo completo em breve.
        </p>
      </div>
    </div>
  );
}
