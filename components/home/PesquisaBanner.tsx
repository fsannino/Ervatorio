import Link from 'next/link';

export function PesquisaBanner() {
  return (
    <section className="py-16" style={{ background: 'var(--color-ink)' }}>
      <div className="container-site">
        <div className="flex flex-col md:flex-row md:items-center gap-6 justify-between">
          <div className="flex flex-col gap-3">
            <p
              className="text-xs uppercase tracking-widest"
              style={{ color: 'var(--color-gold)', fontFamily: 'var(--font-dm-sans)' }}
            >
              Pesquisa em andamento
            </p>
            <h2 className="text-2xl md:text-3xl max-w-2xl" style={{ fontFamily: 'var(--font-playfair)', color: 'var(--color-paper)' }}>
              Pós-Doutorado UNICAMP/FCA — Blockchain, IA e Regulação Sanitária (ANVISA)
            </h2>
            <p className="text-sm max-w-xl" style={{ color: 'var(--color-footnote)', fontFamily: 'var(--font-source-serif)' }}>
              Investigando o potencial de tecnologias de registro distribuído e inteligência artificial
              para aprimorar os processos regulatórios no setor de saúde brasileiro.
            </p>
          </div>

          <div className="flex flex-col gap-3 shrink-0">
            <Link
              href="/pesquisa/postdoc-unicamp"
              className="inline-flex items-center justify-center px-6 py-3 rounded text-sm font-medium transition-opacity hover:opacity-80 whitespace-nowrap"
              style={{ border: '1px solid var(--color-gold)', color: 'var(--color-gold)', fontFamily: 'var(--font-dm-sans)' }}
            >
              Ver detalhes da pesquisa →
            </Link>
            <Link
              href="/pesquisa/colaboracao"
              className="text-center text-xs transition-opacity hover:opacity-70"
              style={{ color: 'var(--color-footnote)', fontFamily: 'var(--font-dm-sans)' }}
            >
              Colaborar nesta pesquisa
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
