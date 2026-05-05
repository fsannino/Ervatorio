import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center text-center px-6"
         style={{ background: 'var(--color-paper)', color: 'var(--color-ink)' }}>
      <p className="text-sm uppercase tracking-widest mb-4" style={{ color: 'var(--color-gold)', fontFamily: 'var(--font-dm-sans)' }}>
        Erro 404
      </p>
      <h1 className="text-5xl mb-6" style={{ fontFamily: 'var(--font-playfair)', fontWeight: 700 }}>
        Página não encontrada
      </h1>
      <p className="text-lg max-w-md mb-10" style={{ color: 'var(--color-footnote)', fontFamily: 'var(--font-source-serif)' }}>
        O endereço que você buscou não existe ou foi movido. Que tal voltar ao início?
      </p>
      <Link
        href="/"
        className="inline-flex items-center gap-2 px-6 py-3 text-sm font-medium rounded transition-opacity hover:opacity-80"
        style={{
          background: 'var(--color-ink)',
          color: 'var(--color-paper)',
          fontFamily: 'var(--font-dm-sans)',
        }}
      >
        ← Voltar ao início
      </Link>
    </div>
  );
}
