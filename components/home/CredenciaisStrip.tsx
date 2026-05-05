import { credenciais } from '@/lib/data/static';

export function CredenciaisStrip() {
  return (
    <section
      className="py-4"
      style={{ background: 'var(--color-gold)' }}
      aria-label="Credenciais e certificações"
    >
      <div className="container-site">
        <ul className="flex flex-wrap items-center justify-center gap-x-8 gap-y-2">
          {credenciais.map((c) => (
            <li key={c.code} className="flex items-center gap-2 text-sm">
              <span className="font-bold text-ink" style={{ fontFamily: 'var(--font-dm-sans)' }}>
                {c.code}
              </span>
              <span className="hidden sm:inline text-xs opacity-75" style={{ color: 'var(--color-ink)' }}>
                {c.issuer}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
