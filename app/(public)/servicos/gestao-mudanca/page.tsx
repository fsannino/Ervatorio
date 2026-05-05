import Link from 'next/link';
export default function ServicePage() {
  return (
    <div className="py-16">
      <div className="container-content">
        <nav className="text-xs mb-6" style={{ color: 'var(--color-footnote)', fontFamily: 'var(--font-dm-sans)' }}>
          <Link href="/" className="hover:underline">Home</Link>
          <span className="mx-2">›</span>
          <Link href="/servicos" className="hover:underline">Serviços</Link>
          <span className="mx-2">›</span>
          <span>Detalhes</span>
        </nav>
        <p className="text-sm" style={{ color: 'var(--color-footnote)', fontFamily: 'var(--font-source-serif)' }}>
          Página detalhada deste serviço em breve. <Link href="/contato" className="underline" style={{ color: 'var(--color-academic)' }}>Entre em contato</Link> para informações.
        </p>
      </div>
    </div>
  );
}
